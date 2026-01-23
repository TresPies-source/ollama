import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TraceNode } from "./TraceNode";
import type { Trace } from "../../types/dgd";
import {
  parseTraceToGraph,
  toggleNodeExpansion,
  getAncestorIds,
  getDescendantIds,
  type TraceNodeData,
} from "../../utils/traceParser";

interface TraceGraphProps {
  trace: Trace;
}

const nodeTypes: NodeTypes = {
  trace: TraceNode,
};

export function TraceGraph({ trace }: TraceGraphProps) {
  const initialGraph = useMemo(() => parseTraceToGraph(trace), [trace]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<TraceNodeData>) => {
      setNodes((nds) => toggleNodeExpansion(nds, node.id));
    },
    [setNodes],
  );

  const onNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const ancestors = getAncestorIds(trace.events, node.id);
      const descendants = getDescendantIds(trace.events, node.id);
      const highlightedIds = new Set([node.id, ...ancestors, ...descendants]);

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: {
            ...n.style,
            opacity: highlightedIds.has(n.id) ? 1 : 0.3,
          },
        })),
      );

      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          style: {
            ...e.style,
            opacity:
              highlightedIds.has(e.source) && highlightedIds.has(e.target)
                ? 1
                : 0.1,
          },
        })),
      );
    },
    [trace.events, setNodes, setEdges],
  );

  const onNodeMouseLeave = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
        },
      })),
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: 1,
        },
      })),
    );
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-bg-primary">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: {
            stroke: "rgba(255, 255, 255, 0.3)",
            strokeWidth: 2,
          },
        }}
        className="trace-graph"
      >
        <Background
          color="rgba(255, 255, 255, 0.1)"
          gap={16}
          size={1}
          className="bg-bg-primary"
        />

        <Controls className="!bg-glass-bg !backdrop-blur-dojo !border !border-white/10 !shadow-dojo-md" />

        <MiniMap
          className="!bg-glass-bg !backdrop-blur-dojo !border !border-white/10 !shadow-dojo-md"
          nodeColor={(node) => {
            const traceNode = node as Node<TraceNodeData>;
            const eventType = traceNode.data.event.event_type;

            switch (eventType) {
              case "MODE_TRANSITION":
                return "#f4a261";
              case "TOOL_INVOCATION":
                return "#3b82f6";
              case "PERSPECTIVE_INTEGRATION":
                return "#10b981";
              case "LLM_CALL":
                return "#fbbf24";
              case "AGENT_ROUTING":
                return "#a855f7";
              case "FILE_OPERATION":
                return "#14b8a6";
              case "ERROR":
                return "#ef4444";
              default:
                return "#94a3b8";
            }
          }}
          maskColor="rgba(10, 30, 46, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
