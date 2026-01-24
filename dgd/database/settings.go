package database

import (
	"database/sql"
	"fmt"
	"time"
)

// GetSetting retrieves a single setting by key
func (db *DB) GetSetting(key string) (string, error) {
	query := `SELECT value FROM settings WHERE key = ?`

	var value string
	err := db.QueryRow(query, key).Scan(&value)

	if err == sql.ErrNoRows {
		return "", fmt.Errorf("setting not found: %s", key)
	}
	if err != nil {
		return "", fmt.Errorf("failed to get setting: %w", err)
	}

	return value, nil
}

// SetSetting creates or updates a single setting
func (db *DB) SetSetting(key, value string) error {
	query := `
		INSERT INTO settings (key, value, updated_at)
		VALUES (?, ?, ?)
		ON CONFLICT(key) DO UPDATE SET
			value = excluded.value,
			updated_at = excluded.updated_at
	`

	_, err := db.Exec(query, key, value, time.Now())
	if err != nil {
		return fmt.Errorf("failed to set setting: %w", err)
	}

	return nil
}

// GetAllSettings retrieves all settings as a map
func (db *DB) GetAllSettings() (map[string]string, error) {
	query := `SELECT key, value FROM settings ORDER BY key ASC`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all settings: %w", err)
	}
	defer rows.Close()

	settings := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, fmt.Errorf("failed to scan setting: %w", err)
		}
		settings[key] = value
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating settings: %w", err)
	}

	return settings, nil
}

// SetSettings updates multiple settings in a single transaction
func (db *DB) SetSettings(settings map[string]string) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO settings (key, value, updated_at)
		VALUES (?, ?, ?)
		ON CONFLICT(key) DO UPDATE SET
			value = excluded.value,
			updated_at = excluded.updated_at
	`

	stmt, err := tx.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	now := time.Now()
	for key, value := range settings {
		if _, err := stmt.Exec(key, value, now); err != nil {
			return fmt.Errorf("failed to set setting %s: %w", key, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// DeleteSetting removes a setting by key
func (db *DB) DeleteSetting(key string) error {
	query := `DELETE FROM settings WHERE key = ?`

	result, err := db.Exec(query, key)
	if err != nil {
		return fmt.Errorf("failed to delete setting: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("setting not found: %s", key)
	}

	return nil
}
