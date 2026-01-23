import { useState, useCallback, useRef } from "react";
import { streamMessageGenerator } from "@/api/dgd-client";
import type { ChatRequest, Message } from "@/types/dgd";

export interface UseChatStreamOptions {
  onMessageComplete?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export interface UseChatStreamResult {
  sendMessage: (
    message: string,
    sessionId: string,
    perspectives?: string[],
  ) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  error: Error | null;
  reset: () => void;
}

export function useChatStream(
  options: UseChatStreamOptions = {},
): UseChatStreamResult {
  const { onMessageComplete, onError } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedContentRef = useRef("");
  const currentMessageIdRef = useRef<string>("");
  const currentSessionIdRef = useRef<string>("");
  const currentAgentTypeRef = useRef<string>("");
  const currentModeRef = useRef<string | undefined>(undefined);

  const reset = useCallback(() => {
    setStreamingContent("");
    setError(null);
    accumulatedContentRef.current = "";
    currentMessageIdRef.current = "";
    currentSessionIdRef.current = "";
    currentAgentTypeRef.current = "";
    currentModeRef.current = undefined;
  }, []);

  const sendMessage = useCallback(
    async (message: string, sessionId: string, perspectives?: string[]) => {
      if (isStreaming) {
        console.warn("Already streaming, ignoring new message");
        return;
      }

      reset();
      setIsStreaming(true);

      abortControllerRef.current = new AbortController();

      const request: ChatRequest = {
        session_id: sessionId,
        message,
        perspectives,
        stream: true,
      };

      try {
        currentSessionIdRef.current = sessionId;

        for await (const chunk of streamMessageGenerator(
          request,
          abortControllerRef.current.signal,
        )) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          // Check for errors in the stream
          if (chunk.error) {
            throw new Error(chunk.error);
          }

          // Update agent metadata if provided
          if (chunk.agent_type) {
            currentAgentTypeRef.current = chunk.agent_type;
          }
          if (chunk.mode) {
            currentModeRef.current = chunk.mode;
          }

          // Accumulate content
          accumulatedContentRef.current += chunk.content;
          setStreamingContent(accumulatedContentRef.current);

          if (chunk.done) {
            // Generate a client-side message ID (server doesn't send one in stream)
            currentMessageIdRef.current = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const completedMessage: Message = {
              id: currentMessageIdRef.current,
              session_id: currentSessionIdRef.current,
              role: "assistant",
              content: accumulatedContentRef.current,
              created_at: new Date().toISOString(),
              agent_type: currentAgentTypeRef.current || "unknown",
              mode: currentModeRef.current,
            };

            onMessageComplete?.(completedMessage);
            reset();
            break;
          }
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
        console.error("Streaming error:", error);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, reset, onMessageComplete, onError],
  );

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    error,
    reset,
  };
}
