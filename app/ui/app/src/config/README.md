# Configuration Directory

This directory contains application configuration files.

## Shortcuts Configuration

### Files

- **`shortcuts.json`** - Default keyboard shortcuts configuration
- **`shortcuts.types.ts`** - TypeScript type definitions for shortcuts
- **`shortcuts.loader.ts`** - Utilities for loading and validating shortcuts
- **`shortcuts.test.ts`** - Tests for shortcuts configuration
- **`index.ts`** - Barrel export for easy imports

### Usage

#### Loading Shortcuts

```typescript
import { loadDefaultShortcuts, getAllShortcuts, getShortcutById } from "@/config";

// Load all shortcuts
const shortcuts = getAllShortcuts();

// Get a specific shortcut
const newSessionShortcut = getShortcutById("new-session");

// Get shortcuts by category
const sessionShortcuts = getShortcutsByCategory("Session");
```

#### Platform-Specific Keys

```typescript
import { getShortcutForPlatform, getCurrentPlatform } from "@/config";

const shortcut = getShortcutById("new-session");
const currentPlatform = getCurrentPlatform(); // "mac" | "windows" | "linux"
const key = getShortcutForPlatform(shortcut.keys, currentPlatform);
// Returns: "Cmd+N" on Mac, "Ctrl+N" on Windows/Linux
```

#### Formatting for Display

```typescript
import { formatShortcutForDisplay } from "@/config";

const formatted = formatShortcutForDisplay("Cmd+N");
// Returns: "⌘N" on Mac, "Cmd+N" on Windows/Linux
```

#### Parsing for react-hotkeys-hook

```typescript
import { parseShortcutToHotkey } from "@/config";

const hotkey = parseShortcutToHotkey("Cmd+N");
// Returns: "meta+n" on Mac, "ctrl+n" on Windows/Linux
```

### Validation

The configuration is automatically validated on load in development mode. To manually validate:

```typescript
import { validateShortcuts, isShortcutsValid, logValidationErrors } from "@/config";

// Check if valid
if (!isShortcutsValid()) {
  logValidationErrors(); // Logs errors to console
}

// Get validation errors
const errors = validateShortcuts();
errors.forEach((error) => console.error(error));
```

### Shortcut Structure

Each shortcut in `shortcuts.json` has the following structure:

```json
{
  "id": "unique-id",
  "name": "Human-readable name",
  "description": "Description of what the shortcut does",
  "category": "Session | Navigation | View | Settings | Edit | Application",
  "keys": {
    "mac": "Cmd+N",
    "windows": "Ctrl+N",
    "linux": "Ctrl+N"
  }
}
```

### Categories

- **Session** - Session management (new, close, export, import)
- **Navigation** - Page navigation (sessions, files, seeds)
- **View** - UI controls (command palette, sidebar, zoom)
- **Settings** - Application settings
- **Edit** - Editing actions (copy, delete, undo, redo)
- **Application** - Application-level actions (quit, help, dev tools)

### Adding New Shortcuts

1. Add the shortcut definition to `shortcuts.json`
2. Ensure the `id` is unique
3. Provide keys for all three platforms (mac, windows, linux)
4. Run `npm test src/config/shortcuts.test.ts` to validate
5. Update this README if adding a new category

### User Customization

User-customized shortcuts will be stored in the database and merged with defaults at runtime. The shortcuts context will handle this merging.

See `src/contexts/ShortcutsContext.tsx` for the implementation.
