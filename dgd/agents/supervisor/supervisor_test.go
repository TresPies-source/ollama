package supervisor

import (
	"context"
	"testing"
)

func TestClassifyIntent_Librarian(t *testing.T) {
	s := NewSupervisor()
	ctx := context.Background()

	tests := []struct {
		query    string
		expected AgentType
	}{
		{"read the file config.json", AgentLibrarian},
		{"search for all markdown files", AgentLibrarian},
		{"show me what's in the directory", AgentLibrarian},
		{"find the seed about memory", AgentLibrarian},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			intent, err := s.ClassifyIntent(ctx, tt.query)
			if err != nil {
				t.Fatalf("ClassifyIntent failed: %v", err)
			}
			if intent.Type != tt.expected {
				t.Errorf("Expected %s, got %s (reasoning: %s)", 
					tt.expected, intent.Type, intent.Reasoning)
			}
		})
	}
}

func TestClassifyIntent_Builder(t *testing.T) {
	s := NewSupervisor()
	ctx := context.Background()

	tests := []struct {
		query    string
		expected AgentType
	}{
		{"generate a Python script to parse JSON", AgentBuilder},
		{"create a function that calculates fibonacci", AgentBuilder},
		{"write code to implement a binary search", AgentBuilder},
		{"build a REST API endpoint", AgentBuilder},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			intent, err := s.ClassifyIntent(ctx, tt.query)
			if err != nil {
				t.Fatalf("ClassifyIntent failed: %v", err)
			}
			if intent.Type != tt.expected {
				t.Errorf("Expected %s, got %s (reasoning: %s)", 
					tt.expected, intent.Type, intent.Reasoning)
			}
		})
	}
}

func TestClassifyIntent_Dojo(t *testing.T) {
	s := NewSupervisor()
	ctx := context.Background()

	tests := []struct {
		query    string
		expected AgentType
	}{
		{"what do you think about this approach?", AgentDojo},
		{"help me think through this problem", AgentDojo},
		{"give me some perspectives on this idea", AgentDojo},
		{"what are my options here?", AgentDojo},
		{"hello, how are you?", AgentDojo}, // Default to Dojo
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			intent, err := s.ClassifyIntent(ctx, tt.query)
			if err != nil {
				t.Fatalf("ClassifyIntent failed: %v", err)
			}
			if intent.Type != tt.expected {
				t.Errorf("Expected %s, got %s (reasoning: %s)", 
					tt.expected, intent.Type, intent.Reasoning)
			}
		})
	}
}

func TestRoute(t *testing.T) {
	s := NewSupervisor()
	ctx := context.Background()

	intent := &Intent{
		Type:       AgentDojo,
		Confidence: 0.8,
		Reasoning:  "Test intent",
	}

	response, err := s.Route(ctx, intent, "test query")
	if err != nil {
		t.Fatalf("Route failed: %v", err)
	}

	if response == "" {
		t.Error("Expected non-empty response")
	}
}
