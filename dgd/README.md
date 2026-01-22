# Dojo Genesis Desktop (DGD)

**Mindful AI Desktop App** — A local-first intelligence workbench for patient builders.

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

## Development Phases

### Phase 1: Core Backend (v0.1) — 2 weeks
- ✅ Sprint 1: Supervisor Agent
- ⏳ Sprint 2: Librarian Agent
- ⏳ Sprint 3: Builder Agent
- ⏳ Sprint 4: Dojo Agent

### Phase 2: Frontend Redesign (v0.2) — 1 week
- Trail of Thought visualization
- Split-view workbench
- Command Palette (⌘K)

### Phase 3: Knowledge Commons (v0.3) — 1 week
- Seed Browser
- GitHub distribution

### Phase 4: Desktop Integration (v0.4) — 1 week
- Native installers
- Auto-updater

### Phase 5: Public Launch (v1.0)
- Open-source release
- Community seeding

## Quick Start

```bash
# Install dependencies
go mod download
cd app/ui/app && npm install

# Run development server
go run cmd/dgd/main.go

# Run tests
go test ./...

# Build binary
go build -o dgd cmd/dgd/main.go
```

## Zenflow Integration

This project is designed for seamless Zenflow orchestration. See `.zenflow.yml` for automation configuration.

## License

MIT (Open Source)

## Team

Built with patience by Cruz Morales and Manus AI (Dojo).
