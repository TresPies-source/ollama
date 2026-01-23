/**
 * Demo script to show trace parser functionality
 * Run with: npx tsx scripts/demo-trace-parser.ts
 */

import {
  parseTraceToGraph,
  getAncestorIds,
  getDescendantIds,
} from "../src/utils/traceParser";
import type { Trace } from "../src/types/dgd";

// Sample trace data representing a typical DGD interaction
const demoTrace: Trace = {
  session_id: "demo-session",
  start_time: "2026-01-23T00:00:00Z",
  end_time: "2026-01-23T00:01:30Z",
  events: [
    // Root: User message arrives at Supervisor
    {
      span_id: "supervisor-1",
      event_type: "AGENT_ROUTING",
      timestamp: "2026-01-23T00:00:00Z",
      metadata: { agent_type: "Supervisor", intent: "code_help" },
    },
    // Supervisor routes to Dojo
    {
      span_id: "dojo-1",
      parent_id: "supervisor-1",
      event_type: "AGENT_ROUTING",
      timestamp: "2026-01-23T00:00:01Z",
      metadata: { agent_type: "Dojo" },
    },
    // Dojo transitions to Scout mode
    {
      span_id: "mode-scout-1",
      parent_id: "dojo-1",
      event_type: "MODE_TRANSITION",
      timestamp: "2026-01-23T00:00:02Z",
      metadata: { mode: "Scout", reason: "Need to explore codebase" },
    },
    // Scout mode calls Librarian
    {
      span_id: "librarian-1",
      parent_id: "mode-scout-1",
      event_type: "AGENT_ROUTING",
      timestamp: "2026-01-23T00:00:03Z",
      metadata: { agent_type: "Librarian" },
    },
    // Librarian uses FileSearch tool
    {
      span_id: "tool-filesearch-1",
      parent_id: "librarian-1",
      event_type: "TOOL_INVOCATION",
      timestamp: "2026-01-23T00:00:04Z",
      metadata: { tool_name: "FileSearch", query: "authentication" },
    },
    // Librarian makes LLM call to summarize results
    {
      span_id: "llm-summarize-1",
      parent_id: "librarian-1",
      event_type: "LLM_CALL",
      timestamp: "2026-01-23T00:00:05Z",
      metadata: { model: "gpt-4", tokens: 1500 },
    },
    // Back to Dojo: integrate perspectives
    {
      span_id: "perspective-1",
      parent_id: "dojo-1",
      event_type: "PERSPECTIVE_INTEGRATION",
      timestamp: "2026-01-23T00:00:06Z",
      metadata: { perspective_count: 3, merged: true },
    },
    // Dojo transitions to Implementation mode
    {
      span_id: "mode-impl-1",
      parent_id: "dojo-1",
      event_type: "MODE_TRANSITION",
      timestamp: "2026-01-23T00:00:07Z",
      metadata: { mode: "Implementation", reason: "Ready to code" },
    },
    // Implementation mode calls Builder
    {
      span_id: "builder-1",
      parent_id: "mode-impl-1",
      event_type: "AGENT_ROUTING",
      timestamp: "2026-01-23T00:00:08Z",
      metadata: { agent_type: "Builder" },
    },
    // Builder writes file
    {
      span_id: "file-write-1",
      parent_id: "builder-1",
      event_type: "FILE_OPERATION",
      timestamp: "2026-01-23T00:00:09Z",
      metadata: { operation: "write", path: "auth.go" },
    },
    // Builder makes LLM call to generate code
    {
      span_id: "llm-codegen-1",
      parent_id: "builder-1",
      event_type: "LLM_CALL",
      timestamp: "2026-01-23T00:00:10Z",
      metadata: { model: "gpt-4", tokens: 3000 },
    },
    // Error occurs during file write
    {
      span_id: "error-1",
      parent_id: "file-write-1",
      event_type: "ERROR",
      timestamp: "2026-01-23T00:00:11Z",
      metadata: { message: "Permission denied: auth.go", code: "EACCES" },
    },
  ],
};

console.log("🎨 Dojo Genesis - Trace Parser Demo\n");
console.log("=".repeat(80));

// Parse trace
console.log("\n📊 Parsing trace with", demoTrace.events.length, "events...\n");
const { nodes, edges } = parseTraceToGraph(demoTrace);

// Display nodes
console.log("🔵 Nodes Generated:", nodes.length);
console.log("-".repeat(80));
for (const node of nodes) {
  const depth = getAncestorIds(demoTrace.events, node.id).length;
  const indent = "  ".repeat(depth);
  const icon = getEventIcon(node.data.event.event_type);
  console.log(
    `${indent}${icon} ${node.id.padEnd(20)} | ${node.data.event.event_type.padEnd(25)} | ${node.data.summary}`,
  );
}

// Display edges
console.log("\n🔗 Edges Generated:", edges.length);
console.log("-".repeat(80));
for (const edge of edges) {
  console.log(`  ${edge.source} → ${edge.target}`);
}

// Show hierarchy for a specific node
console.log('\n🌲 Hierarchy Analysis for "file-write-1":');
console.log("-".repeat(80));
const ancestors = getAncestorIds(demoTrace.events, "file-write-1");
console.log("  Ancestors:", ancestors.join(" → "));

const descendants = getDescendantIds(demoTrace.events, "file-write-1");
console.log("  Descendants:", descendants.join(", "));

// Show color coding
console.log("\n🎨 Color Coding:");
console.log("-".repeat(80));
const eventTypes = new Set(demoTrace.events.map((e) => e.event_type));
for (const eventType of eventTypes) {
  const node = nodes.find((n) => n.data.event.event_type === eventType);
  if (node) {
    console.log(
      `  ${getEventIcon(eventType)} ${eventType.padEnd(30)} | ${node.style?.borderColor}`,
    );
  }
}

// Show positions
console.log("\n📍 Node Positions:");
console.log("-".repeat(80));
console.log("  (x, y) coordinates for hierarchical layout");
for (const node of nodes.slice(0, 5)) {
  console.log(
    `  ${node.id.padEnd(20)} | (${node.position.x}, ${node.position.y})`,
  );
}
console.log("  ... and", nodes.length - 5, "more nodes");

console.log("\n✅ Trace parsing complete!\n");
console.log("=".repeat(80));
console.log("\nNext Steps:");
console.log("  1. Create custom TraceNode component (Step 6.2)");
console.log("  2. Build TraceGraph with React Flow (Step 6.3)");
console.log("  3. Integrate with backend API (Step 6.4)\n");

function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    MODE_TRANSITION: "🔄",
    TOOL_INVOCATION: "🔧",
    PERSPECTIVE_INTEGRATION: "🧩",
    LLM_CALL: "🤖",
    AGENT_ROUTING: "🎯",
    FILE_OPERATION: "📁",
    ERROR: "❌",
  };
  return icons[eventType] || "•";
}
