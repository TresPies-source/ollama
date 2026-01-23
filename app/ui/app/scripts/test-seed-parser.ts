import { readFileSync } from "fs";
import {
  parseSeed,
  searchSeeds,
  getAllCategories,
  getAllTags,
} from "../src/utils/seedParser";
import type { Seed } from "../src/types/dgd";

// Read test seed files (from project root)
const memoryContent = readFileSync("../../../.dgd/seeds/memory.md", "utf-8");
const apiContent = readFileSync("../../../.dgd/seeds/api-design.md", "utf-8");

// Parse seeds
console.log("🌱 Parsing seeds...\n");

const seeds: Seed[] = [];

try {
  const memorySeed = parseSeed(memoryContent, "../../../.dgd/seeds/memory.md");
  seeds.push(memorySeed);
  console.log("✅ Parsed memory.md:");
  console.log(`   Name: ${memorySeed.metadata.name}`);
  console.log(`   Category: ${memorySeed.metadata.category}`);
  console.log(`   Tags: ${memorySeed.metadata.tags.join(", ")}`);
  console.log("");
} catch (error) {
  console.error("❌ Failed to parse memory.md:", error);
}

try {
  const apiSeed = parseSeed(apiContent, "../../../.dgd/seeds/api-design.md");
  seeds.push(apiSeed);
  console.log("✅ Parsed api-design.md:");
  console.log(`   Name: ${apiSeed.metadata.name}`);
  console.log(`   Category: ${apiSeed.metadata.category}`);
  console.log(`   Tags: ${apiSeed.metadata.tags.join(", ")}`);
  console.log("");
} catch (error) {
  console.error("❌ Failed to parse api-design.md:", error);
}

// Test search functionality
console.log("🔍 Testing search...\n");

const memoryResults = searchSeeds(seeds, "memory");
console.log(`Search for "memory": ${memoryResults.length} result(s)`);
memoryResults.forEach((s) => console.log(`   - ${s.metadata.name}`));
console.log("");

const apiResults = searchSeeds(seeds, "api");
console.log(`Search for "api": ${apiResults.length} result(s)`);
apiResults.forEach((s) => console.log(`   - ${s.metadata.name}`));
console.log("");

// Get all categories and tags
console.log("📂 Categories:", getAllCategories(seeds).join(", "));
console.log("🏷️  Tags:", getAllTags(seeds).join(", "));
