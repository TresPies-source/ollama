import type {
  Session,
  SessionWithMessages,
  SessionCreateRequest,
  SessionCreateResponse,
  SessionListResponse,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  Trace,
  ErrorResponse,
} from "@/types/dgd";

// Default API base URL (can be overridden via environment variable)
const API_BASE = import.meta.env.VITE_DGD_API_BASE || "http://localhost:8080";

// Custom error class for DGD API errors
export class DGDAPIError extends Error {
  status?: number;
  response?: ErrorResponse;

  constructor(message: string, status?: number, response?: ErrorResponse) {
    super(message);
    this.name = "DGDAPIError";
    this.status = status;
    this.response = response;
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Helper to wait for a specified duration
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry wrapper for fetch requests
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<Response> {
  let lastError: Error | null = null;
  let delay = retryConfig.delayMs;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is ok or not retryable, return it
      if (
        response.ok ||
        !retryConfig.retryableStatuses.includes(response.status)
      ) {
        return response;
      }

      // Store the error for later
      lastError = new DGDAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        await response.json().catch(() => ({ error: response.statusText })),
      );
    } catch (error) {
      // Network errors are retryable
      lastError = error as Error;
    }

    // If we've exhausted retries, break
    if (attempt === retryConfig.maxRetries) {
      break;
    }

    // Wait before retrying
    await wait(delay);
    delay *= retryConfig.backoffMultiplier;
  }

  // If we get here, all retries failed
  throw (
    lastError ||
    new DGDAPIError("Request failed after all retries", undefined, undefined)
  );
}

// Helper to handle JSON responses with error checking
async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    throw new DGDAPIError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData,
    );
  }

  return response.json();
}

// Session Management

/**
 * Fetches all sessions for the current user
 * @returns Promise resolving to array of sessions (empty array if none exist)
 * @throws DGDAPIError on network or server errors
 */
export async function getSessions(): Promise<Session[]> {
  const response = await fetchWithRetry(`${API_BASE}/api/sessions`);
  const data = await handleJsonResponse<SessionListResponse>(response);
  return data.sessions || [];
}

/**
 * Fetches a single session with all its messages
 * @param id Session ID to fetch
 * @returns Promise resolving to session with messages
 * @throws DGDAPIError on network or server errors (404 if session not found)
 */
export async function getSession(id: string): Promise<SessionWithMessages> {
  const response = await fetchWithRetry(`${API_BASE}/api/sessions/${id}`);
  return handleJsonResponse<SessionWithMessages>(response);
}

/**
 * Creates a new chat session
 * @param title Human-readable title for the session
 * @param workingDir Working directory for file operations in this session
 * @returns Promise resolving to session creation response with session_id
 * @throws DGDAPIError on network or server errors
 */
export async function createSession(
  title: string,
  workingDir: string,
): Promise<SessionCreateResponse> {
  const response = await fetchWithRetry(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      working_dir: workingDir,
    } as SessionCreateRequest),
  });
  return handleJsonResponse<SessionCreateResponse>(response);
}

// Chat API

/**
 * Sends a non-streaming message to the DGD backend
 * @param req Chat request with session_id and message
 * @returns Promise resolving to chat response
 * @throws DGDAPIError on network or server errors
 */
export async function sendMessage(req: ChatRequest): Promise<ChatResponse> {
  const response = await fetchWithRetry(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...req, stream: false }),
  });
  return handleJsonResponse<ChatResponse>(response);
}

/**
 * Streams messages from the DGD backend using Server-Sent Events (SSE)
 *
 * The backend sends SSE events in the format:
 * - `event: message` with StreamChunk data for regular content
 * - `event: error` with StreamChunk data for errors
 *
 * @param req Chat request with session_id and message
 * @param signal Optional AbortSignal to cancel the stream
 * @returns AsyncGenerator yielding StreamChunk objects
 * @throws DGDAPIError on network or server errors
 *
 * @example
 * ```typescript
 * for await (const chunk of streamMessageGenerator(request)) {
 *   if (chunk.error) {
 *     console.error('Stream error:', chunk.error);
 *     break;
 *   }
 *   console.log('Content:', chunk.content);
 *   if (chunk.done) break;
 * }
 * ```
 */
export async function* streamMessageGenerator(
  req: ChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<StreamChunk, void, unknown> {
  const response = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...req, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: response.statusText,
    }));
    throw new DGDAPIError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new DGDAPIError(
      "Response body is not readable",
      undefined,
      undefined,
    );
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") {
          currentEvent = "";
          continue;
        }

        // Parse SSE event type: "event: message" or "event: error"
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }

        // Parse SSE data: "data: {...}"
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          try {
            const chunk = JSON.parse(jsonStr) as StreamChunk;

            // If this is an error event, set the error flag
            if (currentEvent === "error") {
              yield { ...chunk, error: chunk.error || "Unknown error" };
            } else {
              yield chunk;
            }

            // Stop if done or error
            if (chunk.done || chunk.error) {
              return;
            }
          } catch (error) {
            console.error("Failed to parse SSE data:", error, jsonStr);
            // Yield an error chunk for parse failures
            yield {
              content: "",
              done: true,
              error: `Failed to parse response: ${error}`,
            };
            return;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Trace API

/**
 * Fetches the execution trace for a session
 *
 * The trace contains a tree of events showing how the agent processed the request,
 * including mode transitions, tool invocations, LLM calls, and perspective integrations.
 *
 * @param sessionId Session ID to fetch trace for
 * @returns Promise resolving to trace object with all events
 * @throws DGDAPIError on network or server errors (404 if trace not found)
 */
export async function getTrace(sessionId: string): Promise<Trace> {
  const response = await fetchWithRetry(`${API_BASE}/api/trace/${sessionId}`);
  return handleJsonResponse<Trace>(response);
}

// Note: Health check endpoint not yet implemented in backend
// TODO: Implement /api/health endpoint in dgd/api/handlers.go
//
// export async function checkHealth(): Promise<boolean> {
//   try {
//     const response = await fetch(`${API_BASE}/api/health`, {
//       method: "GET",
//     });
//     return response.ok;
//   } catch {
//     return false;
//   }
// }

// Export API base for other utilities
export { API_BASE };
