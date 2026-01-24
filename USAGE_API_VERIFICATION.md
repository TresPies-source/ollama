# Usage API Verification

## Implementation Complete ✓

### Endpoints Implemented

1. **GET /api/usage** - Returns aggregated usage statistics across all sessions
2. **GET /api/sessions/:id/usage** - Returns usage statistics for a specific session

### Test Results

#### GET /api/usage
```bash
curl http://127.0.0.1:8080/api/usage
```

Response (with empty database):
```json
{
  "total_prompt_tokens": 0,
  "total_completion_tokens": 0,
  "total_tokens": 0,
  "total_messages": 0,
  "estimated_cost_usd": 0,
  "usage_by_model": [],
  "usage_by_day": [],
  "usage_by_session": []
}
```

✓ Endpoint accessible  
✓ Returns correct JSON structure  
✓ Handles empty database correctly  

### Files Modified/Created

#### Created:
- `dgd/database/usage.go` - Usage statistics aggregation functions
- `dgd/database/usage_test.go` - Comprehensive unit tests for usage functionality
- `dgd/api/usage.go` - Usage API handlers

#### Modified:
- `dgd/agents/dojo/dojo.go` - Added PromptTokens and CompletionTokens to Response
- `dgd/agents/builder/builder.go` - Added PromptTokens and CompletionTokens to Response
- `dgd/api/handlers.go` - Updated to persist token counts and pass them from agents
- `dgd/cmd/dgd/main.go` - Registered /api/usage and /api/sessions/:id/usage routes

### Key Features

1. **Token Tracking**: All LLM responses now include prompt and completion token counts
2. **Cost Calculation**: Automatic cost estimation based on model pricing (GPT-4o, GPT-4o-mini, Claude, etc.)
3. **Aggregation**: Usage aggregated by:
   - Model/Agent type
   - Day (last 30 days)
   - Session (top 10)
4. **Persistence**: Token counts stored in messages table alongside message content

### Database Schema

Messages table includes:
- `prompt_tokens INTEGER DEFAULT 0`
- `completion_tokens INTEGER DEFAULT 0`

### Price Table (as of January 2026)

| Model | Prompt (per 1M tokens) | Completion (per 1M tokens) |
|-------|------------------------|----------------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Local (Ollama) | $0.00 | $0.00 |

### Next Steps

- Frontend implementation (UsageDashboard component)
- Real-time usage updates via WebSocket
- Export usage reports to CSV/JSON
