import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TraceNode } from "../components/trace/TraceNode";
import type { TraceNodeData } from "../utils/traceParser";
import type { EventType, TraceEvent } from "../types/dgd";
import { toggleNodeExpansion } from "../utils/traceParser";

const nodeTypes = {
  trace: TraceNode,
};

// Layout constants for test grid
const GRID_COLUMNS = 3;
const NODE_HORIZONTAL_SPACING = 350;
const NODE_VERTICAL_SPACING = 300;
const GRID_OFFSET = 50;

// Create test nodes for each event type
const eventTypes: EventType[] = [
  "MODE_TRANSITION",
  "TOOL_INVOCATION",
  "PERSPECTIVE_INTEGRATION",
  "LLM_CALL",
  "AGENT_ROUTING",
  "FILE_OPERATION",
  "ERROR",
];

const createTestEvent = (eventType: EventType, index: number): TraceEvent => {
  const now = new Date();
  const timestamp = new Date(now.getTime() - index * 60000).toISOString();

  const baseEvent: TraceEvent = {
    span_id: `span-${index}`,
    event_type: eventType,
    timestamp,
  };

  switch (eventType) {
    case "MODE_TRANSITION":
      return {
        ...baseEvent,
        metadata: { mode: "Mirror" },
        inputs: { context: "User message received" },
        outputs: { new_mode: "Mirror", reason: "Reflection needed" },
      };
    case "TOOL_INVOCATION":
      return {
        ...baseEvent,
        metadata: { tool_name: "file_read" },
        inputs: { path: "/home/user/document.txt" },
        outputs: { content: "File contents here...", success: true },
      };
    case "PERSPECTIVE_INTEGRATION":
      return {
        ...baseEvent,
        metadata: { perspective_count: 3 },
        inputs: {
          perspectives: [
            "Go is faster",
            "Python is easier",
            "Both have merits",
          ],
        },
        outputs: { synthesis: "Balanced view of trade-offs" },
      };
    case "LLM_CALL":
      return {
        ...baseEvent,
        metadata: { model: "gpt-4" },
        inputs: { prompt: "Analyze this code..." },
        outputs: { response: "The code implements...", tokens: 150 },
      };
    case "AGENT_ROUTING":
      return {
        ...baseEvent,
        metadata: { agent_type: "Builder" },
        inputs: { intent: "code_generation" },
        outputs: { routed_to: "Builder", confidence: 0.95 },
      };
    case "FILE_OPERATION":
      return {
        ...baseEvent,
        metadata: { operation: "write" },
        inputs: { path: "/workspace/main.go", content: "package main..." },
        outputs: { success: true, bytes_written: 256 },
      };
    case "ERROR":
      return {
        ...baseEvent,
        metadata: { message: "File not found" },
        inputs: { path: "/invalid/path.txt" },
        outputs: { error_code: "ENOENT", stack_trace: "Error: ENOENT..." },
      };
    default:
      return baseEvent;
  }
};

const createTestNodes = (): Node<TraceNodeData>[] => {
  return eventTypes.map((eventType, index) => {
    const event = createTestEvent(eventType, index);
    const summary = getSummary(event);

    return {
      id: event.span_id,
      type: "trace",
      position: {
        x: (index % GRID_COLUMNS) * NODE_HORIZONTAL_SPACING + GRID_OFFSET,
        y:
          Math.floor(index / GRID_COLUMNS) * NODE_VERTICAL_SPACING +
          GRID_OFFSET,
      },
      data: {
        event,
        summary,
        expanded: false,
      },
    };
  });
};

function getSummary(event: TraceEvent): string {
  const { event_type, metadata } = event;

  switch (event_type) {
    case "MODE_TRANSITION":
      return `Mode: ${metadata?.mode || "Unknown"}`;
    case "TOOL_INVOCATION":
      return `Tool: ${metadata?.tool_name || "Unknown"}`;
    case "PERSPECTIVE_INTEGRATION":
      return `Perspectives: ${metadata?.perspective_count || 0}`;
    case "LLM_CALL":
      return `LLM: ${metadata?.model || "Unknown"}`;
    case "AGENT_ROUTING":
      return `Agent: ${metadata?.agent_type || "Unknown"}`;
    case "FILE_OPERATION":
      return `File: ${metadata?.operation || "Unknown"}`;
    case "ERROR":
      return `Error: ${metadata?.message || "Unknown error"}`;
    default:
      return event_type;
  }
}

const createTestEdges = (): Edge[] => {
  // Create some sample connections
  return [
    {
      id: "e0-1",
      source: "span-0",
      target: "span-1",
      type: "smoothstep",
      animated: false,
      style: { stroke: "rgba(255, 255, 255, 0.3)", strokeWidth: 2 },
    },
    {
      id: "e1-2",
      source: "span-1",
      target: "span-2",
      type: "smoothstep",
      animated: false,
      style: { stroke: "rgba(255, 255, 255, 0.3)", strokeWidth: 2 },
    },
    {
      id: "e0-3",
      source: "span-0",
      target: "span-3",
      type: "smoothstep",
      animated: false,
      style: { stroke: "rgba(255, 255, 255, 0.3)", strokeWidth: 2 },
    },
    {
      id: "e3-4",
      source: "span-3",
      target: "span-4",
      type: "smoothstep",
      animated: false,
      style: { stroke: "rgba(255, 255, 255, 0.3)", strokeWidth: 2 },
    },
    {
      id: "e4-5",
      source: "span-4",
      target: "span-5",
      type: "smoothstep",
      animated: false,
      style: { stroke: "rgba(255, 255, 255, 0.3)", strokeWidth: 2 },
    },
    {
      id: "e5-6",
      source: "span-5",
      target: "span-6",
      type: "smoothstep",
      animated: false,
      style: { stroke: "rgba(255, 255, 255, 0.3)", strokeWidth: 2 },
    },
  ];
};

function TraceNodeTest() {
  const [nodes, setNodes] = useState<Node<TraceNodeData>[]>(createTestNodes());
  const [edges] = useState<Edge[]>(createTestEdges());

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<TraceNodeData>) => {
      setNodes((nds) => toggleNodeExpansion(nds, node.id));
    },
    [],
  );

  return (
    <div className="h-screen w-screen bg-dojo-bg-primary">
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background color="#1a3647" gap={16} />
          <Controls className="bg-[rgba(15,42,61,0.8)] backdrop-blur-dojo border border-white/10 rounded-dojo-lg" />
        </ReactFlow>
      </div>

      {/* Info Panel */}
      <div className="absolute top-4 left-4 max-w-md">
        <div className="bg-[rgba(15,42,61,0.9)] backdrop-blur-dojo border border-white/10 rounded-dojo-lg p-4 shadow-dojo-xl">
          <h1 className="text-xl font-bold text-white mb-2">TraceNode Test</h1>
          <p className="text-sm text-white/70 mb-4">
            Testing all event types with glassmorphism design and color-coded
            borders.
          </p>
          <div className="space-y-2 text-xs text-white/60">
            <div>
              • <span className="font-medium">Click nodes</span> to
              expand/collapse
            </div>
            <div>
              • <span className="font-medium">Drag nodes</span> to reposition
            </div>
            <div>
              • <span className="font-medium">Scroll</span> to zoom
            </div>
            <div>
              • <span className="font-medium">Pan</span> by dragging canvas
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs font-medium text-white/70 mb-2">
              Event Types:
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {eventTypes.map((type) => (
                <div key={type} className="text-white/50">
                  • {type.replace(/_/g, " ")}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/trace-node-test")({
  component: TraceNodeTest,
});
