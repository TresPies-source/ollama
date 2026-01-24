package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/TresPies-source/dgd/database"
	"github.com/gin-gonic/gin"
)

func TestGetSettingsHandler(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Set some test settings
	testSettings := map[string]string{
		"default_model": "llama3.2:3b",
		"temperature":   "0.8",
		"max_tokens":    "4096",
	}
	err = db.SetSettings(testSettings)
	if err != nil {
		t.Fatalf("Failed to set test settings: %v", err)
	}

	server := NewServer(db)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/settings", server.GetSettingsHandler)

	req, _ := http.NewRequest("GET", "/api/settings", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response SettingsResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if len(response.Settings) != len(testSettings) {
		t.Errorf("Expected %d settings, got %d", len(testSettings), len(response.Settings))
	}

	for key, expectedValue := range testSettings {
		actualValue, ok := response.Settings[key]
		if !ok {
			t.Errorf("Setting %q not found in response", key)
		}
		if actualValue != expectedValue {
			t.Errorf("Setting %q: expected %q, got %q", key, expectedValue, actualValue)
		}
	}
}

func TestGetSettingsHandlerEmpty(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	server := NewServer(db)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/settings", server.GetSettingsHandler)

	req, _ := http.NewRequest("GET", "/api/settings", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response SettingsResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if len(response.Settings) != 0 {
		t.Errorf("Expected 0 settings, got %d", len(response.Settings))
	}
}

func TestUpdateSettingsHandler(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	server := NewServer(db)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/settings", server.UpdateSettingsHandler)

	// Test: Update settings
	updateReq := UpdateSettingsRequest{
		Settings: map[string]string{
			"default_model": "llama3.2:3b",
			"temperature":   "0.8",
		},
	}

	body, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("POST", "/api/settings", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
		t.Logf("Response body: %s", w.Body.String())
	}

	var response SettingsResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if len(response.Settings) != 2 {
		t.Errorf("Expected 2 settings, got %d", len(response.Settings))
	}

	if response.Settings["default_model"] != "llama3.2:3b" {
		t.Errorf("Expected default_model 'llama3.2:3b', got %q", response.Settings["default_model"])
	}
	if response.Settings["temperature"] != "0.8" {
		t.Errorf("Expected temperature '0.8', got %q", response.Settings["temperature"])
	}
}

func TestUpdateSettingsHandlerInvalidJSON(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	server := NewServer(db)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/settings", server.UpdateSettingsHandler)

	// Test: Invalid JSON
	req, _ := http.NewRequest("POST", "/api/settings", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestUpdateSettingsHandlerEmptySettings(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	server := NewServer(db)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/settings", server.UpdateSettingsHandler)

	// Test: Empty settings object
	updateReq := UpdateSettingsRequest{
		Settings: map[string]string{},
	}

	body, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("POST", "/api/settings", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestUpdateSettingsHandlerPartialUpdate(t *testing.T) {
	db, err := database.Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Set initial settings
	initialSettings := map[string]string{
		"default_model": "llama3.2:3b",
		"temperature":   "0.8",
		"max_tokens":    "4096",
	}
	err = db.SetSettings(initialSettings)
	if err != nil {
		t.Fatalf("Failed to set initial settings: %v", err)
	}

	server := NewServer(db)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/settings", server.UpdateSettingsHandler)

	// Test: Partial update (only change one setting)
	updateReq := UpdateSettingsRequest{
		Settings: map[string]string{
			"temperature": "0.5",
		},
	}

	body, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("POST", "/api/settings", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response SettingsResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Should have 3 settings total
	if len(response.Settings) != 3 {
		t.Errorf("Expected 3 settings, got %d", len(response.Settings))
	}

	// Check updated value
	if response.Settings["temperature"] != "0.5" {
		t.Errorf("Expected temperature '0.5', got %q", response.Settings["temperature"])
	}

	// Check unchanged values
	if response.Settings["default_model"] != "llama3.2:3b" {
		t.Errorf("default_model should be unchanged: got %q", response.Settings["default_model"])
	}
	if response.Settings["max_tokens"] != "4096" {
		t.Errorf("max_tokens should be unchanged: got %q", response.Settings["max_tokens"])
	}
}
