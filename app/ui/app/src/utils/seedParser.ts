import yaml from "js-yaml";
import type { Seed, SeedMetadata } from "@/types/dgd";

export interface ParseSeedOptions {
  validateRequired?: boolean;
  defaultCategory?: string;
}

export class SeedParseError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "SeedParseError";
    this.cause = cause;
  }
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export function parseSeed(
  rawContent: string,
  filePath: string,
  options: ParseSeedOptions = {},
): Seed {
  const { validateRequired = true, defaultCategory = "general" } = options;

  // Extract frontmatter and content
  const match = rawContent.match(FRONTMATTER_REGEX);

  if (!match) {
    throw new SeedParseError(
      `No YAML frontmatter found in seed file: ${filePath}. ` +
        `Expected format: ---\\n...metadata...\\n---\\n...content...`,
    );
  }

  const [, frontmatterStr, content] = match;

  // Parse YAML frontmatter
  let frontmatter: unknown;
  try {
    frontmatter = yaml.load(frontmatterStr);
  } catch (error) {
    throw new SeedParseError(
      `Failed to parse YAML frontmatter in ${filePath}`,
      error,
    );
  }

  // Validate frontmatter is an object
  if (
    !frontmatter ||
    typeof frontmatter !== "object" ||
    Array.isArray(frontmatter)
  ) {
    throw new SeedParseError(
      `Invalid frontmatter in ${filePath}: expected object, got ${typeof frontmatter}`,
    );
  }

  const fm = frontmatter as Record<string, unknown>;

  // Extract and validate metadata
  const metadata: SeedMetadata = {
    name: extractString(fm, "name", validateRequired),
    description: extractString(fm, "description", validateRequired),
    category: extractString(fm, "category", false) || defaultCategory,
    tags: extractStringArray(fm, "tags", false),
  };

  // Validate required fields (additional check after extraction)
  if (validateRequired) {
    if (!metadata.name) {
      throw new SeedParseError(`Missing required field 'name' in ${filePath}`);
    }
    if (!metadata.description) {
      throw new SeedParseError(
        `Missing required field 'description' in ${filePath}`,
      );
    }
  }

  return {
    metadata,
    content: content.trim(),
    path: filePath,
  };
}

export function parseSeeds(
  files: Array<{ path: string; content: string }>,
  options: ParseSeedOptions = {},
): Seed[] {
  const seeds: Seed[] = [];
  const errors: Array<{ path: string; error: Error }> = [];

  for (const file of files) {
    try {
      const seed = parseSeed(file.content, file.path, options);
      seeds.push(seed);
    } catch (error) {
      errors.push({
        path: file.path,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  // Log errors but don't fail completely
  if (errors.length > 0) {
    console.warn(`Failed to parse ${errors.length} seed file(s):`, errors);
  }

  return seeds;
}

export function isSeedFile(filename: string): boolean {
  return filename.endsWith(".md") || filename.endsWith(".markdown");
}

export function filterSeedsByCategory(seeds: Seed[], category: string): Seed[] {
  return seeds.filter((seed) => seed.metadata.category === category);
}

export function filterSeedsByTag(seeds: Seed[], tag: string): Seed[] {
  return seeds.filter((seed) => seed.metadata.tags.includes(tag));
}

export function searchSeeds(seeds: Seed[], query: string): Seed[] {
  const lowerQuery = query.toLowerCase();
  return seeds.filter((seed) => {
    const { name, description, category, tags } = seed.metadata;
    return (
      name.toLowerCase().includes(lowerQuery) ||
      description.toLowerCase().includes(lowerQuery) ||
      category.toLowerCase().includes(lowerQuery) ||
      tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      seed.content.toLowerCase().includes(lowerQuery)
    );
  });
}

export function getAllCategories(seeds: Seed[]): string[] {
  const categories = new Set(seeds.map((seed) => seed.metadata.category));
  return Array.from(categories).sort();
}

export function getAllTags(seeds: Seed[]): string[] {
  const tags = new Set(seeds.flatMap((seed) => seed.metadata.tags));
  return Array.from(tags).sort();
}

// Helper functions
function extractString(
  obj: Record<string, unknown>,
  key: string,
  required: boolean,
): string {
  const value = obj[key];

  if (value === undefined || value === null) {
    if (required) {
      throw new SeedParseError(`Missing required field '${key}'`);
    }
    return "";
  }

  if (typeof value !== "string") {
    throw new SeedParseError(
      `Invalid type for field '${key}': expected string, got ${typeof value}`,
    );
  }

  return value;
}

function extractStringArray(
  obj: Record<string, unknown>,
  key: string,
  required: boolean,
): string[] {
  const value = obj[key];

  if (value === undefined || value === null) {
    if (required) {
      throw new SeedParseError(`Missing required field '${key}'`);
    }
    return [];
  }

  if (!Array.isArray(value)) {
    throw new SeedParseError(
      `Invalid type for field '${key}': expected array, got ${typeof value}`,
    );
  }

  // Validate all elements are strings
  const stringArray = value.map((item, index) => {
    if (typeof item !== "string") {
      throw new SeedParseError(
        `Invalid type for ${key}[${index}]: expected string, got ${typeof item}`,
      );
    }
    return item;
  });

  return stringArray;
}
