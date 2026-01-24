package api

import (
	"testing"
	"time"

	"github.com/TresPies-source/dgd/database"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFormatSessionMarkdown(t *testing.T) {
	session := &database.Session{
		ID:         "test-session-id",
		Title:      "Test Session",
		WorkingDir: "/home/user/project",
		Status:     "active",
		CreatedAt:  time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
		UpdatedAt:  time.Date(2024, 1, 1, 13, 0, 0, 0, time.UTC),
	}

	messages := []database.Message{
		{
			ID:        "msg-1",
			SessionID: "test-session-id",
			Role:      "user",
			Content:   "Hello, world!",
			CreatedAt: time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
		},
		{
			ID:               "msg-2",
			SessionID:        "test-session-id",
			Role:             "assistant",
			Content:          "Hi there! How can I help you?",
			CreatedAt:        time.Date(2024, 1, 1, 12, 0, 5, 0, time.UTC),
			AgentType:        "dojo",
			Mode:             "oracle",
			PromptTokens:     10,
			CompletionTokens: 15,
		},
	}

	markdown, err := formatSessionMarkdown(session, messages)
	require.NoError(t, err)

	assert.Contains(t, markdown, "---")
	assert.Contains(t, markdown, "id: test-session-id")
	assert.Contains(t, markdown, "title: Test Session")
	assert.Contains(t, markdown, "working_dir: /home/user/project")
	assert.Contains(t, markdown, "version: \"1.0\"")
	
	assert.Contains(t, markdown, "# Test Session")
	
	assert.Contains(t, markdown, "role: user")
	assert.Contains(t, markdown, "content: Hello, world!")
	
	assert.Contains(t, markdown, "role: assistant")
	assert.Contains(t, markdown, "content: Hi there! How can I help you?")
	assert.Contains(t, markdown, "agent_type: dojo")
	assert.Contains(t, markdown, "mode: oracle")
	assert.Contains(t, markdown, "prompt_tokens: 10")
	assert.Contains(t, markdown, "completion_tokens: 15")
}

func TestFormatSessionMarkdown_EmptyMessages(t *testing.T) {
	session := &database.Session{
		ID:         "test-session-id",
		Title:      "Empty Session",
		WorkingDir: "/home/user/project",
		Status:     "active",
		CreatedAt:  time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
		UpdatedAt:  time.Date(2024, 1, 1, 13, 0, 0, 0, time.UTC),
	}

	messages := []database.Message{}

	markdown, err := formatSessionMarkdown(session, messages)
	require.NoError(t, err)

	assert.Contains(t, markdown, "---")
	assert.Contains(t, markdown, "title: Empty Session")
	assert.Contains(t, markdown, "# Empty Session")
	assert.Contains(t, markdown, "*No messages in this session*")
}

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Simple Title", "Simple_Title"},
		{"Title/With\\Slashes", "Title_With_Slashes"},
		{"Title:With*Special?Chars", "Title_With_Special_Chars"},
		{"Title<With>Pipes|And\"Quotes", "Title_With_Pipes_And_Quotes"},
		{"", "session"},
		{"Very Long Title That Exceeds The Maximum Length Allowed For Filenames In This System", "Very_Long_Title_That_Exceeds_The_Maximum_Length_Al"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := sanitizeFilename(tt.input)
			assert.Equal(t, tt.expected, result)
			assert.LessOrEqual(t, len(result), 50)
		})
	}
}

func TestParseSessionMarkdown(t *testing.T) {
	markdown := `---
id: test-session-id
title: Test Session
working_dir: /home/user/project
created_at: 2024-01-01T12:00:00Z
updated_at: 2024-01-01T13:00:00Z
status: active
exported_at: 2024-01-01T14:00:00Z
version: "1.0"
---

# Test Session

---
role: user
content: Hello, world!
created_at: 2024-01-01T12:00:00Z
---

---
role: assistant
content: Hi there! How can I help you?
created_at: 2024-01-01T12:00:05Z
agent_type: dojo
mode: oracle
prompt_tokens: 10
completion_tokens: 15
---

`

	metadata, messages, err := parseSessionMarkdown(markdown)
	require.NoError(t, err)

	assert.Equal(t, "test-session-id", metadata.ID)
	assert.Equal(t, "Test Session", metadata.Title)
	assert.Equal(t, "/home/user/project", metadata.WorkingDir)
	assert.Equal(t, "active", metadata.Status)
	assert.Equal(t, "1.0", metadata.Version)

	require.Len(t, messages, 2)

	assert.Equal(t, "user", messages[0].Role)
	assert.Equal(t, "Hello, world!", messages[0].Content)

	assert.Equal(t, "assistant", messages[1].Role)
	assert.Equal(t, "Hi there! How can I help you?", messages[1].Content)
	assert.Equal(t, "dojo", messages[1].AgentType)
	assert.Equal(t, "oracle", messages[1].Mode)
	assert.Equal(t, 10, messages[1].PromptTokens)
	assert.Equal(t, 15, messages[1].CompletionTokens)
}

func TestParseSessionMarkdown_EmptyMessages(t *testing.T) {
	markdown := `---
id: test-session-id
title: Empty Session
working_dir: /home/user/project
created_at: 2024-01-01T12:00:00Z
updated_at: 2024-01-01T13:00:00Z
status: active
exported_at: 2024-01-01T14:00:00Z
version: "1.0"
---

# Empty Session

*No messages in this session*
`

	metadata, messages, err := parseSessionMarkdown(markdown)
	require.NoError(t, err)

	assert.Equal(t, "Empty Session", metadata.Title)
	assert.Empty(t, messages)
}

func TestParseSessionMarkdown_InvalidFormat(t *testing.T) {
	tests := []struct {
		name     string
		markdown string
	}{
		{
			name:     "Missing frontmatter",
			markdown: "# Session\n\nSome content",
		},
		{
			name:     "Invalid YAML",
			markdown: "---\ninvalid: yaml: content:\n---\n",
		},
		{
			name:     "Missing title",
			markdown: "---\nid: test\nworking_dir: /home\n---\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := parseSessionMarkdown(tt.markdown)
			assert.Error(t, err)
		})
	}
}

func TestExportImportRoundtrip(t *testing.T) {
	session := &database.Session{
		ID:         "test-session-id",
		Title:      "Roundtrip Test",
		WorkingDir: "/home/user/test",
		Status:     "active",
		CreatedAt:  time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
		UpdatedAt:  time.Date(2024, 1, 1, 13, 0, 0, 0, time.UTC),
	}

	messages := []database.Message{
		{
			ID:        "msg-1",
			SessionID: "test-session-id",
			Role:      "user",
			Content:   "Test message",
			CreatedAt: time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
		},
		{
			ID:               "msg-2",
			SessionID:        "test-session-id",
			Role:             "assistant",
			Content:          "Test response",
			CreatedAt:        time.Date(2024, 1, 1, 12, 0, 5, 0, time.UTC),
			AgentType:        "dojo",
			Mode:             "oracle",
			PromptTokens:     100,
			CompletionTokens: 150,
		},
	}

	markdown, err := formatSessionMarkdown(session, messages)
	require.NoError(t, err)

	metadata, parsedMessages, err := parseSessionMarkdown(markdown)
	require.NoError(t, err)

	assert.Equal(t, session.Title, metadata.Title)
	assert.Equal(t, session.WorkingDir, metadata.WorkingDir)
	assert.Equal(t, session.Status, metadata.Status)

	require.Len(t, parsedMessages, 2)
	assert.Equal(t, messages[0].Role, parsedMessages[0].Role)
	assert.Equal(t, messages[0].Content, parsedMessages[0].Content)
	assert.Equal(t, messages[1].Role, parsedMessages[1].Role)
	assert.Equal(t, messages[1].Content, parsedMessages[1].Content)
	assert.Equal(t, messages[1].AgentType, parsedMessages[1].AgentType)
	assert.Equal(t, messages[1].Mode, parsedMessages[1].Mode)
	assert.Equal(t, messages[1].PromptTokens, parsedMessages[1].PromptTokens)
	assert.Equal(t, messages[1].CompletionTokens, parsedMessages[1].CompletionTokens)
}
