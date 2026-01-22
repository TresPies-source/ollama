package tools

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ReadFileTool reads a file's contents
type ReadFileTool struct {
	workingDir string
}

func NewReadFileTool(workingDir string) *ReadFileTool {
	return &ReadFileTool{workingDir: workingDir}
}

func (t *ReadFileTool) Name() string {
	return "read_file"
}

func (t *ReadFileTool) Description() string {
	return "Read the contents of a file"
}

func (t *ReadFileTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Path to the file to read (relative to working directory)",
			},
		},
		"required": []string{"path"},
	}
}

func (t *ReadFileTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	path, ok := params["path"].(string)
	if !ok {
		return &Result{Success: false, Error: "path parameter required"}, nil
	}

	// Security: prevent directory traversal
	if strings.Contains(path, "..") {
		return &Result{Success: false, Error: "directory traversal not allowed"}, nil
	}

	fullPath := filepath.Join(t.workingDir, path)
	content, err := os.ReadFile(fullPath)
	if err != nil {
		return &Result{Success: false, Error: err.Error()}, nil
	}

	return &Result{
		Success: true,
		Output:  string(content),
		Data: map[string]interface{}{
			"path": path,
			"size": len(content),
		},
	}, nil
}

// WriteFileTool writes content to a file
type WriteFileTool struct {
	workingDir string
}

func NewWriteFileTool(workingDir string) *WriteFileTool {
	return &WriteFileTool{workingDir: workingDir}
}

func (t *WriteFileTool) Name() string {
	return "write_file"
}

func (t *WriteFileTool) Description() string {
	return "Write content to a file (creates or overwrites)"
}

func (t *WriteFileTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Path to the file to write (relative to working directory)",
			},
			"content": map[string]interface{}{
				"type":        "string",
				"description": "Content to write to the file",
			},
		},
		"required": []string{"path", "content"},
	}
}

func (t *WriteFileTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	path, ok := params["path"].(string)
	if !ok {
		return &Result{Success: false, Error: "path parameter required"}, nil
	}

	content, ok := params["content"].(string)
	if !ok {
		return &Result{Success: false, Error: "content parameter required"}, nil
	}

	// Security: prevent directory traversal
	if strings.Contains(path, "..") {
		return &Result{Success: false, Error: "directory traversal not allowed"}, nil
	}

	fullPath := filepath.Join(t.workingDir, path)

	// Create directory if it doesn't exist
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return &Result{Success: false, Error: err.Error()}, nil
	}

	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return &Result{Success: false, Error: err.Error()}, nil
	}

	return &Result{
		Success: true,
		Output:  fmt.Sprintf("Wrote %d bytes to %s", len(content), path),
		Data: map[string]interface{}{
			"path": path,
			"size": len(content),
		},
	}, nil
}

// ListFilesTool lists files in a directory
type ListFilesTool struct {
	workingDir string
}

func NewListFilesTool(workingDir string) *ListFilesTool {
	return &ListFilesTool{workingDir: workingDir}
}

func (t *ListFilesTool) Name() string {
	return "list_files"
}

func (t *ListFilesTool) Description() string {
	return "List files in a directory"
}

func (t *ListFilesTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Path to the directory (relative to working directory, defaults to '.')",
			},
		},
	}
}

func (t *ListFilesTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	path := "."
	if p, ok := params["path"].(string); ok {
		path = p
	}

	// Security: prevent directory traversal
	if strings.Contains(path, "..") {
		return &Result{Success: false, Error: "directory traversal not allowed"}, nil
	}

	fullPath := filepath.Join(t.workingDir, path)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return &Result{Success: false, Error: err.Error()}, nil
	}

	var output strings.Builder
	files := make([]map[string]interface{}, 0, len(entries))

	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		fileType := "file"
		if entry.IsDir() {
			fileType = "directory"
		}

		files = append(files, map[string]interface{}{
			"name": entry.Name(),
			"type": fileType,
			"size": info.Size(),
		})

		output.WriteString(fmt.Sprintf("%s (%s, %d bytes)\n", entry.Name(), fileType, info.Size()))
	}

	return &Result{
		Success: true,
		Output:  output.String(),
		Data: map[string]interface{}{
			"path":  path,
			"files": files,
			"count": len(files),
		},
	}, nil
}
