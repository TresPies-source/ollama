package supervisor

import (
	"context"
	"fmt"
	"strings"

	"github.com/TresPies-source/dgd/llm"
)

// AgentType represents the type of agent to route to
type AgentType string

const (
	AgentDojo      AgentType = "dojo"
	AgentLibrarian AgentType = "librarian"
	AgentBuilder   AgentType = "builder"
)

// Intent represents the classified user intent
type Intent struct {
	Type       AgentType
	Confidence float64
	Reasoning  string
}

// Supervisor handles intent classification and routing
type Supervisor struct {
	llmClient llm.Client
	model     string
	useLLM    bool // If false, use keyword-based classification
}

// NewSupervisor creates a new Supervisor instance
func NewSupervisor() *Supervisor {
	return &Supervisor{
		useLLM: false, // Default to keyword-based for backward compatibility
	}
}

// NewSupervisorWithLLM creates a new Supervisor with LLM-based classification
func NewSupervisorWithLLM(llmClient llm.Client, model string) *Supervisor {
	return &Supervisor{
		llmClient: llmClient,
		model:     model,
		useLLM:    true,
	}
}

// ClassifyIntent analyzes the user query and determines which agent should handle it
func (s *Supervisor) ClassifyIntent(ctx context.Context, query string) (*Intent, error) {
	if s.useLLM && s.llmClient != nil {
		return s.classifyWithLLM(ctx, query)
	}
	return s.classifyWithKeywords(query)
}

// classifyWithLLM uses an LLM to classify the intent
func (s *Supervisor) classifyWithLLM(ctx context.Context, query string) (*Intent, error) {
	systemPrompt := `You are a routing agent that classifies user queries into one of three categories:

1. **dojo**: Thinking partnership, advice, perspectives, options, feedback
   - Examples: "What do you think about this?", "Help me think through this", "What are my options?"

2. **librarian**: File operations, search, retrieval, knowledge seeds
   - Examples: "Find all markdown files", "Read README.md", "List seeds about memory"

3. **builder**: Code generation, execution, implementation
   - Examples: "Generate a Python script", "Create a function", "Build a REST API"

Respond ONLY with a JSON object in this exact format:
{
  "agent": "dojo|librarian|builder",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`

	llmReq := &llm.CompletionRequest{
		Model: s.model,
		Messages: []llm.Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: query},
		},
		Temperature: 0.3, // Low temperature for consistent classification
	}

	llmResp, err := s.llmClient.Complete(ctx, llmReq)
	if err != nil {
		// Fallback to keyword-based classification on error
		return s.classifyWithKeywords(query)
	}

	// Parse JSON response
	var result struct {
		Agent      string  `json:"agent"`
		Confidence float64 `json:"confidence"`
		Reasoning  string  `json:"reasoning"`
	}

	// Simple JSON parsing (in production, use encoding/json)
	content := strings.TrimSpace(llmResp.Content)
	if strings.Contains(content, "\"agent\"") {
		if strings.Contains(content, "\"librarian\"") {
			result.Agent = "librarian"
		} else if strings.Contains(content, "\"builder\"") {
			result.Agent = "builder"
		} else {
			result.Agent = "dojo"
		}

		// Extract confidence (simple heuristic)
		if strings.Contains(content, "0.9") || strings.Contains(content, "0.8") {
			result.Confidence = 0.9
		} else if strings.Contains(content, "0.7") || strings.Contains(content, "0.6") {
			result.Confidence = 0.7
		} else {
			result.Confidence = 0.5
		}

		// Extract reasoning
		reasoningStart := strings.Index(content, "\"reasoning\":")
		if reasoningStart != -1 {
			reasoningStart += len("\"reasoning\":")
			reasoningEnd := strings.LastIndex(content, "\"")
			if reasoningEnd > reasoningStart {
				result.Reasoning = strings.Trim(content[reasoningStart:reasoningEnd], " \"")
			}
		}
	} else {
		// Fallback to keyword-based classification
		return s.classifyWithKeywords(query)
	}

	return &Intent{
		Type:       AgentType(result.Agent),
		Confidence: result.Confidence,
		Reasoning:  result.Reasoning,
	}, nil
}

// classifyWithKeywords uses keyword matching to classify the intent (Phase 1 implementation)
func (s *Supervisor) classifyWithKeywords(query string) (*Intent, error) {
	query = strings.ToLower(query)

	// Librarian keywords: file operations, search, retrieval
	librarianKeywords := []string{
		"read", "file", "search", "find", "retrieve", "seed",
		"show me", "what's in", "list", "directory",
	}

	// Builder keywords: code generation, execution
	builderKeywords := []string{
		"generate", "create", "build", "code", "execute", "run",
		"implement", "write code", "make a", "develop",
	}

	// Dojo keywords: thinking, perspectives, advice
	dojoKeywords := []string{
		"think", "perspective", "advice", "help me", "what do you think",
		"mirror", "scout", "routes", "options", "consider",
	}

	// Count keyword matches
	librarianScore := countKeywords(query, librarianKeywords)
	builderScore := countKeywords(query, builderKeywords)
	dojoScore := countKeywords(query, dojoKeywords)

	// Determine the best match
	maxScore := max(librarianScore, builderScore, dojoScore)

	if maxScore == 0 {
		// Default to Dojo for general conversation
		return &Intent{
			Type:       AgentDojo,
			Confidence: 0.5,
			Reasoning:  "No specific keywords detected, defaulting to Dojo for general thinking partnership",
		}, nil
	}

	var agentType AgentType
	var reasoning string

	switch maxScore {
	case librarianScore:
		agentType = AgentLibrarian
		reasoning = fmt.Sprintf("Detected file/search keywords (score: %d)", librarianScore)
	case builderScore:
		agentType = AgentBuilder
		reasoning = fmt.Sprintf("Detected code generation keywords (score: %d)", builderScore)
	case dojoScore:
		agentType = AgentDojo
		reasoning = fmt.Sprintf("Detected thinking/advice keywords (score: %d)", dojoScore)
	}

	confidence := float64(maxScore) / float64(len(strings.Fields(query)))
	if confidence > 1.0 {
		confidence = 1.0
	}

	return &Intent{
		Type:       agentType,
		Confidence: confidence,
		Reasoning:  reasoning,
	}, nil
}

// Route routes the query to the appropriate agent based on intent
func (s *Supervisor) Route(ctx context.Context, intent *Intent, query string) (string, error) {
	// This is a placeholder that will be replaced with actual agent calls
	switch intent.Type {
	case AgentDojo:
		return fmt.Sprintf("[Dojo Agent] Processing query: %s", query), nil
	case AgentLibrarian:
		return fmt.Sprintf("[Librarian Agent] Processing query: %s", query), nil
	case AgentBuilder:
		return fmt.Sprintf("[Builder Agent] Processing query: %s", query), nil
	default:
		return "", fmt.Errorf("unknown agent type: %s", intent.Type)
	}
}

// countKeywords counts how many keywords from the list appear in the query
func countKeywords(query string, keywords []string) int {
	count := 0
	for _, keyword := range keywords {
		if strings.Contains(query, keyword) {
			count++
		}
	}
	return count
}

// max returns the maximum of three integers
func max(a, b, c int) int {
	if a >= b && a >= c {
		return a
	}
	if b >= c {
		return b
	}
	return c
}
