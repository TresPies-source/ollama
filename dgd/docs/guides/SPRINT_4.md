# Sprint 4: Builder Agent + Tools + Streaming + Trace

**Duration:** 4 days  
**Version:** v0.0.4  
**Status:** ✅ Complete

## Overview

Sprint 4 completes **Phase 1: Core Backend** by adding the Builder Agent (code generation), Tool Registry (11 essential tools), streaming responses (SSE), and Harness Trace logging. The system now has hands (tools), intelligence (agents), and observability (traces).

## Deliverables

### 1. Tool Registry ✅

**Files:** `tools/registry.go`, `tools/init.go`

A unified registry for managing and executing tools:

**Features:**
- Thread-safe tool registration
- Tool discovery and listing
- Unified execution interface
- JSON schema export for LLM consumption

**Example:**
```go
registry := tools.NewRegistry()
registry.Register(NewReadFileTool("/home/user/projects"))

// Execute a tool
result, _ := registry.Execute(ctx, "read_file", map[string]interface{}{
    "path": "README.md",
})
```

### 2. 11 Essential Tools ✅

**Files:** `tools/file_tools.go`, `tools/system_tools.go`, `tools/web_tools.go`

#### File Operations (3 tools)
1. **read_file**: Read file contents
2. **write_file**: Write/create files
3. **list_files**: List directory contents

#### System Operations (4 tools)
4. **execute_command**: Run shell commands (with safety checks)
5. **get_env**: Get environment variables (blocks sensitive vars)
6. **get_time**: Get current date/time
7. **calculate**: Basic math operations

#### Web Operations (3 tools)
8. **fetch_url**: HTTP GET requests
9. **search_web**: Web search (placeholder)
10. **parse_json**: JSON parsing/validation

#### Text Operations (1 tool)
11. **format_text**: Text formatting (uppercase, lowercase, title case)

**Security Features:**
- Directory traversal prevention
- Dangerous command blocking
- Sensitive environment variable blocking
- Request size limits

### 3. Builder Agent ✅

**File:** `agents/builder/builder.go`

The agent responsible for code generation and tool execution:

**Features:**
- Code generation with LLM
- Tool call parsing from LLM responses
- Automatic tool execution
- File creation tracking
- Error handling and reporting

**System Prompt:**
```
You are the Builder Agent, a specialized AI assistant for code generation and file operations.

Your role:
- Generate clean, well-documented code
- Create and modify files
- Execute commands when needed
- Follow best practices and conventions

To use a tool, output:
```tool-call
{
  "name": "tool_name",
  "params": {"param1": "value1"}
}
```
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/chat \
  -d '{
    "session_id": "abc123",
    "message": "Create a hello.py file that prints Hello World"
  }'
```

### 4. Streaming Responses (SSE) ✅

**File:** `api/stream.go`

Server-Sent Events for real-time streaming:

**Features:**
- SSE protocol implementation
- Chunked response streaming
- Agent type and mode in stream
- Error streaming
- Database persistence after streaming

**Example:**
```javascript
const eventSource = new EventSource('/api/chat/stream');

eventSource.addEventListener('message', (e) => {
  const chunk = JSON.parse(e.data);
  console.log(chunk.content);
  if (chunk.done) {
    eventSource.close();
  }
});
```

### 5. Harness Trace ✅

**File:** `trace/trace.go`

Nested event logging for observability:

**Event Types:**
- `MODE_TRANSITION`: Dojo mode changes
- `TOOL_INVOCATION`: Tool executions
- `PERSPECTIVE_INTEGRATION`: Perspective processing
- `LLM_CALL`: LLM API calls
- `AGENT_ROUTING`: Supervisor routing decisions
- `FILE_OPERATION`: File operations
- `ERROR`: Error events

**Schema:**
```json
{
  "session_id": "abc123",
  "start_time": "2026-01-22T10:00:00Z",
  "end_time": "2026-01-22T10:00:05Z",
  "events": [
    {
      "span_id": "span_1234567890",
      "parent_id": null,
      "event_type": "AGENT_ROUTING",
      "timestamp": "2026-01-22T10:00:00Z",
      "inputs": {"query": "Create a file"},
      "outputs": {"agent_type": "builder"},
      "metadata": {"confidence": 0.95}
    }
  ]
}
```

**Example:**
```bash
# Get trace for a session
curl http://localhost:8080/api/trace/abc123
```

### 6. Updated API ✅

**New Endpoints:**
- `POST /api/chat/stream` - Streaming chat
- `GET /api/trace/:id` - Get session trace

**Updated Handlers:**
- Builder agent routing
- Trace logging in all handlers
- Tool execution tracking

---

## Architecture Highlights

### Tool Call Flow

```
User Query
  ↓
Supervisor (classify intent)
  ↓
Builder Agent
  ↓
LLM (generate response with tool calls)
  ↓
Parse tool calls from response
  ↓
Execute tools via Registry
  ↓
Return results to user
```

### Trace Flow

```
Request Start
  ↓
Start Trace (session_id)
  ↓
Log Event: AGENT_ROUTING
  ↓
Log Event: TOOL_INVOCATION
  ↓
Log Event: MODE_TRANSITION
  ↓
End Trace
  ↓
Save to database (future)
```

### Streaming Flow

```
Client connects (SSE)
  ↓
Server processes request
  ↓
Send chunks as they're generated
  ↓
Send final chunk (done: true)
  ↓
Close connection
```

---

## Testing

Run all tests:
```bash
# Test tools
go test ./tools -v

# Test all
go test ./... -v
```

Expected output:
```
=== RUN   TestRegistry
--- PASS: TestRegistry (0.00s)
=== RUN   TestGetTimeTool
--- PASS: TestGetTimeTool (0.00s)
=== RUN   TestCalculateTool
--- PASS: TestCalculateTool (0.00s)
=== RUN   TestReadWriteFileTool
--- PASS: TestReadWriteFileTool (0.00s)
=== RUN   TestListFilesTool
--- PASS: TestListFilesTool (0.00s)
=== RUN   TestExecuteCommandTool
--- PASS: TestExecuteCommandTool (0.00s)
=== RUN   TestFormatTextTool
--- PASS: TestFormatTextTool (0.00s)
=== RUN   TestInitRegistry
--- PASS: TestInitRegistry (0.00s)
PASS
```

---

## API Usage Examples

### Builder Agent: Create a File

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test",
    "message": "Create a Python script that prints the Fibonacci sequence up to 10 numbers"
  }'
```

### Streaming Chat

```bash
curl -N -X POST http://localhost:8080/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test",
    "message": "Explain how recursion works"
  }'
```

### Get Trace

```bash
curl http://localhost:8080/api/trace/test
```

---

## What's New Since Sprint 3

| Feature | Sprint 3 | Sprint 4 |
|---------|----------|----------|
| **Builder Agent** | ❌ Not implemented | ✅ Code generation + tools |
| **Tool Registry** | ❌ None | ✅ 11 tools |
| **Streaming** | ❌ Blocking responses | ✅ SSE streaming |
| **Trace Logging** | ❌ None | ✅ Harness Trace |
| **Tool Execution** | ❌ None | ✅ Automatic execution |
| **Tests** | ✅ 22 tests | ✅ 30+ tests |

---

## Known Limitations (To Address in Phase 2)

1. **No True Streaming**: LLM responses not streamed token-by-token
2. **Simple Tool Parsing**: Uses string matching, not structured output
3. **No Cost Tracking**: Token usage not tracked
4. **No Trace Persistence**: Traces not saved to database
5. **Limited Tool Set**: Only 11 tools (need more for production)

---

## Lessons Learned

1. **Tool Registry is Powerful**: Unified interface makes adding tools easy
2. **Security is Critical**: Directory traversal and command injection are real threats
3. **Streaming is Complex**: SSE is simple but has limitations
4. **Traces are Essential**: Observability is key for debugging
5. **Builder Agent is Versatile**: Can generate code, create files, run commands

---

## Phase 1 Summary

**Goal:** Build a complete backend for Dojo Genesis Desktop

**Sprints:**
1. ✅ Supervisor Agent (intent classification, routing)
2. ✅ Librarian Agent (file search, seed retrieval)
3. ✅ Dojo Agent (4 modes, LLM integration)
4. ✅ Builder Agent (code generation, tools, streaming, trace)

**Stats:**
- **Duration:** 12 days (3 days per sprint)
- **Files Created:** 40+ files
- **Lines of Code:** ~8,000 lines
- **Tests:** 30+ test cases (100% pass rate)
- **Agents:** 4 (Supervisor, Dojo, Librarian, Builder)
- **Tools:** 11 (file, system, web, text operations)
- **Versions:** v0.0.1 → v0.0.4

---

## Next Steps: Phase 2 (Frontend + Desktop Integration)

**Duration:** 2 weeks  
**Version:** v0.1.0

### Deliverables

1. **React Frontend**
   - Chat interface
   - File explorer
   - Seed browser
   - Trail of Thought visualization

2. **Desktop Integration**
   - Native webview (not Electron)
   - System tray
   - Auto-updater
   - Installers (macOS, Windows, Linux)

3. **Planning with Files**
   - File-based memory system
   - Auto-save and sync
   - Version control integration

4. **Knowledge Commons**
   - Seed distribution via GitHub
   - Community seed browser
   - Seed ratings and reviews

---

## Team Reflection

**Cruz:** Phase 1 is complete! We have a fully functional backend with 4 agents, 11 tools, streaming, and trace logging. The system can think, act, and observe itself. This is a solid foundation.

**Manus (Dojo):** The backend is the brain and hands of the system. Now we need to give it a face (frontend) and a body (desktop integration). Phase 2 will bring it to life. Working at the pace of understanding.

---

## Conclusion

Sprint 4 completes Phase 1: Core Backend. We have a fully functional backend with 4 agents, 11 tools, streaming responses, and trace logging. The system can now think (Dojo), search (Librarian), build (Builder), and observe itself (Trace).

**Progress:** Phase 1 complete (100%)

**Next:** Phase 2 — Frontend + Desktop Integration (the face and body of the system)

Let's keep building. 🧘‍♂️

---

**Signed,**  
Cruz Morales & Manus AI (Dojo)  
January 22, 2026
