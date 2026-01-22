package database

import (
	"database/sql"
	"fmt"
	"time"
)

// Session represents a chat session
type Session struct {
	ID         string
	CreatedAt  time.Time
	UpdatedAt  time.Time
	Title      string
	WorkingDir string
	Status     string
}

// CreateSession creates a new session in the database
func (db *DB) CreateSession(session *Session) error {
	query := `
		INSERT INTO sessions (id, title, working_dir, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	
	now := time.Now()
	session.CreatedAt = now
	session.UpdatedAt = now
	
	if session.Status == "" {
		session.Status = "active"
	}
	
	_, err := db.Exec(query, session.ID, session.Title, session.WorkingDir, session.Status, now, now)
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	
	return nil
}

// GetSession retrieves a session by ID
func (db *DB) GetSession(id string) (*Session, error) {
	query := `
		SELECT id, created_at, updated_at, title, working_dir, status
		FROM sessions
		WHERE id = ?
	`
	
	var session Session
	err := db.QueryRow(query, id).Scan(
		&session.ID,
		&session.CreatedAt,
		&session.UpdatedAt,
		&session.Title,
		&session.WorkingDir,
		&session.Status,
	)
	
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("session not found: %s", id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}
	
	return &session, nil
}

// ListSessions retrieves all active sessions
func (db *DB) ListSessions() ([]Session, error) {
	query := `
		SELECT id, created_at, updated_at, title, working_dir, status
		FROM sessions
		WHERE status = 'active'
		ORDER BY updated_at DESC
	`
	
	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list sessions: %w", err)
	}
	defer rows.Close()
	
	var sessions []Session
	for rows.Next() {
		var session Session
		err := rows.Scan(
			&session.ID,
			&session.CreatedAt,
			&session.UpdatedAt,
			&session.Title,
			&session.WorkingDir,
			&session.Status,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan session: %w", err)
		}
		sessions = append(sessions, session)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating sessions: %w", err)
	}
	
	return sessions, nil
}

// UpdateSession updates a session's metadata
func (db *DB) UpdateSession(session *Session) error {
	query := `
		UPDATE sessions
		SET title = ?, working_dir = ?, status = ?, updated_at = ?
		WHERE id = ?
	`
	
	session.UpdatedAt = time.Now()
	
	result, err := db.Exec(query, session.Title, session.WorkingDir, session.Status, session.UpdatedAt, session.ID)
	if err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}
	
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rows == 0 {
		return fmt.Errorf("session not found: %s", session.ID)
	}
	
	return nil
}

// DeleteSession marks a session as deleted
func (db *DB) DeleteSession(id string) error {
	query := `
		UPDATE sessions
		SET status = 'deleted', updated_at = ?
		WHERE id = ?
	`
	
	result, err := db.Exec(query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}
	
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rows == 0 {
		return fmt.Errorf("session not found: %s", id)
	}
	
	return nil
}
