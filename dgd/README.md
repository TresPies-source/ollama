# Dojo Genesis Desktop (DGD)

**Mindful AI Desktop App** — A local-first intelligence workbench for patient builders.

**Current Version:** v0.2.0 (Polish & Usability Release)

## Vision

Dojo Genesis Desktop is a triple fork of:
- **11-11**: Sustainable Intelligence OS philosophy
- **Dojo Genesis**: Agent orchestration and thinking partnership
- **Ollama**: Proven desktop architecture

## Core Principles

1. **Beginner's Mind**: Fresh approach to every interaction
2. **Local-First**: Your data never leaves your machine
3. **Old Hardware Love**: Runs on 5-year-old laptops
4. **Planning with Files**: Filesystem as source of truth
5. **Knowledge Commons**: GitHub-distributed wisdom

## ✨ What's New in v0.2.0

### 🎯 Command Palette (⌘K / Ctrl+K)
Access all app features instantly with a keyboard-driven command palette:
- **Global hotkey**: ⌘K (macOS) or Ctrl+K (Windows/Linux)
- **Fuzzy search** across commands, sessions, and navigation
- **Keyboard navigation**: Arrow keys to navigate, Enter to execute, Escape to close
- **Organized categories**: Commands grouped by Navigation, Sessions, Tools, Settings

### 💰 Cost Tracking & Usage Dashboard
Track your LLM token usage and estimated costs:
- **Real-time tracking**: Every message tracks prompt and completion tokens
- **Usage dashboard**: View total tokens, costs, and trends over time
- **Visual analytics**: Line charts (usage over time) and pie charts (usage by model)
- **Session display**: Current token count shown in each session header

### ⌨️ Keyboard Shortcuts
Navigate the app without touching your mouse:
- **28 default shortcuts** covering all major actions
- **Customizable**: Change any shortcut to your preference in Settings
- **Conflict detection**: Prevents duplicate key bindings
- **Platform-aware**: Automatically adapts to Mac (⌘) or Windows/Linux (Ctrl)

**Key Shortcuts:**
- `⌘K` / `Ctrl+K` - Command Palette
- `⌘N` / `Ctrl+N` - New Session
- `⌘,` / `Ctrl+,` - Settings
- `⌘W` / `Ctrl+W` - Close Session
- `⌘Enter` / `Ctrl+Enter` - Send Message
- See Settings → Shortcuts for complete list

### ⚙️ Settings Panel
Centralized configuration for your entire workspace:
- **Models**: Choose default model, adjust temperature (0.0-2.0), set max tokens
- **Appearance**: Theme (Light/Dark/Auto), font size, glassmorphism intensity
- **Shortcuts**: Customize all keyboard shortcuts
- **Data**: Export all sessions, import sessions, clear history

Access: Press `⌘,` (macOS) or `Ctrl+,` (Windows/Linux)

### 🔄 Auto-Updater
Stay current with automatic update notifications:
- **Background checks**: App checks for updates on startup (non-blocking)
- **Notification banner**: Visual alert when new version available
- **Secure updates**: SHA256 checksum verification before applying
- **One-click install**: Download, verify, and restart automatically

### 📤 Export/Import Sessions
Share and backup your conversations:
- **Export to Markdown**: Right-click any session → "Export Session"
- **Import from Markdown**: Right-click session list → "Import Session"
- **YAML frontmatter**: Metadata preserved (title, model, timestamps)
- **Bulk export**: Export all sessions at once from Settings → Data

**Markdown Format:**
```markdown
---
title: My Session
model: llama3.2:3b
created_at: 2026-01-24T10:00:00Z
---

**user**: Hello!

**assistant**: Hi there! How can I help?
```

## Tech Stack

- **Backend**: Go 1.23 + Gin
- **Frontend**: React 19 + Vite + TanStack Router + Tailwind CSS 4
- **Database**: SQLite (embedded)
- **Webview**: Native (WebKit/WebView2)
- **Distribution**: Single binary (~50-100MB)

## Project Structure

```
dgd/
├── agents/           # Agent implementations
│   ├── supervisor/   # Intent classification & routing
│   ├── dojo/         # 4 modes: Mirror, Scout, Gardener, Implementation
│   ├── librarian/    # File search & seed retrieval
│   └── builder/      # Code generation & execution
├── api/              # HTTP API handlers
├── database/         # SQLite schema & migrations
├── tools/            # Tool registry & implementations
├── cmd/dgd/          # Main application entry point
├── app/ui/app/       # React frontend
└── docs/             # Documentation
```

## API Reference

### Sessions
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/:id/export` - Export session to Markdown
- `POST /api/sessions/import` - Import session from Markdown (multipart file upload)

### Messages
- `GET /api/messages/:sessionId` - Get messages for session
- `POST /api/chat` - Send chat message (streaming response)

### Usage & Token Tracking
- `GET /api/usage` - Get aggregated token usage statistics
  - Returns: total tokens, tokens by model, tokens by day, estimated costs

### Settings
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Update settings (JSON body)

### Updates
- `GET /api/update/check` - Check for available updates
- `POST /api/update/apply` - Apply pending update

### Models
- `GET /api/models` - List available LLM models

## Development Phases

### ✅ Phase 1: Core Backend (v0.1) — Completed
- ✅ Sprint 1: Supervisor Agent
- ✅ Sprint 2: Librarian Agent
- ✅ Sprint 3: Builder Agent
- ✅ Sprint 4: Dojo Agent

### ✅ Phase 2: Polish & Usability (v0.2) — Completed
- ✅ Command Palette (⌘K)
- ✅ Cost Tracking & Usage Dashboard
- ✅ Keyboard Shortcuts (28 customizable shortcuts)
- ✅ Settings Panel
- ✅ Auto-Updater
- ✅ Export/Import Sessions

### ⏳ Phase 3: Knowledge Commons (v0.3) — Planned
- Seed Browser
- GitHub distribution

### ⏳ Phase 4: Desktop Integration (v0.4) — Planned
- Native installers
- Enhanced desktop features

### ⏳ Phase 5: Public Launch (v1.0) — Planned
- Open-source release
- Community seeding

## Quick Start

### Installation

1. **Download** the latest release for your platform from [Releases](https://github.com/TresPies-source/ollama/releases)
2. **Run** the binary:
   - macOS: `./dgd-macos-amd64`
   - Windows: `dgd-windows-amd64.exe`
   - Linux: `./dgd-linux-amd64`
3. **Open** your browser to `http://localhost:8080`

### First Steps

1. **Create a session**: Press `⌘N` (Ctrl+N) or use the Command Palette (`⌘K`)
2. **Start chatting**: Type your message and press `⌘Enter` (Ctrl+Enter)
3. **Explore features**: Press `⌘K` to open the Command Palette and discover all features
4. **Customize**: Press `⌘,` to open Settings and personalize your experience

### Development

```bash
# Install dependencies
go mod download
cd app/ui/app && npm install

# Run development server (backend on :8080, frontend on :5174)
go run cmd/dgd/main.go
# In another terminal:
cd app/ui/app && npm run dev

# Run tests
go test ./...                  # Backend tests
cd app/ui/app && npm test      # Frontend tests

# Build binary
go build -o dgd cmd/dgd/main.go
```

## Keyboard Shortcuts Reference

### Global
- `⌘K` / `Ctrl+K` - Open Command Palette
- `⌘,` / `Ctrl+,` - Open Settings
- `⌘Q` / `Ctrl+Q` - Quit Application
- `Escape` - Close Modal/Palette

### Sessions
- `⌘N` / `Ctrl+N` - New Session
- `⌘W` / `Ctrl+W` - Close Session
- `⌘]` / `Ctrl+]` - Next Session
- `⌘[` / `Ctrl+[` - Previous Session

### Chat
- `⌘Enter` / `Ctrl+Enter` - Send Message
- `⌘L` / `Ctrl+L` - Clear Input
- `⌘C` / `Ctrl+C` - Copy Last Response
- `⌘/` / `Ctrl+/` - Toggle Shortcuts Help

### Tools
- `⌘E` / `Ctrl+E` - Export Current Session
- `⌘I` / `Ctrl+I` - Import Session
- `⌘D` / `Ctrl+D` - Delete Session
- `⌘R` / `Ctrl+R` - Refresh Session List

**Customize any shortcut** in Settings → Shortcuts

**See all shortcuts** by pressing `⌘K` and typing "shortcuts"

## Screenshots

Visual demonstrations of v0.2.0 features can be found in `docs/screenshots/v0.0.2/`:

- **keyboard_shortcuts.png** - Shortcuts panel in Settings showing all 28 customizable shortcuts
- **export_import.png** - Session export/import functionality with Markdown format
- **auto_updater.png** - Update notification banner with version information

## Documentation

- **CHANGELOG.md** - Version history and migration guides
- **docs/architecture/** - Technical architecture documents
  - `v0.2.0_ARCHITECTURE.md` - Feature architecture and design decisions
  - `v0.2.0_SPECIFICATION.md` - Detailed technical specifications
  - `dojo_genesis_design_language_v2.md` - Design system guidelines
- **docs/integration_tests/** - Integration test reports and verification guides

## Testing

### Backend Tests
```bash
go test ./dgd/... -cover
# All tests passing
# Coverage: 74.0% (database), 60-100% (v0.2.0 features)
```

### Frontend Tests
```bash
cd app/ui/app
npm test
# 354 tests passing, 18 skipped
# Coverage: >70% for all v0.2.0 features
```

### Integration Tests
```bash
# Start backend
go run cmd/dgd/main.go

# Start frontend (in another terminal)
cd app/ui/app && npm run dev

# Test all features manually or see docs/integration_tests/
```

## Performance

All v0.2.0 features meet or exceed performance requirements:

- **Command Palette search**: < 50ms (instant fuzzy search)
- **API endpoints**: < 200ms average response time
- **Update checks**: Non-blocking, 5-second startup delay
- **Usage aggregation**: < 100ms for 10,000+ messages
- **Chart rendering**: Lazy loaded, < 500ms initial render

## Zenflow Integration

This project is designed for seamless Zenflow orchestration. See `.zenflow.yml` for automation configuration.

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code patterns and naming conventions
- Write tests for new features (>70% coverage)
- Update documentation for user-facing changes
- Test on multiple platforms when possible
- Use the Dojo Genesis design system for UI components

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/TresPies-source/ollama/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TresPies-source/ollama/discussions)
- **Documentation**: See `dgd/docs/` directory

## License

MIT (Open Source)

## Team

Built with patience by Cruz Morales and Manus AI (Dojo).

---

**Working at the pace of understanding.** 🧘‍♂️
