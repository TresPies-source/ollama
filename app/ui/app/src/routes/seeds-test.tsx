import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SeedGrid } from "../components/seeds/SeedGrid";
import { SeedSearch } from "../components/seeds/SeedSearch";
import { SeedDetailModal } from "../components/seeds/SeedDetailModal";
import type { Seed } from "../types/dgd";

export const Route = createFileRoute("/seeds-test")({
  component: SeedsTest,
});

const mockSeeds: Seed[] = [
  {
    metadata: {
      name: "Memory Management",
      description:
        "Context Iceberg pattern for hierarchical memory management in AI agents",
      category: "architecture",
      tags: ["memory", "performance", "patterns"],
    },
    content: `# Memory Management

## Context Iceberg Pattern

The Context Iceberg is a 4-tier memory hierarchy:

1. **Active Context** - Current conversation (last 10 messages)
2. **Session Memory** - Full conversation history
3. **Seed Library** - Reusable knowledge templates
4. **Tool Results** - Cached outputs

### Usage

\`\`\`python
# Access active context
context = agent.get_active_context()

# Retrieve from seed library
seed = agent.load_seed("memory-pattern")
\`\`\`

This pattern ensures:
- Fast retrieval of recent context
- Efficient long-term memory
- Minimal token usage
`,
    path: "~/.dgd/seeds/memory.md",
  },
  {
    metadata: {
      name: "API Design Principles",
      description: "RESTful API design patterns and best practices",
      category: "development",
      tags: ["api", "rest", "design", "backend"],
    },
    content: `# API Design Principles

## Core Principles

### 1. Resource-Oriented Design

Use nouns for resources, not verbs:
- ✅ \`GET /users\`
- ❌ \`GET /getUsers\`

### 2. HTTP Methods

- \`GET\` - Retrieve resource(s)
- \`POST\` - Create resource
- \`PUT\` - Update entire resource
- \`PATCH\` - Partial update
- \`DELETE\` - Remove resource

### 3. Status Codes

- \`200\` - Success
- \`201\` - Created
- \`400\` - Bad request
- \`404\` - Not found
- \`500\` - Server error

## Example

\`\`\`json
{
  "users": [
    {
      "id": "123",
      "name": "Alice",
      "email": "alice@example.com"
    }
  ]
}
\`\`\`
`,
    path: "~/.dgd/seeds/api-design.md",
  },
  {
    metadata: {
      name: "Testing Strategy",
      description: "Comprehensive testing approach for software projects",
      category: "quality",
      tags: ["testing", "qa", "automation"],
    },
    content: `# Testing Strategy

## Test Pyramid

1. **Unit Tests** (70%) - Fast, isolated tests
2. **Integration Tests** (20%) - Component interactions
3. **E2E Tests** (10%) - Full user workflows

## Best Practices

- Write tests first (TDD)
- Keep tests independent
- Use descriptive names
- Mock external dependencies
`,
    path: "~/.dgd/seeds/testing.md",
  },
  {
    metadata: {
      name: "Git Workflow",
      description: "Team collaboration using Git branching strategy",
      category: "development",
      tags: ["git", "version-control", "workflow"],
    },
    content: `# Git Workflow

## Branch Strategy

- \`main\` - Production code
- \`develop\` - Integration branch
- \`feature/*\` - New features
- \`hotfix/*\` - Emergency fixes

## Commit Messages

Use conventional commits:
\`\`\`
feat: Add user authentication
fix: Resolve login bug
docs: Update API documentation
\`\`\`
`,
    path: "~/.dgd/seeds/git-workflow.md",
  },
  {
    metadata: {
      name: "Security Checklist",
      description: "Essential security practices for web applications",
      category: "security",
      tags: ["security", "authentication", "encryption"],
    },
    content: `# Security Checklist

## Authentication

- [ ] Use strong password policies
- [ ] Implement 2FA
- [ ] Hash passwords with bcrypt/argon2
- [ ] Protect against brute force

## Data Protection

- [ ] Use HTTPS everywhere
- [ ] Encrypt sensitive data at rest
- [ ] Sanitize user inputs
- [ ] Implement CORS properly

## Monitoring

- [ ] Log security events
- [ ] Set up alerts for anomalies
- [ ] Regular security audits
`,
    path: "~/.dgd/seeds/security.md",
  },
  {
    metadata: {
      name: "Performance Optimization",
      description: "Techniques for improving application performance",
      category: "optimization",
      tags: ["performance", "caching", "profiling", "optimization"],
    },
    content: `# Performance Optimization

## Frontend

- Lazy loading
- Code splitting
- Image optimization
- Minimize bundle size

## Backend

- Database indexing
- Query optimization
- Caching strategies
- Load balancing

## Monitoring

Use profiling tools to identify bottlenecks.
`,
    path: "~/.dgd/seeds/performance.md",
  },
];

function SeedsTest() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const availableCategories = useMemo(() => {
    const categories = new Set(mockSeeds.map((s) => s.metadata.category));
    return Array.from(categories);
  }, []);

  const availableTags = useMemo(() => {
    const tags = new Set(mockSeeds.flatMap((s) => s.metadata.tags));
    return Array.from(tags);
  }, []);

  const filteredSeeds = useMemo(() => {
    return mockSeeds.filter((seed) => {
      if (
        searchQuery &&
        !seed.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !seed.metadata.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (selectedCategory && seed.metadata.category !== selectedCategory) {
        return false;
      }

      if (
        selectedTags.length > 0 &&
        !selectedTags.some((tag) => seed.metadata.tags.includes(tag))
      ) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSeedClick = (seed: Seed) => {
    setSelectedSeed(seed);
    setIsModalOpen(true);
  };

  const handleApplyToChat = (seed: Seed) => {
    console.log("Applying seed to chat:", seed.metadata.name);
    alert(`Seed "${seed.metadata.name}" would be applied to chat!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dojo-text-primary mb-2 bg-gradient-sunset bg-clip-text text-transparent">
            Seed Browser Test
          </h1>
          <p className="text-dojo-text-secondary">
            Testing seed browser components with mock data
          </p>
        </div>

        <div className="space-y-6">
          <SeedSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            availableCategories={availableCategories}
            availableTags={availableTags}
          />

          <div>
            <p className="text-sm text-dojo-text-tertiary mb-4">
              Showing {filteredSeeds.length} of {mockSeeds.length} seeds
            </p>
            <SeedGrid seeds={filteredSeeds} onSeedClick={handleSeedClick} />
          </div>
        </div>

        <SeedDetailModal
          seed={selectedSeed}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApplyToChat={handleApplyToChat}
        />
      </div>
    </div>
  );
}
