import type { Node, Edge } from "@xyflow/react";
import type { Trace, TraceEvent, EventType } from "../types/dgd";

/**
 * Extended node data for trace visualization
 * Extends Record<string, unknown> to satisfy React Flow's Node type constraint
 */
export interface TraceNodeData extends Record<string, unknown> {
  event: TraceEvent;
  summary: string;
  expanded: boolean;
}

/**
 * Color mapping for different event types
 */
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  MODE_TRANSITION:
    "linear-gradient(135deg, #f4a261 0%, #e76f51 50%, #ffd166 100%)", // Sunset gradient
  TOOL_INVOCATION: "#3b82f6", // Blue accent
  PERSPECTIVE_INTEGRATION: "#10b981", // Green accent
  LLM_CALL: "#fbbf24", // Yellow accent
  AGENT_ROUTING: "#8b5cf6", // Purple accent (spec-compliant)
  FILE_OPERATION: "#14b8a6", // Teal accent
  ERROR: "#ef4444", // Red accent
};

/**
 * Generate a summary string for a trace event
 */
function generateEventSummary(event: TraceEvent): string {
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

/**
 * Calculate hierarchical positions for nodes
 * Uses a simple top-to-bottom layout with horizontal spacing
 */
function calculateNodePositions(
  events: TraceEvent[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Build parent-child relationships
  const children = new Map<string, string[]>();
  const roots: string[] = [];

  for (const event of events) {
    if (!event.parent_id) {
      roots.push(event.span_id);
    } else {
      if (!children.has(event.parent_id)) {
        children.set(event.parent_id, []);
      }
      children.get(event.parent_id)!.push(event.span_id);
    }
  }

  // Constants for layout
  const HORIZONTAL_SPACING = 300;
  const VERTICAL_SPACING = 150;

  // Recursive function to layout nodes
  function layoutNode(
    spanId: string,
    x: number,
    y: number,
    offset: number,
  ): number {
    positions.set(spanId, { x, y });

    const nodeChildren = children.get(spanId) || [];
    if (nodeChildren.length === 0) {
      return offset;
    }

    let currentOffset = offset;
    for (let i = 0; i < nodeChildren.length; i++) {
      const childX = currentOffset * HORIZONTAL_SPACING;
      const childY = y + VERTICAL_SPACING;
      currentOffset = layoutNode(
        nodeChildren[i],
        childX,
        childY,
        currentOffset,
      );
      currentOffset++;
    }

    // Center parent over children
    if (nodeChildren.length > 0) {
      const firstChildX = positions.get(nodeChildren[0])!.x;
      const lastChildX = positions.get(
        nodeChildren[nodeChildren.length - 1],
      )!.x;
      const centerX = (firstChildX + lastChildX) / 2;
      positions.set(spanId, { x: centerX, y });
    }

    return currentOffset;
  }

  // Layout each root tree
  let currentOffset = 0;
  for (const rootId of roots) {
    currentOffset = layoutNode(
      rootId,
      currentOffset * HORIZONTAL_SPACING,
      0,
      currentOffset,
    );
    currentOffset++;
  }

  return positions;
}

/**
 * Parse trace data into React Flow nodes and edges
 */
export function parseTraceToGraph(trace: Trace): {
  nodes: Node<TraceNodeData>[];
  edges: Edge[];
} {
  const { events } = trace;

  if (!events || events.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Calculate positions
  const positions = calculateNodePositions(events);

  // Create nodes
  const nodes: Node<TraceNodeData>[] = events.map((event) => {
    const position = positions.get(event.span_id) || { x: 0, y: 0 };
    const summary = generateEventSummary(event);
    const color = EVENT_TYPE_COLORS[event.event_type];

    return {
      id: event.span_id,
      type: "trace",
      position,
      data: {
        event,
        summary,
        expanded: false,
      },
      style: {
        borderColor: color,
      },
    };
  });

  // Create edges
  const edges: Edge[] = events
    .filter((event) => event.parent_id)
    .map((event) => ({
      id: `${event.parent_id}-${event.span_id}`,
      source: event.parent_id!,
      target: event.span_id,
      type: "smoothstep",
      animated: false,
      style: {
        stroke: "rgba(255, 255, 255, 0.3)",
        strokeWidth: 2,
      },
    }));

  return { nodes, edges };
}

/**
 * Toggle node expansion state
 */
export function toggleNodeExpansion(
  nodes: Node<TraceNodeData>[],
  nodeId: string,
): Node<TraceNodeData>[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          expanded: !node.data.expanded,
        },
      };
    }
    return node;
  });
}

/**
 * Get all ancestor node IDs for a given node
 */
export function getAncestorIds(events: TraceEvent[], spanId: string): string[] {
  const ancestors: string[] = [];
  const eventMap = new Map(events.map((e) => [e.span_id, e]));

  let current = eventMap.get(spanId);
  while (current?.parent_id) {
    ancestors.push(current.parent_id);
    current = eventMap.get(current.parent_id);
  }

  return ancestors;
}

/**
 * Get all descendant node IDs for a given node
 */
export function getDescendantIds(
  events: TraceEvent[],
  spanId: string,
): string[] {
  const descendants: string[] = [];
  const children = new Map<string, string[]>();

  // Build parent-child map
  for (const event of events) {
    if (event.parent_id) {
      if (!children.has(event.parent_id)) {
        children.set(event.parent_id, []);
      }
      children.get(event.parent_id)!.push(event.span_id);
    }
  }

  // Recursive function to get all descendants
  function collectDescendants(id: string) {
    const childIds = children.get(id) || [];
    for (const childId of childIds) {
      descendants.push(childId);
      collectDescendants(childId);
    }
  }

  collectDescendants(spanId);
  return descendants;
}

/**
 * Filter nodes and edges to show only a path (for highlighting)
 */
export function filterGraphByPath(
  nodes: Node<TraceNodeData>[],
  edges: Edge[],
  pathNodeIds: string[],
): {
  nodes: Node<TraceNodeData>[];
  edges: Edge[];
} {
  const pathSet = new Set(pathNodeIds);

  const filteredNodes = nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      opacity: pathSet.has(node.id) ? 1 : 0.3,
    },
  }));

  const filteredEdges = edges.map((edge) => ({
    ...edge,
    style: {
      ...edge.style,
      opacity: pathSet.has(edge.source) && pathSet.has(edge.target) ? 1 : 0.1,
    },
  }));

  return { nodes: filteredNodes, edges: filteredEdges };
}
