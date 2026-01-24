package dojo

import (
	"context"
	"fmt"
	"strings"

	"github.com/TresPies-source/dgd/llm"
)

// Mode represents the Dojo agent's operating mode
type Mode string

const (
	ModeMirror         Mode = "mirror"
	ModeScout          Mode = "scout"
	ModeGardener       Mode = "gardener"
	ModeImplementation Mode = "implementation"
)

// Dojo implements the Dojo agent with four modes
type Dojo struct {
	llmClient llm.Client
	model     string
}

// NewDojo creates a new Dojo agent
func NewDojo(llmClient llm.Client, model string) *Dojo {
	return &Dojo{
		llmClient: llmClient,
		model:     model,
	}
}

// Request represents a request to the Dojo agent
type Request struct {
	Query        string   `json:"query"`
	Perspectives []string `json:"perspectives,omitempty"`
	Mode         Mode     `json:"mode,omitempty"`
}

// Response represents a response from the Dojo agent
type Response struct {
	Content          string `json:"content"`
	Mode             Mode   `json:"mode"`
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
}

// Process processes a request using the appropriate mode
func (d *Dojo) Process(ctx context.Context, req *Request) (*Response, error) {
	// Determine mode if not specified
	mode := req.Mode
	if mode == "" {
		mode = d.inferMode(req)
	}

	// Build system prompt based on mode
	systemPrompt := d.buildSystemPrompt(mode)

	// Build user prompt
	userPrompt := d.buildUserPrompt(req)

	// Call LLM
	llmReq := &llm.CompletionRequest{
		Model: d.model,
		Messages: []llm.Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: 0.7,
	}

	llmResp, err := d.llmClient.Complete(ctx, llmReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call LLM: %w", err)
	}

	return &Response{
		Content:          llmResp.Content,
		Mode:             mode,
		PromptTokens:     llmResp.PromptTokens,
		CompletionTokens: llmResp.CompletionTokens,
	}, nil
}

// inferMode infers the appropriate mode based on the request
func (d *Dojo) inferMode(req *Request) Mode {
	query := strings.ToLower(req.Query)

	// Mirror: User provides perspectives and wants synthesis
	if len(req.Perspectives) > 0 {
		return ModeMirror
	}

	// Scout: User asks for options, routes, alternatives
	if containsAny(query, []string{"options", "routes", "alternatives", "what should", "which way"}) {
		return ModeScout
	}

	// Implementation: User asks for concrete steps, plan, how-to
	if containsAny(query, []string{"how to", "steps", "plan", "implement", "build", "create"}) {
		return ModeImplementation
	}

	// Gardener: User asks for feedback, evaluation, improvement
	if containsAny(query, []string{"feedback", "improve", "better", "evaluate", "thoughts on"}) {
		return ModeGardener
	}

	// Default to Mirror for general thinking
	return ModeMirror
}

// buildSystemPrompt builds the system prompt based on mode
func (d *Dojo) buildSystemPrompt(mode Mode) string {
	basePrompt := `You are DOJO: a practice center for thinking with AI.

CORE PHILOSOPHY:
- Beginner's Mind: Approach every interaction fresh, free from accumulated expertise
- Self-Definition: Help users see their own thinking, not impose external frameworks
- Understanding is Love: The highest service is offering deep, non-judgmental understanding

COMPASSIONATE BOUNDARIES:
- Refuse to originate perspectives (user supplies them)
- Refuse to gamify thinking (no points, no leaderboards)
- Refuse to become an oracle (help user see, not decide for them)

`

	switch mode {
	case ModeMirror:
		return basePrompt + `MODE: MIRROR
Your role is to synthesize patterns across the user's perspectives.

OUTPUT FORMAT:
1. Pattern Summary (3-6 lines): What pattern do you see across these perspectives?
2. Assumptions/Tensions (1-3 items): What assumptions or tensions are present?
3. Reframes (1-2 items): Offer alternative ways to see the situation

Keep output compact. Use ordinary language. No mystical claims.`

	case ModeScout:
		return basePrompt + `MODE: SCOUT
Your role is to explore possible routes forward.

OUTPUT FORMAT:
1. Routes (2-4 options): Present distinct routes with clear tradeoffs
2. Recommendation: Suggest the "smallest test" step
3. What to Watch For: Key signals to monitor

Keep output practical. Focus on actionable next steps.`

	case ModeGardener:
		return basePrompt + `MODE: GARDENER
Your role is to cultivate ideas by highlighting strengths and growth areas.

OUTPUT FORMAT:
1. Strongest Ideas (2-3 items): What's working well and why
2. Growth Areas (1-2 items): What needs more development
3. Next Cultivation Step: One concrete action to strengthen the thinking

Keep output encouraging. Balance appreciation with honest feedback.`

	case ModeImplementation:
		return basePrompt + `MODE: IMPLEMENTATION
Your role is to provide a concrete action plan.

OUTPUT FORMAT:
1. Next Steps (1-5 steps): Specific, actionable steps in order
2. Success Criteria: How will you know it's working?
3. Potential Blockers: What might get in the way?

Keep output practical. Focus on immediate next actions.`

	default:
		return basePrompt + "Use your best judgment to help the user think clearly."
	}
}

// buildUserPrompt builds the user prompt from the request
func (d *Dojo) buildUserPrompt(req *Request) string {
	if len(req.Perspectives) == 0 {
		return req.Query
	}

	// Include perspectives in the prompt
	prompt := req.Query + "\n\nPerspectives:\n"
	for i, p := range req.Perspectives {
		prompt += fmt.Sprintf("%d. %s\n", i+1, p)
	}

	return prompt
}

// containsAny checks if the string contains any of the substrings
func containsAny(s string, substrs []string) bool {
	for _, substr := range substrs {
		if strings.Contains(s, substr) {
			return true
		}
	}
	return false
}
