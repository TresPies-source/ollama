package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SettingsResponse represents the response containing all settings
type SettingsResponse struct {
	Settings map[string]string `json:"settings"`
}

// UpdateSettingsRequest represents the request to update settings
type UpdateSettingsRequest struct {
	Settings map[string]string `json:"settings"`
}

// GetSettingsHandler handles GET /api/settings
func (s *Server) GetSettingsHandler(c *gin.Context) {
	settings, err := s.db.GetAllSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, SettingsResponse{
		Settings: settings,
	})
}

// UpdateSettingsHandler handles POST /api/settings
func (s *Server) UpdateSettingsHandler(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	if len(req.Settings) == 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "no settings provided"})
		return
	}

	if err := s.db.SetSettings(req.Settings); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	settings, err := s.db.GetAllSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, SettingsResponse{
		Settings: settings,
	})
}
