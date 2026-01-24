package api

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/TresPies-source/dgd/agents/builder"
	"github.com/TresPies-source/dgd/agents/dojo"
	"github.com/TresPies-source/dgd/agents/librarian"
	"github.com/TresPies-source/dgd/agents/supervisor"
	"github.com/TresPies-source/dgd/database"
	"github.com/TresPies-source/dgd/llm"
	"github.com/TresPies-source/dgd/tools"
	"github.com/TresPies-source/dgd/trace"
	"github.com/TresPies-source/dgd/version"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Server represents the API server
type Server struct {
	db           *database.DB
	supervisor   *supervisor.Supervisor
	dojoAgent    *dojo.Dojo
	builderAgent *builder.Builder
	llmClient    llm.Client
	tracer       *trace.Tracer
}

// NewServer creates a new API server
func NewServer(db *database.DB) *Server {
	return &Server{
		db:         db,
		supervisor: supervisor.NewSupervisor(),
		tracer:     trace.NewTracer(),
	}
}

// NewServerWithLLM creates a new API server with LLM integration
func NewServerWithLLM(db *database.DB, llmClient llm.Client, model string) *Server {
	// Create tool registry
	homeDir, _ := os.UserHomeDir()
	workingDir := filepath.Join(homeDir, "projects")
	registry := tools.InitRegistry(workingDir)

	return &Server{
		db:           db,
		supervisor:   supervisor.NewSupervisorWithLLM(llmClient, model),
		dojoAgent:    dojo.NewDojo(llmClient, model),
		builderAgent: builder.NewBuilder(llmClient, model, registry),
		llmClient:    llmClient,
		tracer:       trace.NewTracer(),
	}
}

// ChatHandler handles chat requests
func (s *Server) ChatHandler(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Get session from database
	session, err := s.db.GetSession(req.SessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: fmt.Sprintf("session not found: %s", req.SessionID)})
		return
	}

	// Start trace
	tr := s.tracer.StartTrace(req.SessionID)
	ctx := trace.WithTrace(c.Request.Context(), tr)

	// Save user message to database
	userMessageID := uuid.New().String()
	userMessage := &database.Message{
		ID:        userMessageID,
		SessionID: req.SessionID,
		Role:      "user",
		Content:   req.Message,
	}
	if err := s.db.CreateMessage(userMessage); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// Classify intent
	trace.LogEvent(ctx, trace.EventAgentRouting, map[string]interface{}{
		"query": req.Message,
	}, nil, nil)

	intent, err := s.supervisor.ClassifyIntent(ctx, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	trace.LogEvent(ctx, trace.EventAgentRouting, nil, map[string]interface{}{
		"agent_type": string(intent.Type),
		"confidence": intent.Confidence,
	}, nil)

	// Route to appropriate agent
	var response string
	var agentType string
	var mode string
	var promptTokens int
	var completionTokens int

	switch intent.Type {
	case supervisor.AgentDojo:
		response, mode, promptTokens, completionTokens, err = s.handleDojoQuery(ctx, req.Message, req.Perspectives)
		agentType = "dojo"
	case supervisor.AgentLibrarian:
		response, promptTokens, completionTokens, err = s.handleLibrarianQuery(c, session, req.Message)
		agentType = "librarian"
	case supervisor.AgentBuilder:
		response, promptTokens, completionTokens, err = s.handleBuilderQuery(ctx, session, req.Message)
		agentType = "builder"
	default:
		response = fmt.Sprintf("[Unknown Agent] Cannot process query: %s", req.Message)
		agentType = "unknown"
	}

	if err != nil {
		trace.LogEvent(ctx, trace.EventError, nil, nil, map[string]interface{}{
			"error": err.Error(),
		})
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// Save assistant message to database
	assistantMessageID := uuid.New().String()
	assistantMessage := &database.Message{
		ID:               assistantMessageID,
		SessionID:        req.SessionID,
		Role:             "assistant",
		Content:          response,
		AgentType:        agentType,
		Mode:             mode,
		PromptTokens:     promptTokens,
		CompletionTokens: completionTokens,
	}
	if err := s.db.CreateMessage(assistantMessage); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// End trace
	s.tracer.EndTrace(req.SessionID)

	// Return response
	c.JSON(http.StatusOK, ChatResponse{
		SessionID: req.SessionID,
		MessageID: assistantMessageID,
		Content:   response,
		AgentType: agentType,
		Mode:      mode,
		Done:      true,
	})
}

// handleDojoQuery handles queries routed to the Dojo agent
func (s *Server) handleDojoQuery(ctx context.Context, query string, perspectives []string) (string, string, int, int, error) {
	// If no Dojo agent is configured, return placeholder
	if s.dojoAgent == nil {
		return fmt.Sprintf("[Dojo Agent] Processing query: %s", query), "", 0, 0, nil
	}

	trace.LogEvent(ctx, trace.EventPerspectiveIntegration, map[string]interface{}{
		"query":        query,
		"perspectives": perspectives,
	}, nil, nil)

	// Call Dojo agent
	dojoReq := &dojo.Request{
		Query:        query,
		Perspectives: perspectives,
	}

	dojoResp, err := s.dojoAgent.Process(ctx, dojoReq)
	if err != nil {
		return "", "", 0, 0, fmt.Errorf("dojo agent error: %w", err)
	}

	trace.LogEvent(ctx, trace.EventModeTransition, nil, map[string]interface{}{
		"mode":    string(dojoResp.Mode),
		"content": dojoResp.Content,
	}, nil)

	return dojoResp.Content, string(dojoResp.Mode), dojoResp.PromptTokens, dojoResp.CompletionTokens, nil
}

// handleLibrarianQuery handles queries routed to the Librarian agent
// Returns: (response, promptTokens, completionTokens, error)
// Note: Librarian doesn't use LLM, so tokens are always 0
func (s *Server) handleLibrarianQuery(c *gin.Context, session *database.Session, query string) (string, int, int, error) {
	// Get user home directory for seeds
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", 0, 0, fmt.Errorf("failed to get home directory: %w", err)
	}
	seedsDir := filepath.Join(homeDir, ".dgd", "seeds")

	// Create Librarian instance
	lib := librarian.NewLibrarian(session.WorkingDir, seedsDir)

	// Determine the type of Librarian query
	queryLower := strings.ToLower(query)

	if containsAny(queryLower, []string{"search", "find", "list"}) {
		// File search query
		results, err := lib.SearchFiles(c.Request.Context(), "*")
		if err != nil {
			return "", 0, 0, err
		}

		if len(results) == 0 {
			return "No files found in the working directory.", 0, 0, nil
		}

		response := fmt.Sprintf("Found %d files:\n", len(results))
		for i, result := range results {
			if i >= 10 {
				response += fmt.Sprintf("... and %d more\n", len(results)-10)
				break
			}
			response += fmt.Sprintf("- %s (%d bytes)\n", result.Path, result.SizeBytes)
		}
		return response, 0, 0, nil

	} else if containsAny(queryLower, []string{"read", "show", "display"}) {
		// File read query - extract filename from query
		// This is a simple implementation; can be improved with NLP
		return "File reading functionality will be implemented in the next iteration.", 0, 0, nil

	} else if containsAny(queryLower, []string{"seed", "knowledge"}) {
		// Seed retrieval query
		seeds, err := lib.ListSeeds(c.Request.Context())
		if err != nil {
			return "", 0, 0, err
		}

		if len(seeds) == 0 {
			return "No seeds found. Seeds should be placed in ~/.dgd/seeds/", 0, 0, nil
		}

		response := fmt.Sprintf("Found %d seeds:\n", len(seeds))
		for i, seed := range seeds {
			if i >= 10 {
				response += fmt.Sprintf("... and %d more\n", len(seeds)-10)
				break
			}
			response += fmt.Sprintf("- %s: %s\n", seed.Metadata.Name, seed.Metadata.Description)
		}
		return response, 0, 0, nil
	}

	return fmt.Sprintf("[Librarian Agent] Processing query: %s", query), 0, 0, nil
}

// handleBuilderQuery handles queries routed to the Builder agent
func (s *Server) handleBuilderQuery(ctx context.Context, session *database.Session, query string) (string, int, int, error) {
	if s.builderAgent == nil {
		return "[Builder Agent] Not yet implemented. Coming soon!", 0, 0, nil
	}

	trace.LogEvent(ctx, trace.EventToolInvocation, map[string]interface{}{
		"query":       query,
		"working_dir": session.WorkingDir,
	}, nil, nil)

	// Call Builder agent
	builderReq := &builder.Request{
		Query:      query,
		WorkingDir: session.WorkingDir,
	}

	builderResp, err := s.builderAgent.Process(ctx, builderReq)
	if err != nil {
		return "", 0, 0, fmt.Errorf("builder agent error: %w", err)
	}

	trace.LogEvent(ctx, trace.EventToolInvocation, nil, map[string]interface{}{
		"tools_used":    builderResp.ToolsUsed,
		"files_created": builderResp.FilesCreated,
		"success":       builderResp.Success,
	}, nil)

	return builderResp.Content, builderResp.PromptTokens, builderResp.CompletionTokens, nil
}

// GetTraceHandler returns the trace for a session
func (s *Server) GetTraceHandler(c *gin.Context) {
	sessionID := c.Param("id")

	tr, err := s.tracer.GetTrace(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, tr)
}

// CreateSessionHandler handles session creation
func (s *Server) CreateSessionHandler(c *gin.Context) {
	var req SessionCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	sessionID := uuid.New().String()

	session := &database.Session{
		ID:         sessionID,
		Title:      req.Title,
		WorkingDir: req.WorkingDir,
		Status:     "active",
	}

	if err := s.db.CreateSession(session); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, SessionCreateResponse{
		SessionID: sessionID,
	})
}

// ListSessionsHandler handles listing sessions
func (s *Server) ListSessionsHandler(c *gin.Context) {
	sessions, err := s.db.ListSessions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// Convert database.Session to api.Session
	apiSessions := make([]Session, len(sessions))
	for i, sess := range sessions {
		apiSessions[i] = Session{
			ID:         sess.ID,
			Title:      sess.Title,
			WorkingDir: sess.WorkingDir,
			CreatedAt:  sess.CreatedAt.Format("2006-01-02T15:04:05Z"),
			UpdatedAt:  sess.UpdatedAt.Format("2006-01-02T15:04:05Z"),
			Status:     sess.Status,
		}
	}

	c.JSON(http.StatusOK, SessionListResponse{
		Sessions: apiSessions,
	})
}

// GetSessionHandler handles retrieving a single session
func (s *Server) GetSessionHandler(c *gin.Context) {
	sessionID := c.Param("id")

	session, err := s.db.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: err.Error()})
		return
	}

	messages, err := s.db.ListMessages(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// Convert to API types
	apiMessages := make([]Message, len(messages))
	for i, msg := range messages {
		apiMessages[i] = Message{
			ID:        msg.ID,
			SessionID: msg.SessionID,
			Role:      msg.Role,
			Content:   msg.Content,
			CreatedAt: msg.CreatedAt.Format("2006-01-02T15:04:05Z"),
			AgentType: msg.AgentType,
			Mode:      msg.Mode,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"session": Session{
			ID:         session.ID,
			Title:      session.Title,
			WorkingDir: session.WorkingDir,
			CreatedAt:  session.CreatedAt.Format("2006-01-02T15:04:05Z"),
			UpdatedAt:  session.UpdatedAt.Format("2006-01-02T15:04:05Z"),
			Status:     session.Status,
		},
		"messages": apiMessages,
	})
}

// DeleteSessionHandler handles session deletion
func (s *Server) DeleteSessionHandler(c *gin.Context) {
	sessionID := c.Param("id")

	err := s.db.DeleteSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: fmt.Sprintf("session not found: %s", sessionID)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "session deleted successfully",
	})
}

// HealthHandler handles health check requests
func (s *Server) HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"version": version.Version,
	})
}

// OllamaVersionHandler provides a stub for Ollama WebUI compatibility
func (s *Server) OllamaVersionHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"version": version.Version,
	})
}

// OllamaTagsHandler provides a stub for Ollama WebUI compatibility
func (s *Server) OllamaTagsHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"models": []interface{}{},
	})
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
