package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// OllamaClient implements the Client interface for Ollama
type OllamaClient struct {
	baseURL string
	client  *http.Client
}

// NewOllamaClient creates a new Ollama client
func NewOllamaClient(baseURL string) *OllamaClient {
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	return &OllamaClient{
		baseURL: baseURL,
		client:  &http.Client{},
	}
}

// ollamaRequest represents the Ollama API request format
type ollamaRequest struct {
	Model    string          `json:"model"`
	Messages []Message       `json:"messages"`
	Stream   bool            `json:"stream"`
	Options  *ollamaOptions  `json:"options,omitempty"`
}

// ollamaOptions represents Ollama-specific options
type ollamaOptions struct {
	Temperature float64 `json:"temperature,omitempty"`
	NumPredict  int     `json:"num_predict,omitempty"`
}

// ollamaResponse represents the Ollama API response format
type ollamaResponse struct {
	Model     string  `json:"model"`
	CreatedAt string  `json:"created_at"`
	Message   Message `json:"message"`
	Done      bool    `json:"done"`
}

// Complete generates a completion using Ollama
func (c *OllamaClient) Complete(ctx context.Context, req *CompletionRequest) (*CompletionResponse, error) {
	ollamaReq := ollamaRequest{
		Model:    req.Model,
		Messages: req.Messages,
		Stream:   false,
	}

	if req.Temperature > 0 || req.MaxTokens > 0 {
		ollamaReq.Options = &ollamaOptions{
			Temperature: req.Temperature,
			NumPredict:  req.MaxTokens,
		}
	}

	body, err := json.Marshal(ollamaReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/api/chat", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ollama API error: %s (status %d)", string(body), resp.StatusCode)
	}

	var ollamaResp ollamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &CompletionResponse{
		Content:      ollamaResp.Message.Content,
		Model:        ollamaResp.Model,
		FinishReason: "stop",
	}, nil
}

// Stream generates a streaming completion using Ollama
func (c *OllamaClient) Stream(ctx context.Context, req *CompletionRequest) (<-chan StreamChunk, error) {
	ollamaReq := ollamaRequest{
		Model:    req.Model,
		Messages: req.Messages,
		Stream:   true,
	}

	if req.Temperature > 0 || req.MaxTokens > 0 {
		ollamaReq.Options = &ollamaOptions{
			Temperature: req.Temperature,
			NumPredict:  req.MaxTokens,
		}
	}

	body, err := json.Marshal(ollamaReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/api/chat", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("ollama API error: %s (status %d)", string(body), resp.StatusCode)
	}

	chunks := make(chan StreamChunk)

	go func() {
		defer close(chunks)
		defer resp.Body.Close()

		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			var ollamaResp ollamaResponse
			if err := json.Unmarshal(scanner.Bytes(), &ollamaResp); err != nil {
				continue
			}

			chunks <- StreamChunk{
				Content: ollamaResp.Message.Content,
				Done:    ollamaResp.Done,
			}

			if ollamaResp.Done {
				break
			}
		}
	}()

	return chunks, nil
}

// ListModels returns a list of available Ollama models
func (c *OllamaClient) ListModels(ctx context.Context) ([]string, error) {
	httpReq, err := http.NewRequestWithContext(ctx, "GET", c.baseURL+"/api/tags", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ollama API error: status %d", resp.StatusCode)
	}

	var result struct {
		Models []struct {
			Name string `json:"name"`
		} `json:"models"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	models := make([]string, len(result.Models))
	for i, model := range result.Models {
		models[i] = model.Name
	}

	return models, nil
}

// Provider returns the provider name
func (c *OllamaClient) Provider() Provider {
	return ProviderOllama
}
