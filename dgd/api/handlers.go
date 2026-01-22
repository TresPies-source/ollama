package api

import (
	"net/http"

	"github.com/TresPies-source/dgd/agents/supervisor"
	"github.com/TresPies-source/dgd/database"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Server represents the API server
type Server struct {
	db         *database.DB
	supervisor *supervisor.Supervisor
}

// NewServer creates a new API server
func NewServer(db *database.DB) *Server {
	return &Server{
		db:         db,
		supervisor: supervisor.NewSupervisor(),
	}
}

// ChatHandler handles chat requests
func (s *Server) ChatHandler(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Classify intent
	intent, err := s.supervisor.ClassifyIntent(c.Request.Context(), req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// Route to appropriate agent
	response, err := s.supervisor.Route(c.Request.Context(), intent, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	// Generate message ID
	messageID := uuid.New().String()

	// TODO: Save message to database

	// Return response
	c.JSON(http.StatusOK, ChatResponse{
		SessionID: req.SessionID,
		MessageID: messageID,
		Content:   response,
		AgentType: string(intent.Type),
		Done:      true,
	})
}

// CreateSessionHandler handles session creation
func (s *Server) CreateSessionHandler(c *gin.Context) {
	var req SessionCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	sessionID := uuid.New().String()

	// TODO: Save session to database

	c.JSON(http.StatusOK, SessionCreateResponse{
		SessionID: sessionID,
	})
}

// ListSessionsHandler handles listing sessions
func (s *Server) ListSessionsHandler(c *gin.Context) {
	// TODO: Retrieve sessions from database

	c.JSON(http.StatusOK, SessionListResponse{
		Sessions: []Session{},
	})
}

// HealthHandler handles health check requests
func (s *Server) HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"version": "0.0.1",
	})
}
