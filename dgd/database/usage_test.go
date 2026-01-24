package database

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestGetUsageStats(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create test session
	session := &Session{
		ID:         "session-1",
		Title:      "Test Session",
		WorkingDir: "/tmp",
		Status:     "active",
	}
	if err := db.CreateSession(session); err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}

	// Create test messages with token counts
	messages := []Message{
		{
			ID:               "msg-1",
			SessionID:        "session-1",
			Role:             "user",
			Content:          "Hello",
			PromptTokens:     0,
			CompletionTokens: 0,
		},
		{
			ID:               "msg-2",
			SessionID:        "session-1",
			Role:             "assistant",
			Content:          "Hi there!",
			AgentType:        "dojo",
			PromptTokens:     100,
			CompletionTokens: 50,
		},
		{
			ID:               "msg-3",
			SessionID:        "session-1",
			Role:             "user",
			Content:          "How are you?",
			PromptTokens:     0,
			CompletionTokens: 0,
		},
		{
			ID:               "msg-4",
			SessionID:        "session-1",
			Role:             "assistant",
			Content:          "I'm doing well!",
			AgentType:        "dojo",
			PromptTokens:     120,
			CompletionTokens: 30,
		},
	}

	for _, msg := range messages {
		if err := db.CreateMessage(&msg); err != nil {
			t.Fatalf("Failed to create message: %v", err)
		}
	}

	// Get usage stats
	stats, err := db.GetUsageStats()
	if err != nil {
		t.Fatalf("Failed to get usage stats: %v", err)
	}

	// Verify total statistics
	expectedPromptTokens := 220
	expectedCompletionTokens := 80
	expectedTotalTokens := 300

	if stats.TotalPromptTokens != expectedPromptTokens {
		t.Errorf("Expected TotalPromptTokens %d, got %d", expectedPromptTokens, stats.TotalPromptTokens)
	}

	if stats.TotalCompletionTokens != expectedCompletionTokens {
		t.Errorf("Expected TotalCompletionTokens %d, got %d", expectedCompletionTokens, stats.TotalCompletionTokens)
	}

	if stats.TotalTokens != expectedTotalTokens {
		t.Errorf("Expected TotalTokens %d, got %d", expectedTotalTokens, stats.TotalTokens)
	}

	if stats.TotalMessages != 2 {
		t.Errorf("Expected TotalMessages 2 (only assistant messages), got %d", stats.TotalMessages)
	}

	// Verify usage by model
	if len(stats.UsageByModel) == 0 {
		t.Error("Expected at least one model in UsageByModel")
	} else {
		modelUsage := stats.UsageByModel[0]
		if modelUsage.Model != "dojo" {
			t.Errorf("Expected model 'dojo', got '%s'", modelUsage.Model)
		}
		if modelUsage.TotalTokens != expectedTotalTokens {
			t.Errorf("Expected model total tokens %d, got %d", expectedTotalTokens, modelUsage.TotalTokens)
		}
	}

	// Verify usage by session
	if len(stats.UsageBySessions) == 0 {
		t.Error("Expected at least one session in UsageBySessions")
	} else {
		sessionUsage := stats.UsageBySessions[0]
		if sessionUsage.SessionID != "session-1" {
			t.Errorf("Expected session ID 'session-1', got '%s'", sessionUsage.SessionID)
		}
		if sessionUsage.TotalTokens != expectedTotalTokens {
			t.Errorf("Expected session total tokens %d, got %d", expectedTotalTokens, sessionUsage.TotalTokens)
		}
	}
}

func TestGetSessionUsage(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create test session
	session := &Session{
		ID:         "session-1",
		Title:      "Test Session",
		WorkingDir: "/tmp",
		Status:     "active",
	}
	if err := db.CreateSession(session); err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}

	// Create test messages
	messages := []Message{
		{
			ID:               "msg-1",
			SessionID:        "session-1",
			Role:             "assistant",
			Content:          "Response 1",
			AgentType:        "dojo",
			PromptTokens:     100,
			CompletionTokens: 50,
		},
		{
			ID:               "msg-2",
			SessionID:        "session-1",
			Role:             "assistant",
			Content:          "Response 2",
			AgentType:        "builder",
			PromptTokens:     200,
			CompletionTokens: 100,
		},
	}

	for _, msg := range messages {
		if err := db.CreateMessage(&msg); err != nil {
			t.Fatalf("Failed to create message: %v", err)
		}
	}

	// Get session usage
	usage, err := db.GetSessionUsage("session-1")
	if err != nil {
		t.Fatalf("Failed to get session usage: %v", err)
	}

	// Verify usage
	expectedPromptTokens := 300
	expectedCompletionTokens := 150
	expectedTotalTokens := 450

	if usage.PromptTokens != expectedPromptTokens {
		t.Errorf("Expected PromptTokens %d, got %d", expectedPromptTokens, usage.PromptTokens)
	}

	if usage.CompletionTokens != expectedCompletionTokens {
		t.Errorf("Expected CompletionTokens %d, got %d", expectedCompletionTokens, usage.CompletionTokens)
	}

	if usage.TotalTokens != expectedTotalTokens {
		t.Errorf("Expected TotalTokens %d, got %d", expectedTotalTokens, usage.TotalTokens)
	}

	if usage.MessageCount != 2 {
		t.Errorf("Expected MessageCount 2, got %d", usage.MessageCount)
	}
}

func TestCalculateCost(t *testing.T) {
	tests := []struct {
		name             string
		model            string
		promptTokens     int
		completionTokens int
		expectedCost     float64
	}{
		{
			name:             "GPT-4o",
			model:            "gpt-4o",
			promptTokens:     1000000,
			completionTokens: 1000000,
			expectedCost:     12.50,
		},
		{
			name:             "GPT-4o-mini",
			model:            "gpt-4o-mini",
			promptTokens:     1000000,
			completionTokens: 1000000,
			expectedCost:     0.75,
		},
		{
			name:             "Local model (Ollama)",
			model:            "llama3.2:3b",
			promptTokens:     1000000,
			completionTokens: 1000000,
			expectedCost:     0.0,
		},
		{
			name:             "Unknown model",
			model:            "unknown",
			promptTokens:     1000000,
			completionTokens: 1000000,
			expectedCost:     0.0,
		},
		{
			name:             "Claude 3.5 Sonnet",
			model:            "claude-3-5-sonnet",
			promptTokens:     1000000,
			completionTokens: 1000000,
			expectedCost:     18.00,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cost := calculateCost(tt.model, tt.promptTokens, tt.completionTokens)
			if cost != tt.expectedCost {
				t.Errorf("Expected cost %.2f, got %.2f", tt.expectedCost, cost)
			}
		})
	}
}

func TestGetUsageByDateRange(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create test session
	session := &Session{
		ID:         "session-1",
		Title:      "Test Session",
		WorkingDir: "/tmp",
		Status:     "active",
	}
	if err := db.CreateSession(session); err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}

	// Create messages with different dates (manually set created_at)
	// Note: This is a simplified test; in production, you'd use actual time manipulation
	messages := []Message{
		{
			ID:               "msg-1",
			SessionID:        "session-1",
			Role:             "assistant",
			Content:          "Day 1",
			AgentType:        "dojo",
			PromptTokens:     100,
			CompletionTokens: 50,
		},
		{
			ID:               "msg-2",
			SessionID:        "session-1",
			Role:             "assistant",
			Content:          "Day 2",
			AgentType:        "dojo",
			PromptTokens:     200,
			CompletionTokens: 100,
		},
	}

	for _, msg := range messages {
		if err := db.CreateMessage(&msg); err != nil {
			t.Fatalf("Failed to create message: %v", err)
		}
	}

	// Get usage by date range (last 30 days)
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)

	usage, err := db.GetUsageByDateRange(startDate, endDate)
	if err != nil {
		t.Fatalf("Failed to get usage by date range: %v", err)
	}

	// Verify we got some results
	if len(usage) == 0 {
		t.Error("Expected at least one day in usage")
	}
}

func TestMain(m *testing.M) {
	// Run tests
	code := m.Run()
	os.Exit(code)
}
