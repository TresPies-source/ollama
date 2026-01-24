package api

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/TresPies-source/dgd/database"
	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v3"
)

type SessionMetadata struct {
	ID         string    `yaml:"id"`
	Title      string    `yaml:"title"`
	WorkingDir string    `yaml:"working_dir"`
	CreatedAt  time.Time `yaml:"created_at"`
	UpdatedAt  time.Time `yaml:"updated_at"`
	Status     string    `yaml:"status"`
	ExportedAt time.Time `yaml:"exported_at"`
	Version    string    `yaml:"version"`
}

type ExportMessage struct {
	Role             string    `yaml:"role"`
	Content          string    `yaml:"content"`
	CreatedAt        time.Time `yaml:"created_at"`
	AgentType        string    `yaml:"agent_type,omitempty"`
	Mode             string    `yaml:"mode,omitempty"`
	PromptTokens     int       `yaml:"prompt_tokens,omitempty"`
	CompletionTokens int       `yaml:"completion_tokens,omitempty"`
}

func (s *Server) ExportSessionHandler(c *gin.Context) {
	sessionID := c.Param("id")

	session, err := s.db.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: fmt.Sprintf("session not found: %s", sessionID)})
		return
	}

	messages, err := s.db.ListMessages(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: fmt.Sprintf("failed to get messages: %v", err)})
		return
	}

	markdown, err := formatSessionMarkdown(session, messages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: fmt.Sprintf("failed to format markdown: %v", err)})
		return
	}

	filename := fmt.Sprintf("session_%s_%s.md", sanitizeFilename(session.Title), time.Now().Format("20060102_150405"))

	c.Header("Content-Type", "text/markdown; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.String(http.StatusOK, markdown)
}

func formatSessionMarkdown(session *database.Session, messages []database.Message) (string, error) {
	metadata := SessionMetadata{
		ID:         session.ID,
		Title:      session.Title,
		WorkingDir: session.WorkingDir,
		CreatedAt:  session.CreatedAt,
		UpdatedAt:  session.UpdatedAt,
		Status:     session.Status,
		ExportedAt: time.Now(),
		Version:    "1.0",
	}

	yamlBytes, err := yaml.Marshal(metadata)
	if err != nil {
		return "", fmt.Errorf("failed to marshal metadata: %w", err)
	}

	var sb strings.Builder
	sb.WriteString("---\n")
	sb.Write(yamlBytes)
	sb.WriteString("---\n\n")
	sb.WriteString(fmt.Sprintf("# %s\n\n", session.Title))

	if len(messages) == 0 {
		sb.WriteString("*No messages in this session*\n")
	} else {
		for i, msg := range messages {
			exportMsg := ExportMessage{
				Role:             msg.Role,
				Content:          msg.Content,
				CreatedAt:        msg.CreatedAt,
				AgentType:        msg.AgentType,
				Mode:             msg.Mode,
				PromptTokens:     msg.PromptTokens,
				CompletionTokens: msg.CompletionTokens,
			}

			msgYaml, err := yaml.Marshal(exportMsg)
			if err != nil {
				return "", fmt.Errorf("failed to marshal message %d: %w", i, err)
			}

			sb.WriteString("---\n")
			sb.Write(msgYaml)
			sb.WriteString("---\n\n")
		}
	}

	return sb.String(), nil
}

func sanitizeFilename(filename string) string {
	replacer := strings.NewReplacer(
		"/", "_",
		"\\", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
		" ", "_",
	)
	sanitized := replacer.Replace(filename)
	if len(sanitized) > 50 {
		sanitized = sanitized[:50]
	}
	if sanitized == "" {
		sanitized = "session"
	}
	return sanitized
}
