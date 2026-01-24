package database

import (
	"fmt"
	"time"
)

// UsageStats represents aggregated token usage statistics
type UsageStats struct {
	TotalPromptTokens     int                   `json:"total_prompt_tokens"`
	TotalCompletionTokens int                   `json:"total_completion_tokens"`
	TotalTokens           int                   `json:"total_tokens"`
	TotalMessages         int                   `json:"total_messages"`
	EstimatedCostUSD      float64               `json:"estimated_cost_usd"`
	UsageByModel          []ModelUsage          `json:"usage_by_model"`
	UsageByDay            []DayUsage            `json:"usage_by_day"`
	UsageBySessions       []SessionUsage        `json:"usage_by_session"`
}

// ModelUsage represents token usage aggregated by model
type ModelUsage struct {
	Model            string  `json:"model"`
	PromptTokens     int     `json:"prompt_tokens"`
	CompletionTokens int     `json:"completion_tokens"`
	TotalTokens      int     `json:"total_tokens"`
	MessageCount     int     `json:"message_count"`
	EstimatedCostUSD float64 `json:"estimated_cost_usd"`
}

// DayUsage represents token usage aggregated by day
type DayUsage struct {
	Date             string `json:"date"`
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
	TotalTokens      int    `json:"total_tokens"`
	MessageCount     int    `json:"message_count"`
}

// SessionUsage represents token usage aggregated by session
type SessionUsage struct {
	SessionID        string `json:"session_id"`
	SessionTitle     string `json:"session_title"`
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
	TotalTokens      int    `json:"total_tokens"`
	MessageCount     int    `json:"message_count"`
}

// GetUsageStats retrieves aggregated usage statistics
func (db *DB) GetUsageStats() (*UsageStats, error) {
	stats := &UsageStats{
		UsageByModel:    []ModelUsage{},
		UsageByDay:      []DayUsage{},
		UsageBySessions: []SessionUsage{},
	}

	// Get total statistics
	totalQuery := `
		SELECT 
			COALESCE(SUM(prompt_tokens), 0) as total_prompt,
			COALESCE(SUM(completion_tokens), 0) as total_completion,
			COUNT(*) as total_messages
		FROM messages
		WHERE role = 'assistant'
	`

	err := db.QueryRow(totalQuery).Scan(
		&stats.TotalPromptTokens,
		&stats.TotalCompletionTokens,
		&stats.TotalMessages,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get total stats: %w", err)
	}

	stats.TotalTokens = stats.TotalPromptTokens + stats.TotalCompletionTokens

	// Get usage by model (using agent_type as proxy since we don't store model in messages yet)
	// In a future iteration, we should add a model field to messages table
	modelQuery := `
		SELECT 
			COALESCE(agent_type, 'unknown') as model,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COUNT(*) as message_count
		FROM messages
		WHERE role = 'assistant'
		GROUP BY agent_type
		ORDER BY prompt_tokens + completion_tokens DESC
	`

	rows, err := db.Query(modelQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get model stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var usage ModelUsage
		err := rows.Scan(
			&usage.Model,
			&usage.PromptTokens,
			&usage.CompletionTokens,
			&usage.MessageCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan model usage: %w", err)
		}
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
		usage.EstimatedCostUSD = calculateCost(usage.Model, usage.PromptTokens, usage.CompletionTokens)
		stats.UsageByModel = append(stats.UsageByModel, usage)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating model usage: %w", err)
	}

	// Get usage by day (last 30 days)
	dayQuery := `
		SELECT 
			DATE(created_at) as date,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COUNT(*) as message_count
		FROM messages
		WHERE role = 'assistant'
			AND created_at >= datetime('now', '-30 days')
		GROUP BY DATE(created_at)
		ORDER BY date DESC
	`

	rows, err = db.Query(dayQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get day stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var usage DayUsage
		err := rows.Scan(
			&usage.Date,
			&usage.PromptTokens,
			&usage.CompletionTokens,
			&usage.MessageCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan day usage: %w", err)
		}
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
		stats.UsageByDay = append(stats.UsageByDay, usage)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating day usage: %w", err)
	}

	// Get usage by session (top 10 sessions)
	sessionQuery := `
		SELECT 
			m.session_id,
			s.title,
			COALESCE(SUM(m.prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(m.completion_tokens), 0) as completion_tokens,
			COUNT(*) as message_count
		FROM messages m
		JOIN sessions s ON m.session_id = s.id
		WHERE m.role = 'assistant'
		GROUP BY m.session_id, s.title
		ORDER BY (prompt_tokens + completion_tokens) DESC
		LIMIT 10
	`

	rows, err = db.Query(sessionQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get session stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var usage SessionUsage
		err := rows.Scan(
			&usage.SessionID,
			&usage.SessionTitle,
			&usage.PromptTokens,
			&usage.CompletionTokens,
			&usage.MessageCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan session usage: %w", err)
		}
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
		stats.UsageBySessions = append(stats.UsageBySessions, usage)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating session usage: %w", err)
	}

	// Calculate total estimated cost
	stats.EstimatedCostUSD = 0
	for _, modelUsage := range stats.UsageByModel {
		stats.EstimatedCostUSD += modelUsage.EstimatedCostUSD
	}

	return stats, nil
}

// GetSessionUsage retrieves token usage for a specific session
func (db *DB) GetSessionUsage(sessionID string) (*SessionUsage, error) {
	query := `
		SELECT 
			m.session_id,
			s.title,
			COALESCE(SUM(m.prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(m.completion_tokens), 0) as completion_tokens,
			COUNT(*) as message_count
		FROM messages m
		JOIN sessions s ON m.session_id = s.id
		WHERE m.session_id = ? AND m.role = 'assistant'
		GROUP BY m.session_id, s.title
	`

	var usage SessionUsage
	err := db.QueryRow(query, sessionID).Scan(
		&usage.SessionID,
		&usage.SessionTitle,
		&usage.PromptTokens,
		&usage.CompletionTokens,
		&usage.MessageCount,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get session usage: %w", err)
	}

	usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens

	return &usage, nil
}

// calculateCost estimates the cost in USD based on model and token counts
// Pricing as of January 2026 (approximate)
func calculateCost(model string, promptTokens, completionTokens int) float64 {
	// Model-specific pricing per 1M tokens
	var promptCostPer1M, completionCostPer1M float64

	switch model {
	case "gpt-4o":
		promptCostPer1M = 2.50
		completionCostPer1M = 10.00
	case "gpt-4o-mini":
		promptCostPer1M = 0.15
		completionCostPer1M = 0.60
	case "gpt-4-turbo":
		promptCostPer1M = 10.00
		completionCostPer1M = 30.00
	case "gpt-3.5-turbo":
		promptCostPer1M = 0.50
		completionCostPer1M = 1.50
	case "claude-3-5-sonnet":
		promptCostPer1M = 3.00
		completionCostPer1M = 15.00
	case "claude-3-opus":
		promptCostPer1M = 15.00
		completionCostPer1M = 75.00
	case "claude-3-haiku":
		promptCostPer1M = 0.25
		completionCostPer1M = 1.25
	default:
		// For local models (Ollama) or unknown models, cost is $0
		return 0.0
	}

	promptCost := (float64(promptTokens) / 1_000_000.0) * promptCostPer1M
	completionCost := (float64(completionTokens) / 1_000_000.0) * completionCostPer1M

	return promptCost + completionCost
}

// GetUsageByDateRange retrieves usage statistics for a specific date range
func (db *DB) GetUsageByDateRange(startDate, endDate time.Time) ([]DayUsage, error) {
	query := `
		SELECT 
			DATE(created_at) as date,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COUNT(*) as message_count
		FROM messages
		WHERE role = 'assistant'
			AND created_at >= ?
			AND created_at <= ?
		GROUP BY DATE(created_at)
		ORDER BY date DESC
	`

	rows, err := db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get usage by date range: %w", err)
	}
	defer rows.Close()

	var usage []DayUsage
	for rows.Next() {
		var day DayUsage
		err := rows.Scan(
			&day.Date,
			&day.PromptTokens,
			&day.CompletionTokens,
			&day.MessageCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan day usage: %w", err)
		}
		day.TotalTokens = day.PromptTokens + day.CompletionTokens
		usage = append(usage, day)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating day usage: %w", err)
	}

	return usage, nil
}
