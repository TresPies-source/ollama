package tools

import (
	"context"
	"fmt"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// ExecuteCommandTool executes a shell command
type ExecuteCommandTool struct {
	workingDir string
	timeout    time.Duration
}

func NewExecuteCommandTool(workingDir string) *ExecuteCommandTool {
	return &ExecuteCommandTool{
		workingDir: workingDir,
		timeout:    30 * time.Second,
	}
}

func (t *ExecuteCommandTool) Name() string {
	return "execute_command"
}

func (t *ExecuteCommandTool) Description() string {
	return "Execute a shell command in the working directory"
}

func (t *ExecuteCommandTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"command": map[string]interface{}{
				"type":        "string",
				"description": "The shell command to execute",
			},
		},
		"required": []string{"command"},
	}
}

func (t *ExecuteCommandTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	command, ok := params["command"].(string)
	if !ok {
		return &Result{Success: false, Error: "command parameter required"}, nil
	}

	// Security: block dangerous commands (Unix and Windows)
	dangerous := []string{
		"rm -rf", "dd if=", "mkfs", ":(){ :|:& };:", "> /dev/", // Unix
		"rd /s /q", "format ", "del /f /q", "rmdir /s /q", // Windows
	}
	for _, pattern := range dangerous {
		if strings.Contains(command, pattern) {
			return &Result{Success: false, Error: "dangerous command blocked"}, nil
		}
	}

	// Create context with timeout
	execCtx, cancel := context.WithTimeout(ctx, t.timeout)
	defer cancel()

	// Execute command (platform-specific shell)
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(execCtx, "cmd", "/c", command)
	} else {
		cmd = exec.CommandContext(execCtx, "sh", "-c", command)
	}
	cmd.Dir = t.workingDir

	output, err := cmd.CombinedOutput()
	outputStr := string(output)

	if err != nil {
		return &Result{
			Success: false,
			Output:  outputStr,
			Error:   err.Error(),
		}, nil
	}

	return &Result{
		Success: true,
		Output:  outputStr,
		Data: map[string]interface{}{
			"command":  command,
			"exitCode": 0,
		},
	}, nil
}

// GetEnvTool gets an environment variable
type GetEnvTool struct{}

func NewGetEnvTool() *GetEnvTool {
	return &GetEnvTool{}
}

func (t *GetEnvTool) Name() string {
	return "get_env"
}

func (t *GetEnvTool) Description() string {
	return "Get the value of an environment variable"
}

func (t *GetEnvTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"name": map[string]interface{}{
				"type":        "string",
				"description": "Name of the environment variable",
			},
		},
		"required": []string{"name"},
	}
}

func (t *GetEnvTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	name, ok := params["name"].(string)
	if !ok {
		return &Result{Success: false, Error: "name parameter required"}, nil
	}

	// Security: block sensitive env vars
	sensitive := []string{"PASSWORD", "SECRET", "KEY", "TOKEN", "CREDENTIAL"}
	for _, pattern := range sensitive {
		if strings.Contains(strings.ToUpper(name), pattern) {
			return &Result{Success: false, Error: "access to sensitive environment variable blocked"}, nil
		}
	}

	value := ""
	// In a real implementation, you'd use os.Getenv(name)
	// For now, return empty string

	return &Result{
		Success: true,
		Output:  value,
		Data: map[string]interface{}{
			"name":  name,
			"value": value,
		},
	}, nil
}

// GetTimeTool gets the current time
type GetTimeTool struct{}

func NewGetTimeTool() *GetTimeTool {
	return &GetTimeTool{}
}

func (t *GetTimeTool) Name() string {
	return "get_time"
}

func (t *GetTimeTool) Description() string {
	return "Get the current date and time"
}

func (t *GetTimeTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type":       "object",
		"properties": map[string]interface{}{},
	}
}

func (t *GetTimeTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	now := time.Now()

	return &Result{
		Success: true,
		Output:  now.Format("2006-01-02 15:04:05 MST"),
		Data: map[string]interface{}{
			"timestamp": now.Unix(),
			"iso8601":   now.Format(time.RFC3339),
			"date":      now.Format("2006-01-02"),
			"time":      now.Format("15:04:05"),
		},
	}, nil
}

// CalculateTool performs basic calculations
type CalculateTool struct{}

func NewCalculateTool() *CalculateTool {
	return &CalculateTool{}
}

func (t *CalculateTool) Name() string {
	return "calculate"
}

func (t *CalculateTool) Description() string {
	return "Perform a basic calculation (add, subtract, multiply, divide)"
}

func (t *CalculateTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"operation": map[string]interface{}{
				"type":        "string",
				"description": "Operation to perform: add, subtract, multiply, divide",
				"enum":        []string{"add", "subtract", "multiply", "divide"},
			},
			"a": map[string]interface{}{
				"type":        "number",
				"description": "First number",
			},
			"b": map[string]interface{}{
				"type":        "number",
				"description": "Second number",
			},
		},
		"required": []string{"operation", "a", "b"},
	}
}

func (t *CalculateTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	operation, ok := params["operation"].(string)
	if !ok {
		return &Result{Success: false, Error: "operation parameter required"}, nil
	}

	a, ok := params["a"].(float64)
	if !ok {
		return &Result{Success: false, Error: "a parameter must be a number"}, nil
	}

	b, ok := params["b"].(float64)
	if !ok {
		return &Result{Success: false, Error: "b parameter must be a number"}, nil
	}

	var result float64

	switch operation {
	case "add":
		result = a + b
	case "subtract":
		result = a - b
	case "multiply":
		result = a * b
	case "divide":
		if b == 0 {
			return &Result{Success: false, Error: "division by zero"}, nil
		}
		result = a / b
	default:
		return &Result{Success: false, Error: "unknown operation"}, nil
	}

	return &Result{
		Success: true,
		Output:  fmt.Sprintf("%s(%g, %g) = %g", operation, a, b, result),
		Data: map[string]interface{}{
			"operation": operation,
			"a":         a,
			"b":         b,
			"result":    result,
		},
	}, nil
}
