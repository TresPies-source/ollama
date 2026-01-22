package trace

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// EventType represents the type of trace event
type EventType string

const (
	EventModeTransition       EventType = "MODE_TRANSITION"
	EventToolInvocation       EventType = "TOOL_INVOCATION"
	EventPerspectiveIntegration EventType = "PERSPECTIVE_INTEGRATION"
	EventLLMCall              EventType = "LLM_CALL"
	EventAgentRouting         EventType = "AGENT_ROUTING"
	EventFileOperation        EventType = "FILE_OPERATION"
	EventError                EventType = "ERROR"
)

// Event represents a single trace event
type Event struct {
	SpanID    string                 `json:"span_id"`
	ParentID  string                 `json:"parent_id,omitempty"`
	EventType EventType              `json:"event_type"`
	Timestamp string                 `json:"timestamp"`
	Inputs    map[string]interface{} `json:"inputs,omitempty"`
	Outputs   map[string]interface{} `json:"outputs,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// Trace represents a complete trace session
type Trace struct {
	SessionID string   `json:"session_id"`
	StartTime string   `json:"start_time"`
	EndTime   string   `json:"end_time,omitempty"`
	Events    []*Event `json:"events"`
	mu        sync.Mutex
}

// Tracer manages trace collection
type Tracer struct {
	traces map[string]*Trace
	mu     sync.RWMutex
}

// NewTracer creates a new tracer
func NewTracer() *Tracer {
	return &Tracer{
		traces: make(map[string]*Trace),
	}
}

// StartTrace begins a new trace session
func (t *Tracer) StartTrace(sessionID string) *Trace {
	t.mu.Lock()
	defer t.mu.Unlock()

	trace := &Trace{
		SessionID: sessionID,
		StartTime: time.Now().Format(time.RFC3339),
		Events:    make([]*Event, 0),
	}

	t.traces[sessionID] = trace
	return trace
}

// GetTrace retrieves a trace by session ID
func (t *Tracer) GetTrace(sessionID string) (*Trace, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	trace, exists := t.traces[sessionID]
	if !exists {
		return nil, fmt.Errorf("trace not found for session: %s", sessionID)
	}

	return trace, nil
}

// EndTrace marks a trace session as complete
func (t *Tracer) EndTrace(sessionID string) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	trace, exists := t.traces[sessionID]
	if !exists {
		return fmt.Errorf("trace not found for session: %s", sessionID)
	}

	trace.mu.Lock()
	trace.EndTime = time.Now().Format(time.RFC3339)
	trace.mu.Unlock()

	return nil
}

// AddEvent adds an event to a trace
func (tr *Trace) AddEvent(event *Event) {
	tr.mu.Lock()
	defer tr.mu.Unlock()

	if event.Timestamp == "" {
		event.Timestamp = time.Now().Format(time.RFC3339)
	}

	tr.Events = append(tr.Events, event)
}

// ToJSON exports the trace as JSON
func (tr *Trace) ToJSON() (string, error) {
	tr.mu.Lock()
	defer tr.mu.Unlock()

	data, err := json.MarshalIndent(tr, "", "  ")
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// Context key for trace
type contextKey string

const traceKey contextKey = "trace"

// WithTrace adds a trace to the context
func WithTrace(ctx context.Context, trace *Trace) context.Context {
	return context.WithValue(ctx, traceKey, trace)
}

// FromContext retrieves a trace from the context
func FromContext(ctx context.Context) (*Trace, bool) {
	trace, ok := ctx.Value(traceKey).(*Trace)
	return trace, ok
}

// LogEvent is a helper to log an event if a trace exists in the context
func LogEvent(ctx context.Context, eventType EventType, inputs, outputs, metadata map[string]interface{}) {
	trace, ok := FromContext(ctx)
	if !ok {
		return
	}

	event := &Event{
		SpanID:    generateSpanID(),
		EventType: eventType,
		Inputs:    inputs,
		Outputs:   outputs,
		Metadata:  metadata,
	}

	trace.AddEvent(event)
}

// LogEventWithParent logs an event with a parent span ID
func LogEventWithParent(ctx context.Context, parentID string, eventType EventType, inputs, outputs, metadata map[string]interface{}) {
	trace, ok := FromContext(ctx)
	if !ok {
		return
	}

	event := &Event{
		SpanID:    generateSpanID(),
		ParentID:  parentID,
		EventType: eventType,
		Inputs:    inputs,
		Outputs:   outputs,
		Metadata:  metadata,
	}

	trace.AddEvent(event)
}

// generateSpanID generates a unique span ID
func generateSpanID() string {
	return fmt.Sprintf("span_%d", time.Now().UnixNano())
}

// Summary returns a summary of the trace
func (tr *Trace) Summary() map[string]interface{} {
	tr.mu.Lock()
	defer tr.mu.Unlock()

	eventCounts := make(map[EventType]int)
	for _, event := range tr.Events {
		eventCounts[event.EventType]++
	}

	return map[string]interface{}{
		"session_id":   tr.SessionID,
		"start_time":   tr.StartTime,
		"end_time":     tr.EndTime,
		"event_count":  len(tr.Events),
		"event_counts": eventCounts,
	}
}
