package database

import (
	"embed"
	"fmt"
	"path"
	"sort"
	"strings"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Migration represents a database migration
type Migration struct {
	Version int
	Name    string
	SQL     string
}

// RunMigrations applies all pending migrations to the database
func (db *DB) RunMigrations() error {
	// Create migrations tracking table if it doesn't exist
	if err := db.createMigrationsTable(); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Load all migrations
	migrations, err := loadMigrations()
	if err != nil {
		return fmt.Errorf("failed to load migrations: %w", err)
	}

	// Get applied migrations
	applied, err := db.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Apply pending migrations
	for _, migration := range migrations {
		if _, exists := applied[migration.Version]; exists {
			continue // Migration already applied
		}

		if err := db.applyMigration(migration); err != nil {
			return fmt.Errorf("failed to apply migration %d: %w", migration.Version, err)
		}

		fmt.Printf("Applied migration %d: %s\n", migration.Version, migration.Name)
	}

	return nil
}

// createMigrationsTable creates the migrations tracking table
func (db *DB) createMigrationsTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS migrations (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`
	_, err := db.Exec(query)
	return err
}

// loadMigrations loads all migration files from the embedded filesystem
func loadMigrations() ([]Migration, error) {
	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return nil, fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrations []Migration
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		// Parse migration filename (format: NNN_name.sql)
		filename := entry.Name()
		parts := strings.SplitN(filename, "_", 2)
		if len(parts) < 2 {
			continue
		}

		var version int
		if _, err := fmt.Sscanf(parts[0], "%d", &version); err != nil {
			continue
		}

		name := strings.TrimSuffix(parts[1], ".sql")

		// Read migration SQL
		content, err := migrationsFS.ReadFile(path.Join("migrations", filename))
		if err != nil {
			return nil, fmt.Errorf("failed to read migration %s: %w", filename, err)
		}

		migrations = append(migrations, Migration{
			Version: version,
			Name:    name,
			SQL:     string(content),
		})
	}

	// Sort migrations by version
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	return migrations, nil
}

// getAppliedMigrations returns a map of applied migration versions
func (db *DB) getAppliedMigrations() (map[int]bool, error) {
	query := `SELECT version FROM migrations ORDER BY version`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[int]bool)
	for rows.Next() {
		var version int
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}

	return applied, rows.Err()
}

// applyMigration applies a single migration within a transaction
func (db *DB) applyMigration(migration Migration) error {
	// Special handling for migration 1 (token tracking columns)
	// Check if columns already exist to make it truly idempotent
	if migration.Version == 1 {
		if err := db.applyTokenTrackingMigration(migration); err != nil {
			return err
		}
		return nil
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Execute migration SQL
	if _, err := tx.Exec(migration.SQL); err != nil {
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	// Record migration as applied
	query := `INSERT INTO migrations (version, name) VALUES (?, ?)`
	if _, err := tx.Exec(query, migration.Version, migration.Name); err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// applyTokenTrackingMigration handles migration 1 with column existence checks
func (db *DB) applyTokenTrackingMigration(migration Migration) error {
	// Check if prompt_tokens column exists (before transaction)
	hasPromptTokens, err := db.columnExists("messages", "prompt_tokens")
	if err != nil {
		return fmt.Errorf("failed to check for prompt_tokens column: %w", err)
	}

	// Check if completion_tokens column exists (before transaction)
	hasCompletionTokens, err := db.columnExists("messages", "completion_tokens")
	if err != nil {
		return fmt.Errorf("failed to check for completion_tokens column: %w", err)
	}

	// If both columns exist, just record migration as applied
	if hasPromptTokens && hasCompletionTokens {
		// Record migration as applied without running DDL
		query := `INSERT OR IGNORE INTO migrations (version, name) VALUES (?, ?)`
		if _, err := db.Exec(query, migration.Version, migration.Name); err != nil {
			return fmt.Errorf("failed to record migration: %w", err)
		}
		return nil
	}

	// Begin transaction for DDL changes
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Add prompt_tokens if it doesn't exist
	if !hasPromptTokens {
		if _, err := tx.Exec("ALTER TABLE messages ADD COLUMN prompt_tokens INTEGER DEFAULT 0"); err != nil {
			return fmt.Errorf("failed to add prompt_tokens column: %w", err)
		}
	}

	// Add completion_tokens if it doesn't exist
	if !hasCompletionTokens {
		if _, err := tx.Exec("ALTER TABLE messages ADD COLUMN completion_tokens INTEGER DEFAULT 0"); err != nil {
			return fmt.Errorf("failed to add completion_tokens column: %w", err)
		}
	}

	// Record migration as applied
	query := `INSERT INTO migrations (version, name) VALUES (?, ?)`
	if _, err := tx.Exec(query, migration.Version, migration.Name); err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// columnExists checks if a column exists in a table
func (db *DB) columnExists(tableName, columnName string) (bool, error) {
	// Query pragma_table_info to check if column exists
	// Note: table name cannot be parameterized with pragma functions
	query := fmt.Sprintf("SELECT COUNT(*) FROM pragma_table_info('%s') WHERE name = ?", tableName)
	var count int
	err := db.QueryRow(query, columnName).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetMigrationStatus returns the status of all migrations
func (db *DB) GetMigrationStatus() ([]map[string]interface{}, error) {
	migrations, err := loadMigrations()
	if err != nil {
		return nil, err
	}

	applied, err := db.getAppliedMigrations()
	if err != nil {
		return nil, err
	}

	var status []map[string]interface{}
	for _, migration := range migrations {
		isApplied := applied[migration.Version]
		status = append(status, map[string]interface{}{
			"version": migration.Version,
			"name":    migration.Name,
			"applied": isApplied,
		})
	}

	return status, nil
}
