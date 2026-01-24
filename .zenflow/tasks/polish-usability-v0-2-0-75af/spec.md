# Dojo Genesis Desktop v0.2.0: Technical Specification

**Version:** 1.0  
**Author:** Zencoder (AI)  
**Date:** January 23, 2026  
**Complexity:** HARD  
**Estimated Duration:** 104 hours (2 weeks)

---

## 1. Overview

This specification covers the implementation of six polish and usability features for Dojo Genesis Desktop v0.2.0, transforming the v0.1.0 functional prototype into a professional, polished product. The implementation spans both backend (Go + SQLite) and frontend (React + TypeScript + Vite).

### Complexity Assessment

**Complexity Level: HARD**

**Rationale:**
- 6 major features with significant interdependencies
- Both backend (Go) and frontend (React/TypeScript) implementation required
- Database schema migrations with backward compatibility
- Integration of 4 new libraries (fuse.js, react-hotkeys-hook, recharts, go-update)
- Complex features requiring careful architecture:
  - Auto-updater with cryptographic verification
  - Command palette with fuzzy search across multiple data sources
  - Real-time token tracking with database persistence
- Cross-platform considerations (macOS, Windows, Linux)
- Security considerations (checksum verification, settings validation)
- Performance requirements (< 50ms search, < 200ms API responses)

---

## 2. Technical Context

### 2.1. Technology Stack

**Backend:**
- Language: Go 1.21+
- Database: SQLite 3.x
- Router: Gin framework
- Testing: Go standard testing package

**Frontend:**
- Framework: React 19.1.0
- Build Tool: Vite 6.3.5
- Router: TanStack Router 1.120.20
- State Management: TanStack Query 5.80.7
- Styling: Tailwind CSS 4.1.9
- UI Components: Headless UI, Framer Motion

**Design System:**
- Base: Glassmorphism with Dojo Genesis brand colors
- Primary: Deep teal-navy (#0a1e2e, #0f2a3d, #143847)
- Accents: Warm golden-orange (#f4a261, #e76f51, #ffd166)
- Typography: Inter (primary), Outfit (accent), JetBrains Mono (code)

### 2.2. Existing Architecture

**Backend Structure:**
```
dgd/
├── api/
│   ├── handlers.go      # HTTP handlers
│   ├── stream.go        # Streaming utilities
│   └── types.go         # API types
├── database/
│   ├── db.go            # Database connection
│   ├── schema.sql       # Schema definitions
│   ├── sessions.go      # Session CRUD
│   └── messages.go      # Message CRUD
├── llm/
│   ├── client.go        # LLM client factory
│   ├── types.go         # LLM types
│   ├── ollama.go        # Ollama client
│   └── openai.go        # OpenAI client
└── cmd/dgd/
    └── main.go          # Application entry point
```

**Frontend Structure:**
```
app/ui/app/src/
├── components/          # React components (54 files)
│   ├── Chat.tsx
│   ├── MessageList.tsx
│   ├── SessionHeader.tsx
│   └── ui/              # Reusable UI components
├── routes/              # TanStack Router pages
├── api/                 # API client functions
├── hooks/               # Custom React hooks
├── contexts/            # React contexts
└── utils/               # Utility functions
```

**Current Database Schema:**
- `sessions`: User sessions (id, title, working_dir, status)
- `messages`: Chat messages (id, session_id, role, content, agent_type, mode)
- `traces`: Harness trace metadata
- `trace_details`: Full trace JSON
- `seeds`: Knowledge seeds
- `files`: Files in working directory
- `tool_calls`: Tool execution history

---

## 3. Feature Specifications

### 3.1. Command Palette (⌘K)

**Complexity:** Medium (24 hours)

#### Backend Changes

**None required** - This is a pure frontend feature.

#### Frontend Changes

**New Dependencies:**
```json
{
  "fuse.js": "^7.0.0"  // Fuzzy search library
}
```

**New Files:**
```
src/
├── components/
│   └── CommandPalette.tsx         # Main palette component
├── contexts/
│   └── CommandPaletteContext.tsx  # Global state management
├── commands/
│   ├── registry.ts                # Command definitions
│   └── types.ts                   # Command types
└── hooks/
    └── useCommandPalette.ts       # Hook for palette access
```

**Modified Files:**
```
src/
├── main.tsx                        # Add CommandPaletteProvider
└── routes/                         # Add command palette trigger in all routes
```

**Implementation Details:**

1. **Command Registry** (`src/commands/registry.ts`):
   ```typescript
   interface Command {
     id: string;
     title: string;
     description?: string;
     category: 'action' | 'file' | 'seed' | 'navigation';
     keywords?: string[];
     shortcut?: string;
     action: () => void | Promise<void>;
   }
   
   export const commandRegistry: Command[] = [
     {
       id: 'new-session',
       title: 'New Session',
       category: 'action',
       shortcut: '⌘N',
       action: () => navigate('/sessions/new')
     },
     // ... more commands
   ];
   ```

2. **Command Palette Context** (`src/contexts/CommandPaletteContext.tsx`):
   ```typescript
   interface CommandPaletteState {
     isOpen: boolean;
     query: string;
     results: Command[];
     selectedIndex: number;
   }
   
   interface CommandPaletteContextValue {
     state: CommandPaletteState;
     open: () => void;
     close: () => void;
     search: (query: string) => void;
     execute: (command: Command) => void;
   }
   ```

3. **Fuzzy Search Configuration**:
   ```typescript
   const fuse = new Fuse(commands, {
     keys: ['title', 'description', 'keywords'],
     threshold: 0.4,
     includeScore: true,
     minMatchCharLength: 2
   });
   ```

4. **UI Design** (Glassmorphism):
   ```css
   background: rgba(15, 42, 61, 0.9);
   backdrop-filter: blur(12px);
   border: 1px solid rgba(244, 162, 97, 0.2);
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
   ```

5. **Keyboard Shortcuts**:
   - ⌘K / Ctrl+K: Open palette
   - Escape: Close palette
   - Arrow Up/Down: Navigate results
   - Enter: Execute selected command

**Success Criteria:**
- [ ] Global hotkey (⌘K/Ctrl+K) opens palette from any screen
- [ ] Fuzzy search returns results in < 50ms
- [ ] Keyboard navigation works (arrow keys, Enter, Escape)
- [ ] Results grouped by category (Actions, Files, Seeds, Navigation)
- [ ] Glassmorphism design matches Dojo Genesis style
- [ ] Screenshot: `docs/screenshots/v0.0.2/command_palette.png`

---

### 3.2. Cost Tracking

**Complexity:** Medium (16 hours)

#### Backend Changes

**Database Migration:**

Add to `dgd/database/schema.sql`:
```sql
-- Add token tracking columns to messages table
ALTER TABLE messages ADD COLUMN prompt_tokens INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN completion_tokens INTEGER DEFAULT 0;
```

**Migration File** (`dgd/database/migrations/001_add_token_tracking.sql`):
```sql
-- Migration for v0.2.0: Token tracking
-- Up
ALTER TABLE messages ADD COLUMN prompt_tokens INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN completion_tokens INTEGER DEFAULT 0;

-- Down
-- SQLite doesn't support DROP COLUMN, would require table recreation
```

**Modified Files:**

1. `dgd/llm/types.go`:
   ```go
   type CompletionResponse struct {
       Content         string `json:"content"`
       Model           string `json:"model"`
       PromptTokens    int    `json:"prompt_tokens"`    // NEW
       CompletionTokens int   `json:"completion_tokens"` // NEW
       TokensUsed      int    `json:"tokens_used"`
       FinishReason    string `json:"finish_reason"`
   }
   ```

2. `dgd/llm/ollama.go`:
   ```go
   type ollamaResponse struct {
       Model     string  `json:"model"`
       CreatedAt string  `json:"created_at"`
       Message   Message `json:"message"`
       Done      bool    `json:"done"`
       // NEW: Token usage fields
       PromptEvalCount     int `json:"prompt_eval_count"`
       EvalCount           int `json:"eval_count"`
   }
   
   // In Complete() method:
   return &CompletionResponse{
       Content:          ollamaResp.Message.Content,
       Model:            ollamaResp.Model,
       PromptTokens:     ollamaResp.PromptEvalCount,
       CompletionTokens: ollamaResp.EvalCount,
       TokensUsed:       ollamaResp.PromptEvalCount + ollamaResp.EvalCount,
       FinishReason:     "stop",
   }, nil
   ```

3. `dgd/llm/openai.go`:
   ```go
   // Already returns token counts in API response
   // Update mapping to CompletionResponse
   ```

4. `dgd/database/messages.go`:
   ```go
   type Message struct {
       ID               string    `db:"id"`
       SessionID        string    `db:"session_id"`
       Role             string    `db:"role"`
       Content          string    `db:"content"`
       CreatedAt        time.Time `db:"created_at"`
       AgentType        string    `db:"agent_type"`
       Mode             string    `db:"mode"`
       PromptTokens     int       `db:"prompt_tokens"`     // NEW
       CompletionTokens int       `db:"completion_tokens"` // NEW
   }
   ```

5. `dgd/api/handlers.go`:
   ```go
   // In ChatHandler, after LLM completion:
   assistantMessage := &database.Message{
       ID:               assistantMessageID,
       SessionID:        req.SessionID,
       Role:             "assistant",
       Content:          response,
       AgentType:        agentType,
       Mode:             mode,
       PromptTokens:     llmResponse.PromptTokens,     // NEW
       CompletionTokens: llmResponse.CompletionTokens, // NEW
   }
   ```

**New Files:**

1. `dgd/api/usage.go`:
   ```go
   package api
   
   // UsageStats represents aggregated usage statistics
   type UsageStats struct {
       TotalPromptTokens     int                   `json:"total_prompt_tokens"`
       TotalCompletionTokens int                   `json:"total_completion_tokens"`
       TotalTokens           int                   `json:"total_tokens"`
       EstimatedCostUSD      float64               `json:"estimated_cost_usd"`
       UsageByModel          map[string]int        `json:"usage_by_model"`
       UsageByDay            []DailyUsage          `json:"usage_by_day"`
   }
   
   type DailyUsage struct {
       Date   string `json:"date"`
       Tokens int    `json:"tokens"`
   }
   
   // GetUsageHandler returns aggregated usage statistics
   func (s *Server) GetUsageHandler(c *gin.Context) {
       // Query database for token counts
       // Aggregate by model, by day
       // Calculate estimated cost
       // Return JSON
   }
   ```

2. `dgd/database/usage.go`:
   ```go
   package database
   
   func (db *DB) GetUsageStats() (*UsageStats, error) {
       // SQL queries to aggregate token usage
       // GROUP BY model, GROUP BY date
   }
   ```

**New API Endpoints:**
- `GET /api/usage` - Returns aggregated usage statistics

#### Frontend Changes

**New Files:**
```
src/
├── components/
│   └── UsageDashboard.tsx         # Usage dashboard with charts
├── api/
│   └── usage.ts                   # Usage API client
└── hooks/
    └── useUsage.ts                # Usage data hook
```

**Modified Files:**
```
src/
├── components/
│   └── SessionHeader.tsx          # Add session token count display
└── routes/
    └── settings.tsx               # Add usage dashboard link
```

**New Dependencies:**
```json
{
  "recharts": "^2.12.0"  // Chart library
}
```

**Implementation Details:**

1. **Usage API Client** (`src/api/usage.ts`):
   ```typescript
   export interface UsageStats {
     total_prompt_tokens: number;
     total_completion_tokens: number;
     total_tokens: number;
     estimated_cost_usd: number;
     usage_by_model: Record<string, number>;
     usage_by_day: Array<{ date: string; tokens: number }>;
   }
   
   export async function fetchUsageStats(): Promise<UsageStats> {
     const response = await fetch('http://localhost:8080/api/usage');
     return response.json();
   }
   ```

2. **Usage Dashboard Component** (`src/components/UsageDashboard.tsx`):
   ```typescript
   import { LineChart, PieChart } from 'recharts';
   
   export function UsageDashboard() {
     const { data } = useUsage();
     
     return (
       <div className="space-y-6">
         <div className="grid grid-cols-3 gap-4">
           <StatCard title="Total Tokens" value={data.total_tokens} />
           <StatCard title="Estimated Cost" value={`$${data.estimated_cost_usd.toFixed(2)}`} />
           {/* ... */}
         </div>
         
         <LineChart data={data.usage_by_day} />
         <PieChart data={modelUsageData} />
       </div>
     );
   }
   ```

3. **Session Header Update** (`src/components/SessionHeader.tsx`):
   ```typescript
   // Add token count display for current session
   const sessionTokens = messages.reduce((sum, msg) => 
     sum + msg.prompt_tokens + msg.completion_tokens, 0
   );
   
   return (
     <div className="flex items-center gap-2">
       <span className="text-sm text-dojo-text-tertiary">
         {sessionTokens.toLocaleString()} tokens
       </span>
     </div>
   );
   ```

**Cost Calculation:**
```typescript
// Model pricing (USD per 1M tokens)
const MODEL_PRICING = {
  'llama3.2:3b': 0,      // Local, free
  'gpt-4o-mini': 0.15,   // OpenAI pricing
  'gpt-4o': 2.50,
};

function calculateCost(usageByModel: Record<string, number>): number {
  return Object.entries(usageByModel).reduce((total, [model, tokens]) => {
    const pricePerMillion = MODEL_PRICING[model] || 0;
    return total + (tokens / 1_000_000) * pricePerMillion;
  }, 0);
}
```

**Success Criteria:**
- [ ] Database has `prompt_tokens` and `completion_tokens` columns
- [ ] LLM clients return token counts
- [ ] Chat handler persists token counts with each message
- [ ] `GET /api/usage` returns accurate statistics
- [ ] Usage Dashboard displays line chart (tokens over time)
- [ ] Usage Dashboard displays pie chart (usage by model)
- [ ] Session Header shows token count for current session
- [ ] Screenshot: `docs/screenshots/v0.0.2/cost_tracking.png`

---

### 3.3. Keyboard Shortcuts

**Complexity:** Medium (16 hours)

#### Backend Changes

**Database Schema:**

Add to `dgd/database/schema.sql`:
```sql
-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**New Files:**
- `dgd/database/settings.go`: Settings CRUD operations
- `dgd/api/settings.go`: Settings API handlers

**New API Endpoints:**
- `GET /api/settings` - Retrieve all settings
- `POST /api/settings` - Update one or more settings

#### Frontend Changes

**New Dependencies:**
```json
{
  "react-hotkeys-hook": "^4.5.0"  // Keyboard shortcut library
}
```

**New Files:**
```
src/
├── config/
│   └── shortcuts.json             # Default shortcut definitions
├── contexts/
│   └── ShortcutsContext.tsx       # Shortcuts state management
├── components/
│   └── ShortcutsPanel.tsx         # Shortcuts customization UI
└── hooks/
    └── useShortcut.ts             # Hook for binding shortcuts
```

**Modified Files:**
```
src/
├── main.tsx                        # Add ShortcutsProvider
├── routes/
│   └── settings.tsx               # Add shortcuts panel
└── components/
    └── Chat.tsx                    # Add shortcuts for common actions
```

**Implementation Details:**

1. **Default Shortcuts** (`src/config/shortcuts.json`):
   ```json
   {
     "new-session": {
       "description": "Create new session",
       "mac": "cmd+n",
       "windows": "ctrl+n",
       "linux": "ctrl+n"
     },
     "open-settings": {
       "description": "Open settings",
       "mac": "cmd+,",
       "windows": "ctrl+,",
       "linux": "ctrl+,"
     },
     "command-palette": {
       "description": "Open command palette",
       "mac": "cmd+k",
       "windows": "ctrl+k",
       "linux": "ctrl+k"
     },
     "close-session": {
       "description": "Close current session",
       "mac": "cmd+w",
       "windows": "ctrl+w",
       "linux": "ctrl+w"
     },
     "quit": {
       "description": "Quit application",
       "mac": "cmd+q",
       "windows": "ctrl+q",
       "linux": "ctrl+q"
     }
   }
   ```

2. **Shortcuts Context** (`src/contexts/ShortcutsContext.tsx`):
   ```typescript
   interface ShortcutsContextValue {
     shortcuts: Record<string, string>;
     updateShortcut: (id: string, key: string) => Promise<void>;
     resetShortcuts: () => Promise<void>;
     getShortcut: (id: string) => string;
   }
   
   export function ShortcutsProvider({ children }) {
     const [shortcuts, setShortcuts] = useState(defaultShortcuts);
     
     useEffect(() => {
       // Load user overrides from API
       fetchSettings().then(settings => {
         if (settings.shortcuts) {
           setShortcuts(JSON.parse(settings.shortcuts));
         }
       });
     }, []);
     
     // ...
   }
   ```

3. **Shortcut Hook** (`src/hooks/useShortcut.ts`):
   ```typescript
   import { useHotkeys } from 'react-hotkeys-hook';
   import { useShortcuts } from '@/contexts/ShortcutsContext';
   
   export function useShortcut(id: string, callback: () => void) {
     const { getShortcut } = useShortcuts();
     const shortcut = getShortcut(id);
     
     useHotkeys(shortcut, callback, {
       enableOnFormTags: false,
       preventDefault: true
     });
   }
   ```

4. **Shortcuts Panel** (`src/components/ShortcutsPanel.tsx`):
   ```typescript
   export function ShortcutsPanel() {
     const { shortcuts, updateShortcut } = useShortcuts();
     const [recording, setRecording] = useState<string | null>(null);
     
     const handleRecord = (id: string) => {
       setRecording(id);
       // Listen for key combination
       // Validate not already in use
       // Save to database
     };
     
     return (
       <div className="space-y-4">
         {Object.entries(shortcuts).map(([id, key]) => (
           <div key={id} className="flex items-center justify-between">
             <span>{id}</span>
             <kbd>{key}</kbd>
             <button onClick={() => handleRecord(id)}>Customize</button>
           </div>
         ))}
       </div>
     );
   }
   ```

5. **Platform Detection**:
   ```typescript
   const isMac = navigator.platform.toLowerCase().includes('mac');
   const modKey = isMac ? 'cmd' : 'ctrl';
   ```

**Success Criteria:**
- [ ] All major actions have default keyboard shortcuts
- [ ] Shortcuts work globally (from any screen)
- [ ] Users can customize shortcuts in Settings panel
- [ ] Customized shortcuts persist across sessions
- [ ] Conflict detection prevents duplicate shortcuts
- [ ] Platform-specific shortcuts (⌘ on macOS, Ctrl elsewhere)
- [ ] Screenshot: `docs/screenshots/v0.0.2/keyboard_shortcuts.png`

---

### 3.4. Settings Panel

**Complexity:** Medium (16 hours)

#### Backend Changes

**Database Schema:**

Already covered in Keyboard Shortcuts section:
```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**New Files:**

1. `dgd/database/settings.go`:
   ```go
   package database
   
   func (db *DB) GetSetting(key string) (string, error) { ... }
   func (db *DB) SetSetting(key, value string) error { ... }
   func (db *DB) GetAllSettings() (map[string]string, error) { ... }
   func (db *DB) SetSettings(settings map[string]string) error { ... }
   ```

2. `dgd/api/settings.go`:
   ```go
   package api
   
   type SettingsResponse struct {
       Settings map[string]interface{} `json:"settings"`
   }
   
   func (s *Server) GetSettingsHandler(c *gin.Context) {
       settings, err := s.db.GetAllSettings()
       // Return as JSON
   }
   
   func (s *Server) UpdateSettingsHandler(c *gin.Context) {
       var req map[string]interface{}
       c.ShouldBindJSON(&req)
       // Validate settings
       // Save to database
   }
   ```

**New API Endpoints:**
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Update settings (accepts JSON object)

#### Frontend Changes

**New Files:**
```
src/
├── routes/
│   └── settings.tsx               # Main settings page
├── components/
│   ├── SettingsModels.tsx         # Models section
│   ├── SettingsAppearance.tsx     # Appearance section
│   ├── SettingsShortcuts.tsx      # Shortcuts section (from 3.3)
│   └── SettingsData.tsx           # Data management section
├── api/
│   └── settings.ts                # Settings API client
└── hooks/
    └── useSettings.ts             # Settings data hook
```

**Implementation Details:**

1. **Settings Page** (`src/routes/settings.tsx`):
   ```typescript
   export function Settings() {
     const { data: settings, refetch } = useSettings();
     
     return (
       <div className="max-w-4xl mx-auto p-8">
         <h1 className="text-3xl font-accent mb-8">Settings</h1>
         
         <div className="space-y-8">
           <SettingsModels />
           <SettingsAppearance />
           <SettingsShortcuts />
           <SettingsData />
         </div>
       </div>
     );
   }
   ```

2. **Models Section** (`src/components/SettingsModels.tsx`):
   ```typescript
   export function SettingsModels() {
     const { data: models } = useModels();
     const { updateSetting } = useSettings();
     
     return (
       <section>
         <h2>Model Settings</h2>
         
         <FormField label="Default Model">
           <Select
             value={settings.default_model}
             onChange={(value) => updateSetting('default_model', value)}
           >
             {models.map(model => (
               <option key={model} value={model}>{model}</option>
             ))}
           </Select>
         </FormField>
         
         <FormField label="Temperature">
           <Slider
             min={0}
             max={2}
             step={0.1}
             value={settings.temperature}
             onChange={(value) => updateSetting('temperature', value)}
           />
         </FormField>
         
         <FormField label="Max Tokens">
           <Input
             type="number"
             min={1}
             max={8192}
             value={settings.max_tokens}
             onChange={(e) => updateSetting('max_tokens', parseInt(e.target.value))}
           />
         </FormField>
       </section>
     );
   }
   ```

3. **Appearance Section** (`src/components/SettingsAppearance.tsx`):
   ```typescript
   export function SettingsAppearance() {
     const { updateSetting } = useSettings();
     
     return (
       <section>
         <h2>Appearance</h2>
         
         <FormField label="Theme">
           <Select
             value={settings.theme}
             onChange={(value) => {
               updateSetting('theme', value);
               applyTheme(value);  // Apply immediately
             }}
           >
             <option value="light">Light</option>
             <option value="dark">Dark</option>
             <option value="auto">Auto</option>
           </Select>
         </FormField>
         
         <FormField label="Font Size">
           <Slider
             min={12}
             max={20}
             value={settings.font_size}
             onChange={(value) => {
               updateSetting('font_size', value);
               document.documentElement.style.setProperty('--text-base', `${value}px`);
             }}
           />
         </FormField>
         
         <FormField label="Glassmorphism Intensity">
           <Slider
             min={0}
             max={100}
             value={settings.glassmorphism_intensity}
             onChange={(value) => updateSetting('glassmorphism_intensity', value)}
           />
         </FormField>
       </section>
     );
   }
   ```

4. **Data Section** (`src/components/SettingsData.tsx`):
   ```typescript
   export function SettingsData() {
     const [showConfirm, setShowConfirm] = useState(false);
     
     return (
       <section>
         <h2>Data Management</h2>
         
         <Button onClick={handleExportAll}>
           Export All Sessions
         </Button>
         
         <Button onClick={handleImport}>
           Import Sessions
         </Button>
         
         <Button 
           variant="danger"
           onClick={() => setShowConfirm(true)}
         >
           Clear History
         </Button>
         
         {showConfirm && (
           <ConfirmDialog
             title="Clear History"
             message="This will delete all sessions and messages. This action cannot be undone."
             onConfirm={handleClearHistory}
             onCancel={() => setShowConfirm(false)}
           />
         )}
       </section>
     );
   }
   ```

**Default Settings:**
```typescript
const DEFAULT_SETTINGS = {
  default_model: 'llama3.2:3b',
  temperature: 0.7,
  max_tokens: 2048,
  theme: 'dark',
  font_size: 14,
  glassmorphism_intensity: 70,
  shortcuts: { /* ... */ }
};
```

**Success Criteria:**
- [ ] Settings page accessible via ⌘, or Command Palette
- [ ] All four sections implemented (Models, Appearance, Shortcuts, Data)
- [ ] Settings persisted to SQLite database
- [ ] Theme and font size changes apply immediately
- [ ] Model settings apply to new sessions
- [ ] Form validation prevents invalid inputs
- [ ] Clear History shows confirmation dialog
- [ ] Screenshot: `docs/screenshots/v0.0.2/settings_panel.png`

---

### 3.5. Auto-Updater

**Complexity:** High (16 hours)

#### Backend Changes

**New Dependencies:**
```
go get github.com/inconshreveable/go-update
```

**New Files:**

1. `dgd/updater/updater.go`:
   ```go
   package updater
   
   import (
       "crypto/sha256"
       "encoding/hex"
       "github.com/inconshreveable/go-update"
   )
   
   type LatestVersion struct {
       Version  string `json:"version"`
       URL      string `json:"url"`
       Checksum string `json:"checksum"`  // SHA256 hash
   }
   
   func CheckForUpdates(currentVersion string) (*LatestVersion, error) {
       // Fetch latest.json from GitHub releases
       // Compare versions
       // Return LatestVersion if newer available
   }
   
   func DownloadAndApply(latest *LatestVersion) error {
       // Download binary from URL
       // Verify checksum
       // Apply update using go-update
       // Restart application
   }
   
   func verifyChecksum(data []byte, expectedChecksum string) bool {
       hash := sha256.Sum256(data)
       actualChecksum := hex.EncodeToString(hash[:])
       return actualChecksum == expectedChecksum
   }
   ```

2. `dgd/api/update.go`:
   ```go
   package api
   
   func (s *Server) CheckUpdateHandler(c *gin.Context) {
       latest, err := updater.CheckForUpdates(version.Version)
       if err != nil {
           c.JSON(500, ErrorResponse{Error: err.Error()})
           return
       }
       c.JSON(200, latest)
   }
   
   func (s *Server) ApplyUpdateHandler(c *gin.Context) {
       var req struct {
           Version string `json:"version"`
       }
       c.ShouldBindJSON(&req)
       
       // Download and apply update
       // Notify frontend via WebSocket
       // Restart application
   }
   ```

**Modified Files:**

1. `dgd/cmd/dgd/main.go`:
   ```go
   func main() {
       // Start API server
       
       // Spawn non-blocking goroutine to check for updates
       go func() {
           time.Sleep(5 * time.Second)  // Wait for app to initialize
           latest, err := updater.CheckForUpdates(version.Version)
           if err != nil {
               log.Printf("Update check failed: %v", err)
               return
           }
           if latest != nil {
               log.Printf("Update available: %s", latest.Version)
               // Notify frontend via WebSocket
               ws.Broadcast("update-available", latest)
           }
       }()
   }
   ```

2. `dgd/version/version.go`:
   ```go
   package version
   
   const Version = "0.2.0"
   ```

**New API Endpoints:**
- `GET /api/update/check` - Check for updates
- `POST /api/update/apply` - Download and apply update

**WebSocket Events:**
- `update-available` - Sent when new version detected

#### Frontend Changes

**New Files:**
```
src/
├── components/
│   └── UpdateNotification.tsx     # Update available notification
├── api/
│   └── update.ts                  # Update API client
└── hooks/
    └── useUpdateCheck.ts          # Update check hook
```

**Implementation Details:**

1. **Update Notification** (`src/components/UpdateNotification.tsx`):
   ```typescript
   export function UpdateNotification({ version }: { version: string }) {
     const [show, setShow] = useState(true);
     const applyUpdate = useApplyUpdate();
     
     if (!show) return null;
     
     return (
       <div className="fixed top-4 right-4 bg-dojo-bg-secondary border border-dojo-accent-primary rounded-dojo-lg p-4 shadow-dojo-xl">
         <div className="flex items-center gap-4">
           <div>
             <h3 className="font-semibold">Update Available</h3>
             <p className="text-sm text-dojo-text-secondary">
               Version {version} is ready to install
             </p>
           </div>
           <div className="flex gap-2">
             <Button onClick={() => applyUpdate.mutate()}>
               Install Now
             </Button>
             <Button variant="ghost" onClick={() => setShow(false)}>
               Later
             </Button>
           </div>
         </div>
       </div>
     );
   }
   ```

2. **Update Check Hook** (`src/hooks/useUpdateCheck.ts`):
   ```typescript
   export function useUpdateCheck() {
     const [updateAvailable, setUpdateAvailable] = useState(null);
     
     useEffect(() => {
       const ws = new WebSocket('ws://localhost:8080/ws');
       
       ws.addEventListener('message', (event) => {
         const data = JSON.parse(event.data);
         if (data.type === 'update-available') {
           setUpdateAvailable(data.payload);
         }
       });
       
       return () => ws.close();
     }, []);
     
     return updateAvailable;
   }
   ```

3. **System Tray Icon Update**:
   ```go
   // In dgd/cmd/dgd/main.go (system tray code)
   if updateAvailable {
       systray.SetIcon(trayUpgradeIcon)
   } else {
       systray.SetIcon(trayIcon)
   }
   ```

**Security Considerations:**
- HTTPS only for update downloads
- SHA256 checksum verification
- Signature verification (future enhancement)
- User confirmation required before applying update

**Update Flow:**
1. App starts → Spawn goroutine to check for updates (after 5s delay)
2. Fetch `latest.json` from GitHub releases
3. Compare versions (semantic versioning)
4. If newer version → Notify frontend via WebSocket
5. Frontend shows notification banner
6. User clicks "Install Now"
7. Backend downloads binary, verifies checksum
8. Backend replaces executable
9. Backend restarts application

**Success Criteria:**
- [ ] App checks for updates on startup (non-blocking)
- [ ] Update notification appears when new version available
- [ ] User can install update or dismiss notification
- [ ] Update process verifies checksum
- [ ] Application restarts automatically after update
- [ ] System tray icon changes when update available
- [ ] Screenshot: `docs/screenshots/v0.0.2/auto_updater.png`

---

### 3.6. Export/Import Sessions

**Complexity:** Medium (16 hours)

#### Backend Changes

**New Files:**

1. `dgd/api/export.go`:
   ```go
   package api
   
   import (
       "fmt"
       "gopkg.in/yaml.v3"
   )
   
   type SessionExport struct {
       Metadata SessionMetadata `yaml:"---"`
       Messages []ExportMessage `yaml:"messages"`
   }
   
   type SessionMetadata struct {
       SessionID  string `yaml:"session_id"`
       Title      string `yaml:"title"`
       CreatedAt  string `yaml:"created_at"`
       Model      string `yaml:"model"`
       WorkingDir string `yaml:"working_dir"`
   }
   
   type ExportMessage struct {
       Role      string `yaml:"role"`
       Content   string `yaml:"content"`
       Timestamp string `yaml:"timestamp"`
       Tokens    int    `yaml:"tokens,omitempty"`
   }
   
   func (s *Server) ExportSessionHandler(c *gin.Context) {
       sessionID := c.Param("id")
       
       // Get session and messages from database
       session, err := s.db.GetSession(sessionID)
       messages, err := s.db.ListMessages(sessionID)
       
       // Format as Markdown with YAML frontmatter
       markdown := formatSessionMarkdown(session, messages)
       
       // Return as downloadable file
       c.Header("Content-Type", "text/markdown")
       c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=session_%s.md", sessionID))
       c.String(200, markdown)
   }
   
   func formatSessionMarkdown(session *Session, messages []Message) string {
       var buf strings.Builder
       
       // YAML frontmatter
       buf.WriteString("---\n")
       yaml.NewEncoder(&buf).Encode(SessionMetadata{
           SessionID:  session.ID,
           Title:      session.Title,
           CreatedAt:  session.CreatedAt.Format(time.RFC3339),
           WorkingDir: session.WorkingDir,
       })
       buf.WriteString("---\n\n")
       
       // Messages
       for _, msg := range messages {
           buf.WriteString(fmt.Sprintf("## %s\n\n", strings.Title(msg.Role)))
           buf.WriteString(msg.Content)
           buf.WriteString("\n\n")
       }
       
       return buf.String()
   }
   ```

2. `dgd/api/import.go`:
   ```go
   package api
   
   func (s *Server) ImportSessionHandler(c *gin.Context) {
       file, err := c.FormFile("file")
       if err != nil {
           c.JSON(400, ErrorResponse{Error: "No file uploaded"})
           return
       }
       
       // Open file
       content, err := readFile(file)
       
       // Parse YAML frontmatter
       metadata, messages, err := parseSessionMarkdown(content)
       
       // Create new session in database
       newSessionID := uuid.New().String()
       session := &database.Session{
           ID:         newSessionID,
           Title:      metadata.Title,
           WorkingDir: metadata.WorkingDir,
           Status:     "active",
       }
       s.db.CreateSession(session)
       
       // Insert messages
       for _, msg := range messages {
           s.db.CreateMessage(&database.Message{
               ID:        uuid.New().String(),
               SessionID: newSessionID,
               Role:      msg.Role,
               Content:   msg.Content,
           })
       }
       
       c.JSON(200, gin.H{"session_id": newSessionID})
   }
   
   func parseSessionMarkdown(content string) (*SessionMetadata, []ExportMessage, error) {
       // Split YAML frontmatter and content
       // Parse YAML
       // Parse messages (split by ## headings)
       // Validate format
       // Return parsed data
   }
   ```

**New API Endpoints:**
- `GET /api/sessions/:id/export` - Export session as Markdown
- `POST /api/sessions/import` - Import session from Markdown file

#### Frontend Changes

**New Dependencies:**
```json
{
  "js-yaml": "^4.1.0"  // Already in package.json
}
```

**Modified Files:**
```
src/
├── components/
│   └── SessionContextMenu.tsx     # Add export/import options
└── api/
    └── sessions.ts                # Add export/import functions
```

**Implementation Details:**

1. **Export Function** (`src/api/sessions.ts`):
   ```typescript
   export async function exportSession(sessionId: string): Promise<void> {
     const response = await fetch(`http://localhost:8080/api/sessions/${sessionId}/export`);
     const blob = await response.blob();
     
     // Trigger download
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `session_${sessionId}.md`;
     a.click();
     URL.revokeObjectURL(url);
   }
   ```

2. **Import Function** (`src/api/sessions.ts`):
   ```typescript
   export async function importSession(file: File): Promise<string> {
     const formData = new FormData();
     formData.append('file', file);
     
     const response = await fetch('http://localhost:8080/api/sessions/import', {
       method: 'POST',
       body: formData
     });
     
     const { session_id } = await response.json();
     return session_id;
   }
   ```

3. **Session Context Menu** (`src/components/SessionContextMenu.tsx`):
   ```typescript
   export function SessionContextMenu({ sessionId }: { sessionId: string }) {
     const navigate = useNavigate();
     const fileInputRef = useRef<HTMLInputElement>(null);
     
     const handleExport = async () => {
       await exportSession(sessionId);
     };
     
     const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
       const file = e.target.files?.[0];
       if (!file) return;
       
       const newSessionId = await importSession(file);
       navigate(`/sessions/${newSessionId}`);
     };
     
     return (
       <ContextMenu>
         <MenuItem onClick={handleExport}>
           Export Session
         </MenuItem>
         <MenuItem onClick={() => fileInputRef.current?.click()}>
           Import Session
         </MenuItem>
         <input
           ref={fileInputRef}
           type="file"
           accept=".md,.markdown"
           className="hidden"
           onChange={handleImport}
         />
       </ContextMenu>
     );
   }
   ```

**Markdown Format Example:**
```markdown
---
session_id: "abc-123-def"
title: "Planning Sprint v0.2.0"
created_at: "2026-01-23T10:00:00Z"
model: "llama3.2:3b"
working_dir: "/home/user/projects/dgd"
---

## User

Can you help me plan the v0.2.0 sprint?

## Assistant

Sure! Let's break down the six features...

## User

What about cost tracking?

## Assistant

For cost tracking, we need to...
```

**Success Criteria:**
- [ ] Right-click session shows "Export Session" option
- [ ] Exported file is valid Markdown with YAML frontmatter
- [ ] Exported file includes all messages from session
- [ ] "Import Session" option opens file picker
- [ ] Import validates Markdown format
- [ ] Import creates new session with imported messages
- [ ] Import rejects invalid files with error message
- [ ] Screenshot: `docs/screenshots/v0.0.2/export_import.png`

---

## 4. Implementation Plan

### 4.1. Phase 1: Backend Foundation (32 hours)

**Week 1, Days 1-2 (16 hours):**

1. **Database Migrations** (4 hours)
   - Create migration system
   - Add `prompt_tokens`, `completion_tokens` to messages table
   - Add `settings` table
   - Test migrations

2. **LLM Token Tracking** (4 hours)
   - Update `llm/types.go` with token fields
   - Update `llm/ollama.go` to return token counts
   - Update `llm/openai.go` to return token counts
   - Write tests for token extraction

3. **Settings API** (4 hours)
   - Create `database/settings.go` (CRUD operations)
   - Create `api/settings.go` (HTTP handlers)
   - Add `GET /api/settings` endpoint
   - Add `POST /api/settings` endpoint
   - Write tests

4. **Usage API** (4 hours)
   - Create `database/usage.go` (aggregation queries)
   - Create `api/usage.go` (HTTP handler)
   - Add `GET /api/usage` endpoint
   - Implement usage calculation logic
   - Write tests

**Week 1, Days 3-4 (16 hours):**

5. **Export/Import Endpoints** (8 hours)
   - Create `api/export.go` (session export)
   - Create `api/import.go` (session import)
   - Add `GET /api/sessions/:id/export` endpoint
   - Add `POST /api/sessions/import` endpoint
   - Implement Markdown formatting
   - Implement YAML parsing
   - Write tests

6. **Auto-Updater Backend** (8 hours)
   - Add `go-update` dependency
   - Create `updater/updater.go` (update logic)
   - Create `api/update.go` (update endpoints)
   - Implement update check goroutine in `main.go`
   - Implement WebSocket event broadcasting
   - Implement checksum verification
   - Write tests

### 4.2. Phase 2: Frontend Foundation (40 hours)

**Week 1, Day 5 + Week 2, Days 1-2 (24 hours):**

7. **Command Palette** (24 hours)
   - Install `fuse.js` dependency
   - Create `commands/registry.ts` (command definitions)
   - Create `commands/types.ts` (TypeScript types)
   - Create `contexts/CommandPaletteContext.tsx` (state management)
   - Create `hooks/useCommandPalette.ts` (hook for palette access)
   - Create `components/CommandPalette.tsx` (UI component)
   - Implement fuzzy search with fuse.js
   - Implement keyboard navigation
   - Implement glassmorphism design
   - Add to `main.tsx` (provider)
   - Write tests
   - Take screenshot

**Week 2, Days 3-4 (16 hours):**

8. **Cost Tracking UI** (16 hours)
   - Install `recharts` dependency
   - Create `api/usage.ts` (API client)
   - Create `hooks/useUsage.ts` (data hook)
   - Create `components/UsageDashboard.tsx` (charts)
   - Implement line chart (tokens over time)
   - Implement pie chart (usage by model)
   - Update `components/SessionHeader.tsx` (token display)
   - Implement cost calculation
   - Style with Dojo Genesis theme
   - Write tests
   - Take screenshot

### 4.3. Phase 3: Settings & Shortcuts (32 hours)

**Week 2, Day 5 + Week 3, Day 1 (16 hours):**

9. **Keyboard Shortcuts** (16 hours)
   - Install `react-hotkeys-hook` dependency
   - Create `config/shortcuts.json` (default shortcuts)
   - Create `contexts/ShortcutsContext.tsx` (state management)
   - Create `hooks/useShortcut.ts` (shortcut hook)
   - Create `components/ShortcutsPanel.tsx` (customization UI)
   - Implement shortcut recording
   - Implement conflict detection
   - Implement platform detection (⌘ vs Ctrl)
   - Bind global shortcuts (⌘K, ⌘N, ⌘,, ⌘W, ⌘Q)
   - Write tests
   - Take screenshot

**Week 3, Days 2-3 (16 hours):**

10. **Settings Panel** (16 hours)
    - Create `api/settings.ts` (API client)
    - Create `hooks/useSettings.ts` (data hook)
    - Create `routes/settings.tsx` (main page)
    - Create `components/SettingsModels.tsx` (models section)
    - Create `components/SettingsAppearance.tsx` (appearance section)
    - Create `components/SettingsShortcuts.tsx` (shortcuts section)
    - Create `components/SettingsData.tsx` (data section)
    - Implement form validation
    - Implement immediate effect (theme, font size)
    - Implement confirmation dialogs
    - Style with Dojo Genesis theme
    - Write tests
    - Take screenshot

### 4.4. Phase 4: Polish & Integration (16 hours)

**Week 3, Days 4-5 (16 hours):**

11. **Auto-Updater Frontend** (8 hours)
    - Create `api/update.ts` (API client)
    - Create `hooks/useUpdateCheck.ts` (WebSocket integration)
    - Create `components/UpdateNotification.tsx` (notification banner)
    - Implement update apply flow
    - Implement system tray icon change (backend)
    - Write tests
    - Take screenshot

12. **Export/Import UI** (8 hours)
    - Update `api/sessions.ts` (export/import functions)
    - Update `components/SessionContextMenu.tsx` (menu items)
    - Implement file download
    - Implement file upload
    - Implement error handling
    - Write tests
    - Take screenshot

### 4.5. Phase 5: Testing & Documentation (16 hours)

**Week 4, Days 1-2 (16 hours):**

13. **Integration Testing** (8 hours)
    - Test all features end-to-end
    - Test cross-feature interactions
    - Test edge cases
    - Fix bugs

14. **Documentation & Screenshots** (4 hours)
    - Take all 6 feature screenshots
    - Update README.md with new features
    - Document API endpoints
    - Document keyboard shortcuts

15. **Build & Deploy** (4 hours)
    - Run `go test ./...` (backend tests)
    - Run `npm test` (frontend tests)
    - Run `npm run lint` (linting)
    - Run `./build-dgd.sh` (build for all platforms)
    - Verify builds work on macOS, Windows, Linux
    - Create release notes

---

## 5. File Structure Changes

### 5.1. New Backend Files

```
dgd/
├── updater/
│   └── updater.go                 # Auto-update logic
├── database/
│   ├── migrations/
│   │   └── 001_add_token_tracking.sql
│   ├── settings.go                # Settings CRUD
│   └── usage.go                   # Usage aggregation
└── api/
    ├── settings.go                # Settings endpoints
    ├── usage.go                   # Usage endpoints
    ├── export.go                  # Export endpoint
    ├── import.go                  # Import endpoint
    └── update.go                  # Update endpoints
```

### 5.2. New Frontend Files

```
app/ui/app/src/
├── commands/
│   ├── registry.ts                # Command definitions
│   └── types.ts                   # Command types
├── config/
│   └── shortcuts.json             # Default shortcuts
├── contexts/
│   ├── CommandPaletteContext.tsx  # Command palette state
│   └── ShortcutsContext.tsx       # Shortcuts state
├── components/
│   ├── CommandPalette.tsx         # Command palette UI
│   ├── UsageDashboard.tsx         # Usage dashboard
│   ├── ShortcutsPanel.tsx         # Shortcuts customization
│   ├── SettingsModels.tsx         # Models settings
│   ├── SettingsAppearance.tsx     # Appearance settings
│   ├── SettingsShortcuts.tsx      # Shortcuts settings
│   ├── SettingsData.tsx           # Data management
│   └── UpdateNotification.tsx     # Update notification
├── routes/
│   └── settings.tsx               # Settings page
├── api/
│   ├── usage.ts                   # Usage API client
│   ├── settings.ts                # Settings API client
│   └── update.ts                  # Update API client
└── hooks/
    ├── useCommandPalette.ts       # Command palette hook
    ├── useUsage.ts                # Usage data hook
    ├── useSettings.ts             # Settings data hook
    ├── useShortcut.ts             # Shortcut binding hook
    └── useUpdateCheck.ts          # Update check hook
```

### 5.3. Modified Files

**Backend:**
- `dgd/database/schema.sql` - Add new tables and columns
- `dgd/llm/types.go` - Add token fields
- `dgd/llm/ollama.go` - Return token counts
- `dgd/llm/openai.go` - Return token counts
- `dgd/api/handlers.go` - Persist token counts
- `dgd/cmd/dgd/main.go` - Add update check goroutine

**Frontend:**
- `app/ui/app/package.json` - Add new dependencies
- `app/ui/app/src/main.tsx` - Add providers
- `app/ui/app/src/components/SessionHeader.tsx` - Add token display
- `app/ui/app/src/components/SessionContextMenu.tsx` - Add export/import

---

## 6. Dependencies

### 6.1. New Backend Dependencies

```bash
go get github.com/inconshreveable/go-update  # Auto-updater
go get gopkg.in/yaml.v3                      # YAML parsing (may already exist)
```

### 6.2. New Frontend Dependencies

```bash
npm install fuse.js@^7.0.0                   # Fuzzy search
npm install react-hotkeys-hook@^4.5.0        # Keyboard shortcuts
npm install recharts@^2.12.0                 # Charts
```

---

## 7. Verification Approach

### 7.1. Backend Testing

**Unit Tests:**
```bash
# Test all packages
go test ./dgd/...

# Test specific features
go test ./dgd/updater/...
go test ./dgd/api/...
go test ./dgd/database/...
```

**API Testing:**
```bash
# Start backend
go run cmd/dgd/main.go

# Test settings API
curl http://localhost:8080/api/settings
curl -X POST http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{"default_model": "llama3.2:3b"}'

# Test usage API
curl http://localhost:8080/api/usage

# Test export
curl http://localhost:8080/api/sessions/123/export > session.md

# Test import
curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@session.md"
```

### 7.2. Frontend Testing

**Unit Tests:**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm test CommandPalette
npm test UsageDashboard
```

**Manual Testing:**
```bash
# Start development server
npm run dev

# Test each feature:
# 1. Press ⌘K → Command palette opens
# 2. Open Settings → All sections render
# 3. Send messages → Token counts appear
# 4. Right-click session → Export/Import options
# 5. Check for updates → Notification appears (if available)
# 6. Customize shortcuts → Changes persist
```

### 7.3. Integration Testing

**End-to-End Flow:**
1. Start backend: `go run cmd/dgd/main.go`
2. Start frontend: `npm run dev`
3. Create new session (⌘N)
4. Send messages → Verify token counts persist
5. Open Settings (⌘,) → Verify all sections work
6. Customize shortcut → Restart → Verify persists
7. View Usage Dashboard → Verify charts display
8. Export session → Verify Markdown format
9. Import session → Verify new session created
10. Take screenshots of all features

### 7.4. Build Testing

**Cross-Platform Builds:**
```bash
# Build for all platforms
./build-dgd.sh

# Verify outputs
ls -lh dgd-*
# Should see: dgd-macos-amd64, dgd-windows-amd64.exe, dgd-linux-amd64

# Test on each platform
./dgd-macos-amd64
```

---

## 8. Success Metrics

### 8.1. Feature Completion

- [ ] Command Palette: All 7 success criteria met
- [ ] Cost Tracking: All 7 success criteria met
- [ ] Keyboard Shortcuts: All 7 success criteria met
- [ ] Settings Panel: All 7 success criteria met
- [ ] Auto-Updater: All 7 success criteria met
- [ ] Export/Import: All 7 success criteria met

### 8.2. Code Quality

- [ ] All backend tests pass (`go test ./...`)
- [ ] All frontend tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] No type errors (`npm run build`)
- [ ] Code coverage > 70% for new code

### 8.3. Documentation

- [ ] README.md updated with new features
- [ ] API endpoints documented
- [ ] Keyboard shortcuts documented
- [ ] 6 screenshots captured and saved

### 8.4. Performance

- [ ] Command palette search < 50ms
- [ ] Usage API response < 200ms
- [ ] Settings API response < 200ms
- [ ] No blocking operations on UI thread

---

## 9. Risk Mitigation

### 9.1. Technical Risks

**Risk:** Auto-updater fails on Windows/Linux due to permissions
- **Mitigation:** Test on all platforms early, implement fallback to manual update

**Risk:** Database migration fails on existing installations
- **Mitigation:** Implement migration system with rollback, test on v0.1.0 database

**Risk:** Token counts not available from Ollama API
- **Mitigation:** Handle missing token counts gracefully, default to 0

**Risk:** Command palette performance degrades with many commands
- **Mitigation:** Implement pagination, limit search results to 50

### 9.2. Integration Risks

**Risk:** Keyboard shortcuts conflict with OS shortcuts
- **Mitigation:** Allow customization, provide clear documentation

**Risk:** WebSocket connection fails for update notifications
- **Mitigation:** Implement fallback to polling, reconnection logic

### 9.3. UX Risks

**Risk:** Users accidentally clear history
- **Mitigation:** Implement confirmation dialog with clear warning

**Risk:** Update process interrupts user workflow
- **Mitigation:** Allow "Later" option, only check on startup

---

## 10. Next Steps

After completing this specification:

1. **Review with stakeholder** - Confirm approach and priorities
2. **Create detailed implementation plan** - Break down into daily tasks
3. **Set up development environment** - Install dependencies, prepare database
4. **Begin Phase 1** - Start with backend foundation
5. **Iterate** - Build, test, refine, repeat

---

## Appendix: API Reference

### New Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/settings` | Get all settings | - | `{"settings": {...}}` |
| POST | `/api/settings` | Update settings | `{"key": "value", ...}` | `{"success": true}` |
| GET | `/api/usage` | Get usage statistics | - | `UsageStats` |
| GET | `/api/sessions/:id/export` | Export session | - | Markdown file |
| POST | `/api/sessions/import` | Import session | FormData with file | `{"session_id": "..."}` |
| GET | `/api/update/check` | Check for updates | - | `LatestVersion \| null` |
| POST | `/api/update/apply` | Apply update | `{"version": "..."}` | `{"success": true}` |

### WebSocket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `update-available` | Server → Client | `LatestVersion` | New version detected |
| `update-progress` | Server → Client | `{"progress": 0-100}` | Update download progress |
| `update-complete` | Server → Client | `{"success": true}` | Update applied successfully |

---

**End of Specification**
