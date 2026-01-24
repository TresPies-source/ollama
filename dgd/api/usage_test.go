package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/TresPies-source/dgd/database"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestGetUsageHandler(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create server
	server := NewServer(db)

	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Test with empty database
	t.Run("EmptyDatabase", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/usage", server.GetUsageHandler)

		req := httptest.NewRequest(http.MethodGet, "/api/usage", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var stats database.UsageStats
		if err := json.NewDecoder(w.Body).Decode(&stats); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		if stats.TotalTokens != 0 {
			t.Errorf("Expected TotalTokens 0, got %d", stats.TotalTokens)
		}

		if stats.TotalMessages != 0 {
			t.Errorf("Expected TotalMessages 0, got %d", stats.TotalMessages)
		}

		if len(stats.UsageByModel) != 0 {
			t.Errorf("Expected empty UsageByModel, got %d items", len(stats.UsageByModel))
		}
	})

	// Test with actual data
	t.Run("WithData", func(t *testing.T) {
		// Create test session
		session := &database.Session{
			ID:         "test-session-1",
			Title:      "Test Session",
			WorkingDir: tmpDir,
			Status:     "active",
		}
		if err := db.CreateSession(session); err != nil {
			t.Fatalf("Failed to create session: %v", err)
		}

		// Create test messages with token counts
		messages := []database.Message{
			{
				ID:               "msg-1",
				SessionID:        "test-session-1",
				Role:             "assistant",
				Content:          "Response 1",
				AgentType:        "dojo",
				PromptTokens:     100,
				CompletionTokens: 50,
			},
			{
				ID:               "msg-2",
				SessionID:        "test-session-1",
				Role:             "assistant",
				Content:          "Response 2",
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

		router := gin.New()
		router.GET("/api/usage", server.GetUsageHandler)

		req := httptest.NewRequest(http.MethodGet, "/api/usage", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var stats database.UsageStats
		if err := json.NewDecoder(w.Body).Decode(&stats); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		expectedPromptTokens := 300
		expectedCompletionTokens := 150
		expectedTotalTokens := 450

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
			t.Errorf("Expected TotalMessages 2, got %d", stats.TotalMessages)
		}

		if len(stats.UsageByModel) == 0 {
			t.Error("Expected at least one model in UsageByModel")
		}
	})
}

func TestGetSessionUsageHandler(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create server
	server := NewServer(db)

	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create test session
	sessionID := uuid.New().String()
	session := &database.Session{
		ID:         sessionID,
		Title:      "Test Session",
		WorkingDir: tmpDir,
		Status:     "active",
	}
	if err := db.CreateSession(session); err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}

	// Test with session that has no messages
	t.Run("NoMessages", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/sessions/:id/usage", server.GetSessionUsageHandler)

		req := httptest.NewRequest(http.MethodGet, "/api/sessions/"+sessionID+"/usage", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Should return error because no assistant messages exist
		if w.Code != http.StatusInternalServerError {
			t.Errorf("Expected status 500, got %d", w.Code)
		}
	})

	// Test with session that has messages
	t.Run("WithMessages", func(t *testing.T) {
		// Create test messages
		messages := []database.Message{
			{
				ID:               "msg-1",
				SessionID:        sessionID,
				Role:             "assistant",
				Content:          "Response 1",
				AgentType:        "dojo",
				PromptTokens:     150,
				CompletionTokens: 75,
			},
			{
				ID:               "msg-2",
				SessionID:        sessionID,
				Role:             "assistant",
				Content:          "Response 2",
				AgentType:        "builder",
				PromptTokens:     250,
				CompletionTokens: 125,
			},
		}

		for _, msg := range messages {
			if err := db.CreateMessage(&msg); err != nil {
				t.Fatalf("Failed to create message: %v", err)
			}
		}

		router := gin.New()
		router.GET("/api/sessions/:id/usage", server.GetSessionUsageHandler)

		req := httptest.NewRequest(http.MethodGet, "/api/sessions/"+sessionID+"/usage", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
		}

		var usage database.SessionUsage
		if err := json.NewDecoder(w.Body).Decode(&usage); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		expectedPromptTokens := 400
		expectedCompletionTokens := 200
		expectedTotalTokens := 600

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

		if usage.SessionID != sessionID {
			t.Errorf("Expected SessionID %s, got %s", sessionID, usage.SessionID)
		}
	})

	// Test with invalid session ID
	t.Run("InvalidSessionID", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/sessions/:id/usage", server.GetSessionUsageHandler)

		invalidID := "nonexistent-session"
		req := httptest.NewRequest(http.MethodGet, "/api/sessions/"+invalidID+"/usage", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusInternalServerError {
			t.Errorf("Expected status 500 for invalid session, got %d", w.Code)
		}
	})
}

func TestMain(m *testing.M) {
	// Run tests
	code := m.Run()
	os.Exit(code)
}
