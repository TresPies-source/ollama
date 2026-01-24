# Dojo Genesis Desktop API Documentation

**Version:** v0.2.0  
**Base URL:** `http://localhost:8080`  
**Protocol:** HTTP/1.1  
**Content-Type:** `application/json` (except where noted)

---

## Table of Contents

1. [Sessions](#sessions)
2. [Messages](#messages)
3. [Usage & Token Tracking](#usage--token-tracking)
4. [Settings](#settings)
5. [Updates](#updates)
6. [Models](#models)
7. [Error Handling](#error-handling)
8. [WebSocket Events](#websocket-events)

---

## Sessions

### List All Sessions

Retrieve all chat sessions.

**Endpoint:** `GET /api/sessions`

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid-string",
      "title": "Session Title",
      "working_dir": "/path/to/directory",
      "status": "active",
      "created_at": "2026-01-24T10:00:00Z",
      "updated_at": "2026-01-24T10:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

---

### Create Session

Create a new chat session.

**Endpoint:** `POST /api/sessions`

**Request Body:**
```json
{
  "title": "New Session",
  "working_dir": "/optional/path"
}
```

**Response:**
```json
{
  "id": "new-uuid-string",
  "title": "New Session",
  "working_dir": "/optional/path",
  "status": "active",
  "created_at": "2026-01-24T10:00:00Z",
  "updated_at": "2026-01-24T10:00:00Z"
}
```

**Status Codes:**
- `201 Created` - Session created successfully
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - Database error

---

### Delete Session

Delete a chat session and all its messages.

**Endpoint:** `DELETE /api/sessions/:id`

**Parameters:**
- `id` (path) - Session UUID

**Response:**
```json
{
  "message": "Session deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Session deleted
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Database error

---

### Export Session

Export a session to Markdown format with YAML frontmatter.

**Endpoint:** `GET /api/sessions/:id/export`

**Parameters:**
- `id` (path) - Session UUID

**Response:**
- **Content-Type:** `text/markdown`
- **Content-Disposition:** `attachment; filename="session-{id}.md"`

**Markdown Format:**
```markdown
---
title: Session Title
model: llama3.2:3b
created_at: 2026-01-24T10:00:00Z
updated_at: 2026-01-24T10:30:00Z
---

**user**: Hello!

**assistant**: Hi there! How can I help?
```

**Status Codes:**
- `200 OK` - Export successful
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Database error

---

### Import Session

Import a session from Markdown format.

**Endpoint:** `POST /api/sessions/import`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` - Markdown file (.md or .markdown extension)

**Request Example (curl):**
```bash
curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@session.md"
```

**Response:**
```json
{
  "id": "imported-session-uuid",
  "title": "Imported Session Title",
  "message_count": 10
}
```

**Status Codes:**
- `201 Created` - Import successful
- `400 Bad Request` - Invalid file format or missing file
- `500 Internal Server Error` - Database error

---

## Messages

### Get Messages

Retrieve all messages for a session.

**Endpoint:** `GET /api/messages/:sessionId`

**Parameters:**
- `sessionId` (path) - Session UUID

**Response:**
```json
{
  "messages": [
    {
      "id": "message-uuid",
      "session_id": "session-uuid",
      "role": "user",
      "content": "Hello!",
      "agent_type": "dojo",
      "mode": "mirror",
      "prompt_tokens": 10,
      "completion_tokens": 0,
      "created_at": "2026-01-24T10:00:00Z"
    },
    {
      "id": "message-uuid-2",
      "session_id": "session-uuid",
      "role": "assistant",
      "content": "Hi there!",
      "agent_type": "dojo",
      "mode": "mirror",
      "prompt_tokens": 10,
      "completion_tokens": 15,
      "created_at": "2026-01-24T10:00:05Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Database error

---

### Send Chat Message

Send a message to the AI and receive a streaming response.

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "session_id": "session-uuid",
  "message": "What is the meaning of life?",
  "model": "llama3.2:3b",
  "agent_type": "dojo",
  "mode": "mirror"
}
```

**Response:**
- **Content-Type:** `text/event-stream`
- **Streaming:** Yes (Server-Sent Events)

**Event Format:**
```
data: {"chunk": "Hello", "done": false}

data: {"chunk": " there!", "done": false}

data: {"chunk": "", "done": true, "prompt_tokens": 20, "completion_tokens": 30}
```

**Status Codes:**
- `200 OK` - Streaming started
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - LLM error or database error

---

## Usage & Token Tracking

### Get Usage Statistics

Retrieve aggregated token usage statistics.

**Endpoint:** `GET /api/usage`

**Query Parameters:**
- `from` (optional) - Start date (ISO 8601 format)
- `to` (optional) - End date (ISO 8601 format)
- `model` (optional) - Filter by model name

**Response:**
```json
{
  "total_tokens": 125000,
  "total_prompt_tokens": 60000,
  "total_completion_tokens": 65000,
  "estimated_cost_usd": 0.25,
  "by_model": [
    {
      "model": "llama3.2:3b",
      "total_tokens": 100000,
      "prompt_tokens": 50000,
      "completion_tokens": 50000,
      "estimated_cost_usd": 0.20
    },
    {
      "model": "gpt-4",
      "total_tokens": 25000,
      "prompt_tokens": 10000,
      "completion_tokens": 15000,
      "estimated_cost_usd": 0.05
    }
  ],
  "by_day": [
    {
      "date": "2026-01-24",
      "total_tokens": 50000,
      "prompt_tokens": 25000,
      "completion_tokens": 25000
    },
    {
      "date": "2026-01-23",
      "total_tokens": 75000,
      "prompt_tokens": 35000,
      "completion_tokens": 40000
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Database error

**Cost Calculation:**
- Free models (Ollama): $0.00/1M tokens
- OpenAI GPT-3.5: $0.50/1M prompt tokens, $1.50/1M completion tokens
- OpenAI GPT-4: $30.00/1M prompt tokens, $60.00/1M completion tokens

---

## Settings

### Get All Settings

Retrieve all application settings.

**Endpoint:** `GET /api/settings`

**Response:**
```json
{
  "default_model": "llama3.2:3b",
  "temperature": "0.7",
  "max_tokens": "2048",
  "theme": "dark",
  "font_size": "14",
  "glassmorphism_intensity": "80",
  "shortcuts": "{\"new-session\":\"Cmd+N\",\"open-settings\":\"Cmd+,\"}"
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

---

### Update Settings

Update one or more application settings.

**Endpoint:** `POST /api/settings`

**Request Body:**
```json
{
  "default_model": "gpt-4",
  "temperature": "0.8",
  "theme": "light"
}
```

**Response:**
```json
{
  "message": "Settings updated successfully",
  "updated_keys": ["default_model", "temperature", "theme"]
}
```

**Status Codes:**
- `200 OK` - Settings updated
- `400 Bad Request` - Invalid settings values
- `500 Internal Server Error` - Database error

**Valid Settings:**
- `default_model`: Any available model name
- `temperature`: "0.0" to "2.0" (string)
- `max_tokens`: "1" to "8192" (string)
- `theme`: "light", "dark", or "auto"
- `font_size`: "12" to "20" (string, pixels)
- `glassmorphism_intensity`: "0" to "100" (string, percentage)
- `shortcuts`: JSON string of shortcut mappings

---

## Updates

### Check for Updates

Check if a new version is available.

**Endpoint:** `GET /api/update/check`

**Response (No Update Available):**
```json
{
  "update_available": false,
  "current_version": "0.2.0"
}
```

**Response (Update Available):**
```json
{
  "update_available": true,
  "current_version": "0.2.0",
  "latest_version": "0.2.1",
  "download_url": "https://github.com/TresPies-source/ollama/releases/download/v0.2.1/dgd-macos-amd64",
  "checksum": "abc123def456...",
  "release_notes": "Bug fixes and performance improvements"
}
```

**Status Codes:**
- `200 OK` - Check complete
- `500 Internal Server Error` - GitHub API error

---

### Apply Update

Download and apply a pending update.

**Endpoint:** `POST /api/update/apply`

**Request Body:**
```json
{
  "version": "0.2.1",
  "url": "https://github.com/TresPies-source/ollama/releases/download/v0.2.1/dgd-macos-amd64",
  "checksum": "abc123def456..."
}
```

**Response:**
```json
{
  "message": "Update downloaded and verified. Restart to apply.",
  "status": "ready_to_restart"
}
```

**Status Codes:**
- `200 OK` - Update ready to apply (restart required)
- `400 Bad Request` - Invalid update parameters
- `500 Internal Server Error` - Download error or checksum mismatch

**Process:**
1. Download binary from URL
2. Verify SHA256 checksum
3. Replace current binary (requires permissions)
4. Restart application

---

## Models

### List Available Models

Retrieve all available LLM models.

**Endpoint:** `GET /api/models`

**Response:**
```json
{
  "models": [
    {
      "name": "llama3.2:3b",
      "size": "2.0GB",
      "provider": "ollama",
      "context_length": 8192
    },
    {
      "name": "gpt-4",
      "size": "unknown",
      "provider": "openai",
      "context_length": 8192
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - LLM provider error

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific_field",
    "reason": "validation failed"
  }
}
```

**Common Error Codes:**
- `INVALID_REQUEST` - Malformed request body
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input values
- `DATABASE_ERROR` - Database operation failed
- `LLM_ERROR` - LLM provider error
- `INTERNAL_ERROR` - Unexpected server error

---

## WebSocket Events

The application uses WebSocket connections for real-time updates.

**Connection:** `ws://localhost:8080/ws`

### Server → Client Events

**Update Available:**
```json
{
  "type": "update-available",
  "version": "0.2.1",
  "url": "https://github.com/...",
  "checksum": "abc123..."
}
```

**Session Created:**
```json
{
  "type": "session-created",
  "session_id": "uuid-string"
}
```

**Session Deleted:**
```json
{
  "type": "session-deleted",
  "session_id": "uuid-string"
}
```

**Message Received:**
```json
{
  "type": "message-received",
  "session_id": "uuid-string",
  "message_id": "uuid-string"
}
```

### Client → Server Events

Currently, the WebSocket is read-only (server → client only). All client actions use HTTP endpoints.

---

## Rate Limits

**Current:** No rate limiting implemented

**Recommended for production:**
- 100 requests/minute per IP
- 1000 chat messages/day per session
- 10 MB file upload limit for imports

---

## Authentication

**Current:** No authentication (local-first app)

**Future (v0.3+):**
- Optional API key for remote access
- OAuth2 for cloud sync features

---

## CORS

**Current:** CORS disabled (local development)

**Production:** CORS headers set to allow `http://localhost:8080` only

---

## Versioning

API versioning follows the application version (v0.2.0).

**Breaking changes** will increment the minor version (v0.2.0 → v0.3.0).

**Deprecation policy:** 2 versions notice before removal.

---

## Examples

### Complete Chat Flow

```bash
# 1. Create session
curl -X POST http://localhost:8080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}'
# Response: {"id": "abc-123", ...}

# 2. Send message (streaming)
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "message": "Hello!",
    "model": "llama3.2:3b"
  }'
# Response: SSE stream with chunks

# 3. Get messages
curl http://localhost:8080/api/messages/abc-123

# 4. Export session
curl http://localhost:8080/api/sessions/abc-123/export -o session.md

# 5. Delete session
curl -X DELETE http://localhost:8080/api/sessions/abc-123
```

### Usage Statistics Query

```bash
# Get all usage
curl http://localhost:8080/api/usage

# Get usage for specific date range
curl "http://localhost:8080/api/usage?from=2026-01-01&to=2026-01-31"

# Get usage for specific model
curl "http://localhost:8080/api/usage?model=llama3.2:3b"
```

### Settings Management

```bash
# Get all settings
curl http://localhost:8080/api/settings

# Update settings
curl -X POST http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": "0.9",
    "theme": "dark"
  }'
```

---

## Testing

### Using curl

All examples above use `curl`. Install: `brew install curl` (macOS) or `apt install curl` (Linux)

### Using Postman

1. Import the API collection (if provided)
2. Set base URL: `http://localhost:8080`
3. Test each endpoint

### Using Frontend

The React frontend provides a complete UI for all endpoints. Start both backend and frontend:

```bash
# Terminal 1: Backend
go run cmd/dgd/main.go

# Terminal 2: Frontend
cd app/ui/app && npm run dev
```

Open `http://localhost:5174` in your browser.

---

## Support

For API questions or issues:
- GitHub Issues: [TresPies-source/ollama](https://github.com/TresPies-source/ollama/issues)
- Documentation: See `dgd/docs/` directory

---

**Built with patience by Cruz Morales and Manus AI (Dojo).**
