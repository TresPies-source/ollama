package api

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/TresPies-source/dgd/database"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gopkg.in/yaml.v3"
)

type ImportResponse struct {
	SessionID string `json:"session_id"`
	Message   string `json:"message"`
}

func (s *Server) ImportSessionHandler(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "no file provided or invalid file upload"})
		return
	}
	defer file.Close()

	if !strings.HasSuffix(header.Filename, ".md") && !strings.HasSuffix(header.Filename, ".markdown") {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "file must be a markdown file (.md or .markdown)"})
		return
	}

	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: fmt.Sprintf("failed to read file: %v", err)})
		return
	}

	if len(content) == 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "file is empty"})
		return
	}

	metadata, messages, err := parseSessionMarkdown(string(content))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: fmt.Sprintf("failed to parse markdown: %v", err)})
		return
	}

	newSessionID := uuid.New().String()

	session := &database.Session{
		ID:         newSessionID,
		Title:      metadata.Title,
		WorkingDir: metadata.WorkingDir,
		Status:     "active",
	}

	if err := s.db.CreateSession(session); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: fmt.Sprintf("failed to create session: %v", err)})
		return
	}

	for i, exportMsg := range messages {
		msg := &database.Message{
			ID:               uuid.New().String(),
			SessionID:        newSessionID,
			Role:             exportMsg.Role,
			Content:          exportMsg.Content,
			AgentType:        exportMsg.AgentType,
			Mode:             exportMsg.Mode,
			PromptTokens:     exportMsg.PromptTokens,
			CompletionTokens: exportMsg.CompletionTokens,
		}

		if err := s.db.CreateMessage(msg); err != nil {
			s.db.DeleteSession(newSessionID)
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: fmt.Sprintf("failed to create message %d: %v", i, err)})
			return
		}
	}

	c.JSON(http.StatusOK, ImportResponse{
		SessionID: newSessionID,
		Message:   fmt.Sprintf("Successfully imported session with %d messages", len(messages)),
	})
}

func parseSessionMarkdown(content string) (*SessionMetadata, []ExportMessage, error) {
	if !strings.HasPrefix(content, "---\n") {
		return nil, nil, fmt.Errorf("invalid format: missing YAML frontmatter")
	}

	parts := strings.SplitN(content, "---\n", 4)
	if len(parts) < 3 {
		return nil, nil, fmt.Errorf("invalid format: incomplete frontmatter")
	}

	var metadata SessionMetadata
	if err := yaml.Unmarshal([]byte(parts[1]), &metadata); err != nil {
		return nil, nil, fmt.Errorf("failed to parse metadata: %w", err)
	}

	if metadata.Title == "" {
		return nil, nil, fmt.Errorf("invalid metadata: title is required")
	}

	if len(parts) < 4 {
		return &metadata, []ExportMessage{}, nil
	}

	messagesSection := parts[3]

	if strings.TrimSpace(messagesSection) == "" || strings.Contains(messagesSection, "*No messages in this session*") {
		return &metadata, []ExportMessage{}, nil
	}

	var messages []ExportMessage

	decoder := yaml.NewDecoder(bytes.NewReader([]byte(messagesSection)))

	for {
		var msg ExportMessage
		err := decoder.Decode(&msg)
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		if msg.Role == "" || msg.Content == "" {
			continue
		}

		messages = append(messages, msg)
	}

	return &metadata, messages, nil
}
