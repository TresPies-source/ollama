package database

import (
	"testing"
)

func TestSettingsCRUD(t *testing.T) {
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test: Set a single setting
	err = db.SetSetting("default_model", "llama3.2:3b")
	if err != nil {
		t.Fatalf("SetSetting failed: %v", err)
	}

	// Test: Get a single setting
	value, err := db.GetSetting("default_model")
	if err != nil {
		t.Fatalf("GetSetting failed: %v", err)
	}
	if value != "llama3.2:3b" {
		t.Errorf("Expected value 'llama3.2:3b', got %q", value)
	}

	// Test: Update an existing setting
	err = db.SetSetting("default_model", "llama3.2:7b")
	if err != nil {
		t.Fatalf("SetSetting (update) failed: %v", err)
	}

	value, err = db.GetSetting("default_model")
	if err != nil {
		t.Fatalf("GetSetting failed: %v", err)
	}
	if value != "llama3.2:7b" {
		t.Errorf("Expected value 'llama3.2:7b', got %q", value)
	}

	// Test: Get non-existent setting
	_, err = db.GetSetting("non_existent")
	if err == nil {
		t.Error("Expected error when getting non-existent setting")
	}

	// Test: Delete a setting
	err = db.DeleteSetting("default_model")
	if err != nil {
		t.Fatalf("DeleteSetting failed: %v", err)
	}

	// Verify deletion
	_, err = db.GetSetting("default_model")
	if err == nil {
		t.Error("Expected error after deleting setting")
	}

	// Test: Delete non-existent setting
	err = db.DeleteSetting("non_existent")
	if err == nil {
		t.Error("Expected error when deleting non-existent setting")
	}
}

func TestGetAllSettings(t *testing.T) {
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test: Get all settings when empty
	settings, err := db.GetAllSettings()
	if err != nil {
		t.Fatalf("GetAllSettings failed: %v", err)
	}
	if len(settings) != 0 {
		t.Errorf("Expected 0 settings, got %d", len(settings))
	}

	// Add some settings
	testSettings := map[string]string{
		"default_model": "llama3.2:3b",
		"temperature":   "0.8",
		"max_tokens":    "4096",
	}

	for key, value := range testSettings {
		err = db.SetSetting(key, value)
		if err != nil {
			t.Fatalf("SetSetting failed for %s: %v", key, err)
		}
	}

	// Test: Get all settings
	settings, err = db.GetAllSettings()
	if err != nil {
		t.Fatalf("GetAllSettings failed: %v", err)
	}

	if len(settings) != len(testSettings) {
		t.Errorf("Expected %d settings, got %d", len(testSettings), len(settings))
	}

	for key, expectedValue := range testSettings {
		actualValue, ok := settings[key]
		if !ok {
			t.Errorf("Setting %q not found", key)
		}
		if actualValue != expectedValue {
			t.Errorf("Setting %q: expected %q, got %q", key, expectedValue, actualValue)
		}
	}
}

func TestSetSettings(t *testing.T) {
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test: Set multiple settings at once
	newSettings := map[string]string{
		"default_model":         "llama3.2:3b",
		"temperature":           "0.8",
		"max_tokens":            "4096",
		"theme":                 "dark",
		"glassmorphism_opacity": "0.9",
	}

	err = db.SetSettings(newSettings)
	if err != nil {
		t.Fatalf("SetSettings failed: %v", err)
	}

	// Verify all settings were set
	settings, err := db.GetAllSettings()
	if err != nil {
		t.Fatalf("GetAllSettings failed: %v", err)
	}

	if len(settings) != len(newSettings) {
		t.Errorf("Expected %d settings, got %d", len(newSettings), len(settings))
	}

	for key, expectedValue := range newSettings {
		actualValue, ok := settings[key]
		if !ok {
			t.Errorf("Setting %q not found", key)
		}
		if actualValue != expectedValue {
			t.Errorf("Setting %q: expected %q, got %q", key, expectedValue, actualValue)
		}
	}

	// Test: Update some settings via SetSettings
	updatedSettings := map[string]string{
		"default_model": "llama3.2:7b",
		"temperature":   "0.5",
		"new_setting":   "new_value",
	}

	err = db.SetSettings(updatedSettings)
	if err != nil {
		t.Fatalf("SetSettings (update) failed: %v", err)
	}

	// Verify updates
	settings, err = db.GetAllSettings()
	if err != nil {
		t.Fatalf("GetAllSettings failed: %v", err)
	}

	// Should have 6 settings now (5 original + 1 new)
	if len(settings) != 6 {
		t.Errorf("Expected 6 settings, got %d", len(settings))
	}

	// Check updated values
	if settings["default_model"] != "llama3.2:7b" {
		t.Errorf("default_model not updated: got %q", settings["default_model"])
	}
	if settings["temperature"] != "0.5" {
		t.Errorf("temperature not updated: got %q", settings["temperature"])
	}
	if settings["new_setting"] != "new_value" {
		t.Errorf("new_setting not added: got %q", settings["new_setting"])
	}

	// Check unchanged values
	if settings["max_tokens"] != "4096" {
		t.Errorf("max_tokens should be unchanged: got %q", settings["max_tokens"])
	}
}

func TestSettingsTransaction(t *testing.T) {
	db, err := Open(":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Set initial settings
	initialSettings := map[string]string{
		"setting1": "value1",
		"setting2": "value2",
	}
	err = db.SetSettings(initialSettings)
	if err != nil {
		t.Fatalf("SetSettings failed: %v", err)
	}

	// Verify atomicity: all settings should be set or none
	batchSettings := map[string]string{
		"setting1": "updated1",
		"setting3": "value3",
	}
	err = db.SetSettings(batchSettings)
	if err != nil {
		t.Fatalf("SetSettings failed: %v", err)
	}

	settings, err := db.GetAllSettings()
	if err != nil {
		t.Fatalf("GetAllSettings failed: %v", err)
	}

	// Should have 3 settings: setting1 (updated), setting2 (unchanged), setting3 (new)
	if len(settings) != 3 {
		t.Errorf("Expected 3 settings, got %d", len(settings))
	}

	if settings["setting1"] != "updated1" {
		t.Errorf("setting1 should be updated: got %q", settings["setting1"])
	}
	if settings["setting2"] != "value2" {
		t.Errorf("setting2 should be unchanged: got %q", settings["setting2"])
	}
	if settings["setting3"] != "value3" {
		t.Errorf("setting3 should be added: got %q", settings["setting3"])
	}
}
