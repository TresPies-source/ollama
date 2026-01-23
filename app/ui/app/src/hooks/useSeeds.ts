import { useState, useEffect, useMemo } from "react";
import type { Seed } from "@/types/dgd";
import {
  parseSeed,
  searchSeeds,
  getAllCategories,
  getAllTags,
} from "@/utils/seedParser";

const TEST_SEED_FILES = [
  "/test-seeds/memory.md",
  "/test-seeds/api-design.md",
  "/test-seeds/code-quality.md",
];

export interface UseSeedsOptions {
  loadOnMount?: boolean;
  testMode?: boolean;
}

export interface UseSeedsReturn {
  seeds: Seed[];
  filteredSeeds: Seed[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  availableCategories: string[];
  availableTags: string[];
  refetch: () => Promise<void>;
}

export function useSeeds(options: UseSeedsOptions = {}): UseSeedsReturn {
  const { loadOnMount = true, testMode = true } = options;

  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const loadTestSeeds = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedSeeds: Seed[] = [];

      for (const filePath of TEST_SEED_FILES) {
        try {
          const response = await fetch(filePath);
          if (!response.ok) {
            console.warn(`Failed to load seed: ${filePath}`);
            continue;
          }

          const content = await response.text();
          const seed = parseSeed(content, filePath);
          loadedSeeds.push(seed);
        } catch (err) {
          console.error(`Error parsing seed ${filePath}:`, err);
        }
      }

      setSeeds(loadedSeeds);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to load test seeds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSeedsFromLibrarian = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement Librarian agent integration
      // This would send a message to the Librarian agent asking for seed files
      // For now, fall back to test mode
      console.warn(
        "Librarian integration not yet implemented, using test mode",
      );
      await loadTestSeeds();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to load seeds from Librarian:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    if (testMode) {
      await loadTestSeeds();
    } else {
      await loadSeedsFromLibrarian();
    }
  };

  useEffect(() => {
    if (loadOnMount) {
      refetch();
    }
  }, [loadOnMount]);

  const availableCategories = useMemo(() => {
    return getAllCategories(seeds);
  }, [seeds]);

  const availableTags = useMemo(() => {
    return getAllTags(seeds);
  }, [seeds]);

  const filteredSeeds = useMemo(() => {
    let result = seeds;

    if (searchQuery) {
      result = searchSeeds(result, searchQuery);
    }

    if (selectedCategory) {
      result = result.filter(
        (seed) => seed.metadata.category === selectedCategory,
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((seed) =>
        selectedTags.every((tag) => seed.metadata.tags.includes(tag)),
      );
    }

    return result;
  }, [seeds, searchQuery, selectedCategory, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  return {
    seeds,
    filteredSeeds,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,
    clearFilters,
    availableCategories,
    availableTags,
    refetch,
  };
}
