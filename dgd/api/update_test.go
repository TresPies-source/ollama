package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/TresPies-source/dgd/database"
	"github.com/TresPies-source/dgd/updater"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestServer(t *testing.T) (*Server, *gin.Engine) {
	gin.SetMode(gin.TestMode)

	// Use in-memory SQLite database for testing
	tmpDB := t.TempDir() + "/test.db"
	db, err := database.Open(tmpDB)
	require.NoError(t, err)
	t.Cleanup(func() { db.Close() })

	server := NewServer(db)
	router := gin.New()

	return server, router
}

func TestCheckUpdateHandler(t *testing.T) {
	t.Run("update available - custom format", func(t *testing.T) {
		// Create mock update server
		updateServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			response := updater.LatestVersion{
				Version:  "0.3.0",
				URL:      "https://example.com/dgd-0.3.0",
				Checksum: "abc123",
			}
			json.NewEncoder(w).Encode(response)
		}))
		defer updateServer.Close()

		server, router := setupTestServer(t)
		router.GET("/api/update/check", server.CheckUpdateHandler)

		req := httptest.NewRequest("GET", "/api/update/check?url="+updateServer.URL, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response UpdateCheckResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.True(t, response.UpdateAvailable)
		assert.Equal(t, "0.2.0", response.CurrentVersion)
		assert.Equal(t, "0.3.0", response.LatestVersion)
	})

	t.Run("no update available", func(t *testing.T) {
		// Create mock update server with same version
		updateServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			response := updater.LatestVersion{
				Version:  "0.2.0",
				URL:      "https://example.com/dgd-0.2.0",
				Checksum: "abc123",
			}
			json.NewEncoder(w).Encode(response)
		}))
		defer updateServer.Close()

		server, router := setupTestServer(t)
		router.GET("/api/update/check", server.CheckUpdateHandler)

		req := httptest.NewRequest("GET", "/api/update/check?url="+updateServer.URL, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response UpdateCheckResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.False(t, response.UpdateAvailable)
		assert.Equal(t, "0.2.0", response.CurrentVersion)
	})

	t.Run("update available - github format", func(t *testing.T) {
		// Create mock GitHub API server
		updateServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			response := updater.GitHubRelease{
				TagName: "v0.3.0",
				Assets: []struct {
					Name               string `json:"name"`
					BrowserDownloadURL string `json:"browser_download_url"`
				}{
					{
						Name:               "dgd-linux-amd64",
						BrowserDownloadURL: "https://example.com/dgd-linux-amd64",
					},
					{
						Name:               "dgd-windows-amd64.exe",
						BrowserDownloadURL: "https://example.com/dgd-windows-amd64.exe",
					},
				},
			}
			json.NewEncoder(w).Encode(response)
		}))
		defer updateServer.Close()

		server, router := setupTestServer(t)
		router.GET("/api/update/check", server.CheckUpdateHandler)

		req := httptest.NewRequest("GET", "/api/update/check?url="+updateServer.URL, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response UpdateCheckResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.True(t, response.UpdateAvailable)
		assert.Equal(t, "v0.3.0", response.LatestVersion)
	})

	t.Run("server error", func(t *testing.T) {
		// Create mock server that returns error
		updateServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}))
		defer updateServer.Close()

		server, router := setupTestServer(t)
		router.GET("/api/update/check", server.CheckUpdateHandler)

		req := httptest.NewRequest("GET", "/api/update/check?url="+updateServer.URL, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)

		var response ErrorResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.Contains(t, response.Error, "failed after")
	})
}

func TestApplyUpdateHandler(t *testing.T) {
	t.Run("valid update request", func(t *testing.T) {
		server, router := setupTestServer(t)
		router.POST("/api/update/apply", server.ApplyUpdateHandler)

		reqBody := map[string]string{
			"version":  "0.3.0",
			"url":      "https://example.com/dgd-0.3.0",
			"checksum": "abc123",
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/update/apply", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response UpdateApplyResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.True(t, response.Success)
		assert.Contains(t, response.Message, "Update is being applied")
	})

	t.Run("missing version", func(t *testing.T) {
		server, router := setupTestServer(t)
		router.POST("/api/update/apply", server.ApplyUpdateHandler)

		reqBody := map[string]string{
			"url":      "https://example.com/dgd-0.3.0",
			"checksum": "abc123",
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/update/apply", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response ErrorResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.Contains(t, response.Error, "required")
	})

	t.Run("missing url", func(t *testing.T) {
		server, router := setupTestServer(t)
		router.POST("/api/update/apply", server.ApplyUpdateHandler)

		reqBody := map[string]string{
			"version":  "0.3.0",
			"checksum": "abc123",
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/update/apply", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("missing checksum", func(t *testing.T) {
		server, router := setupTestServer(t)
		router.POST("/api/update/apply", server.ApplyUpdateHandler)

		reqBody := map[string]string{
			"version": "0.3.0",
			"url":     "https://example.com/dgd-0.3.0",
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/update/apply", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		server, router := setupTestServer(t)
		router.POST("/api/update/apply", server.ApplyUpdateHandler)

		req := httptest.NewRequest("POST", "/api/update/apply", bytes.NewReader([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response ErrorResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.Contains(t, response.Error, "invalid request")
	})
}
