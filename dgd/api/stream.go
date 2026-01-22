package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/TresPies-source/dgd/agents/builder"
	"github.com/TresPies-source/dgd/agents/dojo"
	"github.com/TresPies-source/dgd/agents/librarian"
	"github.com/TresPies-source/dgd/agents/supervisor"
	"github.com/TresPies-source/dgd/database"
	"github.com/TresPies-source/dgd/llm"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// StreamChunk represents a single chunk of streamed response
type StreamChunk struct {
	Content   string `json:"content"`
	Done      bool   `json:"done"`
	AgentType string `json:"agent_type,omitempty"`
	Mode      string `json:"mode,omitempty"`
	Error     string `json:"error,omitempty"`
}

// ChatStreamHandler handles streaming chat requests
func (s *Server) ChatStreamHandler(c *gin.Context) {
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

	// Set headers for SSE
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")

	// Classify intent
	intent, err := s.supervisor.ClassifyIntent(c.Request.Context(), req.Message)
	if err != nil {
		sendStreamError(c, err.Error())
		return
	}

	// Stream response based on agent type
	var fullResponse string
	var agentType string
	var mode string

	switch intent.Type {
	case supervisor.AgentDojo:
		fullResponse, mode, err = s.streamDojoResponse(c, req.Message, req.Perspectives)
		agentType = "dojo"
	case supervisor.AgentLibrarian:
		fullResponse, err = s.streamLibrarianResponse(c, session, req.Message)
		agentType = "librarian"
	case supervisor.AgentBuilder:
		fullResponse, err = s.streamBuilderResponse(c, session, req.Message)
		agentType = "builder"
	default:
		sendStreamError(c, "unknown agent type")
		return
	}

	if err != nil {
		sendStreamError(c, err.Error())
		return
	}

	// Send final chunk
	sendStreamChunk(c, StreamChunk{
		Content:   "",
		Done:      true,
		AgentType: agentType,
		Mode:      mode,
	})

	// Save assistant message to database
	assistantMessageID := uuid.New().String()
	assistantMessage := &database.Message{
		ID:        assistantMessageID,
		SessionID: req.SessionID,
		Role:      "assistant",
		Content:   fullResponse,
		AgentType: agentType,
		Mode:      mode,
	}
	s.db.CreateMessage(assistantMessage)
}

func (s *Server) streamDojoResponse(c *gin.Context, query string, perspectives []string) (string, string, error) {
	if s.dojoAgent == nil {
		// No streaming without LLM
		response := fmt.Sprintf("[Dojo Agent] Processing query: %s", query)
		sendStreamChunk(c, StreamChunk{Content: response, Done: false})
		return response, "", nil
	}

	// For now, use non-streaming (streaming requires LLM client support)
	dojoReq := &dojo.Request{
		Query:        query,
		Perspectives: perspectives,
	}

	dojoResp, err := s.dojoAgent.Process(c.Request.Context(), dojoReq)
	if err != nil {
		return "", "", err
	}

	// Send as single chunk (can be improved with actual streaming)
	sendStreamChunk(c, StreamChunk{
		Content:   dojoResp.Content,
		Done:      false,
		AgentType: "dojo",
		Mode:      string(dojoResp.Mode),
	})

	return dojoResp.Content, string(dojoResp.Mode), nil
}

func (s *Server) streamLibrarianResponse(c *gin.Context, session *database.Session, query string) (string, error) {
	// Librarian responses are typically fast, so send as single chunk
	response, err := s.handleLibrarianQuery(c, session, query)
	if err != nil {
		return "", err
	}

	sendStreamChunk(c, StreamChunk{
		Content:   response,
		Done:      false,
		AgentType: "librarian",
	})

	return response, nil
}

func (s *Server) streamBuilderResponse(c *gin.Context, session *database.Session, query string) (string, error) {
	if s.builderAgent == nil {
		response := "[Builder Agent] Not yet implemented. Coming soon!"
		sendStreamChunk(c, StreamChunk{Content: response, Done: false})
		return response, nil
	}

	// Call Builder agent
	builderReq := &builder.Request{
		Query:      query,
		WorkingDir: session.WorkingDir,
	}

	builderResp, err := s.builderAgent.Process(c.Request.Context(), builderReq)
	if err != nil {
		return "", err
	}

	// Send response as chunks (can be improved with actual streaming)
	sendStreamChunk(c, StreamChunk{
		Content:   builderResp.Content,
		Done:      false,
		AgentType: "builder",
	})

	return builderResp.Content, nil
}

func sendStreamChunk(c *gin.Context, chunk StreamChunk) {
	data, _ := json.Marshal(chunk)
	c.SSEvent("message", string(data))
	c.Writer.Flush()
}

func sendStreamError(c *gin.Context, errMsg string) {
	chunk := StreamChunk{
		Content: "",
		Done:    true,
		Error:   errMsg,
	}
	data, _ := json.Marshal(chunk)
	c.SSEvent("error", string(data))
	c.Writer.Flush()
}
