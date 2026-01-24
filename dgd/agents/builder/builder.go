package builder

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/TresPies-source/dgd/llm"
	"github.com/TresPies-source/dgd/tools"
)

// Builder is the agent responsible for code generation and tool execution
type Builder struct {
	llmClient llm.Client
	model     string
	registry  *tools.Registry
}

// Request represents a request to the Builder agent
type Request struct {
	Query      string `json:"query"`
	WorkingDir string `json:"working_dir"`
}

// Response represents a response from the Builder agent
type Response struct {
	Content          string                 `json:"content"`
	ToolsUsed        []string               `json:"tools_used"`
	FilesCreated     []string               `json:"files_created"`
	Success          bool                   `json:"success"`
	Data             map[string]interface{} `json:"data,omitempty"`
	PromptTokens     int                    `json:"prompt_tokens"`
	CompletionTokens int                    `json:"completion_tokens"`
}

// NewBuilder creates a new Builder agent
func NewBuilder(llmClient llm.Client, model string, registry *tools.Registry) *Builder {
	return &Builder{
		llmClient: llmClient,
		model:     model,
		registry:  registry,
	}
}

// Process handles a builder request
func (b *Builder) Process(ctx context.Context, req *Request) (*Response, error) {
	// Build system prompt
	systemPrompt := b.buildSystemPrompt()

	// Build user prompt
	userPrompt := fmt.Sprintf("Task: %s\n\nWorking Directory: %s", req.Query, req.WorkingDir)

	// Call LLM
	llmReq := &llm.CompletionRequest{
		Model: b.model,
		Messages: []llm.Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: 0.2, // Lower temperature for more deterministic code generation
	}

	llmResp, err := b.llmClient.Complete(ctx, llmReq)
	if err != nil {
		return nil, fmt.Errorf("LLM completion failed: %w", err)
	}

	// Parse response for tool calls
	toolsUsed := []string{}
	filesCreated := []string{}
	content := llmResp.Content

	// Simple tool call parsing (look for ```tool-call blocks)
	if strings.Contains(content, "```tool-call") {
		// Extract and execute tool calls
		toolCalls := b.extractToolCalls(content)
		for _, toolCall := range toolCalls {
			result, err := b.executeTool(ctx, toolCall)
			if err != nil {
				content += fmt.Sprintf("\n\n[Tool Error] %s: %s", toolCall.Name, err.Error())
			} else {
				toolsUsed = append(toolsUsed, toolCall.Name)
				if toolCall.Name == "write_file" {
					if path, ok := toolCall.Params["path"].(string); ok {
						filesCreated = append(filesCreated, path)
					}
				}
				content += fmt.Sprintf("\n\n[Tool Result] %s: %s", toolCall.Name, result.Output)
			}
		}
	}

	return &Response{
		Content:          content,
		ToolsUsed:        toolsUsed,
		FilesCreated:     filesCreated,
		Success:          true,
		PromptTokens:     llmResp.PromptTokens,
		CompletionTokens: llmResp.CompletionTokens,
	}, nil
}

// buildSystemPrompt creates the system prompt for the Builder agent
func (b *Builder) buildSystemPrompt() string {
	toolsJSON := b.registry.ToJSON()
	toolsStr, _ := json.MarshalIndent(toolsJSON, "", "  ")

	return fmt.Sprintf(`You are the Builder Agent, a specialized AI assistant for code generation and file operations.

Your role:
- Generate clean, well-documented code
- Create and modify files
- Execute commands when needed
- Follow best practices and conventions

Available tools:
%s

To use a tool, output a tool call in this format:
` + "```tool-call" + `
{
  "name": "tool_name",
  "params": {
    "param1": "value1"
  }
}
` + "```" + `

Guidelines:
1. Always explain what you're doing before using tools
2. Use tools to create files, not just describe them
3. Keep code clean, documented, and following best practices
4. Test your work when possible
5. Report any errors clearly

Remember: You're here to build, not just advise.`, string(toolsStr))
}

// ToolCall represents a parsed tool call
type ToolCall struct {
	Name   string                 `json:"name"`
	Params map[string]interface{} `json:"params"`
}

// extractToolCalls extracts tool calls from LLM response
func (b *Builder) extractToolCalls(content string) []ToolCall {
	var toolCalls []ToolCall

	// Find all ```tool-call blocks
	blocks := strings.Split(content, "```tool-call")
	for i := 1; i < len(blocks); i++ {
		// Find the end of the block
		endIdx := strings.Index(blocks[i], "```")
		if endIdx == -1 {
			continue
		}

		jsonStr := strings.TrimSpace(blocks[i][:endIdx])

		// Parse JSON
		var toolCall ToolCall
		if err := json.Unmarshal([]byte(jsonStr), &toolCall); err != nil {
			continue
		}

		toolCalls = append(toolCalls, toolCall)
	}

	return toolCalls
}

// executeTool executes a tool call
func (b *Builder) executeTool(ctx context.Context, toolCall ToolCall) (*tools.Result, error) {
	return b.registry.Execute(ctx, toolCall.Name, toolCall.Params)
}

// ListTools returns all available tools
func (b *Builder) ListTools() []map[string]interface{} {
	return b.registry.ToJSON()
}
