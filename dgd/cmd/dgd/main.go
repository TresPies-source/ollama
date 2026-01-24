package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/TresPies-source/dgd/api"
	"github.com/TresPies-source/dgd/database"
	"github.com/TresPies-source/dgd/llm"
	"github.com/TresPies-source/dgd/updater"
	"github.com/TresPies-source/dgd/version"
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

	// Register shutdown callback for graceful restart
	updater.RegisterShutdownCallback(func() error {
		log.Println("Graceful shutdown: closing database...")
		return db.Close()
	})

	log.Println("Database initialized at:", dbPath)

	// Initialize LLM client (optional)
	var server *api.Server
	llmProvider := os.Getenv("LLM_PROVIDER") // "ollama", "openai", or empty for keyword-based
	if llmProvider != "" {
		llmConfig := &llm.Config{
			Provider: llm.Provider(llmProvider),
			BaseURL:  os.Getenv("LLM_BASE_URL"),
			APIKey:   os.Getenv("LLM_API_KEY"),
			Model:    os.Getenv("LLM_MODEL"),
		}

		// Set defaults
		if llmConfig.Model == "" {
			if llmConfig.Provider == llm.ProviderOllama {
				llmConfig.Model = "llama3.2:3b"
			} else if llmConfig.Provider == llm.ProviderOpenAI {
				llmConfig.Model = "gpt-4o-mini"
			}
		}

		llmClient, err := llm.NewClient(llmConfig)
		if err != nil {
			log.Printf("Warning: Failed to initialize LLM client: %v", err)
			log.Printf("Falling back to keyword-based classification")
			server = api.NewServer(db)
		} else {
			log.Printf("LLM client initialized: %s (%s)", llmConfig.Provider, llmConfig.Model)
			server = api.NewServerWithLLM(db, llmClient, llmConfig.Model)
		}
	} else {
		log.Printf("No LLM provider configured, using keyword-based classification")
		server = api.NewServer(db)
	}

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
	router.POST("/api/chat/stream", server.ChatStreamHandler)
	router.POST("/api/sessions", server.CreateSessionHandler)
	router.GET("/api/sessions", server.ListSessionsHandler)
	router.GET("/api/sessions/:id", server.GetSessionHandler)
	router.DELETE("/api/sessions/:id", server.DeleteSessionHandler)
	router.GET("/api/sessions/:id/usage", server.GetSessionUsageHandler)
	router.GET("/api/sessions/:id/export", server.ExportSessionHandler)
	router.POST("/api/sessions/import", server.ImportSessionHandler)
	router.GET("/api/trace/:id", server.GetTraceHandler)
	router.GET("/api/usage", server.GetUsageHandler)
	router.GET("/api/settings", server.GetSettingsHandler)
	router.POST("/api/settings", server.UpdateSettingsHandler)
	router.GET("/api/update/check", server.CheckUpdateHandler)
	router.POST("/api/update/apply", server.ApplyUpdateHandler)
	
	// Ollama WebUI compatibility stubs
	router.GET("/api/version", server.OllamaVersionHandler)
	router.GET("/api/tags", server.OllamaTagsHandler)

	// Start update checker in background (non-blocking)
	go func() {
		// Wait 5 seconds before checking for updates
		time.Sleep(5 * time.Second)

		updateURL := os.Getenv("UPDATE_URL")
		if updateURL == "" {
			// Default to GitHub releases
			updateURL = "https://api.github.com/repos/TresPies-source/ollama/releases/latest"
		}

		checker := updater.NewUpdateChecker(updateURL)
		latest, err := checker.CheckForUpdates(version.Version)
		if err != nil {
			log.Printf("Update check failed: %v", err)
			return
		}

		if latest != nil {
			log.Printf("Update available: %s (current: %s)", latest.Version, version.Version)
			// In a real implementation, this would broadcast via WebSocket to notify the frontend
			// For now, just log it
		} else {
			log.Printf("No updates available (current version: %s)", version.Version)
		}
	}()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Starting Dojo Genesis Desktop server on %s", addr)
	log.Printf("Seeds directory: %s", filepath.Join(homeDir, ".dgd", "seeds"))

	if err := router.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
