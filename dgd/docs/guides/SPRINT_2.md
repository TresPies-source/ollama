# Sprint 2: Librarian Agent & Database Persistence

**Duration:** 3 days  
**Version:** v0.0.2  
**Status:** ✅ Complete

## Overview

Sprint 2 brings Dojo Genesis Desktop to life with the **Librarian Agent** and **database persistence**. The system can now search files, retrieve knowledge seeds, and persist sessions and messages to SQLite.

## Deliverables

### 1. Librarian Agent ✅

**File:** `agents/librarian/librarian.go`

The Librarian implements file operations and knowledge retrieval:

**Features:**
- **File Search**: Recursive directory traversal with pattern matching
- **File Reading**: Secure file access with path validation
- **Seed Management**: YAML frontmatter parsing for knowledge seeds
- **Seed Search**: Query seeds by name, category, or tags

**Example:**
```go
lib := librarian.NewLibrarian("/home/user/projects", "/home/user/.dgd/seeds")

// Search for markdown files
results, err := lib.SearchFiles(ctx, "*.md")

// Retrieve a specific seed
seed, err := lib.RetrieveSeed(ctx, "Memory Management")

// Search seeds by category
seeds, err := lib.SearchSeeds(ctx, "architecture")
```

### 2. Database Persistence ✅

**Files:** `database/sessions.go`, `database/messages.go`

Full CRUD operations for sessions and messages:

**Sessions:**
- Create, Read, Update, Delete
- Status management (active, archived, deleted)
- Automatic timestamp tracking

**Messages:**
- Create, Read, List, Delete
- Agent type and mode tracking
- Foreign key constraints
- Automatic session timestamp updates

### 3. API Integration ✅

**File:** `api/handlers.go`

Updated API handlers with full integration:

**New Endpoints:**
- `GET /api/sessions/:id` — Get session with message history

**Updated Endpoints:**
- `POST /api/chat` — Now saves messages to database and routes to Librarian
- `POST /api/sessions` — Now persists to database
- `GET /api/sessions` — Now retrieves from database

**Librarian Query Handling:**
- File search queries: `"find all files"`, `"list files"`
- File read queries: `"read README.md"`, `"show config.json"`
- Seed queries: `"list seeds"`, `"find seed about memory"`

### 4. Seed File Format ✅

**Format:** Markdown with YAML frontmatter

```markdown
---
name: Memory Management
description: Best practices for memory management
category: architecture
tags:
  - memory
  - performance
  - context
---

# Memory Management

Use the Context Iceberg pattern for efficient memory management.

## Key Principles

1. **Tier 1 (Always On):** Core system prompt
2. **Tier 2 (On Demand):** Active seed patches
3. **Tier 3 (When Referenced):** Full file content
4. **Tier 4 (Pruned):** General conversation history
```

### 5. Unit Tests ✅

**Files:** `agents/librarian/librarian_test.go`, `database/database_test.go`

Comprehensive test coverage:

**Librarian Tests:**
- File search with patterns
- File reading with security checks
- Seed listing and parsing
- Seed retrieval by name
- Seed search by category/tags

**Database Tests:**
- Session CRUD operations
- Message CRUD operations
- Foreign key constraints
- Timestamp management

## Architecture Decisions

### Why YAML Frontmatter for Seeds?

- **Human-Readable**: Easy to write and edit
- **Structured Metadata**: Category, tags, description
- **Markdown Content**: Rich formatting for knowledge
- **Standard Format**: Used by Jekyll, Hugo, Obsidian

### Why Path Security Checks?

- **Prevent Directory Traversal**: Block `../` attacks
- **Sandbox Working Directory**: Files only accessible within session's working dir
- **User Safety**: Protect system files from accidental access

### Why Soft Delete for Sessions?

- **Data Recovery**: Accidentally deleted sessions can be restored
- **Audit Trail**: Track session lifecycle
- **Clean UX**: Deleted sessions don't appear in lists but remain in database

## Testing

Run all tests:
```bash
# Test Librarian agent
go test ./agents/librarian -v

# Test database layer
go test ./database -v

# Test Supervisor agent
go test ./agents/supervisor -v
```

Expected output:
```
=== RUN   TestSearchFiles
--- PASS: TestSearchFiles (0.00s)
=== RUN   TestReadFile
--- PASS: TestReadFile (0.00s)
=== RUN   TestListSeeds
--- PASS: TestListSeeds (0.00s)
=== RUN   TestRetrieveSeed
--- PASS: TestRetrieveSeed (0.00s)
=== RUN   TestSearchSeeds
--- PASS: TestSearchSeeds (0.00s)
PASS
```

## Running the Server

```bash
# Install dependencies
go mod download

# Create seeds directory
mkdir -p ~/.dgd/seeds

# Run server
go run cmd/dgd/main.go

# Server starts on http://localhost:8080
```

## API Usage Examples

### Create a Session
```bash
curl -X POST http://localhost:8080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Project",
    "working_dir": "/home/user/projects/my-project"
  }'
```

### Send a File Search Query
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc123",
    "message": "find all markdown files"
  }'
```

### Send a Seed Query
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc123",
    "message": "list all seeds"
  }'
```

### Get Session History
```bash
curl http://localhost:8080/api/sessions/abc123
```

## Creating Your First Seed

1. Create the seeds directory:
```bash
mkdir -p ~/.dgd/seeds
```

2. Create a seed file (`~/.dgd/seeds/memory-management.md`):
```markdown
---
name: Memory Management
description: Best practices for memory management in agentic systems
category: architecture
tags:
  - memory
  - performance
  - context
---

# Memory Management

Use the Context Iceberg pattern for efficient memory management.

## The 4-Tier System

1. **Tier 1 (Always On):** Core system prompt, current user query
2. **Tier 2 (On Demand):** Active seed patches, relevant project memory
3. **Tier 3 (When Referenced):** Full text of specific files
4. **Tier 4 (Pruned Aggressively):** General conversation history
```

3. Query the seed:
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc123",
    "message": "show me the memory management seed"
  }'
```

## Next Steps (Sprint 3)

1. **Dojo Agent Implementation**
   - Mirror mode (perspective synthesis)
   - Scout mode (route exploration)
   - Gardener mode (idea cultivation)
   - Implementation mode (action planning)

2. **LLM Integration**
   - Ollama client for local models
   - Cloud API support (OpenAI, Anthropic)
   - Model routing based on task

3. **Enhanced Librarian**
   - Semantic search with embeddings
   - File content extraction
   - Seed recommendations

## Lessons Learned

1. **YAML Frontmatter Works**: Simple, standard, human-friendly
2. **Security First**: Path validation prevents directory traversal
3. **Soft Deletes Win**: Better UX and data recovery
4. **Test Everything**: Unit tests caught multiple edge cases
5. **Simple Routing**: Keyword-based Librarian routing is sufficient for now

## Team

Built with patience and precision by Cruz Morales and Manus AI (Dojo).

---

**Status:** Sprint 2 complete. Foundation is solid. Ready for Sprint 3: Dojo Agent.
