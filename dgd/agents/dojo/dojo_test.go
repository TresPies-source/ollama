package dojo

import (
	"context"
	"testing"

	"github.com/TresPies-source/dgd/llm"
)

// MockLLMClient is a mock LLM client for testing
type MockLLMClient struct{}

func (m *MockLLMClient) Complete(ctx context.Context, req *llm.CompletionRequest) (*llm.CompletionResponse, error) {
	// Return a mock response based on the system prompt
	var content string
	if len(req.Messages) > 0 {
		systemPrompt := req.Messages[0].Content
		if containsString(systemPrompt, "MIRROR") {
			content = "Pattern: You're exploring multiple perspectives.\nTensions: Need to choose a direction.\nReframe: Consider this as an opportunity, not a constraint."
		} else if containsString(systemPrompt, "SCOUT") {
			content = "Route 1: Go with option A (fast but risky)\nRoute 2: Go with option B (slow but safe)\nRecommendation: Start with option B, test quickly."
		} else if containsString(systemPrompt, "GARDENER") {
			content = "Strongest: Your core idea is solid.\nGrowth: Needs more concrete examples.\nNext Step: Write one detailed example."
		} else if containsString(systemPrompt, "IMPLEMENTATION") {
			content = "Step 1: Define the interface\nStep 2: Implement core logic\nStep 3: Add tests\nSuccess: All tests pass."
		} else {
			content = "This is a general response."
		}
	}

	return &llm.CompletionResponse{
		Content:      content,
		Model:        "mock-model",
		FinishReason: "stop",
	}, nil
}

func (m *MockLLMClient) Stream(ctx context.Context, req *llm.CompletionRequest) (<-chan llm.StreamChunk, error) {
	chunks := make(chan llm.StreamChunk, 1)
	chunks <- llm.StreamChunk{Content: "Mock streaming response", Done: true}
	close(chunks)
	return chunks, nil
}

func (m *MockLLMClient) ListModels(ctx context.Context) ([]string, error) {
	return []string{"mock-model"}, nil
}

func (m *MockLLMClient) Provider() llm.Provider {
	return "mock"
}

func containsString(s, substr string) bool {
	return len(s) >= len(substr) && findSubstring(s, substr)
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func TestDojoMirrorMode(t *testing.T) {
	mockClient := &MockLLMClient{}
	dojo := NewDojo(mockClient, "mock-model")

	req := &Request{
		Query: "Help me think about this",
		Perspectives: []string{
			"Option A is faster",
			"Option B is safer",
			"Option C is cheaper",
		},
	}

	resp, err := dojo.Process(context.Background(), req)
	if err != nil {
		t.Fatalf("Process failed: %v", err)
	}

	if resp.Mode != ModeMirror {
		t.Errorf("Expected mode %s, got %s", ModeMirror, resp.Mode)
	}

	if resp.Content == "" {
		t.Error("Expected non-empty content")
	}

	t.Logf("Mirror response: %s", resp.Content)
}

func TestDojoScoutMode(t *testing.T) {
	mockClient := &MockLLMClient{}
	dojo := NewDojo(mockClient, "mock-model")

	req := &Request{
		Query: "What are my options for solving this problem?",
	}

	resp, err := dojo.Process(context.Background(), req)
	if err != nil {
		t.Fatalf("Process failed: %v", err)
	}

	if resp.Mode != ModeScout {
		t.Errorf("Expected mode %s, got %s", ModeScout, resp.Mode)
	}

	if resp.Content == "" {
		t.Error("Expected non-empty content")
	}

	t.Logf("Scout response: %s", resp.Content)
}

func TestDojoGardenerMode(t *testing.T) {
	mockClient := &MockLLMClient{}
	dojo := NewDojo(mockClient, "mock-model")

	req := &Request{
		Query: "Give me feedback on this idea",
	}

	resp, err := dojo.Process(context.Background(), req)
	if err != nil {
		t.Fatalf("Process failed: %v", err)
	}

	if resp.Mode != ModeGardener {
		t.Errorf("Expected mode %s, got %s", ModeGardener, resp.Mode)
	}

	if resp.Content == "" {
		t.Error("Expected non-empty content")
	}

	t.Logf("Gardener response: %s", resp.Content)
}

func TestDojoImplementationMode(t *testing.T) {
	mockClient := &MockLLMClient{}
	dojo := NewDojo(mockClient, "mock-model")

	req := &Request{
		Query: "How do I implement this feature?",
	}

	resp, err := dojo.Process(context.Background(), req)
	if err != nil {
		t.Fatalf("Process failed: %v", err)
	}

	if resp.Mode != ModeImplementation {
		t.Errorf("Expected mode %s, got %s", ModeImplementation, resp.Mode)
	}

	if resp.Content == "" {
		t.Error("Expected non-empty content")
	}

	t.Logf("Implementation response: %s", resp.Content)
}

func TestDojoModeInference(t *testing.T) {
	mockClient := &MockLLMClient{}
	dojo := NewDojo(mockClient, "mock-model")

	tests := []struct {
		query        string
		perspectives []string
		expectedMode Mode
	}{
		{
			query:        "Think about this",
			perspectives: []string{"A", "B"},
			expectedMode: ModeMirror,
		},
		{
			query:        "What routes should I take?",
			perspectives: nil,
			expectedMode: ModeScout,
		},
		{
			query:        "Improve my code",
			perspectives: nil,
			expectedMode: ModeGardener,
		},
		{
			query:        "How to build this",
			perspectives: nil,
			expectedMode: ModeImplementation,
		},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			req := &Request{
				Query:        tt.query,
				Perspectives: tt.perspectives,
			}

			resp, err := dojo.Process(context.Background(), req)
			if err != nil {
				t.Fatalf("Process failed: %v", err)
			}

			if resp.Mode != tt.expectedMode {
				t.Errorf("Expected mode %s, got %s", tt.expectedMode, resp.Mode)
			}
		})
	}
}
