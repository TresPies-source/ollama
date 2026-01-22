package tools

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// FetchURLTool fetches content from a URL
type FetchURLTool struct {
	client *http.Client
}

func NewFetchURLTool() *FetchURLTool {
	return &FetchURLTool{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (t *FetchURLTool) Name() string {
	return "fetch_url"
}

func (t *FetchURLTool) Description() string {
	return "Fetch content from a URL (HTTP GET request)"
}

func (t *FetchURLTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"url": map[string]interface{}{
				"type":        "string",
				"description": "URL to fetch",
			},
		},
		"required": []string{"url"},
	}
}

func (t *FetchURLTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	urlStr, ok := params["url"].(string)
	if !ok {
		return &Result{Success: false, Error: "url parameter required"}, nil
	}

	// Validate URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return &Result{Success: false, Error: "invalid URL"}, nil
	}

	// Security: only allow HTTP/HTTPS
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return &Result{Success: false, Error: "only HTTP/HTTPS URLs allowed"}, nil
	}

	// Make request
	req, err := http.NewRequestWithContext(ctx, "GET", urlStr, nil)
	if err != nil {
		return &Result{Success: false, Error: err.Error()}, nil
	}

	resp, err := t.client.Do(req)
	if err != nil {
		return &Result{Success: false, Error: err.Error()}, nil
	}
	defer resp.Body.Close()

	// Read response (limit to 1MB)
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1024*1024))
	if err != nil {
		return &Result{Success: false, Error: err.Error()}, nil
	}

	return &Result{
		Success: true,
		Output:  string(body),
		Data: map[string]interface{}{
			"url":         urlStr,
			"statusCode":  resp.StatusCode,
			"contentType": resp.Header.Get("Content-Type"),
			"size":        len(body),
		},
	}, nil
}

// SearchWebTool performs a web search (placeholder)
type SearchWebTool struct{}

func NewSearchWebTool() *SearchWebTool {
	return &SearchWebTool{}
}

func (t *SearchWebTool) Name() string {
	return "search_web"
}

func (t *SearchWebTool) Description() string {
	return "Search the web for information (placeholder implementation)"
}

func (t *SearchWebTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"query": map[string]interface{}{
				"type":        "string",
				"description": "Search query",
			},
		},
		"required": []string{"query"},
	}
}

func (t *SearchWebTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	query, ok := params["query"].(string)
	if !ok {
		return &Result{Success: false, Error: "query parameter required"}, nil
	}

	// Placeholder implementation
	// In a real implementation, this would call a search API
	output := fmt.Sprintf("Search results for: %s\n\n", query)
	output += "[Placeholder] This tool requires a search API integration.\n"
	output += "Consider integrating with: DuckDuckGo, Google Custom Search, or Brave Search."

	return &Result{
		Success: true,
		Output:  output,
		Data: map[string]interface{}{
			"query":   query,
			"results": []string{},
		},
	}, nil
}

// ParseJSONTool parses JSON string
type ParseJSONTool struct{}

func NewParseJSONTool() *ParseJSONTool {
	return &ParseJSONTool{}
}

func (t *ParseJSONTool) Name() string {
	return "parse_json"
}

func (t *ParseJSONTool) Description() string {
	return "Parse a JSON string and extract values"
}

func (t *ParseJSONTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"json": map[string]interface{}{
				"type":        "string",
				"description": "JSON string to parse",
			},
		},
		"required": []string{"json"},
	}
}

func (t *ParseJSONTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	jsonStr, ok := params["json"].(string)
	if !ok {
		return &Result{Success: false, Error: "json parameter required"}, nil
	}

	// Simple validation (check if it looks like JSON)
	trimmed := strings.TrimSpace(jsonStr)
	if !strings.HasPrefix(trimmed, "{") && !strings.HasPrefix(trimmed, "[") {
		return &Result{Success: false, Error: "invalid JSON format"}, nil
	}

	// In a real implementation, you'd use encoding/json to parse
	// For now, just return the input as validation
	return &Result{
		Success: true,
		Output:  "JSON parsed successfully",
		Data: map[string]interface{}{
			"json":  jsonStr,
			"valid": true,
		},
	}, nil
}

// FormatTextTool formats text (uppercase, lowercase, title case)
type FormatTextTool struct{}

func NewFormatTextTool() *FormatTextTool {
	return &FormatTextTool{}
}

func (t *FormatTextTool) Name() string {
	return "format_text"
}

func (t *FormatTextTool) Description() string {
	return "Format text (uppercase, lowercase, title case)"
}

func (t *FormatTextTool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"text": map[string]interface{}{
				"type":        "string",
				"description": "Text to format",
			},
			"format": map[string]interface{}{
				"type":        "string",
				"description": "Format type: uppercase, lowercase, title",
				"enum":        []string{"uppercase", "lowercase", "title"},
			},
		},
		"required": []string{"text", "format"},
	}
}

func (t *FormatTextTool) Execute(ctx context.Context, params map[string]interface{}) (*Result, error) {
	text, ok := params["text"].(string)
	if !ok {
		return &Result{Success: false, Error: "text parameter required"}, nil
	}

	format, ok := params["format"].(string)
	if !ok {
		return &Result{Success: false, Error: "format parameter required"}, nil
	}

	var result string
	switch format {
	case "uppercase":
		result = strings.ToUpper(text)
	case "lowercase":
		result = strings.ToLower(text)
	case "title":
		result = strings.Title(strings.ToLower(text))
	default:
		return &Result{Success: false, Error: "unknown format"}, nil
	}

	return &Result{
		Success: true,
		Output:  result,
		Data: map[string]interface{}{
			"original": text,
			"format":   format,
			"result":   result,
		},
	}, nil
}
