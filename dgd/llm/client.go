package llm

import "fmt"

// NewClient creates a new LLM client based on the config
func NewClient(config *Config) (Client, error) {
	switch config.Provider {
	case ProviderOllama:
		return NewOllamaClient(config.BaseURL), nil
	case ProviderOpenAI:
		if config.APIKey == "" {
			return nil, fmt.Errorf("API key required for OpenAI")
		}
		return NewOpenAIClient(config.APIKey), nil
	case ProviderAnthropic:
		return nil, fmt.Errorf("Anthropic provider not yet implemented")
	default:
		return nil, fmt.Errorf("unknown provider: %s", config.Provider)
	}
}

// DefaultConfig returns the default LLM configuration (Ollama)
func DefaultConfig() *Config {
	return &Config{
		Provider: ProviderOllama,
		BaseURL:  "http://localhost:11434",
		Model:    "llama3.2:3b", // Small, fast model for local use
	}
}
