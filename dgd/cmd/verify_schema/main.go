package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("Failed to get home directory:", err)
	}

	dbPath := filepath.Join(homeDir, ".dgd", "dgd.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	defer db.Close()

	fmt.Println("=== Verifying Database Schema ===")
	fmt.Println("Database path:", dbPath)
	fmt.Println()

	// Check messages table schema
	fmt.Println("Messages table schema:")
	rows, err := db.Query("PRAGMA table_info(messages)")
	if err != nil {
		log.Fatal("Failed to get messages schema:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name, colType string
		var notNull, pk int
		var dfltValue sql.NullString
		
		err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk)
		if err != nil {
			log.Fatal("Failed to scan row:", err)
		}
		
		fmt.Printf("  - %s (%s)\n", name, colType)
	}
	fmt.Println()

	// Check settings table exists
	fmt.Println("Settings table schema:")
	rows, err = db.Query("PRAGMA table_info(settings)")
	if err != nil {
		log.Fatal("Failed to get settings schema:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name, colType string
		var notNull, pk int
		var dfltValue sql.NullString
		
		err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk)
		if err != nil {
			log.Fatal("Failed to scan row:", err)
		}
		
		fmt.Printf("  - %s (%s)\n", name, colType)
	}
	fmt.Println()

	// Check migrations table
	fmt.Println("Applied migrations:")
	rows, err = db.Query("SELECT version, name, applied_at FROM migrations ORDER BY version")
	if err != nil {
		log.Fatal("Failed to get migrations:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var version int
		var name, appliedAt string
		
		err := rows.Scan(&version, &name, &appliedAt)
		if err != nil {
			log.Fatal("Failed to scan migration:", err)
		}
		
		fmt.Printf("  - Migration %d: %s (applied: %s)\n", version, name, appliedAt)
	}

	fmt.Println("\n✅ Schema verification complete!")
}
