---
name: API Design Principles
description: RESTful API best practices and patterns
category: patterns
tags: [api, rest, design, best-practices]
---
# API Design Principles

## Core Principles

1. **Consistency** - Use consistent naming and structure
2. **Simplicity** - Keep endpoints simple and focused
3. **Documentation** - Always document your APIs
4. **Versioning** - Plan for API evolution

## RESTful Patterns

- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Resource-based URLs (`/users`, `/posts`)
- Proper status codes (200, 201, 404, 500)
- HATEOAS for discoverability

## Error Handling

Always return structured error responses:

```json
{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "details": {
    "resource": "user",
    "id": "123"
  }
}
```
