package librarian

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// Librarian handles file search and seed retrieval operations
type Librarian struct {
	workingDir string
	seedsDir   string
}

// NewLibrarian creates a new Librarian instance
func NewLibrarian(workingDir, seedsDir string) *Librarian {
	return &Librarian{
		workingDir: workingDir,
		seedsDir:   seedsDir,
	}
}

// FileSearchResult represents a file search result
type FileSearchResult struct {
	Path      string `json:"path"`
	Name      string `json:"name"`
	SizeBytes int64  `json:"size_bytes"`
	IsDir     bool   `json:"is_dir"`
}

// SeedMetadata represents the YAML frontmatter of a seed file
type SeedMetadata struct {
	Name        string   `yaml:"name"`
	Description string   `yaml:"description"`
	Category    string   `yaml:"category"`
	Tags        []string `yaml:"tags"`
}

// Seed represents a complete seed with metadata and content
type Seed struct {
	Metadata SeedMetadata `json:"metadata"`
	Content  string       `json:"content"`
	FilePath string       `json:"file_path"`
}

// SearchFiles searches for files in the working directory
func (l *Librarian) SearchFiles(ctx context.Context, pattern string) ([]FileSearchResult, error) {
	var results []FileSearchResult

	// Walk the working directory
	err := filepath.WalkDir(l.workingDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip hidden directories and files
		if strings.HasPrefix(d.Name(), ".") && d.Name() != "." {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		// Check if the file matches the pattern
		matched, err := filepath.Match(pattern, d.Name())
		if err != nil {
			return err
		}

		if matched {
			info, err := d.Info()
			if err != nil {
				return err
			}

			// Get relative path from working directory
			relPath, err := filepath.Rel(l.workingDir, path)
			if err != nil {
				relPath = path
			}

			results = append(results, FileSearchResult{
				Path:      relPath,
				Name:      d.Name(),
				SizeBytes: info.Size(),
				IsDir:     d.IsDir(),
			})
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to search files: %w", err)
	}

	return results, nil
}

// ReadFile reads the content of a file
func (l *Librarian) ReadFile(ctx context.Context, relativePath string) (string, error) {
	fullPath := filepath.Join(l.workingDir, relativePath)

	// Security check: ensure the path is within the working directory
	absPath, err := filepath.Abs(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to resolve path: %w", err)
	}

	absWorkingDir, err := filepath.Abs(l.workingDir)
	if err != nil {
		return "", fmt.Errorf("failed to resolve working directory: %w", err)
	}

	if !strings.HasPrefix(absPath, absWorkingDir) {
		return "", fmt.Errorf("path is outside working directory")
	}

	// Read the file
	content, err := os.ReadFile(absPath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	return string(content), nil
}

// ListSeeds lists all available seeds
func (l *Librarian) ListSeeds(ctx context.Context) ([]Seed, error) {
	var seeds []Seed

	// Check if seeds directory exists
	if _, err := os.Stat(l.seedsDir); os.IsNotExist(err) {
		return seeds, nil // Return empty list if directory doesn't exist
	}

	// Walk the seeds directory
	err := filepath.WalkDir(l.seedsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Only process .md files
		if d.IsDir() || !strings.HasSuffix(d.Name(), ".md") {
			return nil
		}

		// Parse the seed file
		seed, err := l.parseSeedFile(path)
		if err != nil {
			// Log error but continue processing other seeds
			fmt.Printf("Warning: failed to parse seed %s: %v\n", path, err)
			return nil
		}

		seeds = append(seeds, *seed)
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to list seeds: %w", err)
	}

	return seeds, nil
}

// RetrieveSeed retrieves a specific seed by name
func (l *Librarian) RetrieveSeed(ctx context.Context, name string) (*Seed, error) {
	seeds, err := l.ListSeeds(ctx)
	if err != nil {
		return nil, err
	}

	// Find the seed by name
	for _, seed := range seeds {
		if seed.Metadata.Name == name {
			return &seed, nil
		}
	}

	return nil, fmt.Errorf("seed not found: %s", name)
}

// SearchSeeds searches for seeds by category or tag
func (l *Librarian) SearchSeeds(ctx context.Context, query string) ([]Seed, error) {
	allSeeds, err := l.ListSeeds(ctx)
	if err != nil {
		return nil, err
	}

	var results []Seed
	query = strings.ToLower(query)

	for _, seed := range allSeeds {
		// Check if query matches name, description, category, or tags
		if strings.Contains(strings.ToLower(seed.Metadata.Name), query) ||
			strings.Contains(strings.ToLower(seed.Metadata.Description), query) ||
			strings.Contains(strings.ToLower(seed.Metadata.Category), query) {
			results = append(results, seed)
			continue
		}

		// Check tags
		for _, tag := range seed.Metadata.Tags {
			if strings.Contains(strings.ToLower(tag), query) {
				results = append(results, seed)
				break
			}
		}
	}

	return results, nil
}

// parseSeedFile parses a seed markdown file with YAML frontmatter
func (l *Librarian) parseSeedFile(path string) (*Seed, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read seed file: %w", err)
	}

	contentStr := string(content)

	// Check for YAML frontmatter (between --- markers)
	if !strings.HasPrefix(contentStr, "---\n") {
		return nil, fmt.Errorf("seed file missing YAML frontmatter")
	}

	// Find the end of frontmatter
	endIdx := strings.Index(contentStr[4:], "\n---\n")
	if endIdx == -1 {
		return nil, fmt.Errorf("seed file has malformed YAML frontmatter")
	}

	// Extract frontmatter and content
	frontmatter := contentStr[4 : endIdx+4]
	markdownContent := strings.TrimSpace(contentStr[endIdx+9:])

	// Parse YAML frontmatter
	var metadata SeedMetadata
	if err := yaml.Unmarshal([]byte(frontmatter), &metadata); err != nil {
		return nil, fmt.Errorf("failed to parse YAML frontmatter: %w", err)
	}

	return &Seed{
		Metadata: metadata,
		Content:  markdownContent,
		FilePath: path,
	}, nil
}
