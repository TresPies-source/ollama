package api

// ChatRequest represents a chat request from the client
type ChatRequest struct {
	SessionID string    `json:"session_id"`
	Message   string    `json:"message"`
	Stream    *bool     `json:"stream,omitempty"`
}

// ChatResponse represents a chat response to the client
type ChatResponse struct {
	SessionID  string  `json:"session_id"`
	MessageID  string  `json:"message_id"`
	Content    string  `json:"content"`
	AgentType  string  `json:"agent_type"`
	Mode       string  `json:"mode,omitempty"`
	Done       bool    `json:"done"`
}

// SessionCreateRequest represents a request to create a new session
type SessionCreateRequest struct {
	Title      string `json:"title"`
	WorkingDir string `json:"working_dir"`
}

// SessionCreateResponse represents the response after creating a session
type SessionCreateResponse struct {
	SessionID string `json:"session_id"`
}

// SessionListResponse represents a list of sessions
type SessionListResponse struct {
	Sessions []Session `json:"sessions"`
}

// Session represents a chat session
type Session struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	WorkingDir string `json:"working_dir"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
	Status     string `json:"status"`
}

// Message represents a chat message
type Message struct {
	ID        string `json:"id"`
	SessionID string `json:"session_id"`
	Role      string `json:"role"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
	AgentType string `json:"agent_type,omitempty"`
	Mode      string `json:"mode,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}
