---
name: Memory Management
description: Context Iceberg pattern for efficient memory usage
category: architecture
tags: [memory, performance, optimization]
---
# Memory Management

## The Context Iceberg Pattern

Use the 4-tier Context Iceberg approach:

1. **Surface Layer** - Immediate context (last 5 messages)
2. **Middle Layer** - Recent session history (last 20 messages)
3. **Deep Layer** - Session summary and key decisions
4. **Foundation** - Project-wide knowledge and patterns

This approach ensures efficient memory usage while maintaining context awareness.

## Best Practices

- Keep the surface layer fresh and relevant
- Periodically compress middle layer into deep layer
- Store foundation knowledge in seeds
- Use semantic search for retrieval
