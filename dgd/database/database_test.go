package database

import (
	"testing"

	"github.com/google/uuid"
)

func TestSessionCRUD(t *testing.T) {
	// Create temporary database
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test: Create session
	session := &Session{
		ID:         uuid.New().String(),
		Title:      "Test Session",
		WorkingDir: "/home/user/projects",
		Status:     "active",
	}

	err = db.CreateSession(session)
	if err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}

	// Test: Get session
	retrieved, err := db.GetSession(session.ID)
	if err != nil {
		t.Fatalf("GetSession failed: %v", err)
	}

	if retrieved.Title != session.Title {
		t.Errorf("Expected title %q, got %q", session.Title, retrieved.Title)
	}

	// Test: Update session
	retrieved.Title = "Updated Title"
	err = db.UpdateSession(retrieved)
	if err != nil {
		t.Fatalf("UpdateSession failed: %v", err)
	}

	updated, err := db.GetSession(session.ID)
	if err != nil {
		t.Fatalf("GetSession failed: %v", err)
	}

	if updated.Title != "Updated Title" {
		t.Errorf("Expected title %q, got %q", "Updated Title", updated.Title)
	}

	// Test: List sessions
	sessions, err := db.ListSessions()
	if err != nil {
		t.Fatalf("ListSessions failed: %v", err)
	}

	if len(sessions) != 1 {
		t.Errorf("Expected 1 session, got %d", len(sessions))
	}

	// Test: Delete session
	err = db.DeleteSession(session.ID)
	if err != nil {
		t.Fatalf("DeleteSession failed: %v", err)
	}

	// Verify deletion (status should be 'deleted')
	deleted, err := db.GetSession(session.ID)
	if err != nil {
		t.Fatalf("GetSession failed: %v", err)
	}

	if deleted.Status != "deleted" {
		t.Errorf("Expected status 'deleted', got %q", deleted.Status)
	}

	// Deleted sessions should not appear in list
	sessions, err = db.ListSessions()
	if err != nil {
		t.Fatalf("ListSessions failed: %v", err)
	}

	if len(sessions) != 0 {
		t.Errorf("Expected 0 active sessions, got %d", len(sessions))
	}
}

func TestMessageCRUD(t *testing.T) {
	// Create temporary database
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create a session first
	sessionID := uuid.New().String()
	session := &Session{
		ID:         sessionID,
		Title:      "Test Session",
		WorkingDir: "/home/user/projects",
		Status:     "active",
	}
	err = db.CreateSession(session)
	if err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}

	// Test: Create message
	message := &Message{
		ID:        uuid.New().String(),
		SessionID: sessionID,
		Role:      "user",
		Content:   "Hello, Dojo!",
		AgentType: "dojo",
		Mode:      "mirror",
	}

	err = db.CreateMessage(message)
	if err != nil {
		t.Fatalf("CreateMessage failed: %v", err)
	}

	// Test: Get message
	retrieved, err := db.GetMessage(message.ID)
	if err != nil {
		t.Fatalf("GetMessage failed: %v", err)
	}

	if retrieved.Content != message.Content {
		t.Errorf("Expected content %q, got %q", message.Content, retrieved.Content)
	}

	if retrieved.AgentType != message.AgentType {
		t.Errorf("Expected agent_type %q, got %q", message.AgentType, retrieved.AgentType)
	}

	// Test: List messages
	messages, err := db.ListMessages(sessionID)
	if err != nil {
		t.Fatalf("ListMessages failed: %v", err)
	}

	if len(messages) != 1 {
		t.Errorf("Expected 1 message, got %d", len(messages))
	}

	// Test: Create multiple messages
	message2 := &Message{
		ID:        uuid.New().String(),
		SessionID: sessionID,
		Role:      "assistant",
		Content:   "Hello! How can I help?",
		AgentType: "dojo",
	}
	err = db.CreateMessage(message2)
	if err != nil {
		t.Fatalf("CreateMessage failed: %v", err)
	}

	messages, err = db.ListMessages(sessionID)
	if err != nil {
		t.Fatalf("ListMessages failed: %v", err)
	}

	if len(messages) != 2 {
		t.Errorf("Expected 2 messages, got %d", len(messages))
	}

	// Messages should be ordered by created_at
	if messages[0].Role != "user" || messages[1].Role != "assistant" {
		t.Error("Messages not in correct order")
	}

	// Test: Delete message
	err = db.DeleteMessage(message.ID)
	if err != nil {
		t.Fatalf("DeleteMessage failed: %v", err)
	}

	messages, err = db.ListMessages(sessionID)
	if err != nil {
		t.Fatalf("ListMessages failed: %v", err)
	}

	if len(messages) != 1 {
		t.Errorf("Expected 1 message after deletion, got %d", len(messages))
	}
}

func TestForeignKeyConstraints(t *testing.T) {
	// Create temporary database
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Try to create a message without a session (should fail)
	message := &Message{
		ID:        uuid.New().String(),
		SessionID: "non-existent-session",
		Role:      "user",
		Content:   "Test",
	}

	err = db.CreateMessage(message)
	if err == nil {
		t.Error("Expected error when creating message with non-existent session")
	}
}
