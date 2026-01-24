# Auto-Updater Implementation

**Version:** 0.2.0  
**Status:** ✅ Complete  
**Last Updated:** January 24, 2026

---

## Overview

The Auto-Updater provides automatic update checking and application for Dojo Genesis Desktop. It supports:

- Non-blocking startup checks
- Manual update checks via API
- GitHub Releases API integration
- Custom update server support
- SHA256 checksum verification
- Graceful shutdown before restart
- Cross-platform support (Windows, macOS, Linux)
- Multi-architecture support (amd64, arm64)
- Automatic retry with exponential backoff

---

## Architecture

### Components

```
┌─────────────────────┐
│   Frontend (TBD)    │
│  Update UI/Notify   │
└──────────┬──────────┘
           │
           ↓ REST API
┌──────────────────────┐
│   API Layer          │
│  /api/update/check   │
│  /api/update/apply   │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  Updater Package     │
│  • CheckForUpdates   │
│  • DownloadAndApply  │
│  • RestartApp        │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│   Update Sources     │
│  • GitHub Releases   │
│  • Custom latest.json│
└──────────────────────┘
```

### Package Structure

```
dgd/
├── version/
│   └── version.go          # Version constant (0.2.0)
├── updater/
│   ├── updater.go          # Core update logic
│   └── updater_test.go     # Unit tests (51.6% coverage)
├── api/
│   ├── update.go           # API endpoints
│   └── update_test.go      # API tests
└── cmd/dgd/
    └── main.go             # Startup update check + routes
```

---

## Update Flow

### 1. Automatic Check on Startup

```go
// In main.go
go func() {
    time.Sleep(5 * time.Second)  // Non-blocking delay
    
    checker := updater.NewUpdateChecker(updateURL)
    latest, err := checker.CheckForUpdates(version.Version)
    
    if latest != nil {
        log.Printf("Update available: %s", latest.Version)
        // Broadcast to frontend via WebSocket (future)
    }
}()
```

**Features:**
- Runs in background goroutine
- 5-second delay after startup
- Non-blocking (doesn't delay app start)
- Automatic retry (3 attempts with exponential backoff)
- Logs result to console

### 2. Manual Check via API

```bash
GET /api/update/check?url=https://custom-server.com/latest.json
```

**Response (Update Available):**
```json
{
  "update_available": true,
  "current_version": "0.2.0",
  "latest_version": "0.3.0",
  "download_url": "https://github.com/.../dgd-macos-amd64",
  "checksum": "abc123..."
}
```

**Response (No Update):**
```json
{
  "update_available": false,
  "current_version": "0.2.0"
}
```

### 3. Apply Update

```bash
POST /api/update/apply
Content-Type: application/json

{
  "version": "0.3.0",
  "url": "https://github.com/.../dgd-macos-amd64",
  "checksum": "abc123..."
}
```

**Process:**
1. Download binary (10-minute timeout)
2. Verify SHA256 checksum (if provided)
3. Apply update to current executable
4. Call shutdown callback (close database, etc.)
5. Wait 1 second for cleanup
6. Start new process with same arguments
7. Exit current process

---

## Update Sources

### GitHub Releases API (Default)

**Endpoint:** `https://api.github.com/repos/TresPies-source/ollama/releases/latest`

**Expected Format:**
```json
{
  "tag_name": "v0.3.0",
  "assets": [
    {
      "name": "dgd-macos-amd64",
      "browser_download_url": "https://github.com/.../dgd-macos-amd64"
    },
    {
      "name": "dgd-macos-arm64",
      "browser_download_url": "https://github.com/.../dgd-macos-arm64"
    },
    {
      "name": "dgd-windows-amd64.exe",
      "browser_download_url": "https://github.com/.../dgd-windows-amd64.exe"
    },
    {
      "name": "dgd-linux-amd64",
      "browser_download_url": "https://github.com/.../dgd-linux-amd64"
    }
  ]
}
```

**How it works:**
- Updater parses GitHub API response
- Finds asset matching current platform/arch
- Uses `browser_download_url` for download
- ⚠️ **Note:** GitHub doesn't provide checksums in API (optional verification)

### Custom Update Server

**Endpoint:** Your custom URL (e.g., `https://updates.example.com/latest.json`)

**Expected Format:**
```json
{
  "version": "0.3.0",
  "url": "https://cdn.example.com/dgd-macos-amd64",
  "checksum": "abc123def456..."
}
```

**How it works:**
- Simple JSON file with version, URL, and checksum
- Updater directly uses provided values
- ✅ **Recommended:** Always include checksum for security

---

## Platform Support

### Binary Naming Convention

Format: `dgd-{os}-{arch}[.exe]`

| Platform | Architecture | Binary Name |
|----------|-------------|-------------|
| macOS | Intel (x64) | `dgd-macos-amd64` |
| macOS | Apple Silicon (ARM) | `dgd-macos-arm64` |
| Linux | x64 | `dgd-linux-amd64` |
| Linux | ARM64 | `dgd-linux-arm64` |
| Windows | x64 | `dgd-windows-amd64.exe` |
| Windows | ARM64 | `dgd-windows-arm64.exe` |

**Auto-Detection:**
The updater automatically detects the current platform and architecture using `runtime.GOOS` and `runtime.GOARCH`.

---

## Security

### Checksum Verification

**Algorithm:** SHA256

**Process:**
1. Download binary from update server
2. Calculate SHA256 hash of downloaded data
3. Compare with expected checksum
4. Apply update only if checksums match

**When used:**
- ✅ Custom update servers (always provide checksum)
- ⚠️ GitHub Releases (checksum optional, not in API)

**Example:**
```bash
# Generate checksum for your binary
sha256sum dgd-macos-amd64
# Output: abc123def456... dgd-macos-amd64
```

### Update Safety

1. **Atomic replacement:** Uses `go-update` library for safe binary replacement
2. **Backup:** Old binary is automatically backed up before update
3. **Rollback:** If update fails, old binary remains in place
4. **Verification:** Checksum verification prevents corrupted/malicious binaries

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UPDATE_URL` | `https://api.github.com/repos/TresPies-source/ollama/releases/latest` | Update server URL |
| `PORT` | `8080` | Server port |

**Usage:**
```bash
# Use custom update server
export UPDATE_URL="https://updates.example.com/latest.json"
./dgd

# Use GitHub releases (default)
./dgd
```

### Timeouts

| Operation | Timeout | Configurable |
|-----------|---------|--------------|
| Update check | 30 seconds | Yes (in code) |
| Binary download | 10 minutes | Yes (in code) |
| Retry backoff | 1s, 4s, 9s | Yes (in code) |

**Example:**
```go
checker := updater.NewUpdateChecker(url)
checker.client.Timeout = 60 * time.Second  // Custom timeout
checker.maxRetries = 5                      // More retries
```

---

## Graceful Shutdown

### Shutdown Callback

Register a callback to be called before application restart:

```go
import "github.com/TresPies-source/dgd/updater"

// In main.go
updater.RegisterShutdownCallback(func() error {
    log.Println("Graceful shutdown: closing database...")
    
    // Close database connections
    if err := db.Close(); err != nil {
        return err
    }
    
    // Save application state
    if err := saveState(); err != nil {
        return err
    }
    
    log.Println("Shutdown complete")
    return nil
})
```

**What happens:**
1. Update is triggered
2. Shutdown callback is called
3. Wait 1 second for cleanup
4. New process starts
5. Wait 500ms for new process to initialize
6. Current process exits

**Use cases:**
- Close database connections
- Save unsaved work
- Flush logs
- Clean up temporary files
- Notify other services

---

## Testing

### Unit Tests

**Location:** `dgd/updater/updater_test.go`

**Coverage:** 51.6%

**Test Scenarios:**
- ✅ Version comparison (newer/older/same)
- ✅ Checksum verification (valid/invalid)
- ✅ Update check (available/not available)
- ✅ GitHub API parsing
- ✅ Retry logic (success on retry, max retries exceeded)
- ✅ Platform binary naming
- ✅ Server errors

**Run tests:**
```bash
cd dgd
go test ./updater/... -v -cover
```

### API Tests

**Location:** `dgd/api/update_test.go`

**Test Scenarios:**
- ✅ Check update endpoint (custom format)
- ✅ Check update endpoint (GitHub format)
- ✅ Check update endpoint (no update)
- ✅ Check update endpoint (server error)
- ✅ Apply update endpoint (valid request)
- ✅ Apply update endpoint (missing fields)
- ✅ Apply update endpoint (invalid JSON)

**Run tests:**
```bash
cd dgd
go test ./api -v -run "TestCheckUpdateHandler|TestApplyUpdateHandler"
```

---

## API Reference

### GET /api/update/check

**Query Parameters:**
- `url` (optional): Custom update server URL

**Response:**
```typescript
{
  update_available: boolean
  current_version: string
  latest_version?: string      // If update available
  download_url?: string         // If update available
  checksum?: string             // If update available
}
```

**Status Codes:**
- `200 OK`: Check succeeded
- `500 Internal Server Error`: Check failed (network, parsing, etc.)

### POST /api/update/apply

**Request Body:**
```json
{
  "version": "string",   // Required: e.g., "0.3.0"
  "url": "string",       // Required: Download URL
  "checksum": "string"   // Required: SHA256 checksum
}
```

**Response:**
```json
{
  "success": true,
  "message": "Update is being applied. Application will restart shortly."
}
```

**Status Codes:**
- `200 OK`: Update started (async)
- `400 Bad Request`: Missing/invalid fields
- `500 Internal Server Error`: Update failed (will be logged, not returned)

**Note:** Update happens in background goroutine. The response is sent immediately before the update actually completes.

---

## Troubleshooting

### Update Check Fails

**Symptoms:** Logs show "Update check failed"

**Possible causes:**
1. Network connectivity issues
2. Update server unreachable
3. Invalid JSON response
4. Missing platform binary in GitHub release

**Solutions:**
- Check internet connection
- Verify UPDATE_URL is correct
- Check update server logs
- Ensure GitHub release includes binaries for all platforms

### Update Apply Fails

**Symptoms:** Application doesn't restart or logs show "failed to apply update"

**Possible causes:**
1. Checksum mismatch
2. Insufficient permissions to replace binary
3. Binary download corrupted
4. Shutdown callback failed

**Solutions:**
- Verify checksum is correct
- Run application with appropriate permissions
- Re-download update
- Check shutdown callback for errors

### Binary Not Found

**Symptoms:** "no binary found for platform: dgd-xxx"

**Possible causes:**
1. GitHub release missing binary for your platform
2. Binary named incorrectly

**Solutions:**
- Ensure GitHub release includes:
  - `dgd-macos-amd64` and `dgd-macos-arm64`
  - `dgd-linux-amd64` and `dgd-linux-arm64`
  - `dgd-windows-amd64.exe` and `dgd-windows-arm64.exe`

---

## Future Enhancements

### Planned for v0.2.1

1. **WebSocket Notifications**
   - Real-time update notification to frontend
   - User prompt: "Update available. Install now?"

2. **Update Progress**
   - Download progress reporting
   - Installation progress

3. **Update Scheduling**
   - "Remind me later" functionality
   - Install on next restart

4. **Rollback Support**
   - Automatic rollback if new version crashes
   - Manual rollback via API

5. **Update History**
   - Track installed updates in database
   - Show changelog in UI

---

## References

- **go-update library:** https://github.com/inconshreveable/go-update
- **GitHub Releases API:** https://docs.github.com/en/rest/releases
- **Semantic Versioning:** https://semver.org/

---

## Support

For issues or questions:
1. Check logs: `~/.dgd/logs/`
2. Run with debug logging: `DEBUG=1 ./dgd`
3. File issue: https://github.com/TresPies-source/ollama/issues

---

**End of Auto-Updater Implementation Documentation**
