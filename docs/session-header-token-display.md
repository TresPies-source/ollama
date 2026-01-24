# Session Header Token Display - Implementation Summary

**Status:** ✅ Complete  
**Date:** January 23, 2026  
**Feature:** Display token count in session header

---

## Overview

Implemented a token count display in the session header that shows the total number of tokens (prompt + completion) used in the current session. The display is reactive and updates automatically when new messages are added.

---

## Implementation Details

### 1. Type Updates

**File:** `app/ui/app/src/types/dgd.ts`

Added optional token fields to the `Message` interface:

```typescript
export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  agent_type?: string;
  mode?: string;
  prompt_tokens?: number;      // ← Added
  completion_tokens?: number;  // ← Added
}
```

### 2. Token Calculation

**File:** `app/ui/app/src/routes/chat.$sessionId.tsx`

Implemented reactive token calculation:

```typescript
const totalTokens = messages.reduce((sum, msg) => {
  const promptTokens = msg.prompt_tokens || 0;
  const completionTokens = msg.completion_tokens || 0;
  return sum + promptTokens + completionTokens;
}, 0);
```

**Features:**
- Uses `reduce()` for efficient aggregation
- Handles missing token data gracefully (defaults to 0)
- Automatically recalculates when `messages` array changes

### 3. UI Display

Added token count to the session header:

```tsx
<div className="flex items-center gap-3">
  <p className="text-sm text-dojo-text-secondary">
    {isStreaming ? "Thinking..." : "Ready"}
  </p>
  {totalTokens > 0 && (
    <span className="text-sm text-dojo-text-tertiary">
      {totalTokens.toLocaleString()} tokens
    </span>
  )}
</div>
```

**Design:**
- **Styling:** Uses `text-dojo-text-tertiary` for subtle, non-intrusive display
- **Formatting:** Uses `toLocaleString()` for proper number formatting (1,234)
- **Conditional Rendering:** Only displays when `totalTokens > 0`
- **Responsive:** Flexbox layout adapts to different screen sizes

---

## Testing

**File:** `app/ui/app/src/routes/__tests__/chat.test.tsx`

Created comprehensive test suite with 5 tests:

1. ✅ Calculate total tokens from messages correctly
2. ✅ Handle messages without token data gracefully
3. ✅ Format token count with locale formatting
4. ✅ Handle empty messages array
5. ✅ Calculate tokens for messages with partial token data

**Test Results:**
```
✓ src/routes/__tests__/chat.test.tsx (5 tests) 15ms
  Test Files  1 passed (1)
  Tests  5 passed (5)
```

---

## Verification

### Current Behavior

- The token display code is implemented and tested
- Token count will appear in the header when messages have token data
- Currently not visible because:
  1. No LLM provider is configured (using keyword-based classification)
  2. Messages in database don't have token counts yet
  
### Expected Behavior (with LLM configured)

When an LLM provider (Ollama/OpenAI) returns token counts:

```
┌─────────────────────────────────────────────┐
│ 🥋  New Chat                         Trail  │
│     Ready  |  1,234 tokens                  │
└─────────────────────────────────────────────┘
```

The token count will:
- Display next to the "Ready" status
- Update in real-time as messages are added
- Format with comma separators (e.g., 1,234,567)
- Use tertiary text color for subtle appearance

---

## Files Modified

1. `app/ui/app/src/types/dgd.ts` - Added token fields to Message interface
2. `app/ui/app/src/routes/chat.$sessionId.tsx` - Implemented token calculation and display
3. `app/ui/app/src/routes/__tests__/chat.test.tsx` - Created test suite (new file)

---

## Next Steps

To see the token display in action:

1. Configure an LLM provider (Ollama or OpenAI)
2. Ensure backend returns `prompt_tokens` and `completion_tokens` in messages
3. Send messages in a session
4. Token count will automatically appear in the header

---

## Success Criteria

- ✅ Token count visible in session header (when messages have token data)
- ✅ Count updates when new messages added (reactive calculation)
- ✅ Formatting uses locale conventions (toLocaleString())
- ✅ Styling matches Dojo Genesis design system (text-dojo-text-tertiary)
- ✅ All tests pass (5/5)

**Status:** COMPLETE
