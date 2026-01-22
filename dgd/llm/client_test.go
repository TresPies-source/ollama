package llm

import (
	"testing"
)

func TestDefaultConfig(t *testing.T) {
	config := DefaultConfig()

	if config.Provider != ProviderOllama {
		t.Errorf("Expected provider %s, got %s", ProviderOllama, config.Provider)
	}

	if config.BaseURL == "" {
		t.Error("Expected non-empty base URL")
	}

	if config.Model == "" {
		t.Error("Expected non-empty model")
	}
}

func TestNewClient_Ollama(t *testing.T) {
	config := &Config{
		Provider: ProviderOllama,
		BaseURL:  "http://localhost:11434",
	}

	client, err := NewClient(config)
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}

	if client.Provider() != ProviderOllama {
		t.Errorf("Expected provider %s, got %s", ProviderOllama, client.Provider())
	}
}

func TestNewClient_OpenAI(t *testing.T) {
	config := &Config{
		Provider: ProviderOpenAI,
		APIKey:   "test-key",
	}

	client, err := NewClient(config)
	if err != nil {
		t.Fatalf("NewClient failed: %v", err)
	}

	if client.Provider() != ProviderOpenAI {
		t.Errorf("Expected provider %s, got %s", ProviderOpenAI, client.Provider())
	}
}

func TestNewClient_OpenAI_NoAPIKey(t *testing.T) {
	config := &Config{
		Provider: ProviderOpenAI,
	}

	_, err := NewClient(config)
	if err == nil {
		t.Error("Expected error when creating OpenAI client without API key")
	}
}

func TestNewClient_UnknownProvider(t *testing.T) {
	config := &Config{
		Provider: "unknown",
	}

	_, err := NewClient(config)
	if err == nil {
		t.Error("Expected error when creating client with unknown provider")
	}
}
