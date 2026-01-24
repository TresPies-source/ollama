# v0.2.0 Screenshots

This directory contains screenshots demonstrating all six v0.2.0 features.

## Current Screenshots

### ✅ Captured

1. **keyboard_shortcuts.png** (81.08 KB)
   - Shows the Shortcuts panel in Settings
   - Displays all 28 customizable keyboard shortcuts
   - Demonstrates the shortcut customization interface

2. **export_import.png** (544 KB)
   - Shows the session context menu with export/import options
   - Demonstrates the Markdown export format
   - Shows import file picker

3. **auto_updater.png** (28.13 KB)
   - Shows the update notification banner
   - Displays version information and action buttons
   - Demonstrates the glassmorphism design

## Missing Screenshots

### ⚠️ To Be Captured

The following screenshots were planned but not yet captured. They should be taken before considering v0.2.0 documentation complete:

4. **command_palette.png** ❌
   - **What to show**: Command Palette opened with ⌘K
   - **How to capture**:
     1. Start app: `npm run dev` (frontend) + `go run cmd/dgd/main.go` (backend)
     2. Press ⌘K (or Ctrl+K)
     3. Type a search query (e.g., "new session")
     4. Screenshot showing:
        - Search input with query
        - Filtered results grouped by category
        - Selected item highlighted
        - Glassmorphism modal design
   - **Location**: Command Palette modal overlay

5. **cost_tracking.png** (also known as usage_dashboard.png) ❌
   - **What to show**: Usage Dashboard with charts and statistics
   - **How to capture**:
     1. Start app and create some sessions with messages
     2. Navigate to Settings → Usage Dashboard
     3. Screenshot showing:
        - Total tokens and estimated cost cards
        - Line chart (tokens over time)
        - Pie chart (usage by model)
        - Model breakdown table
        - Responsive design with Dojo Genesis theme
   - **Location**: `/settings` route, Usage Dashboard section

6. **settings_panel.png** ❌
   - **What to show**: Settings page with all four sections
   - **How to capture**:
     1. Press ⌘, (or Ctrl+,) to open Settings
     2. Screenshot showing:
        - All four sections visible: Models, Appearance, Shortcuts, Data
        - Forms and controls for each section
        - Glassmorphism design
        - Settings navigation/tabs
   - **Location**: `/settings` route

## Screenshot Guidelines

When capturing screenshots:

1. **Window size**: 1920x1080 or 1440x900 (standard desktop resolutions)
2. **Browser**: Chrome or Firefox (latest version)
3. **Theme**: Dark theme (default Dojo Genesis theme)
4. **Content**: Use realistic but safe example data
5. **Format**: PNG (for clarity and transparency)
6. **Quality**: High quality, no compression artifacts
7. **Privacy**: No personal information, API keys, or sensitive data

## Screenshot Capture Tools

**macOS:**
- ⌘Shift+4 → Space → Click window (captures window with shadow)
- ⌘Shift+4 → Drag selection (captures specific area)
- Use built-in Screenshot app for timed captures

**Windows:**
- Win+Shift+S → Select area (Snipping Tool)
- Use Windows Snipping Tool for precise captures

**Linux:**
- gnome-screenshot or scrot
- Spectacle (KDE)
- Flameshot (cross-platform)

## Verification

Once all screenshots are captured:

- [ ] command_palette.png exists and shows command palette clearly
- [ ] cost_tracking.png exists and shows usage dashboard with charts
- [ ] settings_panel.png exists and shows all four settings sections
- [ ] All screenshots are high quality PNG files
- [ ] All screenshots use dark theme
- [ ] All screenshots show the glassmorphism design
- [ ] Update main README.md to reference all 6 screenshots
- [ ] Update CHANGELOG.md if needed

## Integration Test Report

See also:
- `dgd/docs/integration_tests/v0.2.0_integration_test_report.md` - Full integration test results
- `dgd/docs/integration_tests/v0.2.0_e2e_integration_test_report.md` - End-to-end test results

Note: The E2E integration tests identified a critical frontend-backend API mismatch (BUG-001) that prevents the app from loading. This must be fixed before screenshots can be taken.

## Next Steps

1. **Fix BUG-001**: Update frontend API client to use DGD endpoints (not Ollama endpoints)
2. **Start app**: Verify both backend and frontend load correctly
3. **Capture missing screenshots**: Follow guidelines above
4. **Update documentation**: Add screenshots to README.md and CHANGELOG.md
5. **Mark step complete**: Update plan.md to mark "Documentation & README Update" as [x]

---

**Note**: Documentation is considered 95% complete. Screenshots are the final 5%.
