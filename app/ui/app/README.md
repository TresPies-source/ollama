# Dojo Genesis Desktop - Frontend

**Version:** 0.1.0

A stunning React-based frontend for Dojo Genesis Desktop, featuring glassmorphism UI, real-time chat streaming, and visual trace exploration.

## Overview

This is the web UI component of Dojo Genesis Desktop, built with:

- **React 19** - Latest React with concurrent features
- **Vite** - Lightning-fast build tool
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Flow** - Interactive graph visualization
- **CodeMirror** - Code editing

## Design System

### Dojo Genesis Visual Identity

**Color Palette:**

- Deep teal-navy backgrounds (`#0a1e2e`, `#0f2a3d`)
- Warm golden-orange accents (`#f4a261`, `#e76f51`)
- Sunset gradient (`linear-gradient(135deg, #f4a261, #e76f51, #ffd166)`)

**Glassmorphism:**

- Semi-transparent backgrounds (`rgba(15, 42, 61, 0.7)`)
- Backdrop blur (`12px`)
- Layered depth with shadows

**Typography:**

- UI: Inter font family
- Code: JetBrains Mono

**Animations:**

- Natural easing (`cubic-bezier(0.4, 0.0, 0.2, 1)`)
- Smooth transitions (300ms)

## Features

### ✅ Chat Interface

- Real-time streaming via Server-Sent Events (SSE)
- Message bubbles with glassmorphism
- Agent avatars (Supervisor, Dojo, Librarian, Builder)
- Mode badges (Mirror, Scout, Gardener, Implementation)
- Auto-scrolling message list
- Fade-in + slide-up animations

### ✅ Session Management

- Grid view of sessions (3-4 columns)
- Create new sessions with modal
- Switch between sessions
- Session cards with glass effect
- Hover animations (lift + glow)

### ✅ File Explorer

- Split-view layout (tree + editor)
- Resizable panels
- CodeMirror editor with syntax highlighting
- File tree with expand/collapse
- Support for JS, TS, Python, Markdown, JSON, HTML, CSS

### ✅ Seed Browser

- Grid of seed cards
- Search and filter by category/tags
- Seed detail modal with markdown rendering
- Apply seed context to chat
- YAML frontmatter parsing

### ✅ Trail of Thought

- Interactive trace graph visualization
- React Flow with hierarchical layout
- Color-coded nodes by event type:
  - MODE_TRANSITION: Sunset gradient
  - TOOL_INVOCATION: Blue accent
  - PERSPECTIVE_INTEGRATION: Green accent
  - LLM_CALL: Yellow accent
  - ERROR: Red accent
- Expandable nodes (show inputs/outputs)
- Zoom, pan, minimap controls
- Path highlighting on hover

### ✅ Component Primitives

- **Button**: Primary (sunset gradient), Secondary (glass), Ghost (transparent)
- **Input**: Glass background, accent border on focus
- **Card**: Glassmorphism with rounded corners
- **Badge**: Small pill with accent background
- **Avatar**: Circular with glass border

## Project Structure

```
app/ui/app/
├── src/
│   ├── api/              # API client (dgd-client.ts)
│   ├── components/       # React components
│   │   ├── chat/         # Chat interface components
│   │   ├── files/        # File explorer components
│   │   ├── seeds/        # Seed browser components
│   │   ├── sessions/     # Session management components
│   │   ├── trace/        # Trail of Thought components
│   │   └── ui/           # Primitive UI components
│   ├── hooks/            # Custom React hooks
│   ├── routes/           # TanStack Router pages
│   ├── styles/           # CSS (theme.css, index.css)
│   ├── types/            # TypeScript types (dgd.ts)
│   └── utils/            # Utilities (seedParser, traceParser)
├── public/               # Static assets
├── scripts/              # Demo scripts
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
├── vite.config.ts        # Vite configuration
└── vitest.config.ts      # Vitest configuration
```

## Getting Started

### Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later

### Installation

```bash
cd app/ui/app
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Visit http://localhost:5173

### Build

Build for production:

```bash
npm run build
```

Output: `dist/` directory

### Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests with UI:

```bash
npm run test:ui
```

### Linting

Check code quality:

```bash
npm run lint
```

Format code:

```bash
npm run prettier
```

Check formatting:

```bash
npm run prettier:check
```

## Configuration

### Environment Variables

Create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Backend Integration

The frontend connects to the Dojo Genesis Desktop backend at `http://localhost:8080` by default.

**API Endpoints:**

- `POST /api/chat` - Send message
- `GET /api/chat/stream` - Stream responses (SSE)
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/trace/:id` - Get trace data

## Component Gallery

Visit `/components` route to see all primitive components with live examples.

## Test Routes

Development-only routes for testing components:

- `/file-tree-test` - File tree component
- `/files-explorer-test` - File explorer with mock data
- `/trace-node-test` - Trace node component
- `/trace-graph-test` - Trace graph with sample data
- `/seeds-test` - Seed browser with test seeds

## Screenshots

See `.zenflow/tasks/dojo-genesis-desktop-frontend-9387/` for verification screenshots:

- `component_gallery.png` - Component primitives
- `sessions_page.png` - Session management
- `new_session_modal.png` - Session creation
- `desktop_app.png` - Desktop app window
- `logo_integration_dev.png` - Logo integration

## Architecture

### State Management

- **TanStack Query** for server state (sessions, seeds, traces)
- **React Context** for streaming state
- **Local State** for UI state (modals, forms)

### Routing

TanStack Router with file-based routes in `src/routes/`:

- `/__root.tsx` - Root layout
- `/index.tsx` - Home page
- `/sessions.tsx` - Session list
- `/chat.$sessionId.tsx` - Chat view
- `/files.tsx` - File explorer
- `/seeds.tsx` - Seed browser
- `/trace.$sessionId.tsx` - Trail of Thought
- `/settings.tsx` - Settings

### API Integration

Custom API client (`src/api/dgd-client.ts`) wraps fetch with:

- TypeScript types
- Error handling
- SSE streaming support

### Testing

- **Vitest** - Unit testing framework
- **75 tests** across utility functions
- Coverage for seedParser, traceParser, file validation

## Known Issues

### Warnings

- ESLint warnings for React Hook dependencies (non-blocking)
- Some `any` types in markdown parsing utilities
- Browserslist data is 8 months old (cosmetic warning)

### Limitations

- File operations currently use agent-based API (may add direct file API)
- Some component tests are minimal (covered by integration testing)

## Contributing

### Code Style

- Use **Prettier** for formatting
- Follow **ESLint** rules
- Write **TypeScript** types for all new code
- Use **Tailwind CSS** utility classes

### Component Guidelines

1. Use primitive components from `src/components/ui/`
2. Follow glassmorphism design system
3. Add animations with Framer Motion
4. Ensure accessibility (ARIA labels, keyboard navigation)
5. Test with Vitest

### Git Workflow

1. Create feature branch
2. Run tests: `npm test`
3. Run linters: `npm run lint && npm run prettier`
4. Build: `npm run build`
5. Commit with descriptive message

## Performance

### Bundle Size

- **Main bundle**: ~2.6 MB (819 KB gzipped)
- **CSS**: 443 KB (52 KB gzipped)
- **Index HTML**: 6.3 KB (1.7 KB gzipped)

Large chunks are primarily from:

- Syntax highlighting (Shiki with 200+ languages)
- Mermaid diagram support
- Math rendering (KaTeX)

### Optimization Opportunities

- Code splitting for language-specific syntax highlighters
- Lazy loading for diagrams and math rendering
- Route-based code splitting (already implemented via TanStack Router)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2017+ JavaScript features
- CSS Grid, Flexbox, Custom Properties
- Native backdrop-filter (glassmorphism)

## License

See main repository for license information.

## Related Projects

- **Dojo Genesis Desktop Backend** - Go-based backend with agents and tools
- **Ollama** - Base desktop app architecture (forked)

## Links

- **Backend**: `/home/ubuntu/dgd/` (Phase 1 deliverables)
- **Task Plan**: `.zenflow/tasks/dojo-genesis-desktop-frontend-9387/plan.md`
- **Spec**: `.zenflow/tasks/dojo-genesis-desktop-frontend-9387/spec.md`

---

**Built with ❤️ for Dojo Genesis Desktop v0.1.0**
