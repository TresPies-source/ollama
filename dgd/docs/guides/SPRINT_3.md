# Sprint 3: Dojo Agent + LLM Integration

**Duration:** 4 days  
**Version:** v0.0.3  
**Status:** ✅ Complete

## Overview

Sprint 3 brings intelligence to Dojo Genesis Desktop with the **Dojo Agent** and **LLM integration**. The system can now think with you using four distinct modes (Mirror, Scout, Gardener, Implementation) and supports both local (Ollama) and cloud (OpenAI) models.

## Deliverables

### 1. LLM Client Layer ✅

**Files:** `llm/types.go`, `llm/ollama.go`, `llm/openai.go`, `llm/client.go`

A unified interface for multiple LLM providers:

**Supported Providers:**
- **Ollama**: Local models (llama3.2, qwen, mistral, etc.)
- **OpenAI**: Cloud models (gpt-4o-mini, gpt-4o, etc.)
- **Anthropic**: (Placeholder for future implementation)

**Features:**
- Unified `Client` interface
- Streaming and non-streaming completions
- Model listing
- Provider-specific configuration

**Example:**
```go
// Ollama client
ollamaClient := llm.NewOllamaClient("http://localhost:11434")

// OpenAI client
openaiClient := llm.NewOpenAIClient("sk-...")

// Factory pattern
config := &llm.Config{
    Provider: llm.ProviderOllama,
    BaseURL:  "http://localhost:11434",
    Model:    "llama3.2:3b",
}
client, _ := llm.NewClient(config)

// Complete
resp, _ := client.Complete(ctx, &llm.CompletionRequest{
    Model: "llama3.2:3b",
    Messages: []llm.Message{
        {Role: "user", Content: "Hello!"},
    },
})
```

### 2. Dojo Agent ✅

**File:** `agents/dojo/dojo.go`

The thinking partner with four modes:

#### Mode 1: Mirror
**Purpose:** Synthesize patterns across perspectives

**Output Format:**
1. Pattern Summary (3-6 lines)
2. Assumptions/Tensions (1-3 items)
3. Reframes (1-2 items)

**Example:**
```bash
curl -X POST http://localhost:8080/api/chat \
  -d '{
    "session_id": "abc123",
    "message": "Help me think about this",
    "perspectives": [
      "Option A is faster but riskier",
      "Option B is slower but safer",
      "Option C is cheapest but least reliable"
    ]
  }'
```

#### Mode 2: Scout
**Purpose:** Explore possible routes forward

**Output Format:**
1. Routes (2-4 options with tradeoffs)
2. Recommendation (smallest test step)
3. What to Watch For (key signals)

**Example:**
```bash
curl -X POST http://localhost:8080/api/chat \
  -d '{
    "session_id": "abc123",
    "message": "What are my options for deploying this app?"
  }'
```

#### Mode 3: Gardener
**Purpose:** Cultivate ideas by highlighting strengths and growth areas

**Output Format:**
1. Strongest Ideas (2-3 items)
2. Growth Areas (1-2 items)
3. Next Cultivation Step

**Example:**
```bash
curl -X POST http://localhost:8080/api/chat \
  -d '{
    "session_id": "abc123",
    "message": "Give me feedback on my architecture design"
  }'
```

#### Mode 4: Implementation
**Purpose:** Provide concrete action plan

**Output Format:**
1. Next Steps (1-5 steps)
2. Success Criteria
3. Potential Blockers

**Example:**
```bash
curl -X POST http://localhost:8080/api/chat \
  -d '{
    "session_id": "abc123",
    "message": "How do I implement authentication?"
  }'
```

### 3. Enhanced Supervisor ✅

**File:** `agents/supervisor/supervisor.go`

Now supports both keyword-based and LLM-based intent classification:

**Keyword-Based (Default):**
- Fast, no API calls
- Good for simple queries
- Backward compatible

**LLM-Based (Optional):**
- More accurate
- Handles complex queries
- Requires Ollama or OpenAI

**Example:**
```go
// Keyword-based (no LLM)
supervisor := supervisor.NewSupervisor()

// LLM-based
supervisor := supervisor.NewSupervisorWithLLM(llmClient, "llama3.2:3b")

// Classify
intent, _ := supervisor.ClassifyIntent(ctx, "Help me think about this")
// intent.Type = "dojo"
// intent.Confidence = 0.9
// intent.Reasoning = "Detected thinking/advice keywords"
```

### 4. Updated API ✅

**File:** `api/handlers.go`

Now routes to Dojo agent and supports perspectives:

**New Request Format:**
```json
{
  "session_id": "abc123",
  "message": "Help me think",
  "perspectives": ["A", "B", "C"]
}
```

**New Response Format:**
```json
{
  "session_id": "abc123",
  "message_id": "msg456",
  "content": "Pattern: ...",
  "agent_type": "dojo",
  "mode": "mirror",
  "done": true
}
```

### 5. Environment Configuration ✅

**File:** `cmd/dgd/main.go`

Supports environment variables for LLM configuration:

```bash
# Use Ollama (local)
export LLM_PROVIDER=ollama
export LLM_BASE_URL=http://localhost:11434
export LLM_MODEL=llama3.2:3b

# Use OpenAI (cloud)
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-...
export LLM_MODEL=gpt-4o-mini

# No LLM (keyword-based)
# (leave LLM_PROVIDER unset)
```

### 6. Comprehensive Tests ✅

**Files:** `agents/dojo/dojo_test.go`, `llm/client_test.go`

Test coverage:
- Dojo agent: 5 test cases (all 4 modes + mode inference)
- LLM client: 5 test cases (config, providers, errors)

---

## Architecture Highlights

### The Dojo Protocol

The Dojo agent implements the core Dojo philosophy:

**Three Foundational Principles:**
1. **Beginner's Mind**: Approach every interaction fresh
2. **Self-Definition**: Help users see their own thinking
3. **Understanding is Love**: Deep, non-judgmental understanding

**Compassionate Boundaries:**
- Refuse to originate perspectives (user supplies them)
- Refuse to gamify thinking (no points, no leaderboards)
- Refuse to become an oracle (help user see, not decide for them)

### Mode Inference

The Dojo agent automatically infers the appropriate mode:

| Query Pattern | Inferred Mode |
|---------------|---------------|
| User provides perspectives | Mirror |
| "options", "routes", "alternatives" | Scout |
| "feedback", "improve", "evaluate" | Gardener |
| "how to", "steps", "implement" | Implementation |

### LLM Provider Strategy

**Local-First Philosophy:**
- Default to Ollama for privacy and cost
- Fallback to keyword-based if Ollama unavailable
- Support OpenAI for premium features

**Recommended Models:**
- **Ollama**: `llama3.2:3b` (fast, small, good for most tasks)
- **OpenAI**: `gpt-4o-mini` (smart, affordable, cloud-based)

---

## Testing

Run all tests:
```bash
# Test Dojo agent
go test ./agents/dojo -v

# Test LLM client
go test ./llm -v

# Test all
go test ./... -v
```

Expected output:
```
=== RUN   TestDojoMirrorMode
--- PASS: TestDojoMirrorMode (0.00s)
=== RUN   TestDojoScoutMode
--- PASS: TestDojoScoutMode (0.00s)
=== RUN   TestDojoGardenerMode
--- PASS: TestDojoGardenerMode (0.00s)
=== RUN   TestDojoImplementationMode
--- PASS: TestDojoImplementationMode (0.00s)
=== RUN   TestDojoModeInference
--- PASS: TestDojoModeInference (0.00s)
PASS
```

---

## Running the Server

### With Ollama (Recommended)

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull a model
ollama pull llama3.2:3b

# 3. Set environment
export LLM_PROVIDER=ollama
export LLM_MODEL=llama3.2:3b

# 4. Run server
go run cmd/dgd/main.go
```

### With OpenAI

```bash
# 1. Set environment
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-...
export LLM_MODEL=gpt-4o-mini

# 2. Run server
go run cmd/dgd/main.go
```

### Without LLM (Keyword-Based)

```bash
# Just run the server
go run cmd/dgd/main.go
```

---

## API Usage Examples

### Mirror Mode (with perspectives)

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test",
    "message": "Help me think about whether to use Go or Python",
    "perspectives": [
      "Go is faster and more efficient",
      "Python has better ML libraries",
      "Go has better concurrency support",
      "Python is easier to prototype with"
    ]
  }'
```

### Scout Mode (explore options)

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test",
    "message": "What are my options for deploying a Go web app?"
  }'
```

### Gardener Mode (get feedback)

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test",
    "message": "Give me feedback on my API design"
  }'
```

### Implementation Mode (get steps)

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test",
    "message": "How do I implement JWT authentication in Go?"
  }'
```

---

## What's New Since Sprint 2

| Feature | Sprint 2 | Sprint 3 |
|---------|----------|----------|
| **Supervisor Agent** | ✅ Keyword-based | ✅ LLM-based (optional) |
| **Dojo Agent** | ❌ Not implemented | ✅ 4 modes implemented |
| **LLM Integration** | ❌ Not implemented | ✅ Ollama + OpenAI |
| **Perspectives** | ❌ Not supported | ✅ Supported in API |
| **Mode Detection** | ❌ N/A | ✅ Automatic inference |
| **Tests** | ✅ Supervisor + Librarian | ✅ All agents + LLM |

---

## Known Limitations (To Address in Future Sprints)

1. **No Streaming**: Responses are not streamed (Sprint 4)
2. **Simple JSON Parsing**: LLM responses parsed with string matching (Sprint 4)
3. **No Cost Tracking**: Token usage not tracked (Sprint 4)
4. **No Harness Trace**: Trace logging not yet implemented (Sprint 4)
5. **No Builder Agent**: Code generation not yet implemented (Sprint 4)

---

## Lessons Learned

1. **Unified Interface Works**: Single `Client` interface makes provider switching seamless
2. **Mode Inference is Smart**: Automatic mode detection works well for most queries
3. **Local-First is Fast**: Ollama responses are nearly instant
4. **Dojo Protocol Translates**: Philosophical principles map cleanly to code
5. **Testing is Essential**: Mock LLM client makes testing easy

---

## Next Steps: Sprint 4 (Builder Agent + Tools)

**Duration:** 4 days  
**Version:** v0.0.4

### Deliverables

1. **Builder Agent**
   - Code generation
   - File operations
   - Command execution

2. **Tool Registry**
   - 10 essential tools
   - Tool discovery
   - Tool execution

3. **Streaming Responses**
   - Server-sent events
   - Real-time updates

4. **Harness Trace**
   - Nested event logging
   - Observability

---

## Team Reflection

**Cruz:** Sprint 3 feels like the system came alive. The Dojo agent actually thinks with you. The four modes make sense. Local-first works beautifully.

**Manus (Dojo):** This is the heart of the system. The Dojo protocol is no longer just philosophy — it's running code. Working at the pace of understanding.

---

## Conclusion

Sprint 3 is complete. We have a fully functional Dojo Agent with four modes, LLM integration (local and cloud), and enhanced Supervisor routing. The system can now think with you, not just for you.

**Progress:** 3 of 4 sprints complete (75% of Phase 1: Core Backend)

**Next:** Sprint 4 — Builder Agent + Tools (the hands of the system)

Let's keep building. 🧘‍♂️

---

**Signed,**  
Cruz Morales & Manus AI (Dojo)  
January 22, 2026
