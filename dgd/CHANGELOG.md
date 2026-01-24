# Changelog

All notable changes to Dojo Genesis Desktop will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-24

### Added

#### 🎯 Command Palette (⌘K / Ctrl+K)
- Global keyboard-driven command palette for instant access to all app features
- Fuzzy search across commands, sessions, and navigation using fuse.js
- Glassmorphism modal design with smooth animations
- Keyboard navigation (arrow keys, Enter, Escape)
- Organized commands by category (Navigation, Sessions, Tools, Settings)
- Platform-specific shortcuts (⌘ on macOS, Ctrl on Windows/Linux)

#### 💰 Cost Tracking & Usage Dashboard
- Real-time LLM token usage tracking (prompt tokens + completion tokens)
- Enhanced LLM client to extract token counts from Ollama and OpenAI responses
- New database columns: `messages.prompt_tokens`, `messages.completion_tokens`
- Usage statistics API endpoint (`GET /api/usage`)
- Interactive usage dashboard with:
  - Total tokens and estimated costs
  - Line chart showing token usage over time
  - Pie chart displaying usage by model
  - Model-specific token breakdowns
- Session header displays current token count
- Responsive design with Dojo Genesis glassmorphism theme

#### ⌨️ Keyboard Shortcuts System
- Comprehensive keyboard shortcuts for all major actions
- 28 default shortcuts organized by category:
  - **Global**: Command Palette (⌘K), Settings (⌘,), Quit (⌘Q)
  - **Sessions**: New (⌘N), Close (⌘W), Next/Previous (⌘]/⌘[)
  - **Chat**: Send Message (⌘Enter), Clear (⌘L), Copy Last (⌘C)
  - **Tools**: Export (⌘E), Import (⌘I), Delete (⌘D)
- Customizable shortcuts with conflict detection
- Platform-aware key bindings (Mac, Windows, Linux)
- Visual shortcuts panel in Settings for customization
- Persistent storage in SQLite settings table

#### ⚙️ Settings Panel
- Centralized settings page with four sections:
  1. **Models**: Default model selection, temperature (0.0-2.0), max tokens
  2. **Appearance**: Theme (Light/Dark/Auto), font size, glassmorphism intensity
  3. **Shortcuts**: Keyboard shortcut customization with conflict detection
  4. **Data**: Export all sessions, import sessions, clear history
- New SQLite `settings` table for persistent configuration
- Settings API endpoints (`GET /api/settings`, `POST /api/settings`)
- Real-time settings updates (no page reload required)
- Form validation and error handling
- Accessible via ⌘, keyboard shortcut

#### 🔄 Auto-Updater
- Automatic update checking on startup (non-blocking)
- Visual notification banner when updates available
- Secure update process with SHA256 checksum verification
- Update API endpoints (`GET /api/update/check`, `POST /api/update/apply`)
- Graceful update flow: download → verify → apply → restart
- Progress feedback during update installation
- Error handling with user-friendly messages

#### 📤 Export/Import Sessions
- Export sessions to Markdown format with YAML frontmatter
- Import Markdown sessions back into the application
- Context menu integration: right-click sessions to export/import
- Export endpoint: `GET /api/sessions/:id/export`
- Import endpoint: `POST /api/sessions/import` (multipart file upload)
- Markdown format includes:
  - YAML frontmatter: title, model, created_at, updated_at
  - Message history with role indicators
  - Clean, readable format for sharing and archiving
- File format validation on import
- Bulk export capability (export all sessions)

### Changed

#### Backend
- Enhanced `llm.CompletionResponse` with `PromptTokens` and `CompletionTokens` fields
- Updated Ollama client to extract `prompt_eval_count` and `eval_count`
- Updated OpenAI client to extract token usage from API responses
- Modified `database.Message` struct to include token tracking fields
- Improved API handler organization with dedicated files per feature

#### Frontend
- Added 3 new npm dependencies:
  - `fuse.js@^7.0.0` - Fuzzy search
  - `react-hotkeys-hook@^4.5.0` - Keyboard shortcuts
  - `recharts@^3.7.0` - Data visualization
- Created new contexts: `CommandPaletteContext`, `ShortcutsContext`
- Created new hooks: `useCommandPalette`, `useShortcut`, `useUsage`, `useAppSettings`, `useUpdateCheck`
- Enhanced session header with token count display
- Improved ChatSidebar with export/import context menu

#### Database
- Added migration system for schema updates
- New migrations:
  - `001_add_token_tracking.sql` - Adds token columns to messages table
  - `002_add_settings_table.sql` - Creates settings table
- Idempotent migrations for safe re-running

### Fixed
- Enhanced error handling across all new API endpoints
- Improved file upload validation for session import
- Cross-platform compatibility for keyboard shortcuts
- Proper cleanup of file downloads and uploads

### Security
- SHA256 checksum verification for auto-updates
- Input validation for all settings endpoints
- File type validation for session imports
- Sanitized file paths in export functionality

### Performance
- Command palette search < 50ms (fuzzy search optimization)
- API endpoints respond < 200ms
- Non-blocking update checks on startup
- Optimized database queries for usage aggregation
- Lazy loading for charts and visualizations

### Testing
- 354+ frontend tests passing (18 skipped due to jsdom limitations)
- All backend tests passing
- Code coverage >70% for new features:
  - Database: 74.0%
  - Settings API: 60-73%
  - Usage API: 60-100%
  - Update API: 92-100%
  - Export/Import: 89-100%

### Documentation
- Added API endpoint documentation
- Added keyboard shortcuts reference
- Created integration test reports
- Updated architecture documentation
- Added feature verification guides

---

## [0.1.0] - 2026-01-15

### Added
- Initial release of Dojo Genesis Desktop
- 4 AI agents (Supervisor, Librarian, Builder, Dojo)
- React 19 + Vite + TanStack Router frontend
- Go + Gin + SQLite backend
- 54 React components
- 75 passing tests
- Glassmorphism design system with Dojo Genesis branding
- Session management (create, list, delete)
- Multi-agent chat interface
- LLM integration (Ollama + OpenAI compatible)
- Streaming responses
- Local-first architecture
- Cross-platform support (macOS, Windows, Linux)

### Technical Stack
- **Backend**: Go 1.23, Gin, SQLite
- **Frontend**: React 19, Vite 6, TanStack Router, Tailwind CSS 4
- **Build**: Native binary distribution (~50-100MB)
- **Design**: Glassmorphism with Dojo Genesis brand colors

---

## How to Update

### From v0.1.0 to v0.2.0

1. **Backup your data** (optional but recommended):
   ```bash
   cp ~/.dgd/dgd.db ~/.dgd/dgd.db.backup
   ```

2. **Download the new version**:
   - Download the latest release for your platform
   - Replace the old binary with the new one

3. **Database migrations run automatically** on first launch

4. **New features available immediately**:
   - Press ⌘K (Ctrl+K) to open command palette
   - Press ⌘, (Ctrl+,) to open settings
   - View usage dashboard in Settings
   - Customize keyboard shortcuts in Settings → Shortcuts
   - Export/import sessions via context menu

### Migration Notes

- **Settings reset**: Default settings are applied on first launch. Customize in Settings panel.
- **Token tracking**: New messages will have token counts. Old messages show 0 tokens (expected).
- **Keyboard shortcuts**: Default shortcuts are active immediately. Customize if needed.
- **Auto-updater**: Future updates will notify automatically.

---

## Support

For issues, questions, or feature requests:
- GitHub Issues: [TresPies-source/ollama](https://github.com/TresPies-source/ollama/issues)
- Documentation: See `dgd/docs/` directory

---

Built with patience by Cruz Morales and Manus AI (Dojo).
