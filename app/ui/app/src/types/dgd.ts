// DGD Backend API Types

// Session Types
export interface Session {
  id: string;
  title: string;
  working_dir: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface SessionWithMessages {
  session: Session;
  messages: Message[];
}

export interface SessionCreateRequest {
  title: string;
  working_dir: string;
}

export interface SessionCreateResponse {
  session_id: string;
}

export interface SessionListResponse {
  sessions: Session[];
}

// Message Types
export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  agent_type?: string;
  mode?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
}

// Chat Types
export interface ChatRequest {
  session_id: string;
  message: string;
  perspectives?: string[];
  stream?: boolean;
}

export interface ChatResponse {
  session_id: string;
  message_id: string;
  content: string;
  agent_type: string;
  mode?: string;
  done: boolean;
}

// Streaming chunk from SSE
export interface StreamChunk {
  content: string;
  done: boolean;
  agent_type?: string;
  mode?: string;
  error?: string;
}

// Trace Types
export type EventType =
  | "MODE_TRANSITION"
  | "TOOL_INVOCATION"
  | "PERSPECTIVE_INTEGRATION"
  | "LLM_CALL"
  | "AGENT_ROUTING"
  | "FILE_OPERATION"
  | "ERROR";

export interface TraceEvent {
  span_id: string;
  parent_id?: string;
  event_type: EventType;
  timestamp: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface Trace {
  session_id: string;
  start_time: string;
  end_time?: string;
  events: TraceEvent[];
}

// Error Types
export interface ErrorResponse {
  error: string;
}

// Seed Types (for file browser feature)
export interface SeedMetadata {
  name: string;
  description: string;
  category: string;
  tags: string[];
}

export interface Seed {
  metadata: SeedMetadata;
  content: string;
  path: string;
}

// File Tree Types (for file explorer)
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}
