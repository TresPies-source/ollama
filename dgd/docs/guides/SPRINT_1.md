# Sprint 1: Supervisor Agent

**Duration:** 3 days  
**Version:** v0.0.1  
**Status:** ✅ Complete

## Overview

Sprint 1 establishes the foundation of Dojo Genesis Desktop by implementing the **Supervisor Agent** — the intelligent router that classifies user intent and directs queries to the appropriate specialist agent.

## Deliverables

### 1. Intent Classification ✅

**File:** `agents/supervisor/supervisor.go`

The Supervisor implements keyword-based intent classification that analyzes user queries and determines which agent should handle them:

- **Librarian Agent**: File operations, search, retrieval
- **Builder Agent**: Code generation, execution
- **Dojo Agent**: Thinking partnership, advice (default)

**Example:**
```go
intent, err := supervisor.ClassifyIntent(ctx, "read the file config.json")
// Returns: Intent{Type: "librarian", Confidence: 0.75, Reasoning: "Detected file/search keywords"}
```

### 2. Agent Routing ✅

**File:** `agents/supervisor/supervisor.go`

The `Route` function directs queries to the appropriate agent based on classified intent. Currently returns placeholder responses; will be upgraded to actual agent calls in future sprints.

### 3. API Endpoints ✅

**File:** `api/handlers.go`

Implemented REST API endpoints:

- `POST /api/chat` — Send a chat message
- `POST /api/sessions` — Create a new session
- `GET /api/sessions` — List all sessions
- `GET /health` — Health check

### 4. Database Schema ✅

**File:** `database/schema.sql`

Created SQLite schema with tables for:
- Sessions
- Messages
- Traces (Harness Trace)
- Seeds
- Files
- Tool calls

### 5. Unit Tests ✅

**File:** `agents/supervisor/supervisor_test.go`

Comprehensive test coverage for:
- Librarian intent classification
- Builder intent classification
- Dojo intent classification (including default fallback)
- Routing logic

## Architecture Decisions

### Why Keyword-Based Classification?

**Phase 1 (Current):** Simple, fast, no external dependencies. Perfect for MVP.

**Phase 2 (Future):** Upgrade to LLM-based classification for more nuanced understanding.

### Why SQLite?

- **Local-first**: Data never leaves the user's machine
- **Embedded**: No separate database server required
- **Fast**: Excellent for read-heavy workloads
- **Portable**: Single file, easy to backup

### Why Gin Framework?

- **Fast**: One of the fastest Go web frameworks
- **Simple**: Clean API, easy to learn
- **Popular**: Large community, good documentation
- **Proven**: Used by Ollama and many production systems

## Testing

Run tests:
```bash
go test ./agents/supervisor -v
```

Expected output:
```
=== RUN   TestClassifyIntent_Librarian
--- PASS: TestClassifyIntent_Librarian (0.00s)
=== RUN   TestClassifyIntent_Builder
--- PASS: TestClassifyIntent_Builder (0.00s)
=== RUN   TestClassifyIntent_Dojo
--- PASS: TestClassifyIntent_Dojo (0.00s)
=== RUN   TestRoute
--- PASS: TestRoute (0.00s)
PASS
```

## Running the Server

```bash
# Install dependencies
go mod download

# Run server
go run cmd/dgd/main.go

# Server starts on http://localhost:8080
```

## API Usage Examples

### Create a Session
```bash
curl -X POST http://localhost:8080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Session", "working_dir": "/home/user/projects"}'
```

### Send a Chat Message
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "abc123", "message": "read the file README.md"}'
```

## Next Steps (Sprint 2)

1. **Implement Librarian Agent**
   - File search functionality
   - Seed retrieval
   - SQLite integration for metadata

2. **Database Persistence**
   - Save sessions to database
   - Save messages to database
   - Query session history

3. **Error Handling**
   - Graceful error recovery
   - User-friendly error messages
   - Logging and debugging

## Lessons Learned

1. **Start Simple**: Keyword-based classification is sufficient for MVP
2. **Test Early**: Unit tests caught several edge cases
3. **Plan for Upgrades**: Code is structured to easily swap in LLM-based classification
4. **Follow Patterns**: Ollama's architecture patterns work well for our use case

## Team

Built with patience by Cruz Morales and Manus AI (Dojo).
