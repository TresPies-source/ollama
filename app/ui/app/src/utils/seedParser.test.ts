import { describe, it, expect } from "vitest";
import {
  parseSeed,
  parseSeeds,
  isSeedFile,
  filterSeedsByCategory,
  filterSeedsByTag,
  searchSeeds,
  getAllCategories,
  getAllTags,
  SeedParseError,
} from "./seedParser";
import type { Seed } from "@/types/dgd";

describe("seedParser", () => {
  describe("parseSeed", () => {
    it("should parse valid seed with all fields", () => {
      const content = `---
name: Memory Management
description: Context Iceberg pattern
category: architecture
tags: [memory, performance]
---
# Memory Management
Use the 4-tier Context Iceberg...`;

      const seed = parseSeed(content, "/test/memory.md");

      expect(seed.metadata.name).toBe("Memory Management");
      expect(seed.metadata.description).toBe("Context Iceberg pattern");
      expect(seed.metadata.category).toBe("architecture");
      expect(seed.metadata.tags).toEqual(["memory", "performance"]);
      expect(seed.content).toBe(
        "# Memory Management\nUse the 4-tier Context Iceberg...",
      );
      expect(seed.path).toBe("/test/memory.md");
    });

    it("should parse seed with minimal fields", () => {
      const content = `---
name: Simple Seed
description: A simple test seed
---
Content here`;

      const seed = parseSeed(content, "/test/simple.md");

      expect(seed.metadata.name).toBe("Simple Seed");
      expect(seed.metadata.description).toBe("A simple test seed");
      expect(seed.metadata.category).toBe("general"); // default
      expect(seed.metadata.tags).toEqual([]);
      expect(seed.content).toBe("Content here");
    });

    it("should allow custom default category", () => {
      const content = `---
name: Test
description: Test seed
---
Content`;

      const seed = parseSeed(content, "/test/test.md", {
        defaultCategory: "custom",
      });

      expect(seed.metadata.category).toBe("custom");
    });

    it("should throw error for missing frontmatter", () => {
      const content = "# Just some markdown";

      expect(() => parseSeed(content, "/test/invalid.md")).toThrow(
        SeedParseError,
      );
      expect(() => parseSeed(content, "/test/invalid.md")).toThrow(
        /No YAML frontmatter found/,
      );
    });

    it("should throw error for invalid YAML", () => {
      const content = `---
name: Test
invalid yaml: [unclosed
---
Content`;

      expect(() => parseSeed(content, "/test/invalid.md")).toThrow(
        SeedParseError,
      );
      expect(() => parseSeed(content, "/test/invalid.md")).toThrow(
        /Failed to parse YAML frontmatter/,
      );
    });

    it("should throw error for missing required fields", () => {
      const content = `---
name: Test
---
Content`;

      expect(() => parseSeed(content, "/test/incomplete.md")).toThrow(
        SeedParseError,
      );
      expect(() => parseSeed(content, "/test/incomplete.md")).toThrow(
        /Missing required field 'description'/,
      );
    });

    it("should not throw error for missing required fields when validation disabled", () => {
      const content = `---
name: Test
---
Content`;

      const seed = parseSeed(content, "/test/incomplete.md", {
        validateRequired: false,
      });

      expect(seed.metadata.name).toBe("Test");
      expect(seed.metadata.description).toBe("");
    });

    it("should throw error for invalid field types", () => {
      const content = `---
name: 123
description: Valid description
---
Content`;

      expect(() => parseSeed(content, "/test/invalid.md")).toThrow(
        SeedParseError,
      );
      expect(() => parseSeed(content, "/test/invalid.md")).toThrow(
        /Invalid type for field 'name'/,
      );
    });

    it("should throw error for invalid tags type", () => {
      const content = `---
name: Test
description: Valid description
tags: not-an-array
---
Content`;

      expect(() => parseSeed(content, "/test/invalid.md")).toThrow(
        SeedParseError,
      );
      expect(() => parseSeed(content, "/test/invalid.md")).toThrow(
        /Invalid type for field 'tags'/,
      );
    });

    it("should handle empty tags array", () => {
      const content = `---
name: Test
description: Test seed
tags: []
---
Content`;

      const seed = parseSeed(content, "/test/test.md");

      expect(seed.metadata.tags).toEqual([]);
    });

    it("should trim whitespace from content", () => {
      const content = `---
name: Test
description: Test seed
---

   Content with whitespace   

`;

      const seed = parseSeed(content, "/test/test.md");

      expect(seed.content).toBe("Content with whitespace");
    });
  });

  describe("parseSeeds", () => {
    it("should parse multiple valid seeds", () => {
      const files = [
        {
          path: "/test/seed1.md",
          content: `---
name: Seed 1
description: First seed
category: cat1
---
Content 1`,
        },
        {
          path: "/test/seed2.md",
          content: `---
name: Seed 2
description: Second seed
category: cat2
---
Content 2`,
        },
      ];

      const seeds = parseSeeds(files);

      expect(seeds).toHaveLength(2);
      expect(seeds[0].metadata.name).toBe("Seed 1");
      expect(seeds[1].metadata.name).toBe("Seed 2");
    });

    it("should skip invalid seeds and continue parsing", () => {
      const files = [
        {
          path: "/test/valid.md",
          content: `---
name: Valid
description: Valid seed
---
Content`,
        },
        {
          path: "/test/invalid.md",
          content: "No frontmatter",
        },
      ];

      const seeds = parseSeeds(files);

      expect(seeds).toHaveLength(1);
      expect(seeds[0].metadata.name).toBe("Valid");
    });
  });

  describe("isSeedFile", () => {
    it("should return true for .md files", () => {
      expect(isSeedFile("test.md")).toBe(true);
    });

    it("should return true for .markdown files", () => {
      expect(isSeedFile("test.markdown")).toBe(true);
    });

    it("should return false for other files", () => {
      expect(isSeedFile("test.txt")).toBe(false);
      expect(isSeedFile("test.js")).toBe(false);
      expect(isSeedFile("test")).toBe(false);
    });
  });

  describe("filterSeedsByCategory", () => {
    const seeds: Seed[] = [
      {
        metadata: {
          name: "Seed 1",
          description: "Desc 1",
          category: "architecture",
          tags: [],
        },
        content: "Content 1",
        path: "/seed1.md",
      },
      {
        metadata: {
          name: "Seed 2",
          description: "Desc 2",
          category: "patterns",
          tags: [],
        },
        content: "Content 2",
        path: "/seed2.md",
      },
      {
        metadata: {
          name: "Seed 3",
          description: "Desc 3",
          category: "architecture",
          tags: [],
        },
        content: "Content 3",
        path: "/seed3.md",
      },
    ];

    it("should filter seeds by category", () => {
      const filtered = filterSeedsByCategory(seeds, "architecture");

      expect(filtered).toHaveLength(2);
      expect(filtered[0].metadata.name).toBe("Seed 1");
      expect(filtered[1].metadata.name).toBe("Seed 3");
    });

    it("should return empty array for non-existent category", () => {
      const filtered = filterSeedsByCategory(seeds, "nonexistent");

      expect(filtered).toHaveLength(0);
    });
  });

  describe("filterSeedsByTag", () => {
    const seeds: Seed[] = [
      {
        metadata: {
          name: "Seed 1",
          description: "Desc 1",
          category: "arch",
          tags: ["memory", "performance"],
        },
        content: "Content 1",
        path: "/seed1.md",
      },
      {
        metadata: {
          name: "Seed 2",
          description: "Desc 2",
          category: "arch",
          tags: ["security", "best-practices"],
        },
        content: "Content 2",
        path: "/seed2.md",
      },
      {
        metadata: {
          name: "Seed 3",
          description: "Desc 3",
          category: "arch",
          tags: ["performance", "optimization"],
        },
        content: "Content 3",
        path: "/seed3.md",
      },
    ];

    it("should filter seeds by tag", () => {
      const filtered = filterSeedsByTag(seeds, "performance");

      expect(filtered).toHaveLength(2);
      expect(filtered[0].metadata.name).toBe("Seed 1");
      expect(filtered[1].metadata.name).toBe("Seed 3");
    });

    it("should return empty array for non-existent tag", () => {
      const filtered = filterSeedsByTag(seeds, "nonexistent");

      expect(filtered).toHaveLength(0);
    });
  });

  describe("searchSeeds", () => {
    const seeds: Seed[] = [
      {
        metadata: {
          name: "Memory Management",
          description: "Context Iceberg pattern",
          category: "architecture",
          tags: ["memory", "performance"],
        },
        content: "Use the 4-tier Context Iceberg...",
        path: "/seed1.md",
      },
      {
        metadata: {
          name: "API Design",
          description: "RESTful API best practices",
          category: "patterns",
          tags: ["api", "rest"],
        },
        content: "Design clean APIs...",
        path: "/seed2.md",
      },
    ];

    it("should search by name", () => {
      const results = searchSeeds(seeds, "memory");

      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("Memory Management");
    });

    it("should search by description", () => {
      const results = searchSeeds(seeds, "iceberg");

      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("Memory Management");
    });

    it("should search by category", () => {
      const results = searchSeeds(seeds, "patterns");

      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("API Design");
    });

    it("should search by tags", () => {
      const results = searchSeeds(seeds, "rest");

      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("API Design");
    });

    it("should search by content", () => {
      const results = searchSeeds(seeds, "4-tier");

      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("Memory Management");
    });

    it("should be case-insensitive", () => {
      const results = searchSeeds(seeds, "MEMORY");

      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("Memory Management");
    });

    it("should return empty array for no matches", () => {
      const results = searchSeeds(seeds, "nonexistent");

      expect(results).toHaveLength(0);
    });
  });

  describe("getAllCategories", () => {
    it("should return unique categories sorted", () => {
      const seeds: Seed[] = [
        {
          metadata: {
            name: "S1",
            description: "D1",
            category: "patterns",
            tags: [],
          },
          content: "C1",
          path: "/s1.md",
        },
        {
          metadata: {
            name: "S2",
            description: "D2",
            category: "architecture",
            tags: [],
          },
          content: "C2",
          path: "/s2.md",
        },
        {
          metadata: {
            name: "S3",
            description: "D3",
            category: "patterns",
            tags: [],
          },
          content: "C3",
          path: "/s3.md",
        },
      ];

      const categories = getAllCategories(seeds);

      expect(categories).toEqual(["architecture", "patterns"]);
    });
  });

  describe("getAllTags", () => {
    it("should return unique tags sorted", () => {
      const seeds: Seed[] = [
        {
          metadata: {
            name: "S1",
            description: "D1",
            category: "cat",
            tags: ["performance", "memory"],
          },
          content: "C1",
          path: "/s1.md",
        },
        {
          metadata: {
            name: "S2",
            description: "D2",
            category: "cat",
            tags: ["api", "rest"],
          },
          content: "C2",
          path: "/s2.md",
        },
        {
          metadata: {
            name: "S3",
            description: "D3",
            category: "cat",
            tags: ["performance", "optimization"],
          },
          content: "C3",
          path: "/s3.md",
        },
      ];

      const tags = getAllTags(seeds);

      expect(tags).toEqual([
        "api",
        "memory",
        "optimization",
        "performance",
        "rest",
      ]);
    });
  });
});
