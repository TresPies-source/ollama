package librarian

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestSearchFiles(t *testing.T) {
	// Create temporary test directory
	tmpDir := t.TempDir()
	
	// Create test files
	testFiles := []string{
		"file1.txt",
		"file2.md",
		"subdir/file3.txt",
		"subdir/file4.go",
	}
	
	for _, file := range testFiles {
		fullPath := filepath.Join(tmpDir, file)
		dir := filepath.Dir(fullPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(fullPath, []byte("test content"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	
	lib := NewLibrarian(tmpDir, "")
	ctx := context.Background()
	
	// Test: Search for all .txt files
	results, err := lib.SearchFiles(ctx, "*.txt")
	if err != nil {
		t.Fatalf("SearchFiles failed: %v", err)
	}
	
	if len(results) != 2 {
		t.Errorf("Expected 2 .txt files, got %d", len(results))
	}
	
	// Test: Search for all .md files
	results, err = lib.SearchFiles(ctx, "*.md")
	if err != nil {
		t.Fatalf("SearchFiles failed: %v", err)
	}
	
	if len(results) != 1 {
		t.Errorf("Expected 1 .md file, got %d", len(results))
	}
}

func TestReadFile(t *testing.T) {
	// Create temporary test directory
	tmpDir := t.TempDir()
	
	// Create test file
	testContent := "Hello, Dojo Genesis!"
	testFile := "test.txt"
	fullPath := filepath.Join(tmpDir, testFile)
	if err := os.WriteFile(fullPath, []byte(testContent), 0644); err != nil {
		t.Fatal(err)
	}
	
	lib := NewLibrarian(tmpDir, "")
	ctx := context.Background()
	
	// Test: Read file
	content, err := lib.ReadFile(ctx, testFile)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}
	
	if content != testContent {
		t.Errorf("Expected content %q, got %q", testContent, content)
	}
	
	// Test: Security check - try to read outside working directory
	_, err = lib.ReadFile(ctx, "../outside.txt")
	if err == nil {
		t.Error("Expected error when reading outside working directory")
	}
}

func TestListSeeds(t *testing.T) {
	// Create temporary seeds directory
	seedsDir := t.TempDir()
	
	// Create test seed files
	seed1 := `---
name: Test Seed 1
description: A test seed for unit testing
category: testing
tags:
  - test
  - unit
---

# Test Seed 1

This is the content of test seed 1.
`
	
	seed2 := `---
name: Test Seed 2
description: Another test seed
category: testing
tags:
  - test
  - example
---

# Test Seed 2

This is the content of test seed 2.
`
	
	if err := os.WriteFile(filepath.Join(seedsDir, "seed1.md"), []byte(seed1), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(seedsDir, "seed2.md"), []byte(seed2), 0644); err != nil {
		t.Fatal(err)
	}
	
	lib := NewLibrarian("", seedsDir)
	ctx := context.Background()
	
	// Test: List all seeds
	seeds, err := lib.ListSeeds(ctx)
	if err != nil {
		t.Fatalf("ListSeeds failed: %v", err)
	}
	
	if len(seeds) != 2 {
		t.Errorf("Expected 2 seeds, got %d", len(seeds))
	}
	
	// Verify seed metadata
	if seeds[0].Metadata.Name != "Test Seed 1" && seeds[0].Metadata.Name != "Test Seed 2" {
		t.Errorf("Unexpected seed name: %s", seeds[0].Metadata.Name)
	}
}

func TestRetrieveSeed(t *testing.T) {
	// Create temporary seeds directory
	seedsDir := t.TempDir()
	
	// Create test seed file
	seedContent := `---
name: Memory Management
description: Best practices for memory management
category: architecture
tags:
  - memory
  - performance
---

# Memory Management

Use the Context Iceberg pattern for efficient memory management.
`
	
	if err := os.WriteFile(filepath.Join(seedsDir, "memory.md"), []byte(seedContent), 0644); err != nil {
		t.Fatal(err)
	}
	
	lib := NewLibrarian("", seedsDir)
	ctx := context.Background()
	
	// Test: Retrieve seed by name
	seed, err := lib.RetrieveSeed(ctx, "Memory Management")
	if err != nil {
		t.Fatalf("RetrieveSeed failed: %v", err)
	}
	
	if seed.Metadata.Name != "Memory Management" {
		t.Errorf("Expected seed name 'Memory Management', got %s", seed.Metadata.Name)
	}
	
	if seed.Metadata.Category != "architecture" {
		t.Errorf("Expected category 'architecture', got %s", seed.Metadata.Category)
	}
	
	// Test: Retrieve non-existent seed
	_, err = lib.RetrieveSeed(ctx, "Non-Existent Seed")
	if err == nil {
		t.Error("Expected error when retrieving non-existent seed")
	}
}

func TestSearchSeeds(t *testing.T) {
	// Create temporary seeds directory
	seedsDir := t.TempDir()
	
	// Create test seed files
	seeds := []string{
		`---
name: Memory Management
description: Best practices for memory management
category: architecture
tags:
  - memory
  - performance
---
Content 1`,
		`---
name: Agent Routing
description: How to route between agents
category: orchestration
tags:
  - agents
  - routing
---
Content 2`,
		`---
name: Database Design
description: Database schema design patterns
category: architecture
tags:
  - database
  - schema
---
Content 3`,
	}
	
	for i, content := range seeds {
		filename := filepath.Join(seedsDir, filepath.Base(filepath.Join(seedsDir, filepath.Base(filepath.Join("seed", string(rune('0'+i))))+".md")))
		if err := os.WriteFile(filename, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}
	
	lib := NewLibrarian("", seedsDir)
	ctx := context.Background()
	
	// Test: Search by category
	results, err := lib.SearchSeeds(ctx, "architecture")
	if err != nil {
		t.Fatalf("SearchSeeds failed: %v", err)
	}
	
	if len(results) != 2 {
		t.Errorf("Expected 2 results for 'architecture', got %d", len(results))
	}
	
	// Test: Search by tag
	results, err = lib.SearchSeeds(ctx, "memory")
	if err != nil {
		t.Fatalf("SearchSeeds failed: %v", err)
	}
	
	if len(results) != 1 {
		t.Errorf("Expected 1 result for 'memory', got %d", len(results))
	}
}
