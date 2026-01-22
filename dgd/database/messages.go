package database

import (
	"database/sql"
	"fmt"
	"time"
)

// Message represents a chat message
type Message struct {
	ID        string
	SessionID string
	Role      string
	Content   string
	CreatedAt time.Time
	AgentType string
	Mode      string
}

// CreateMessage creates a new message in the database
func (db *DB) CreateMessage(message *Message) error {
	query := `
		INSERT INTO messages (id, session_id, role, content, created_at, agent_type, mode)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	
	message.CreatedAt = time.Now()
	
	_, err := db.Exec(query,
		message.ID,
		message.SessionID,
		message.Role,
		message.Content,
		message.CreatedAt,
		nullString(message.AgentType),
		nullString(message.Mode),
	)
	
	if err != nil {
		return fmt.Errorf("failed to create message: %w", err)
	}
	
	// Update session's updated_at timestamp
	_, err = db.Exec("UPDATE sessions SET updated_at = ? WHERE id = ?", message.CreatedAt, message.SessionID)
	if err != nil {
		return fmt.Errorf("failed to update session timestamp: %w", err)
	}
	
	return nil
}

// GetMessage retrieves a message by ID
func (db *DB) GetMessage(id string) (*Message, error) {
	query := `
		SELECT id, session_id, role, content, created_at, agent_type, mode
		FROM messages
		WHERE id = ?
	`
	
	var message Message
	var agentType, mode sql.NullString
	
	err := db.QueryRow(query, id).Scan(
		&message.ID,
		&message.SessionID,
		&message.Role,
		&message.Content,
		&message.CreatedAt,
		&agentType,
		&mode,
	)
	
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("message not found: %s", id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get message: %w", err)
	}
	
	message.AgentType = agentType.String
	message.Mode = mode.String
	
	return &message, nil
}

// ListMessages retrieves all messages for a session
func (db *DB) ListMessages(sessionID string) ([]Message, error) {
	query := `
		SELECT id, session_id, role, content, created_at, agent_type, mode
		FROM messages
		WHERE session_id = ?
		ORDER BY created_at ASC
	`
	
	rows, err := db.Query(query, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to list messages: %w", err)
	}
	defer rows.Close()
	
	var messages []Message
	for rows.Next() {
		var message Message
		var agentType, mode sql.NullString
		
		err := rows.Scan(
			&message.ID,
			&message.SessionID,
			&message.Role,
			&message.Content,
			&message.CreatedAt,
			&agentType,
			&mode,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		
		message.AgentType = agentType.String
		message.Mode = mode.String
		
		messages = append(messages, message)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating messages: %w", err)
	}
	
	return messages, nil
}

// DeleteMessage deletes a message from the database
func (db *DB) DeleteMessage(id string) error {
	query := `DELETE FROM messages WHERE id = ?`
	
	result, err := db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete message: %w", err)
	}
	
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rows == 0 {
		return fmt.Errorf("message not found: %s", id)
	}
	
	return nil
}

// nullString converts an empty string to sql.NullString
func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}
