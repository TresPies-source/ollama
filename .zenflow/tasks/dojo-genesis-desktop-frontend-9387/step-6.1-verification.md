# Step 6.1: Trail of Thought - Trace Parsing - Verification

**Date:** 2026-01-23  
**Status:** ✅ Complete

---

## Implementation Summary

Created `src/utils/traceParser.ts` with comprehensive trace-to-graph conversion functionality.

### Files Created

1. **`src/utils/traceParser.ts`** (main implementation)
   - `parseTraceToGraph()` - Converts Trace to React Flow nodes and edges
   - `toggleNodeExpansion()` - Manages node expand/collapse state
   - `getAncestorIds()` - Gets all ancestor nodes for highlighting
   - `getDescendantIds()` - Gets all descendant nodes for filtering
   - `filterGraphByPath()` - Highlights specific paths in the graph
   - `EVENT_TYPE_COLORS` - Color mapping for event types

2. **`src/utils/traceParser.test.ts`** (test suite)
   - 19 comprehensive tests covering all functionality
   - Tests for empty traces, hierarchical structure, and edge cases

---

## Features Implemented

### 1. **Trace to Graph Conversion**

Converts DGD trace events into React Flow graph structure:

```typescript
const { nodes, edges } = parseTraceToGraph(trace);
```

**Node Structure:**
- `id`: span_id from trace event
- `type`: 'trace' (custom node type)
- `position`: Calculated hierarchically
- `data`: Contains event, summary, expanded state
- `style`: Color-coded border by event type

**Edge Structure:**
- `id`: "{parent_id}-{span_id}"
- `source`: parent span_id
- `target`: child span_id
- `type`: 'smoothstep' (bezier curves)
- `style`: Semi-transparent white stroke

### 2. **Hierarchical Layout**

Implements top-to-bottom hierarchical layout:
- Root nodes at y=0
- Each level 150px below parent
- Siblings spaced 300px horizontally
- Parents centered over children

### 3. **Event Type Color Coding**

| Event Type | Color | Description |
|------------|-------|-------------|
| MODE_TRANSITION | Sunset gradient | Golden-orange gradient |
| TOOL_INVOCATION | Blue (#3b82f6) | Tool execution |
| PERSPECTIVE_INTEGRATION | Green (#10b981) | Perspective merging |
| LLM_CALL | Yellow (#fbbf24) | LLM API calls |
| AGENT_ROUTING | Purple (#a855f7) | Agent selection |
| FILE_OPERATION | Teal (#14b8a6) | File system ops |
| ERROR | Red (#ef4444) | Error events |

### 4. **Summary Generation**

Auto-generates human-readable summaries:
- MODE_TRANSITION: "Mode: Scout"
- TOOL_INVOCATION: "Tool: FileSearch"
- LLM_CALL: "LLM: gpt-4"
- ERROR: "Error: Connection timeout"

### 5. **Path Highlighting**

Support for highlighting specific paths through the graph:
- `getAncestorIds()`: Get all parents up to root
- `getDescendantIds()`: Get all children recursively
- `filterGraphByPath()`: Dim non-path nodes/edges

### 6. **Node Expansion**

Toggle expand/collapse state for nodes:
```typescript
const updatedNodes = toggleNodeExpansion(nodes, nodeId);
```

---

## Test Results

```
✓ src/utils/traceParser.test.ts (19 tests) 9ms

Test Files  1 passed (1)
     Tests  19 passed (19)
  Duration  421ms
```

### Test Coverage

- ✅ Parse trace events into nodes and edges
- ✅ Create nodes with correct structure
- ✅ Assign correct colors based on event type
- ✅ Create edges from parent-child relationships
- ✅ Handle empty trace
- ✅ Calculate hierarchical positions
- ✅ Toggle node expanded state
- ✅ Get all ancestor IDs
- ✅ Get all descendant IDs
- ✅ Highlight nodes and edges in path
- ✅ All event types have color definitions

---

## Sample Output

For a trace with 5 events:
```
root-1 (AGENT_ROUTING)
  ├── child-1 (MODE_TRANSITION)
  │     └── grandchild-1 (TOOL_INVOCATION)
  └── child-2 (LLM_CALL)
        └── error-1 (ERROR)
```

**Generated Graph:**
- **5 nodes** with positions, colors, and summaries
- **4 edges** connecting parent-child relationships
- **Hierarchical layout** with root at top
- **Color-coded borders** based on event type

---

## Integration Points

### Input Format (DGD Backend)
```typescript
interface Trace {
  session_id: string;
  start_time: string;
  end_time?: string;
  events: TraceEvent[];
}

interface TraceEvent {
  span_id: string;
  parent_id?: string;
  event_type: EventType;
  timestamp: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

### Output Format (React Flow)
```typescript
interface Node<TraceNodeData> {
  id: string;
  type: 'trace';
  position: { x: number; y: number };
  data: {
    event: TraceEvent;
    summary: string;
    expanded: boolean;
  };
  style: {
    borderColor: string;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'smoothstep';
  style: {
    stroke: string;
    strokeWidth: number;
  };
}
```

---

## Next Steps

### Step 6.2: Custom Trace Nodes
- Create `TraceNode.tsx` component
- Implement glassmorphism styling
- Add expand/collapse UI
- Show inputs/outputs when expanded

### Step 6.3: Graph Visualization
- Create `TraceGraph.tsx` with React Flow
- Add zoom/pan controls
- Add minimap
- Implement hover highlighting

### Step 6.4: Route & Integration
- Create `/trace/:sessionId` route
- Fetch trace from backend API
- Integrate with trace parser
- Add link from chat page

---

## Notes

- Layout algorithm is simple but effective for moderate-sized traces
- For very large traces (>100 nodes), may need more sophisticated layout (dagre/elkjs)
- Color scheme matches Dojo Genesis design system
- Ready for React Flow integration in next step

---

**Verification:** ✅ All tests passed, ready for Step 6.2
