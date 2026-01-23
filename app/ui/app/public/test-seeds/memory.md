---
name: Memory Management
description: Context Iceberg pattern for efficient memory usage
category: architecture
tags: [memory, performance, optimization]
---

# Memory Management

## Context Iceberg Pattern

The Context Iceberg is a 4-tier memory management system that keeps the most relevant information at the surface while deeper context remains accessible but dormant.

### Tier 1: Active Context (Surface)

- Current conversation
- Immediate task context
- Recently used functions and variables

### Tier 2: Session Context (Shallow)

- Session history
- File tree snapshot
- Recent tool invocations

### Tier 3: Project Context (Deep)

- Project structure
- Core architecture patterns
- Key dependencies

### Tier 4: Knowledge Base (Abyss)

- Seed files
- Documentation
- Historical patterns

## Implementation Guidelines

1. **Keep Active Context Minimal**: Only include what's needed for the current task
2. **Lazy Load Deeper Tiers**: Pull from deeper tiers only when needed
3. **Compress Historical Data**: Summarize older context to save memory
4. **Prune Aggressively**: Remove irrelevant context regularly

## Benefits

- Reduced memory usage
- Faster response times
- Better context relevance
- Scalable to long sessions
