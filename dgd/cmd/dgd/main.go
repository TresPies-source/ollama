package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/TresPies-source/dgd/api"
	"github.com/TresPies-source/dgd/database"
	"github.com/gin-gonic/gin"
)

func main() {
	// Get user home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("Failed to get home directory:", err)
	}

	// Set up database path
	dbPath := filepath.Join(homeDir, ".dgd", "dgd.db")
	
	// Open database
	db, err := database.Open(dbPath)
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	defer db.Close()

	log.Println("Database initialized at:", dbPath)

	// Create API server
	server := api.NewServer(db)

	// Set up Gin router
	router := gin.Default()

	// Enable CORS for development
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// API routes
	router.GET("/health", server.HealthHandler)
	router.POST("/api/chat", server.ChatHandler)
	router.POST("/api/sessions", server.CreateSessionHandler)
	router.GET("/api/sessions", server.ListSessionsHandler)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Starting Dojo Genesis Desktop server on %s", addr)
	
	if err := router.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
