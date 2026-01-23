---
name: API Design Principles
description: REST API design best practices and patterns
category: patterns
tags: [api, rest, design, best-practices]
---

# API Design Principles

## Core Principles

### 1. RESTful Resource Modeling

- Use nouns for resources: `/users`, `/sessions`, `/messages`
- Avoid verbs in URLs: ❌ `/getUser`, ✅ `/users/{id}`
- Use HTTP methods correctly: GET, POST, PUT, DELETE, PATCH

### 2. Consistent Naming Conventions

- Use lowercase with hyphens: `/user-sessions`
- Plural nouns for collections: `/users` not `/user`
- Singular for single resources: `/users/{id}` not `/users/{id}s`

### 3. Proper Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

### 4. Error Handling

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "field": "specific field that caused error"
  }
}
```

### 5. Pagination

```
GET /users?page=2&limit=20
```

Response should include:

```json
{
  "data": [...],
  "page": 2,
  "limit": 20,
  "total": 150,
  "has_more": true
}
```

### 6. Versioning

- URL-based: `/v1/users`, `/v2/users`
- Header-based: `Accept: application/vnd.api.v2+json`

### 7. Authentication

- Use Bearer tokens in Authorization header
- Support API keys for service-to-service
- Implement rate limiting

## DGD API Examples

### Session Management

```
GET    /api/sessions           - List all sessions
POST   /api/sessions           - Create new session
GET    /api/sessions/{id}      - Get session with messages
DELETE /api/sessions/{id}      - Delete session
```

### Chat

```
POST   /api/chat               - Send message (non-streaming)
POST   /api/chat/stream        - Send message (SSE streaming)
```

### Trace

```
GET    /api/trace/{session_id} - Get execution trace
```
