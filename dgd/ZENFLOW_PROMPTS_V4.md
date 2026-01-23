# Zenflow Prompt: v0.1.0 - Dojo Genesis Desktop Frontend

**Project:** Dojo Genesis Desktop  
**Version:** v0.0.4 → v0.1.0  
**Duration:** 2 weeks  
**Approach:** Specification-driven with verification

---

## Context

### Phase 1 Complete (v0.0.1 - v0.0.4)

We built a complete Go backend with 4 agents, 11 tools, and production-grade infrastructure:

**Agents:**
- Supervisor: Intent classification and routing
- Dojo: Four modes (Mirror, Scout, Gardener, Implementation)
- Librarian: File search and seed retrieval
- Builder: Code generation and tool execution

**Infrastructure:**
- SQLite database (sessions, messages, traces, seeds)
- Streaming SSE API (`/api/chat/stream`)
- Harness Trace logging (nested span tracking)
- Tool Registry (11 essential tools)

**Tests:** 30+ test cases, 100% pass rate

### Phase 2 Goal (v0.1.0)

Build the React frontend and desktop integration by forking Ollama's proven architecture.

**Why Ollama Fork:**
- Proven desktop app pattern (Go + React + native webview)
- Lightweight binaries (~50-100MB)
- Cross-platform (macOS, Windows, Linux)
- No Electron overhead

---

## Repository Context

**Fork:** TresPies-source/ollama  
**Backend Code:** `/home/ubuntu/dgd/` (Phase 1 deliverables)  
**Frontend Base:** `app/ui/app/` (Ollama's React app)  
**Design Spec:** Dojo Genesis.docx (Section 7: Stunning Visual Design System)

### Key Patterns to Follow

**From Ollama:**
- React 19 + Vite + TanStack Router
- Native webview (WebKit/WebView2, not Electron)
- `//go:embed` for embedding React build
- System tray integration
- Auto-updater via GitHub releases

**From Dojo Genesis:**
- Glassmorphism (blur, transparency, layered depth)
- Logo-aligned colors (teal-navy base, golden-orange accents)
- Natural animations (cubic-bezier easing)
- Planning with Files (filesystem as source of truth)

---

## Design System Reference

### Color Palette

```css
:root {
  /* Background & Structure */
  --bg-primary: #0a1e2e;      /* Deep teal-navy */
  --bg-secondary: #0f2a3d;    /* Slightly lighter teal */
  
  /* Accent Colors */
  --accent-primary: #f4a261;   /* Warm golden-orange */
  --accent-secondary: #e76f51; /* Deeper orange-red */
  
  /* Gradients */
  --gradient-sunset: linear-gradient(135deg, #f4a261 0%, #e76f51 50%, #ffd166 100%);
  
  /* Glassmorphism */
  --glass-bg: rgba(15, 42, 61, 0.7);
  --glass-blur: 12px;
  
  /* Animations */
  --ease-natural: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### Typography

- **UI Font:** Inter
- **Code Font:** JetBrains Mono

### Component Primitives

- **Button:** Primary (sunset gradient), Secondary (glass), Ghost (transparent)
- **Input:** Glass background, accent border on focus
- **Card:** Glassmorphism effect, 12px border radius
- **Badge:** Small pill with accent background
- **Avatar:** Circular with glass border

---

## Week 1: React Frontend Foundation

### Spec 1: Setup & Design System (6 hours)

**Requirements:**

1. **Rebrand Ollama React App**
   - Update `package.json`: name "dojo-genesis-desktop", version "0.1.0"
   - Update `index.html`: title "Dojo Genesis Desktop"
   - Add dependencies: framer-motion, react-flow-renderer

2. **Implement Design System**
   - Create `tailwind.config.js` with Dojo Genesis theme
   - Create `globals.css` with CSS variables
   - Build 5 primitive components (Button, Input, Card, Badge, Avatar)
   - Create component gallery page

**Success Criteria:**
- [ ] `npm run dev` works at http://localhost:5173
- [ ] Component gallery shows all 5 primitives
- [ ] Glassmorphism effect is visible
- [ ] Screenshot of component gallery

**Integration Points:**
- Existing Ollama Tailwind configuration
- Existing component structure in `app/ui/app/src/components/`

**Verification:**
```bash
cd app/ui/app
npm install
npm run dev
# Visit http://localhost:5173/components
# Screenshot: component_gallery.png
```

---

### Spec 2: Chat Interface (8 hours)

**Requirements:**

1. **Chat Page Layout**
   - Full-screen layout with glass background
   - Message list (center, scrollable)
   - Input field (bottom, glass effect)
   - Header with Dojo logo

2. **Message Components**
   - MessageList: Auto-scrolling container
   - MessageBubble: Glass card with avatar, content, timestamp
   - MessageInput: Textarea with send button (sunset gradient)
   - AgentAvatar: Circular avatar with Dojo logo
   - StreamingIndicator: Pulsing dot with glass effect

3. **API Integration**
   - Connect to `/api/chat` endpoint
   - Handle streaming via SSE (`/api/chat/stream`)
   - Display agent responses in real-time
   - Error handling with retry logic

4. **Animations**
   - Messages fade in + slide up (Framer Motion)
   - Input expands on focus
   - Send button pulses on hover

**Success Criteria:**
- [ ] Can send and receive messages
- [ ] Streaming works (tokens appear in real-time)
- [ ] Messages display with glassmorphism
- [ ] Animations are smooth
- [ ] Screenshot of chat interface

**Integration Points:**
- Backend API: `http://localhost:8080/api/chat`
- Backend SSE: `http://localhost:8080/api/chat/stream`
- Backend API structure: `/home/ubuntu/dgd/api/handlers.go`

**Verification:**
```bash
# Start backend
cd /home/ubuntu/dgd
go run cmd/dgd/main.go

# Start frontend
cd app/ui/app
npm run dev

# Test chat
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","message":"Hello Dojo"}'

# Screenshot: chat_interface.png
```

---

### Spec 3: Session Management (6 hours)

**Requirements:**

1. **Sessions Page**
   - Grid layout of session cards (3-4 columns)
   - Each card: title, last message, timestamp
   - Glass effect on cards
   - Hover effect (subtle glow)

2. **Session Operations**
   - Create new session (modal with glass effect)
   - List all sessions (`GET /api/sessions`)
   - Switch to session (navigate to `/chat/:id`)
   - Delete session (confirmation dialog)

3. **Animations**
   - Cards stagger in (Framer Motion)
   - Hover effects (scale + glow)
   - Modal transitions (fade + scale)

**Success Criteria:**
- [ ] Can create, list, switch, delete sessions
- [ ] Grid layout looks organized
- [ ] Glass effects are consistent
- [ ] Screenshot of sessions page

**Integration Points:**
- Backend API: `http://localhost:8080/api/sessions`
- Backend session logic: `/home/ubuntu/dgd/database/sessions.go`

**Verification:**
```bash
# Test session API
curl http://localhost:8080/api/sessions

# Screenshot: sessions_page.png
```

---

## Week 2: Advanced Features & Desktop Integration

### Spec 4: File Explorer (8 hours)

**Requirements:**

1. **Files Page Layout**
   - Split-view: File tree (left, 30%) + File editor (right, 70%)
   - Resizable split pane
   - Glass effect on both panels

2. **File Tree Component**
   - Recursive tree structure
   - Expand/collapse folders (animated)
   - File icons by type
   - Click to open in editor

3. **File Editor Component**
   - Monaco Editor with syntax highlighting
   - Save button (sunset gradient)
   - Auto-save on blur
   - Unsaved indicator

4. **API Integration**
   - Use Librarian agent to list files
   - Use Librarian agent to read file contents
   - Use Builder agent to write files

**Success Criteria:**
- [ ] Can browse file tree
- [ ] Can view and edit files
- [ ] Can save changes
- [ ] Syntax highlighting works
- [ ] Screenshot of file explorer

**Integration Points:**
- Backend Librarian: `/home/ubuntu/dgd/agents/librarian/librarian.go`
- Backend Builder: `/home/ubuntu/dgd/agents/builder/builder.go`

**Verification:**
```bash
# Create test file
mkdir -p ~/.dgd/workspace
echo "# Test File" > ~/.dgd/workspace/test.md

# Test via chat
curl -X POST http://localhost:8080/api/chat \
  -d '{"session_id":"test","message":"list files in workspace"}'

# Screenshot: file_explorer.png
```

---

### Spec 5: Seed Browser (6 hours)

**Requirements:**

1. **Seeds Page Layout**
   - Grid of seed cards (3-4 columns)
   - Search bar at top
   - Filter by category/tags

2. **Seed Card Component**
   - Glass card with sunset gradient accent
   - Show: name, description, category, tags
   - Hover effect (lift + glow)
   - Click to view details

3. **Seed Detail Modal**
   - Full-screen modal with glass background
   - Markdown rendering of seed content
   - "Apply to Chat" button
   - Close button

4. **API Integration**
   - Use Librarian to list seeds
   - Parse YAML frontmatter
   - Apply seed context to chat

**Success Criteria:**
- [ ] Can browse seeds in grid
- [ ] Can search and filter
- [ ] Can view seed details
- [ ] Can apply seed to chat
- [ ] Screenshot of seed browser

**Integration Points:**
- Backend Librarian: `/home/ubuntu/dgd/agents/librarian/librarian.go`
- Seed format: YAML frontmatter + Markdown content

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
  -d '{"session_id":"test","message":"list all seeds"}'

# Screenshot: seed_browser.png
```

---

### Spec 6: Trail of Thought (10 hours)

**Requirements:**

1. **Trail of Thought Component**
   - Use React Flow for graph visualization
   - Fetch trace from `/api/trace/:id`
   - Parse nested structure (span_id, parent_id)

2. **Node Styling**
   - Glassmorphism background
   - Color-code by event_type:
     - MODE_TRANSITION: Sunset gradient border
     - TOOL_INVOCATION: Blue accent
     - PERSPECTIVE_INTEGRATION: Green accent
     - ERROR: Red accent
   - Show: event_type, timestamp, summary

3. **Interactivity**
   - Click node to expand (show inputs/outputs)
   - Hover to highlight path
   - Zoom and pan controls
   - Minimap for navigation

4. **Layout**
   - Hierarchical layout (top-to-bottom)
   - Smooth edges (bezier curves)
   - Animated transitions

**Success Criteria:**
- [ ] Trace displays as interactive graph
- [ ] Nodes are color-coded
- [ ] Can expand nodes
- [ ] Zoom/pan works
- [ ] Screenshot of Trail of Thought

**Integration Points:**
- Backend trace API: `http://localhost:8080/api/trace/:id`
- Backend trace format: `/home/ubuntu/dgd/trace/trace.go`

**Verification:**
```bash
# Generate trace by sending message
curl -X POST http://localhost:8080/api/chat \
  -d '{"session_id":"test","message":"Help me think about Go vs Python","perspectives":["Go is faster","Python has better ML libraries"]}'

# Get trace ID from response
# Fetch trace
curl http://localhost:8080/api/trace/{trace_id}

# Screenshot: trail_of_thought.png
```

---

### Spec 7: Desktop Integration (12 hours)

**Requirements:**

1. **Embed React Build in Go Binary**
   - Build React app (`npm run build`)
   - Embed build output using `//go:embed`
   - Serve embedded files via HTTP handler

2. **Native Webview Integration**
   - Use Ollama's webview pattern
   - Create window with React app
   - Set window title, size, icon

3. **Build Scripts**
   - Create `Makefile`
   - Build for macOS (`.app` bundle)
   - Build for Windows (`.exe`)
   - Build for Linux (binary)

4. **System Tray**
   - Add tray icon (Dojo logo)
   - Add tray menu (Open, Check for Updates, Quit)
   - Handle menu actions

5. **Auto-Updater**
   - Check GitHub releases on startup
   - Compare versions
   - Download and install updates

**Success Criteria:**
- [ ] App runs as standalone executable
- [ ] React app loads in native webview
- [ ] UI is identical to browser version
- [ ] System tray works
- [ ] Auto-updater checks GitHub
- [ ] Screenshot of desktop app

**Integration Points:**
- Ollama's `app/main.go`
- Ollama's `app/webview/webview.go`
- Ollama's build process

**Verification:**
```bash
# Build desktop app
cd app
npm run build
go build -o dgd-desktop main.go

# Run desktop app
./dgd-desktop

# Screenshot: desktop_app.png
# Screenshot: system_tray.png
```

---

## Success Metrics

### Week 1
- [ ] React app runs with Dojo Genesis branding
- [ ] Design system matches blueprint
- [ ] Chat interface works (send/receive, streaming)
- [ ] Session management works

### Week 2
- [ ] File explorer works
- [ ] Seed browser works
- [ ] Trail of Thought visualizes traces
- [ ] Desktop app runs as standalone executable
- [ ] System tray and auto-updater work

### Phase 2 Complete
- [ ] Version v0.1.0 released
- [ ] Installers for macOS, Windows, Linux
- [ ] UI is stunning (glassmorphism, sunset gradients)
- [ ] All tests pass
- [ ] Documentation complete

---

## Zenflow Execution Guidelines

### For Each Spec

1. **Read the Repository First**
   - Review existing Ollama code
   - Understand patterns and conventions
   - Check Phase 1 backend code

2. **Implement the Specification**
   - Follow requirements exactly
   - Match existing code style
   - Integrate cleanly

3. **Test Thoroughly**
   - Run tests (`npm test`, `go test`)
   - Test integration with backend
   - Take screenshots

4. **Update Memory**
   - Document decisions
   - Note deviations
   - Record learnings

---

**Last Updated:** 2026-01-22  
**Status:** Ready for Zenflow execution  
**Next Action:** Execute Spec 1 (Setup & Design System)
