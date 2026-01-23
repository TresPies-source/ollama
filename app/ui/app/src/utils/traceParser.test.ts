import { describe, it, expect } from "vitest";
import {
  parseTraceToGraph,
  toggleNodeExpansion,
  getAncestorIds,
  getDescendantIds,
  filterGraphByPath,
  EVENT_TYPE_COLORS,
} from "./traceParser";
import type { Trace, TraceEvent } from "../types/dgd";

describe("traceParser", () => {
  // Sample trace data for testing
  const sampleEvents: TraceEvent[] = [
    {
      span_id: "root-1",
      event_type: "AGENT_ROUTING",
      timestamp: "2026-01-23T00:00:00Z",
      metadata: { agent_type: "Supervisor" },
    },
    {
      span_id: "child-1",
      parent_id: "root-1",
      event_type: "MODE_TRANSITION",
      timestamp: "2026-01-23T00:00:01Z",
      metadata: { mode: "Scout" },
    },
    {
      span_id: "child-2",
      parent_id: "root-1",
      event_type: "LLM_CALL",
      timestamp: "2026-01-23T00:00:02Z",
      metadata: { model: "gpt-4" },
    },
    {
      span_id: "grandchild-1",
      parent_id: "child-1",
      event_type: "TOOL_INVOCATION",
      timestamp: "2026-01-23T00:00:03Z",
      metadata: { tool_name: "FileSearch" },
    },
    {
      span_id: "error-1",
      parent_id: "child-2",
      event_type: "ERROR",
      timestamp: "2026-01-23T00:00:04Z",
      metadata: { message: "Connection timeout" },
    },
  ];

  const sampleTrace: Trace = {
    session_id: "test-session",
    start_time: "2026-01-23T00:00:00Z",
    events: sampleEvents,
  };

  describe("parseTraceToGraph", () => {
    it("should parse trace events into nodes and edges", () => {
      const { nodes, edges } = parseTraceToGraph(sampleTrace);

      expect(nodes).toHaveLength(5);
      expect(edges).toHaveLength(4); // 4 parent-child relationships
    });

    it("should create nodes with correct structure", () => {
      const { nodes } = parseTraceToGraph(sampleTrace);

      const rootNode = nodes.find((n) => n.id === "root-1");
      expect(rootNode).toBeDefined();
      expect(rootNode?.type).toBe("trace");
      expect(rootNode?.data.event.event_type).toBe("AGENT_ROUTING");
      expect(rootNode?.data.summary).toContain("Supervisor");
      expect(rootNode?.data.expanded).toBe(false);
      expect(rootNode?.position).toBeDefined();
    });

    it("should assign correct colors based on event type", () => {
      const { nodes } = parseTraceToGraph(sampleTrace);

      const modeTransitionNode = nodes.find((n) => n.id === "child-1");
      expect(modeTransitionNode?.style?.borderColor).toBe(
        EVENT_TYPE_COLORS.MODE_TRANSITION,
      );

      const errorNode = nodes.find((n) => n.id === "error-1");
      expect(errorNode?.style?.borderColor).toBe(EVENT_TYPE_COLORS.ERROR);
    });

    it("should create edges from parent-child relationships", () => {
      const { edges } = parseTraceToGraph(sampleTrace);

      const edgeIds = edges.map((e) => e.id);
      expect(edgeIds).toContain("root-1-child-1");
      expect(edgeIds).toContain("root-1-child-2");
      expect(edgeIds).toContain("child-1-grandchild-1");
      expect(edgeIds).toContain("child-2-error-1");
    });

    it("should handle empty trace", () => {
      const emptyTrace: Trace = {
        session_id: "empty",
        start_time: "2026-01-23T00:00:00Z",
        events: [],
      };

      const { nodes, edges } = parseTraceToGraph(emptyTrace);
      expect(nodes).toHaveLength(0);
      expect(edges).toHaveLength(0);
    });

    it("should calculate hierarchical positions", () => {
      const { nodes } = parseTraceToGraph(sampleTrace);

      const rootNode = nodes.find((n) => n.id === "root-1");
      const childNode = nodes.find((n) => n.id === "child-1");

      // Child should be below parent (higher y)
      expect(childNode!.position.y).toBeGreaterThan(rootNode!.position.y);
    });
  });

  describe("toggleNodeExpansion", () => {
    it("should toggle node expanded state", () => {
      const { nodes } = parseTraceToGraph(sampleTrace);

      const updatedNodes = toggleNodeExpansion(nodes, "root-1");
      const rootNode = updatedNodes.find((n) => n.id === "root-1");

      expect(rootNode?.data.expanded).toBe(true);

      const toggled = toggleNodeExpansion(updatedNodes, "root-1");
      const rootNodeAgain = toggled.find((n) => n.id === "root-1");

      expect(rootNodeAgain?.data.expanded).toBe(false);
    });

    it("should only affect the specified node", () => {
      const { nodes } = parseTraceToGraph(sampleTrace);

      const updatedNodes = toggleNodeExpansion(nodes, "root-1");
      const otherNode = updatedNodes.find((n) => n.id === "child-1");

      expect(otherNode?.data.expanded).toBe(false);
    });
  });

  describe("getAncestorIds", () => {
    it("should get all ancestor IDs", () => {
      const ancestors = getAncestorIds(sampleEvents, "grandchild-1");

      expect(ancestors).toContain("child-1");
      expect(ancestors).toContain("root-1");
      expect(ancestors).toHaveLength(2);
    });

    it("should return empty array for root node", () => {
      const ancestors = getAncestorIds(sampleEvents, "root-1");

      expect(ancestors).toHaveLength(0);
    });

    it("should handle direct children", () => {
      const ancestors = getAncestorIds(sampleEvents, "child-1");

      expect(ancestors).toContain("root-1");
      expect(ancestors).toHaveLength(1);
    });
  });

  describe("getDescendantIds", () => {
    it("should get all descendant IDs", () => {
      const descendants = getDescendantIds(sampleEvents, "root-1");

      expect(descendants).toContain("child-1");
      expect(descendants).toContain("child-2");
      expect(descendants).toContain("grandchild-1");
      expect(descendants).toContain("error-1");
      expect(descendants).toHaveLength(4);
    });

    it("should return empty array for leaf node", () => {
      const descendants = getDescendantIds(sampleEvents, "grandchild-1");

      expect(descendants).toHaveLength(0);
    });

    it("should handle single-level descendants", () => {
      const descendants = getDescendantIds(sampleEvents, "child-1");

      expect(descendants).toContain("grandchild-1");
      expect(descendants).toHaveLength(1);
    });
  });

  describe("filterGraphByPath", () => {
    it("should highlight nodes in path", () => {
      const { nodes, edges } = parseTraceToGraph(sampleTrace);
      const pathNodeIds = ["root-1", "child-1", "grandchild-1"];

      const { nodes: filteredNodes, edges: filteredEdges } = filterGraphByPath(
        nodes,
        edges,
        pathNodeIds,
      );

      const highlightedNode = filteredNodes.find((n) => n.id === "root-1");
      const dimmedNode = filteredNodes.find((n) => n.id === "child-2");
      const highlightedEdge = filteredEdges.find(
        (e) => e.source === "root-1" && e.target === "child-1",
      );

      expect(highlightedNode?.style?.opacity).toBe(1);
      expect(dimmedNode?.style?.opacity).toBe(0.3);
      expect(highlightedEdge?.style?.opacity).toBe(1);
    });

    it("should highlight edges in path", () => {
      const { nodes, edges } = parseTraceToGraph(sampleTrace);
      const pathNodeIds = ["root-1", "child-1"];

      const { edges: filteredEdges } = filterGraphByPath(
        nodes,
        edges,
        pathNodeIds,
      );

      const highlightedEdge = filteredEdges.find(
        (e) => e.id === "root-1-child-1",
      );
      const dimmedEdge = filteredEdges.find((e) => e.id === "root-1-child-2");

      expect(highlightedEdge?.style?.opacity).toBe(1);
      expect(dimmedEdge?.style?.opacity).toBe(0.1);
    });
  });

  describe("EVENT_TYPE_COLORS", () => {
    it("should have colors for all event types", () => {
      const eventTypes = [
        "MODE_TRANSITION",
        "TOOL_INVOCATION",
        "PERSPECTIVE_INTEGRATION",
        "LLM_CALL",
        "AGENT_ROUTING",
        "FILE_OPERATION",
        "ERROR",
      ] as const;

      for (const type of eventTypes) {
        expect(EVENT_TYPE_COLORS[type]).toBeDefined();
        expect(typeof EVENT_TYPE_COLORS[type]).toBe("string");
      }
    });

    it("should use sunset gradient for MODE_TRANSITION", () => {
      expect(EVENT_TYPE_COLORS.MODE_TRANSITION).toContain("gradient");
    });

    it("should use red for ERROR", () => {
      expect(EVENT_TYPE_COLORS.ERROR).toContain("ef4444");
    });
  });
});
