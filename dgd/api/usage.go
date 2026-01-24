package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetUsageHandler returns aggregated usage statistics
func (s *Server) GetUsageHandler(c *gin.Context) {
	stats, err := s.db.GetUsageStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetSessionUsageHandler returns usage statistics for a specific session
func (s *Server) GetSessionUsageHandler(c *gin.Context) {
	sessionID := c.Param("id")

	usage, err := s.db.GetSessionUsage(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, usage)
}
