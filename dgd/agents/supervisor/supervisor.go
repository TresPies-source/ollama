package supervisor

import (
	"context"
	"fmt"
	"strings"
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
	// Future: Add LLM client for intelligent classification
}

// NewSupervisor creates a new Supervisor instance
func NewSupervisor() *Supervisor {
	return &Supervisor{}
}

// ClassifyIntent analyzes the user query and determines which agent should handle it
func (s *Supervisor) ClassifyIntent(ctx context.Context, query string) (*Intent, error) {
	// Phase 1: Simple keyword-based classification
	// Phase 2: Upgrade to LLM-based classification
	
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
