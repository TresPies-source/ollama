package llm

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDefaultConfig(t *testing.T) {
	config := DefaultConfig()

	if config.Provider != ProviderOllama {
		t.Errorf("Expected provider %s, got %s", ProviderOllama, config.Provider)
	}

	if config.BaseURL == "" {
		t.Error("Expected non-empty base URL")
	}

	if config.Model == "" {
		t.Error("Expected non-empty model")
	}
}

func TestNewClient_Ollama(t *testing.T) {
	config := &Config{
		Provider: ProviderOllama,
		BaseURL:  "http://localhost:11434",
	}

	client, err := NewClient(config)
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}

	if client.Provider() != ProviderOllama {
		t.Errorf("Expected provider %s, got %s", ProviderOllama, client.Provider())
	}
}

func TestNewClient_OpenAI(t *testing.T) {
	config := &Config{
		Provider: ProviderOpenAI,
		APIKey:   "test-key",
	}

	client, err := NewClient(config)
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}

	if client.Provider() != ProviderOpenAI {
		t.Errorf("Expected provider %s, got %s", ProviderOpenAI, client.Provider())
	}
}

func TestNewClient_OpenAI_NoAPIKey(t *testing.T) {
	config := &Config{
		Provider: ProviderOpenAI,
	}

	_, err := NewClient(config)
	if err == nil {
		t.Error("Expected error when creating OpenAI client without API key")
	}
}

func TestNewClient_UnknownProvider(t *testing.T) {
	config := &Config{
		Provider: "unknown",
	}

	_, err := NewClient(config)
	if err == nil {
		t.Error("Expected error when creating client with unknown provider")
	}
}

func TestOllamaClient_TokenExtraction(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := ollamaResponse{
			Model:           "llama3.2:3b",
			Message:         Message{Role: "assistant", Content: "Hello, world!"},
			Done:            true,
			PromptEvalCount: 50,
			EvalCount:       25,
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := NewOllamaClient(server.URL)

	req := &CompletionRequest{
		Model:    "llama3.2:3b",
		Messages: []Message{{Role: "user", Content: "Hello"}},
	}

	resp, err := client.Complete(context.Background(), req)
	if err != nil {
		t.Fatalf("Complete failed: %v", err)
	}

	if resp.PromptTokens != 50 {
		t.Errorf("Expected PromptTokens=50, got %d", resp.PromptTokens)
	}

	if resp.CompletionTokens != 25 {
		t.Errorf("Expected CompletionTokens=25, got %d", resp.CompletionTokens)
	}

	if resp.TokensUsed != 75 {
		t.Errorf("Expected TokensUsed=75, got %d", resp.TokensUsed)
	}
}

func TestOllamaClient_TokenExtraction_MissingCounts(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := ollamaResponse{
			Model:   "llama3.2:3b",
			Message: Message{Role: "assistant", Content: "Hello, world!"},
			Done:    true,
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := NewOllamaClient(server.URL)

	req := &CompletionRequest{
		Model:    "llama3.2:3b",
		Messages: []Message{{Role: "user", Content: "Hello"}},
	}

	resp, err := client.Complete(context.Background(), req)
	if err != nil {
		t.Fatalf("Complete failed: %v", err)
	}

	if resp.PromptTokens != 0 {
		t.Errorf("Expected PromptTokens=0 (default), got %d", resp.PromptTokens)
	}

	if resp.CompletionTokens != 0 {
		t.Errorf("Expected CompletionTokens=0 (default), got %d", resp.CompletionTokens)
	}

	if resp.TokensUsed != 0 {
		t.Errorf("Expected TokensUsed=0, got %d", resp.TokensUsed)
	}
}

func TestOpenAIClient_TokenExtraction(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := openaiResponse{
			Model: "gpt-4",
			Choices: []struct {
				Index        int     `json:"index"`
				Message      Message `json:"message"`
				FinishReason string  `json:"finish_reason"`
			}{
				{
					Index:        0,
					Message:      Message{Role: "assistant", Content: "Hello, world!"},
					FinishReason: "stop",
				},
			},
			Usage: struct {
				PromptTokens     int `json:"prompt_tokens"`
				CompletionTokens int `json:"completion_tokens"`
				TotalTokens      int `json:"total_tokens"`
			}{
				PromptTokens:     100,
				CompletionTokens: 50,
				TotalTokens:      150,
			},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := &OpenAIClient{
		baseURL: server.URL,
		apiKey:  "test-key",
		client:  &http.Client{},
	}

	req := &CompletionRequest{
		Model:    "gpt-4",
		Messages: []Message{{Role: "user", Content: "Hello"}},
	}

	resp, err := client.Complete(context.Background(), req)
	if err != nil {
		t.Fatalf("Complete failed: %v", err)
	}

	if resp.PromptTokens != 100 {
		t.Errorf("Expected PromptTokens=100, got %d", resp.PromptTokens)
	}

	if resp.CompletionTokens != 50 {
		t.Errorf("Expected CompletionTokens=50, got %d", resp.CompletionTokens)
	}

	if resp.TokensUsed != 150 {
		t.Errorf("Expected TokensUsed=150, got %d", resp.TokensUsed)
	}
}

func TestOpenAIClient_TokenExtraction_MissingCounts(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := openaiResponse{
			Model: "gpt-4",
			Choices: []struct {
				Index        int     `json:"index"`
				Message      Message `json:"message"`
				FinishReason string  `json:"finish_reason"`
			}{
				{
					Index:        0,
					Message:      Message{Role: "assistant", Content: "Hello, world!"},
					FinishReason: "stop",
				},
			},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := &OpenAIClient{
		baseURL: server.URL,
		apiKey:  "test-key",
		client:  &http.Client{},
	}

	req := &CompletionRequest{
		Model:    "gpt-4",
		Messages: []Message{{Role: "user", Content: "Hello"}},
	}

	resp, err := client.Complete(context.Background(), req)
	if err != nil {
		t.Fatalf("Complete failed: %v", err)
	}

	if resp.PromptTokens != 0 {
		t.Errorf("Expected PromptTokens=0 (default), got %d", resp.PromptTokens)
	}

	if resp.CompletionTokens != 0 {
		t.Errorf("Expected CompletionTokens=0 (default), got %d", resp.CompletionTokens)
	}

	if resp.TokensUsed != 0 {
		t.Errorf("Expected TokensUsed=0 (default), got %d", resp.TokensUsed)
	}
}
