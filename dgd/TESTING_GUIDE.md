# Testing Guide - Export/Import Endpoints

## Prerequisites

### Install GCC (Required for SQLite driver)

The DGD server uses SQLite which requires CGO (C bindings). You need GCC installed and in your PATH.

#### Windows

**Option 1: MinGW-w64 (Recommended)**
1. Download: https://github.com/niXman/mingw-builds-binaries/releases
   - Look for: `x86_64-*-release-posix-seh-ucrt-*.7z`
2. Extract to `C:\mingw64`
3. Add to PATH:
   ```cmd
   setx PATH "%PATH%;C:\mingw64\bin"
   ```
4. Verify:
   ```cmd
   gcc --version
   ```

**Option 2: TDM-GCC**
1. Download: https://jmeubank.github.io/tdm-gcc/
2. Run installer (adds to PATH automatically)
3. Verify: `gcc --version`

**Option 3: MSYS2**
1. Download: https://www.msys2.org/
2. Install and run:
   ```bash
   pacman -S mingw-w64-x86_64-gcc
   ```
3. Add to PATH: `C:\msys64\mingw64\bin`

#### macOS

```bash
xcode-select --install
```

#### Linux

```bash
# Debian/Ubuntu
sudo apt-get install gcc

# Fedora/RHEL
sudo dnf install gcc

# Arch
sudo pacman -S gcc
```

## Running Tests

### 1. Unit Tests

Once GCC is installed:

```bash
cd dgd
go test -v ./api -run "TestFormat|TestSanitize|TestParse|TestExportImport"
```

Expected output:
```
=== RUN   TestFormatSessionMarkdown
--- PASS: TestFormatSessionMarkdown (0.00s)
=== RUN   TestFormatSessionMarkdown_EmptyMessages
--- PASS: TestFormatSessionMarkdown_EmptyMessages (0.00s)
=== RUN   TestSanitizeFilename
--- PASS: TestSanitizeFilename (0.00s)
...
PASS
ok      github.com/TresPies-source/dgd/api
```

### 2. Integration Tests

#### Start the Server

```bash
cd dgd
go run cmd/dgd/main.go
```

Server should start on `http://localhost:8080`

#### Run Automated Tests

**Linux/macOS:**
```bash
chmod +x test_export_import.sh
./test_export_import.sh
```

**Windows (PowerShell):**
```powershell
.\test_export_import.ps1
```

**Windows (Git Bash/WSL):**
```bash
bash test_export_import.sh
```

### 3. Manual Testing

#### Step 1: Create Test Session

```bash
curl -X POST http://localhost:8080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Export Test", "working_dir": "/tmp/test"}'
```

Save the `session_id` from response.

#### Step 2: Add Messages

```bash
SESSION_ID="<your-session-id>"

curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"message\": \"Hello world\"}"

curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"message\": \"Tell me about Dojo\"}"
```

#### Step 3: Export Session

```bash
curl http://localhost:8080/api/sessions/$SESSION_ID/export \
  -o exported_session.md
```

View the export:
```bash
cat exported_session.md
```

Expected format:
```markdown
---
id: <uuid>
title: Export Test
working_dir: /tmp/test
created_at: 2024-01-23T18:00:00Z
...
---

# Export Test

---
role: user
content: Hello world
...
---
```

#### Step 4: Import Session

```bash
curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@exported_session.md"
```

Response:
```json
{
  "session_id": "<new-uuid>",
  "message": "Successfully imported session with X messages"
}
```

#### Step 5: Verify Import

```bash
NEW_SESSION_ID="<new-session-id-from-import>"

curl http://localhost:8080/api/sessions/$NEW_SESSION_ID
```

Should show the imported session with all messages.

### 4. Test with Sample Data

Use the provided sample export:

```bash
curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@sample_session_export.md"
```

This imports a session with 4 messages including:
- User queries about Dojo Genesis
- Assistant responses with token counts
- Multiple agent types (Dojo, Builder)
- Different modes (Oracle, Sage)

## Verification Checklist

- [ ] GCC installed and in PATH
- [ ] `go test` runs without CGO errors
- [ ] All unit tests pass
- [ ] Server starts successfully
- [ ] Can create sessions via API
- [ ] Can export sessions (returns .md file)
- [ ] Export contains valid YAML frontmatter
- [ ] Export contains all messages
- [ ] Can import exported files
- [ ] Import creates new session
- [ ] Imported session has all messages
- [ ] Token counts preserved in roundtrip
- [ ] Agent types preserved in roundtrip
- [ ] Integration test scripts pass

## Troubleshooting

### Error: "CGO_ENABLED=0"

**Problem:** Binary compiled without CGO support.

**Solution:**
1. Install GCC (see above)
2. Ensure GCC is in PATH: `gcc --version`
3. Rebuild: `go build ./cmd/dgd`

### Error: "gcc not found"

**Problem:** GCC not in PATH.

**Solution:**
- Windows: Add `C:\mingw64\bin` to PATH
- macOS: Run `xcode-select --install`
- Linux: Install gcc package

### Error: "session not found"

**Problem:** Invalid session ID.

**Solution:**
1. Create session first: `POST /api/sessions`
2. Use returned `session_id` in export URL

### Error: "invalid format"

**Problem:** Malformed import file.

**Solution:**
1. Verify YAML frontmatter starts with `---`
2. Check all required fields present: `id`, `title`, `working_dir`
3. Ensure message sections are valid YAML
4. Use exported file as template

### Server Won't Start

**Problem:** Database initialization failed.

**Solution:**
1. Check CGO enabled: `go env CGO_ENABLED` (should be "1")
2. Verify GCC available: `gcc --version`
3. Remove old database: `rm ~/.dgd/dgd.db`
4. Rebuild: `go build -v ./cmd/dgd`

## Performance Testing

### Large Session Export

```bash
# Create session with many messages
SESSION_ID="<session-id>"
for i in {1..100}; do
  curl -X POST http://localhost:8080/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"session_id\": \"$SESSION_ID\", \"message\": \"Message $i\"}"
done

# Time the export
time curl http://localhost:8080/api/sessions/$SESSION_ID/export \
  -o large_session.md

# Check file size
ls -lh large_session.md
```

Expected: < 5 seconds for 100 messages

### Import Performance

```bash
# Time the import
time curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@large_session.md"
```

Expected: < 10 seconds for 100 messages

## Security Testing

### Filename Injection

```bash
# Create session with special characters in title
curl -X POST http://localhost:8080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Test/../../../etc/passwd", "working_dir": "/tmp"}'

# Export should sanitize filename
curl http://localhost:8080/api/sessions/$SESSION_ID/export \
  -i | grep "Content-Disposition"
```

Should NOT contain `../` or other path traversal characters.

### Invalid File Upload

```bash
# Try to upload non-markdown file
echo "not markdown" > test.txt
curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@test.txt"
```

Should return 400 error: "file must be a markdown file"

### Malformed YAML

```bash
# Create invalid YAML file
cat > bad.md << 'EOF'
---
invalid yaml: [unclosed
---
EOF

curl -X POST http://localhost:8080/api/sessions/import \
  -F "file=@bad.md"
```

Should return 400 error with parse failure message.

## Next Steps

After verifying export/import works:

1. **Frontend Integration** - Add UI buttons for export/import
2. **Bulk Operations** - Export all sessions at once
3. **Format Options** - JSON, CSV export formats
4. **Import Merging** - Merge imported sessions into existing ones
5. **Progress Tracking** - Show progress for large imports
6. **Validation UI** - Preview import before committing

## Documentation

- Full implementation: `EXPORT_IMPORT_VERIFICATION.md`
- Implementation summary: `IMPLEMENTATION_SUMMARY.md`
- Sample export: `sample_session_export.md`
