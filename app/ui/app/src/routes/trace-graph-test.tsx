import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import { TraceGraph } from "../components/trace/TraceGraph";
import { TraceControls } from "../components/trace/TraceControls";
import type { Trace } from "../types/dgd";

const mockTrace: Trace = {
  session_id: "test-session-123",
  start_time: new Date(Date.now() - 10000).toISOString(),
  events: [
    {
      span_id: "span-1",
      parent_id: undefined,
      event_type: "AGENT_ROUTING",
      timestamp: new Date(Date.now() - 10000).toISOString(),
      metadata: { agent_type: "Supervisor" },
      inputs: { message: "Hello Dojo" },
      outputs: { agent: "Dojo", confidence: 0.95 },
    },
    {
      span_id: "span-2",
      parent_id: "span-1",
      event_type: "MODE_TRANSITION",
      timestamp: new Date(Date.now() - 9000).toISOString(),
      metadata: { mode: "Mirror" },
      inputs: { current_mode: "Scout" },
      outputs: { new_mode: "Mirror" },
    },
    {
      span_id: "span-3",
      parent_id: "span-2",
      event_type: "LLM_CALL",
      timestamp: new Date(Date.now() - 8000).toISOString(),
      metadata: { model: "gpt-4" },
      inputs: { prompt: "Reflect on the message" },
      outputs: { response: "I understand your question..." },
    },
    {
      span_id: "span-4",
      parent_id: "span-2",
      event_type: "TOOL_INVOCATION",
      timestamp: new Date(Date.now() - 7000).toISOString(),
      metadata: { tool_name: "SearchFiles" },
      inputs: { query: "relevant context" },
      outputs: { files: ["file1.md", "file2.md"] },
    },
    {
      span_id: "span-5",
      parent_id: "span-1",
      event_type: "PERSPECTIVE_INTEGRATION",
      timestamp: new Date(Date.now() - 6000).toISOString(),
      metadata: { perspective_count: 2 },
      inputs: { perspectives: ["technical", "user-focused"] },
      outputs: { integrated_view: "Balanced perspective" },
    },
    {
      span_id: "span-6",
      parent_id: "span-5",
      event_type: "FILE_OPERATION",
      timestamp: new Date(Date.now() - 5000).toISOString(),
      metadata: { operation: "write" },
      inputs: { path: "output.txt", content: "Result" },
      outputs: { success: true },
    },
    {
      span_id: "span-7",
      parent_id: "span-5",
      event_type: "ERROR",
      timestamp: new Date(Date.now() - 4000).toISOString(),
      metadata: { message: "Connection timeout" },
      inputs: { operation: "network_call" },
      outputs: { error: "TIMEOUT" },
    },
  ],
};

function TraceGraphTestPage() {
  return (
    <div className="w-screen h-screen bg-bg-primary">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-bg-secondary/50 backdrop-blur-dojo">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">
            Trail of Thought - Test
          </h1>
          <span className="text-sm text-white/50">
            Session: {mockTrace.session_id}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-white/70">
            {mockTrace.events.length} events
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="h-[calc(100vh-4rem)] relative">
        <ReactFlowProvider>
          <TraceGraph trace={mockTrace} />
          <TraceControls />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/trace-graph-test")({
  component: TraceGraphTestPage,
});
