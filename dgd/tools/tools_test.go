package tools

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestRegistry(t *testing.T) {
	registry := NewRegistry()

	// Register a tool
	tool := NewGetTimeTool()
	err := registry.Register(tool)
	if err != nil {
		t.Fatalf("Failed to register tool: %v", err)
	}

	// Get the tool
	retrieved, err := registry.Get("get_time")
	if err != nil {
		t.Fatalf("Failed to get tool: %v", err)
	}

	if retrieved.Name() != "get_time" {
		t.Errorf("Expected tool name 'get_time', got '%s'", retrieved.Name())
	}

	// List tools
	tools := registry.List()
	if len(tools) != 1 {
		t.Errorf("Expected 1 tool, got %d", len(tools))
	}

	// Try to register the same tool again
	err = registry.Register(tool)
	if err == nil {
		t.Error("Expected error when registering duplicate tool")
	}
}

func TestGetTimeTool(t *testing.T) {
	tool := NewGetTimeTool()

	result, err := tool.Execute(context.Background(), map[string]interface{}{})
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}

	if !result.Success {
		t.Error("Expected success")
	}

	if result.Output == "" {
		t.Error("Expected non-empty output")
	}

	t.Logf("Time: %s", result.Output)
}

func TestCalculateTool(t *testing.T) {
	tool := NewCalculateTool()

	tests := []struct {
		operation string
		a         float64
		b         float64
		expected  float64
	}{
		{"add", 2, 3, 5},
		{"subtract", 5, 3, 2},
		{"multiply", 4, 3, 12},
		{"divide", 10, 2, 5},
	}

	for _, tt := range tests {
		t.Run(tt.operation, func(t *testing.T) {
			result, err := tool.Execute(context.Background(), map[string]interface{}{
				"operation": tt.operation,
				"a":         tt.a,
				"b":         tt.b,
			})

			if err != nil {
				t.Fatalf("Execute failed: %v", err)
			}

			if !result.Success {
				t.Errorf("Expected success, got error: %s", result.Error)
			}

			if result.Data["result"].(float64) != tt.expected {
				t.Errorf("Expected %g, got %g", tt.expected, result.Data["result"].(float64))
			}
		})
	}
}

func TestReadWriteFileTool(t *testing.T) {
	// Create temp directory
	tmpDir, err := os.MkdirTemp("", "dgd-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Write file
	writeTool := NewWriteFileTool(tmpDir)
	writeResult, err := writeTool.Execute(context.Background(), map[string]interface{}{
		"path":    "test.txt",
		"content": "Hello, World!",
	})

	if err != nil {
		t.Fatalf("Write failed: %v", err)
	}

	if !writeResult.Success {
		t.Errorf("Expected write success, got error: %s", writeResult.Error)
	}

	// Read file
	readTool := NewReadFileTool(tmpDir)
	readResult, err := readTool.Execute(context.Background(), map[string]interface{}{
		"path": "test.txt",
	})

	if err != nil {
		t.Fatalf("Read failed: %v", err)
	}

	if !readResult.Success {
		t.Errorf("Expected read success, got error: %s", readResult.Error)
	}

	if readResult.Output != "Hello, World!" {
		t.Errorf("Expected 'Hello, World!', got '%s'", readResult.Output)
	}
}

func TestListFilesTool(t *testing.T) {
	// Create temp directory with files
	tmpDir, err := os.MkdirTemp("", "dgd-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create test files
	os.WriteFile(filepath.Join(tmpDir, "file1.txt"), []byte("test"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "file2.txt"), []byte("test"), 0644)

	// List files
	tool := NewListFilesTool(tmpDir)
	result, err := tool.Execute(context.Background(), map[string]interface{}{})

	if err != nil {
		t.Fatalf("List failed: %v", err)
	}

	if !result.Success {
		t.Errorf("Expected success, got error: %s", result.Error)
	}

	files := result.Data["files"].([]map[string]interface{})
	if len(files) != 2 {
		t.Errorf("Expected 2 files, got %d", len(files))
	}

	t.Logf("Files: %v", result.Output)
}

func TestExecuteCommandTool(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "dgd-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	tool := NewExecuteCommandTool(tmpDir)

	// Test safe command (platform-specific)
	var safeCommand string
	var dangerousCommand string
	if runtime.GOOS == "windows" {
		safeCommand = "echo Hello"
		dangerousCommand = "rd /s /q C:\\"
	} else {
		safeCommand = "echo 'Hello'"
		dangerousCommand = "rm -rf /"
	}

	result, err := tool.Execute(context.Background(), map[string]interface{}{
		"command": safeCommand,
	})

	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}

	if !result.Success {
		t.Errorf("Expected success, got error: %s", result.Error)
	}

	// Test dangerous command (should be blocked)
	result, err = tool.Execute(context.Background(), map[string]interface{}{
		"command": dangerousCommand,
	})

	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}

	if result.Success {
		t.Error("Expected dangerous command to be blocked")
	}
}

func TestFormatTextTool(t *testing.T) {
	tool := NewFormatTextTool()

	tests := []struct {
		text     string
		format   string
		expected string
	}{
		{"hello world", "uppercase", "HELLO WORLD"},
		{"HELLO WORLD", "lowercase", "hello world"},
		{"hello world", "title", "Hello World"},
	}

	for _, tt := range tests {
		t.Run(tt.format, func(t *testing.T) {
			result, err := tool.Execute(context.Background(), map[string]interface{}{
				"text":   tt.text,
				"format": tt.format,
			})

			if err != nil {
				t.Fatalf("Execute failed: %v", err)
			}

			if !result.Success {
				t.Errorf("Expected success, got error: %s", result.Error)
			}

			if result.Output != tt.expected {
				t.Errorf("Expected '%s', got '%s'", tt.expected, result.Output)
			}
		})
	}
}

func TestInitRegistry(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "dgd-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	registry := InitRegistry(tmpDir)

	tools := registry.List()
	if len(tools) < 10 {
		t.Errorf("Expected at least 10 tools, got %d", len(tools))
	}

	// Check that all expected tools are registered
	expectedTools := []string{
		"read_file", "write_file", "list_files",
		"execute_command", "get_env", "get_time", "calculate",
		"fetch_url", "search_web", "parse_json", "format_text",
	}

	for _, name := range expectedTools {
		_, err := registry.Get(name)
		if err != nil {
			t.Errorf("Expected tool '%s' to be registered", name)
		}
	}

	t.Logf("Registered %d tools", len(tools))
}
