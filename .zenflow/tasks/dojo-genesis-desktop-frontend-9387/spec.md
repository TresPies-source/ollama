# Technical Specification: Dojo Genesis Desktop Frontend v0.1.0

**Project:** Dojo Genesis Desktop  
**Phase:** Phase 2 (Frontend + Desktop Integration)  
**Version:** v0.0.4 → v0.1.0  
**Complexity:** **HARD**  
**Duration:** 2 weeks (7 specs)  
**Date:** January 22, 2026

---

## Complexity Assessment: HARD

This is a **hard** complexity task due to:

1. **Large Scope**: 7 distinct specifications spanning multiple weeks
2. **Architectural Complexity**: Desktop integration with native webview, not Electron
3. **Design System**: Complete visual redesign with glassmorphism and custom branding
4. **Multiple Integration Points**: Backend API, streaming SSE, trace visualization, file system
5. **Advanced Features**: React Flow visualization, CodeMirror editor, real-time streaming
6. **Cross-Platform**: Must work on macOS, Windows, and Linux
7. **High Visual Fidelity**: Stunning glassmorphism effects, animations, gradients

---

## Technical Context

### Stack Overview

**Frontend:**
- React 19.1.0
- TypeScript 5.8.3
- Vite 6.3.5
- TanStack Router 1.120.20
- TanStack Query 5.80.7
- Tailwind CSS 4.1.9
- Framer Motion 12.17.0 (already installed)

**Additional Dependencies Required:**
- `@xyflow/react` (for Trail of Thought)
- `@uiw/react-codemirror` + `@codemirror/lang-*` (for File Editor)
- `js-yaml` (for seed frontmatter parsing)
- `react-markdown` (already installed)

**Backend (Already Complete):**
- Go 1.23 + Gin
- SQLite database
- 4 agents (Supervisor, Dojo, Librarian, Builder)
- 11 tools
- SSE streaming support
- Harness Trace logging

**Desktop Integration:**
- Native webview (WebKit on macOS, WebView2 on Windows)
- Go binary with embedded React build (`//go:embed`)
- System tray integration
- Auto-updater via GitHub releases

### Existing Codebase Structure

```
app/
├── ui/app/                    # React frontend (Ollama base)
│   ├── src/
│   │   ├── components/        # Existing UI components
│   │   │   ├── ui/           # Primitives (Button, Input, Badge, etc.)
│   │   │   ├── Chat.tsx
│   │   │   ├── ChatForm.tsx
│   │   │   ├── Message.tsx
│   │   │   └── ...
│   │   ├── routes/           # TanStack Router routes
│   │   │   ├── __root.tsx
│   │   │   ├── c.$chatId.tsx
│   │   │   ├── index.tsx
│   │   │   └── settings.tsx
│   │   ├── hooks/            # React hooks
│   │   ├── contexts/         # React contexts
│   │   ├── api.ts            # API client
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── webview/                   # Native webview integration
├── darwin/                    # macOS-specific code
├── wintray/                   # Windows system tray
└── ...

dgd/                          # Backend (Phase 1 - Complete)
├── agents/
│   ├── supervisor/
│   ├── dojo/
│   ├── librarian/
│   └── builder/
├── api/
│   ├── handlers.go           # HTTP handlers
│   ├── stream.go             # SSE streaming
│   └── types.go              # API types
├── database/                 # SQLite
├── tools/                    # 11 tools
├── trace/                    # Trace logging
└── cmd/dgd/main.go          # Server entry point
```

---

## Backend API Reference

### Available Endpoints

All endpoints run on `http://localhost:8080` by default.

#### 1. **Chat Endpoints**

**POST /api/chat**
- **Purpose:** Send message and get response (blocking)
- **Request:**
  ```json
  {
    "session_id": "uuid",
    "message": "user query",
    "perspectives": ["perspective1", "perspective2"] // optional
  }
  ```
- **Response:**
  ```json
  {
    "session_id": "uuid",
    "message_id": "uuid",
    "content": "assistant response",
    "agent_type": "dojo|librarian|builder",
    "mode": "mirror|scout|gardener|implementation", // for dojo only
    "done": true
  }
  ```

**POST /api/chat/stream**
- **Purpose:** Send message and get streaming response (SSE)
- **Request:** Same as `/api/chat`
- **Response:** Server-Sent Events stream
  ```
  data: {"content": "partial response...", "done": false}
  data: {"content": "complete response", "done": true, "agent_type": "dojo", "mode": "mirror"}
  ```

#### 2. **Session Endpoints**

**POST /api/sessions**
- **Purpose:** Create new session
- **Request:**
  ```json
  {
    "title": "Session Title",
    "working_dir": "/path/to/working/dir"
  }
  ```
- **Response:**
  ```json
  {
    "session_id": "uuid"
  }
  ```

**GET /api/sessions**
- **Purpose:** List all sessions
- **Response:**
  ```json
  {
    "sessions": [
      {
        "id": "uuid",
        "title": "Session Title",
        "working_dir": "/path",
        "created_at": "2026-01-22T12:00:00Z",
        "updated_at": "2026-01-22T12:30:00Z",
        "status": "active"
      }
    ]
  }
  ```

**GET /api/sessions/:id**
- **Purpose:** Get session with messages
- **Response:**
  ```json
  {
    "session": {
      "id": "uuid",
      "title": "Session Title",
      "working_dir": "/path",
      "created_at": "2026-01-22T12:00:00Z",
      "updated_at": "2026-01-22T12:30:00Z",
      "status": "active"
    },
    "messages": [
      {
        "id": "uuid",
        "session_id": "uuid",
        "role": "user|assistant",
        "content": "message content",
        "created_at": "2026-01-22T12:00:00Z",
        "agent_type": "dojo",
        "mode": "mirror"
      }
    ]
  }
  ```

#### 3. **Trace Endpoints**

**GET /api/trace/:id**
- **Purpose:** Get trace for session
- **Response:**
  ```json
  {
    "session_id": "uuid",
    "start_time": "2026-01-22T12:00:00Z",
    "end_time": "2026-01-22T12:05:00Z",
    "events": [
      {
        "span_id": "span_1234567890",
        "parent_id": "span_1234567889",
        "event_type": "MODE_TRANSITION|TOOL_INVOCATION|PERSPECTIVE_INTEGRATION|LLM_CALL|AGENT_ROUTING|FILE_OPERATION|ERROR",
        "timestamp": "2026-01-22T12:00:01Z",
        "inputs": {},
        "outputs": {},
        "metadata": {}
      }
    ]
  }
  ```

#### 4. **Health Endpoint**

**GET /health**
- **Purpose:** Health check
- **Response:** `200 OK`

---

## Design System Specification

### Color Palette

```css
:root {
  /* Background & Structure */
  --bg-primary: #0a1e2e;      /* Deep teal-navy */
  --bg-secondary: #0f2a3d;    /* Slightly lighter teal */
  --bg-tertiary: #1a3647;     /* Even lighter teal */
  
  /* Accent Colors */
  --accent-primary: #f4a261;   /* Warm golden-orange */
  --accent-secondary: #e76f51; /* Deeper orange-red */
  --accent-tertiary: #ffd166;  /* Light golden yellow */
  
  /* Gradients */
  --gradient-sunset: linear-gradient(135deg, #f4a261 0%, #e76f51 50%, #ffd166 100%);
  --gradient-ocean: linear-gradient(135deg, #0a1e2e 0%, #0f2a3d 50%, #1a3647 100%);
  
  /* Glassmorphism */
  --glass-bg: rgba(15, 42, 61, 0.7);
  --glass-bg-light: rgba(15, 42, 61, 0.5);
  --glass-border: rgba(244, 162, 97, 0.2);
  --glass-blur: 12px;
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: #b0c4de;
  --text-tertiary: #8a9fb8;
  
  /* Animations */
  --ease-natural: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Shadows */
  --shadow-glass: 0 8px 32px 0 rgba(10, 30, 46, 0.37);
  --shadow-glow: 0 0 20px rgba(244, 162, 97, 0.3);
}
```

### Typography

**Fonts:**
- **UI Font:** Inter (system fallback: ui-sans-serif, system-ui)
- **Code Font:** JetBrains Mono (system fallback: ui-monospace, monospace)

**Scale:**
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### Component Primitives

#### 1. **Button**
- **Primary:** Sunset gradient background, white text, shadow, hover lift
- **Secondary:** Glass background, accent border, blur effect
- **Ghost:** Transparent, accent text, hover glass effect

#### 2. **Input**
- **Default:** Glass background, accent border on focus, blur effect
- **With Icon:** Left icon support
- **Textarea:** Multi-line support

#### 3. **Card**
- **Default:** Glass background, rounded corners (12px), shadow
- **Hover:** Lift effect, glow shadow
- **Accent:** Sunset gradient border

#### 4. **Badge**
- **Small:** Pill shape, accent background, small text
- **With Dot:** Pulsing dot indicator

#### 5. **Avatar**
- **Circular:** Round image, glass border
- **With Status:** Status indicator dot

### Animation Guidelines

**Transitions:**
- **Duration:** 200-300ms for micro-interactions, 400-600ms for larger movements
- **Easing:** Use `--ease-natural` for most, `--ease-bounce` for playful effects

**Common Patterns:**
- **Fade In:** Opacity 0 → 1
- **Slide Up:** Transform translateY(20px) → translateY(0)
- **Lift:** Transform translateY(0) → translateY(-4px)
- **Glow:** Shadow none → shadow-glow

---

## Implementation Approach

### Week 1: React Frontend Foundation

#### **Spec 1: Setup & Design System** (6 hours)

**Goal:** Rebrand Ollama app and implement design system primitives.

**Tasks:**
1. Update branding in `package.json`, `index.html`
2. Install dependencies: None needed (framer-motion already installed)
3. Create `src/styles/theme.css` with Dojo Genesis CSS variables
4. Update `tailwind.config.js` with custom theme
5. Create/update 5 primitives in `src/components/ui/`:
   - `button.tsx` (update existing)
   - `input.tsx` (update existing)
   - `card.tsx` (create new)
   - `badge.tsx` (update existing)
   - `avatar.tsx` (create new)
6. Create component gallery route: `src/routes/components.tsx`

**Files to Create/Modify:**
- **Create:**
  - `src/styles/theme.css`
  - `src/components/ui/card.tsx`
  - `src/components/ui/avatar.tsx`
  - `src/routes/components.tsx`
- **Modify:**
  - `package.json` (name, version)
  - `index.html` (title)
  - `tailwind.config.js` (theme extension)
  - `src/index.css` (import theme.css)
  - `src/components/ui/button.tsx` (add variants)
  - `src/components/ui/input.tsx` (add glass effect)
  - `src/components/ui/badge.tsx` (update styling)

**Integration Points:**
- Existing Tailwind setup in `app/ui/app/tailwind.config.js`
- Existing component structure in `src/components/ui/`

**Verification:**
```bash
cd app/ui/app
npm install
npm run dev
# Visit http://localhost:5173/components
# Verify all 5 primitives display with glassmorphism
# Take screenshot: component_gallery.png
```

---

#### **Spec 2: Chat Interface** (8 hours)

**Goal:** Build chat interface with SSE streaming and glassmorphism design.

**Tasks:**
1. Create new API client functions for DGD backend
2. Build chat components:
   - `ChatLayout.tsx` (full-screen layout)
   - `MessageList.tsx` (auto-scrolling container)
   - `MessageBubble.tsx` (glass card with avatar)
   - `MessageInput.tsx` (glass input with send button)
   - `AgentAvatar.tsx` (circular avatar with Dojo logo)
   - `StreamingIndicator.tsx` (pulsing dot)
3. Integrate SSE streaming
4. Add Framer Motion animations
5. Create chat route: `src/routes/chat.$sessionId.tsx`

**Files to Create/Modify:**
- **Create:**
  - `src/api/dgd-client.ts` (DGD backend API client)
  - `src/components/chat/ChatLayout.tsx`
  - `src/components/chat/MessageList.tsx`
  - `src/components/chat/MessageBubble.tsx`
  - `src/components/chat/MessageInput.tsx`
  - `src/components/chat/AgentAvatar.tsx`
  - `src/components/chat/StreamingIndicator.tsx`
  - `src/routes/chat.$sessionId.tsx`
  - `src/hooks/useChatStream.ts`
- **Modify:**
  - `src/api.ts` (add DGD endpoints)

**API Integration:**
- **POST /api/chat/stream**: SSE streaming
- **POST /api/chat**: Fallback non-streaming
- **GET /api/sessions/:id**: Load chat history

**Verification:**
```bash
# Start backend
cd dgd
export LLM_PROVIDER=ollama
export LLM_MODEL=llama3.2:3b
go run cmd/dgd/main.go

# Start frontend
cd app/ui/app
npm run dev

# Test chat
# 1. Create session via API
# 2. Navigate to /chat/{session_id}
# 3. Send message
# 4. Verify streaming works
# Screenshot: chat_interface.png
```

---

#### **Spec 3: Session Management** (6 hours)

**Goal:** Build session management page with grid layout and glassmorphism.

**Tasks:**
1. Create session components:
   - `SessionGrid.tsx` (responsive grid)
   - `SessionCard.tsx` (glass card)
   - `NewSessionModal.tsx` (glass modal)
   - `DeleteConfirmDialog.tsx` (confirmation)
2. Integrate with backend API
3. Add Framer Motion stagger animations
4. Create sessions route: `src/routes/sessions.tsx`

**Files to Create/Modify:**
- **Create:**
  - `src/components/sessions/SessionGrid.tsx`
  - `src/components/sessions/SessionCard.tsx`
  - `src/components/sessions/NewSessionModal.tsx`
  - `src/components/sessions/DeleteConfirmDialog.tsx`
  - `src/routes/sessions.tsx`
  - `src/hooks/useSessions.ts`

**API Integration:**
- **GET /api/sessions**: List sessions
- **POST /api/sessions**: Create session
- **DELETE /api/sessions/:id**: Delete session (TODO: implement backend)

**Verification:**
```bash
# Test session API
curl http://localhost:8080/api/sessions

# Visit http://localhost:5173/sessions
# Verify grid layout
# Screenshot: sessions_page.png
```

---

### Week 2: Advanced Features & Desktop Integration

#### **Spec 4: File Explorer** (8 hours)

**Goal:** Build file explorer with split-view and CodeMirror editor.

**Tasks:**
1. Install `@uiw/react-codemirror` and language extensions
2. Create file components:
   - `FileExplorer.tsx` (split-view container)
   - `FileTree.tsx` (recursive tree)
   - `FileEditor.tsx` (CodeMirror wrapper)
   - `FileTreeNode.tsx` (tree node with icon)
3. Integrate with Librarian agent
4. Add file operations (read, save)
5. Create files route: `src/routes/files.tsx`

**Dependencies:**
```json
{
  "@uiw/react-codemirror": "^4.21.0",
  "@codemirror/lang-javascript": "^6.2.0",
  "@codemirror/lang-python": "^6.1.0",
  "@codemirror/lang-markdown": "^6.2.0",
  "@codemirror/lang-json": "^6.0.0",
  "@codemirror/lang-html": "^6.4.0",
  "@codemirror/lang-css": "^6.2.0"
}
```

**Files to Create/Modify:**
- **Create:**
  - `src/components/files/FileExplorer.tsx`
  - `src/components/files/FileTree.tsx`
  - `src/components/files/FileEditor.tsx`
  - `src/components/files/FileTreeNode.tsx`
  - `src/routes/files.tsx`
  - `src/hooks/useFileTree.ts`

**API Integration:**
- Use **Librarian agent** via `/api/chat`
- Message: "list files in workspace"
- Message: "read file {path}"

**Verification:**
```bash
# Create test file
mkdir -p ~/.dgd/workspace
echo "# Test File" > ~/.dgd/workspace/test.md

# Test via chat
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","message":"list files in workspace"}'

# Visit http://localhost:5173/files
# Screenshot: file_explorer.png
```

---

#### **Spec 5: Seed Browser** (6 hours)

**Goal:** Build seed browser with search and detail modal.

**Tasks:**
1. Install `js-yaml` for frontmatter parsing
2. Create seed components:
   - `SeedGrid.tsx` (grid layout)
   - `SeedCard.tsx` (glass card with gradient accent)
   - `SeedDetailModal.tsx` (full-screen modal)
   - `SeedSearch.tsx` (search/filter bar)
3. Integrate with Librarian agent
4. Parse YAML frontmatter
5. Create seeds route: `src/routes/seeds.tsx`

**Dependencies:**
```json
{
  "js-yaml": "^4.1.0",
  "@types/js-yaml": "^4.0.9"
}
```

**Files to Create/Modify:**
- **Create:**
  - `src/components/seeds/SeedGrid.tsx`
  - `src/components/seeds/SeedCard.tsx`
  - `src/components/seeds/SeedDetailModal.tsx`
  - `src/components/seeds/SeedSearch.tsx`
  - `src/routes/seeds.tsx`
  - `src/hooks/useSeeds.ts`
  - `src/utils/seedParser.ts`

**API Integration:**
- Use **Librarian agent** via `/api/chat`
- Message: "list all seeds"

**Seed Format:**
```markdown
---
name: Memory Management
description: Context Iceberg pattern
category: architecture
tags: [memory, performance]
---
# Memory Management
Content goes here...
```

**Verification:**
```bash
# Create test seed
mkdir -p ~/.dgd/seeds
cat > ~/.dgd/seeds/memory.md << 'EOF'
---
name: Memory Management
description: Context Iceberg pattern
category: architecture
tags: [memory, performance]
---
# Memory Management
Use the 4-tier Context Iceberg...
EOF

# Test via chat
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","message":"list all seeds"}'

# Visit http://localhost:5173/seeds
# Screenshot: seed_browser.png
```

---

#### **Spec 6: Trail of Thought** (10 hours)

**Goal:** Build interactive trace visualization with React Flow.

**Tasks:**
1. Install React Flow
2. Create trace components:
   - `TraceGraph.tsx` (React Flow wrapper)
   - `TraceNode.tsx` (custom node component)
   - `TraceControls.tsx` (zoom/pan controls)
   - `TraceTimeline.tsx` (timeline view)
3. Parse trace data to graph structure
4. Implement color-coding by event type
5. Add interactivity (expand nodes, highlight paths)
6. Create trace route: `src/routes/trace.$sessionId.tsx`

**Dependencies:**
```json
{
  "@xyflow/react": "^12.0.0"
}
```

**Files to Create/Modify:**
- **Create:**
  - `src/components/trace/TraceGraph.tsx`
  - `src/components/trace/TraceNode.tsx`
  - `src/components/trace/TraceControls.tsx`
  - `src/components/trace/TraceTimeline.tsx`
  - `src/routes/trace.$sessionId.tsx`
  - `src/hooks/useTrace.ts`
  - `src/utils/traceParser.ts`

**API Integration:**
- **GET /api/trace/:id**: Fetch trace data

**Event Type Colors:**
```css
MODE_TRANSITION: Sunset gradient border
TOOL_INVOCATION: Blue accent (#3b82f6)
PERSPECTIVE_INTEGRATION: Green accent (#10b981)
AGENT_ROUTING: Purple accent (#8b5cf6)
LLM_CALL: Yellow accent (#fbbf24)
FILE_OPERATION: Teal accent (#14b8a6)
ERROR: Red accent (#ef4444)
```

**Verification:**
```bash
# Generate trace by sending message
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","message":"Help me think about Go vs Python","perspectives":["Go is faster","Python has better ML libraries"]}'

# Get trace
curl http://localhost:8080/api/trace/test | jq

# Visit http://localhost:5173/trace/test
# Screenshot: trail_of_thought.png
```

---

#### **Spec 7: Desktop Integration** (12 hours)

**Goal:** Build standalone desktop app with native webview and system tray.

**Tasks:**
1. Build React app for production
2. Embed React build in Go binary using `//go:embed`
3. Create webview integration
4. Implement system tray
5. Add auto-updater
6. Create build scripts for macOS, Windows, Linux
7. Test desktop app

**Files to Create/Modify:**
- **Create:**
  - `app/cmd/dgd-desktop/main.go` (desktop app entry)
  - `app/embed.go` (embed React build)
  - `app/tray.go` (system tray)
  - `app/updater.go` (auto-updater)
  - `Makefile` (build scripts)
- **Modify:**
  - Study existing Ollama patterns:
    - `app/webview/` (webview integration)
    - `app/darwin/` (macOS integration)
    - `app/wintray/` (Windows tray)

**Build Process:**
1. Build React app: `cd app/ui/app && npm run build`
2. Embed build: `//go:embed ui/app/dist`
3. Build Go binary: `go build -o dgd-desktop ./app/cmd/dgd-desktop`

**Integration Pattern (from Ollama):**
```go
// app/cmd/dgd-desktop/main.go
package main

import (
    "embed"
    "github.com/TresPies-source/dgd/app/webview"
)

//go:embed ui/app/dist
var embeddedUI embed.FS

func main() {
    // Start backend server
    go startBackend()
    
    // Create webview
    webview.Start(embeddedUI, "Dojo Genesis Desktop")
}
```

**System Tray Menu:**
- Open
- Check for Updates
- Quit

**Verification:**
```bash
# Build desktop app
cd app/ui/app
npm run build

cd ../..
go build -o dgd-desktop ./cmd/dgd-desktop

# Run desktop app
./dgd-desktop

# Verify:
# - App opens in native window
# - UI loads correctly
# - System tray icon appears
# - Menu works
# Screenshots:
# - desktop_app.png
# - system_tray.png
```

---

## Data Model Changes

No database schema changes required. All APIs are already implemented in Phase 1.

---

## API Changes

No backend API changes required. All endpoints are already implemented:
- ✅ `/api/chat`
- ✅ `/api/chat/stream`
- ✅ `/api/sessions`
- ✅ `/api/sessions/:id`
- ✅ `/api/trace/:id`
- ✅ `/health`

**Note:** May need to add `DELETE /api/sessions/:id` for session deletion, but this is optional for v0.1.0.

---

## Interface Changes

### New TypeScript Types

```typescript
// src/types/dgd.ts

export interface Session {
  id: string;
  title: string;
  working_dir: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  agent_type?: 'dojo' | 'librarian' | 'builder';
  mode?: 'mirror' | 'scout' | 'gardener' | 'implementation';
}

export interface ChatRequest {
  session_id: string;
  message: string;
  perspectives?: string[];
  stream?: boolean;
}

export interface ChatResponse {
  session_id: string;
  message_id: string;
  content: string;
  agent_type: string;
  mode?: string;
  done: boolean;
}

export interface Trace {
  session_id: string;
  start_time: string;
  end_time?: string;
  events: TraceEvent[];
}

export interface TraceEvent {
  span_id: string;
  parent_id?: string;
  event_type: 'MODE_TRANSITION' | 'TOOL_INVOCATION' | 'PERSPECTIVE_INTEGRATION' | 'LLM_CALL' | 'AGENT_ROUTING' | 'FILE_OPERATION' | 'ERROR';
  timestamp: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Seed {
  path: string;
  metadata: {
    name: string;
    description: string;
    category: string;
    tags: string[];
  };
  content: string;
}

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size_bytes?: number;
  children?: FileNode[];
}
```

---

## Verification Approach

### Testing Strategy

**Unit Tests:**
- Component rendering (Vitest + @vitest/browser)
- Utility functions (seed parsing, trace parsing)
- Hooks (custom React hooks)

**Integration Tests:**
- API client functions
- SSE streaming
- File operations

**Manual Testing:**
- Visual testing (component gallery)
- User flows (create session, chat, view trace)
- Desktop app (window, tray, updates)

### Test Commands

```bash
# Unit tests
npm test

# Coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run build  # TypeScript compilation
```

### Verification Checklist

**Week 1:**
- [ ] Component gallery displays all 5 primitives
- [ ] Glassmorphism effects are visible
- [ ] Chat interface sends/receives messages
- [ ] SSE streaming works
- [ ] Sessions page lists sessions
- [ ] Can create new session
- [ ] Screenshots: `component_gallery.png`, `chat_interface.png`, `sessions_page.png`

**Week 2:**
- [ ] File explorer displays tree
- [ ] CodeMirror editor loads and saves
- [ ] Seed browser displays seeds
- [ ] Seed detail modal works
- [ ] Trail of Thought visualizes trace
- [ ] Nodes are color-coded
- [ ] Desktop app runs
- [ ] System tray works
- [ ] Screenshots: `file_explorer.png`, `seed_browser.png`, `trail_of_thought.png`, `desktop_app.png`, `system_tray.png`

---

## Risk Assessment

### High Risks

1. **Desktop Integration Complexity**
   - **Risk:** Webview integration may have platform-specific issues
   - **Mitigation:** Follow Ollama's proven patterns closely, test on all platforms early

2. **SSE Streaming Implementation**
   - **Risk:** Real-time streaming may have edge cases
   - **Mitigation:** Implement fallback to non-streaming, add retry logic

3. **Trail of Thought Visualization**
   - **Risk:** Complex graph layout may be slow or confusing
   - **Mitigation:** Start simple, iterate on layout, add controls

### Medium Risks

1. **Design System Consistency**
   - **Risk:** Glassmorphism may not work on all backgrounds
   - **Mitigation:** Test extensively, provide fallbacks

2. **File Operations via Agent**
   - **Risk:** Parsing agent responses for file data is fragile
   - **Mitigation:** Add structured output to backend if needed

### Low Risks

1. **Dependencies**
   - **Risk:** New dependencies may have vulnerabilities
   - **Mitigation:** Use well-maintained libraries, audit regularly

---

## Success Criteria

### Functional Requirements

- [ ] All 7 specs implemented
- [ ] Chat interface works with streaming
- [ ] Session management functional
- [ ] File explorer can view/edit files
- [ ] Seed browser displays seeds
- [ ] Trail of Thought visualizes traces
- [ ] Desktop app runs on macOS, Windows, Linux

### Non-Functional Requirements

- [ ] UI matches design system (glassmorphism, sunset gradients)
- [ ] Animations are smooth (60 FPS)
- [ ] Performance is acceptable (<100ms UI interactions)
- [ ] Desktop app binary size <100MB
- [ ] All tests pass
- [ ] TypeScript compilation succeeds

### Deliverables

- [ ] React app (rebranded, redesigned)
- [ ] 7 feature pages (chat, sessions, files, seeds, trace, components, settings)
- [ ] Desktop app (macOS, Windows, Linux)
- [ ] Build scripts (Makefile)
- [ ] 10 screenshots (verification evidence)
- [ ] Updated README with installation instructions

---

## Timeline

**Week 1: React Frontend Foundation**
- Day 1-2: Spec 1 (Setup & Design System) - 6 hours
- Day 3-4: Spec 2 (Chat Interface) - 8 hours
- Day 5: Spec 3 (Session Management) - 6 hours

**Week 2: Advanced Features & Desktop Integration**
- Day 1-2: Spec 4 (File Explorer) - 8 hours
- Day 3: Spec 5 (Seed Browser) - 6 hours
- Day 4-5: Spec 6 (Trail of Thought) - 10 hours
- Day 6-7: Spec 7 (Desktop Integration) - 12 hours

**Total:** 56 hours over 2 weeks

---

## Notes

1. **Ollama Fork:** We're building on top of Ollama's proven desktop architecture, not rebuilding from scratch
2. **Phase 1 Complete:** Backend is fully functional, no backend changes needed
3. **Design First:** Visual design is critical - glassmorphism must be stunning
4. **Local-First:** All data stays on user's machine, no cloud dependencies
5. **Planning with Files:** Foundation laid in Phase 1, will be expanded in future phases

---

## Related Documents

- **Backend Code:** `dgd/` directory (Phase 1)
- **Ollama Reference:** `app/` directory
- **Sprint Reports:** `dgd/SPRINT_[1-4]_REPORT.md`
- **Task Prompt:** `.zenflow/tasks/dojo-genesis-desktop-frontend-9387/` (Zenflow prompt)

---

**Specification Status:** ✅ Complete  
**Ready for Implementation:** Yes  
**Next Step:** Create implementation plan in `plan.md`
