package database

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMigrations(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	status, err := db.GetMigrationStatus()
	if err != nil {
		t.Fatalf("Failed to get migration status: %v", err)
	}

	if len(status) != 2 {
		t.Errorf("Expected 2 migrations, got %d", len(status))
	}

	for _, m := range status {
		if !m["applied"].(bool) {
			t.Errorf("Migration %d (%s) not applied", m["version"], m["name"])
		}
	}
}

func TestTokenTracking(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	session := &Session{
		ID:         "test-session",
		Title:      "Test Session",
		WorkingDir: tmpDir,
	}
	if err := db.CreateSession(session); err != nil {
		t.Fatalf("Failed to create session: %v", err)
	}

	message := &Message{
		ID:               "test-message",
		SessionID:        session.ID,
		Role:             "assistant",
		Content:          "Test response",
		PromptTokens:     100,
		CompletionTokens: 50,
	}

	if err := db.CreateMessage(message); err != nil {
		t.Fatalf("Failed to create message: %v", err)
	}

	retrieved, err := db.GetMessage(message.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve message: %v", err)
	}

	if retrieved.PromptTokens != 100 {
		t.Errorf("Expected PromptTokens=100, got %d", retrieved.PromptTokens)
	}

	if retrieved.CompletionTokens != 50 {
		t.Errorf("Expected CompletionTokens=50, got %d", retrieved.CompletionTokens)
	}
}

func TestMigrationIdempotency(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	db.Close()

	db, err = Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to reopen database: %v", err)
	}
	defer db.Close()

	status, err := db.GetMigrationStatus()
	if err != nil {
		t.Fatalf("Failed to get migration status: %v", err)
	}

	if len(status) != 2 {
		t.Errorf("Expected 2 migrations after reopen, got %d", len(status))
	}

	for _, m := range status {
		if !m["applied"].(bool) {
			t.Errorf("Migration %d (%s) not applied after reopen", m["version"], m["name"])
		}
	}
}

func TestLegacyDatabaseUpgrade(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	if err := os.WriteFile(filepath.Join(tmpDir, "schema.sql"), []byte(`
		CREATE TABLE sessions (
			id TEXT PRIMARY KEY,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			title TEXT NOT NULL,
			working_dir TEXT NOT NULL,
			status TEXT DEFAULT 'active'
		);
		
		CREATE TABLE messages (
			id TEXT PRIMARY KEY,
			session_id TEXT NOT NULL,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			agent_type TEXT,
			mode TEXT,
			FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
		);
	`), 0644); err != nil {
		t.Fatalf("Failed to write schema: %v", err)
	}

	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	var columnCount int
	err = db.QueryRow(`
		SELECT COUNT(*) FROM pragma_table_info('messages') 
		WHERE name IN ('prompt_tokens', 'completion_tokens')
	`).Scan(&columnCount)
	if err != nil {
		t.Fatalf("Failed to check columns: %v", err)
	}

	if columnCount != 2 {
		t.Errorf("Expected 2 token columns, got %d", columnCount)
	}
}
