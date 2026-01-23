import { useQuery } from "@tanstack/react-query";
import { getTrace } from "../api/dgd-client";
import { parseTraceToGraph } from "../utils/traceParser";
import type { Trace } from "../types/dgd";
import type { Node, Edge } from "@xyflow/react";
import type { TraceNodeData } from "../utils/traceParser";

/**
 * Hook to fetch and parse trace data for a session
 * @param sessionId Session ID to fetch trace for
 * @returns Query result with trace data and parsed graph
 */
export const useTrace = (sessionId: string) => {
  return useQuery({
    queryKey: ["dgd-trace", sessionId],
    queryFn: () => getTrace(sessionId),
    enabled: !!sessionId,
    staleTime: 30000, // Traces are relatively static, cache for 30s
    retry: 2,
  });
};

/**
 * Hook to get parsed graph data from a trace
 * @param trace Trace object to parse
 * @returns Parsed nodes and edges for React Flow, or null if no trace
 */
export const useTraceGraph = (
  trace: Trace | undefined,
): { nodes: Node<TraceNodeData>[]; edges: Edge[] } | null => {
  if (!trace) return null;

  return parseTraceToGraph(trace);
};
