package api

import (
	"net/http"

	"github.com/TresPies-source/dgd/updater"
	"github.com/TresPies-source/dgd/version"
	"github.com/gin-gonic/gin"
)

// UpdateCheckResponse represents the response for update check
type UpdateCheckResponse struct {
	UpdateAvailable bool   `json:"update_available"`
	CurrentVersion  string `json:"current_version"`
	LatestVersion   string `json:"latest_version,omitempty"`
	DownloadURL     string `json:"download_url,omitempty"`
	Checksum        string `json:"checksum,omitempty"`
}

// UpdateApplyResponse represents the response for update apply
type UpdateApplyResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// CheckUpdateHandler handles GET /api/update/check
func (s *Server) CheckUpdateHandler(c *gin.Context) {
	// Default update URL (GitHub releases)
	updateURL := "https://api.github.com/repos/TresPies-source/ollama/releases/latest"

	// Allow override via environment variable
	if customURL := c.Query("url"); customURL != "" {
		updateURL = customURL
	}

	checker := updater.NewUpdateChecker(updateURL)
	latest, err := checker.CheckForUpdates(version.Version)

	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	if latest == nil {
		// No update available
		c.JSON(http.StatusOK, UpdateCheckResponse{
			UpdateAvailable: false,
			CurrentVersion:  version.Version,
		})
		return
	}

	// Update available
	c.JSON(http.StatusOK, UpdateCheckResponse{
		UpdateAvailable: true,
		CurrentVersion:  version.Version,
		LatestVersion:   latest.Version,
		DownloadURL:     latest.URL,
		Checksum:        latest.Checksum,
	})
}

// ApplyUpdateHandler handles POST /api/update/apply
func (s *Server) ApplyUpdateHandler(c *gin.Context) {
	var req struct {
		Version  string `json:"version"`
		URL      string `json:"url"`
		Checksum string `json:"checksum"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "invalid request: " + err.Error(),
		})
		return
	}

	// Validate required fields
	if req.Version == "" || req.URL == "" || req.Checksum == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "version, url, and checksum are required",
		})
		return
	}

	latest := &updater.LatestVersion{
		Version:  req.Version,
		URL:      req.URL,
		Checksum: req.Checksum,
	}

	// Download and apply update in a goroutine
	go func() {
		checker := updater.NewUpdateChecker("")
		if err := checker.DownloadAndApply(latest); err != nil {
			// Log error but don't fail the response since it's async
			// In a real app, you'd want to notify the user via WebSocket
			return
		}

		// Restart the application
		updater.RestartApplication()
	}()

	c.JSON(http.StatusOK, UpdateApplyResponse{
		Success: true,
		Message: "Update is being applied. Application will restart shortly.",
	})
}
