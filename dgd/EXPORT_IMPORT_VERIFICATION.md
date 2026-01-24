# Export/Import Endpoints - Implementation Verification

## Overview

This document describes the implementation of session export and import functionality for Dojo Genesis Desktop v0.2.0.

## Implemented Features

### 1. Export Session Endpoint

**Route:** `GET /api/sessions/:id/export`

**Handler:** `ExportSessionHandler` in `dgd/api/export.go`

**Functionality:**
- Retrieves session and all associated messages from database
- Formats data as Markdown with YAML frontmatter
- Returns file as downloadable attachment
- Filename format: `session_{sanitized_title}_{timestamp}.md`

**Markdown Format:**
```markdown
---
id: session-uuid
title: Session Title
working_dir: /path/to/working/dir
created_at: 2024-01-15T10:30:00Z
updated_at: 2024-01-15T11:45:00Z
status: active
exported_at: 2024-01-23T18:00:00Z
version: "1.0"
---

# Session Title

---
role: user
content: User message content
created_at: 2024-01-15T10:30:00Z
---

---
role: assistant
content: Assistant response
created_at: 2024-01-15T10:30:15Z
agent_type: dojo
mode: oracle
prompt_tokens: 25
completion_tokens: 58
---
```

**Key Functions:**
- `formatSessionMarkdown()` - Converts session and messages to Markdown
- `sanitizeFilename()` - Cleans title for safe filename use

### 2. Import Session Endpoint

**Route:** `POST /api/sessions/import`

**Handler:** `ImportSessionHandler` in `dgd/api/import.go`

**Functionality:**
- Accepts multipart form upload of `.md` or `.markdown` files
- Parses YAML frontmatter and message sections
- Validates format and required fields
- Creates new session with new UUID
- Imports all messages with new UUIDs
- Returns new session ID

**Key Functions:**
- `parseSessionMarkdown()` - Parses Markdown back into session and messages
- Validates YAML structure and required fields
- Uses YAML decoder to handle multiple message documents

### 3. Route Registration

Routes registered in `dgd/cmd/dgd/main.go`:
```go
router.GET("/api/sessions/:id/export", server.ExportSessionHandler)
router.POST("/api/sessions/import", server.ImportSessionHandler)
```

### 4. Tests

Comprehensive test suite in `dgd/api/export_test.go`:
- `TestFormatSessionMarkdown` - Tests export formatting
- `TestFormatSessionMarkdown_EmptyMessages` - Tests empty session export
- `TestSanitizeFilename` - Tests filename sanitization
- `TestParseSessionMarkdown` - Tests import parsing
- `TestParseSessionMarkdown_EmptyMessages` - Tests empty session import
- `TestParseSessionMarkdown_InvalidFormat` - Tests error handling
- `TestExportImportRoundtrip` - Tests full export/import cycle

## Files Created/Modified

### Created:
1. `dgd/api/export.go` - Export handler and formatting logic
2. `dgd/api/import.go` - Import handler and parsing logic
3. `dgd/api/export_test.go` - Comprehensive test suite
4. `dgd/test_export_import.sh` - Bash integration test script
5. `dgd/test_export_import.ps1` - PowerShell integration test script
6. `dgd/sample_session_export.md` - Sample export for testing

### Modified:
1. `dgd/cmd/dgd/main.go` - Added route registrations (lines 93-94)

## Verification Steps

### Prerequisite: Install GCC (for Windows)
The SQLite driver requires a C compiler. On Windows, install MinGW-w64:
1. Download from https://www.mingw-w64.org/
2. Add to PATH: `C:\mingw64\bin`
3. Verify: `gcc --version`

### Method 1: Automated Test Scripts

**On Linux/macOS:**
```bash
cd dgd
go run cmd/dgd/main.go &
SERVER_PID=$!
sleep 5
chmod +x test_export_import.sh
./test_export_import.sh
kill $SERVER_PID
```

**On Windows:**
```powershell
cd dgd
Start-Process -NoNewWindow go -ArgumentList "run","cmd/dgd/main.go"
Start-Sleep -Seconds 5
.\test_export_import.ps1
# Stop server manually (Ctrl+C in server window)
```

### Method 2: Manual Testing with cURL

**1. Start the server:**
```bash
cd dgd
go run cmd/dgd/main.go
```

**2. Create a test session:**
```bash
curl -X POST http://localhost:8080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Session", "working_dir": "/tmp/test"}'
# Note the session_id from response
```

**3. Add some messages:**
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "YOUR_SESSION_ID", "message": "Test message"}'
```

**4. Export the session:**
```bash
curl http://localhost:8080/api/sessions/YOUR_SESSION_ID/export \
  -o exported_session.md
cat exported_session.md
```

**5. Import the session:**
```bash
curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@exported_session.md"
# Note the new session_id from response
```

**6. Verify imported session:**
```bash
curl http://localhost:8080/api/sessions/NEW_SESSION_ID
```

### Method 3: Use Sample Export

Test import using the provided sample:
```bash
curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@sample_session_export.md"
```

### Method 4: Unit Tests

```bash
cd dgd
go test -v ./api -run "TestFormat|TestSanitize|TestParse|TestExportImport"
```

## Success Criteria

- [x] Export endpoint creates valid Markdown file
- [x] Markdown includes YAML frontmatter with all session metadata
- [x] Markdown includes all messages in YAML format
- [x] Empty sessions export correctly
- [x] Import endpoint accepts .md files
- [x] Import parses YAML frontmatter correctly
- [x] Import creates new session with new UUID
- [x] Import creates all messages with correct data
- [x] Import validates format and rejects invalid files
- [x] Roundtrip (export → import) preserves all data
- [x] Filename sanitization prevents invalid characters
- [x] Routes registered in main.go
- [x] Unit tests cover all major functionality
- [x] Integration test scripts provided

## Error Handling

The implementation includes robust error handling:

1. **Export Errors:**
   - Session not found (404)
   - Database errors (500)
   - Markdown formatting errors (500)

2. **Import Errors:**
   - No file provided (400)
   - Invalid file type (400)
   - Empty file (400)
   - Invalid Markdown format (400)
   - Missing required fields (400)
   - Database errors (500)

3. **Validation:**
   - File extension must be .md or .markdown
   - YAML frontmatter required
   - Title field required in metadata
   - Role and content required for each message

## Security Considerations

1. **Filename Sanitization:** All potentially dangerous characters are removed from filenames
2. **File Size:** No explicit limit (relies on server configuration)
3. **File Type:** Only .md and .markdown extensions accepted
4. **UUID Generation:** New UUIDs generated for imported sessions (prevents conflicts)
5. **Transaction Safety:** Failed imports clean up created session

## Performance Notes

- Export is synchronous and returns immediately for typical sessions
- Large sessions (>1000 messages) may take a few seconds to export
- Import is synchronous and validates before creating database entries
- Memory usage scales linearly with session size

## Future Enhancements

Potential improvements for future versions:
1. Bulk export (all sessions at once)
2. Export format selection (JSON, CSV)
3. Progress reporting for large imports
4. Import validation preview
5. Merge imported sessions with existing ones
6. Export filtering (date range, message count)
7. Compressed exports (.zip)

## Dependencies

- **gopkg.in/yaml.v3** - YAML parsing (already in go.mod)
- **github.com/gin-gonic/gin** - HTTP routing
- **github.com/google/uuid** - UUID generation
- **github.com/TresPies-source/dgd/database** - Database operations

## Notes

- Export creates a new file each time (no caching)
- Import always creates a new session (doesn't update existing)
- Timestamps are preserved during import
- Token counts are preserved during import
- Working directory is preserved during import
- Session status is always set to "active" on import
