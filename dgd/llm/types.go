package llm

import "context"

// Provider represents an LLM provider
type Provider string

const (
	ProviderOllama    Provider = "ollama"
	ProviderOpenAI    Provider = "openai"
	ProviderAnthropic Provider = "anthropic"
)

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// CompletionRequest represents a request for text completion
type CompletionRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature,omitempty"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Stream      bool      `json:"stream,omitempty"`
}

// CompletionResponse represents a response from text completion
type CompletionResponse struct {
	Content          string `json:"content"`
	Model            string `json:"model"`
	TokensUsed       int    `json:"tokens_used"`
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
	FinishReason     string `json:"finish_reason"`
}

// StreamChunk represents a chunk of streaming response
type StreamChunk struct {
	Content string `json:"content"`
	Done    bool   `json:"done"`
}

// Client is the interface that all LLM providers must implement
type Client interface {
	// Complete generates a completion for the given request
	Complete(ctx context.Context, req *CompletionRequest) (*CompletionResponse, error)

	// Stream generates a streaming completion for the given request
	Stream(ctx context.Context, req *CompletionRequest) (<-chan StreamChunk, error)

	// ListModels returns a list of available models
	ListModels(ctx context.Context) ([]string, error)

	// Provider returns the provider name
	Provider() Provider
}

// Config represents the configuration for an LLM client
type Config struct {
	Provider Provider
	BaseURL  string
	APIKey   string
	Model    string
}
