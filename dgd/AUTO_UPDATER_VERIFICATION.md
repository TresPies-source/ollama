# Auto-Updater Verification Guide

**Version:** 0.2.0  
**Last Updated:** January 24, 2026

---

## Prerequisites

- Go 1.21+
- SQLite 3
- `curl` or `httpie` for API testing
- (Optional) GCC for SQLite CGO compilation

---

## Verification Checklist

### ✅ Unit Tests

**Run updater package tests:**
```bash
cd dgd
go test ./updater/... -v -cover
```

**Expected Output:**
```
=== RUN   TestIsNewerVersion
=== RUN   TestVerifyChecksum
=== RUN   TestCheckForUpdates
=== RUN   TestGetPlatformBinaryName
=== RUN   TestParseGitHubRelease
=== RUN   TestCheckForUpdatesRetry
=== RUN   TestCheckForUpdatesGitHubFormat
--- PASS: All tests
PASS
ok      github.com/TresPies-source/dgd/updater  12.031s
coverage: 51.6% of statements
```

**Success Criteria:**
- [ ] All tests pass
- [ ] Coverage > 50%
- [ ] No compilation errors

---

### ✅ API Endpoint Tests

**Run API tests:**
```bash
cd dgd
go test ./api -v -run "TestCheckUpdateHandler|TestApplyUpdateHandler"
```

**Expected Output:**
```
=== RUN   TestCheckUpdateHandler
=== RUN   TestApplyUpdateHandler
--- PASS: All tests
PASS
ok      github.com/TresPies-source/dgd/api     1.372s
```

**Success Criteria:**
- [ ] All API tests pass
- [ ] No HTTP errors
- [ ] Proper JSON responses

---

### ✅ Manual API Testing

#### 1. Start the Application

```bash
cd dgd
go run cmd/dgd/main.go
```

**Expected logs:**
```
Database initialized at: ~/.dgd/dgd.db
Starting Dojo Genesis Desktop server on :8080
No updates available (current version: 0.2.0)
```

**Success Criteria:**
- [ ] Application starts without errors
- [ ] Update check runs after 5 seconds
- [ ] No panic or crash

#### 2. Test Update Check Endpoint (No Update)

```bash
# Create mock update server with same version
echo '{"version":"0.2.0","url":"https://example.com/dgd","checksum":"abc"}' > /tmp/latest.json
python3 -m http.server 9000 --directory /tmp &

# Check for updates
curl http://localhost:8080/api/update/check?url=http://localhost:9000/latest.json
```

**Expected Response:**
```json
{
  "update_available": false,
  "current_version": "0.2.0"
}
```

**Success Criteria:**
- [ ] Response indicates no update available
- [ ] Current version is "0.2.0"
- [ ] HTTP 200 status

#### 3. Test Update Check Endpoint (Update Available)

```bash
# Update mock server with newer version
echo '{"version":"0.3.0","url":"https://example.com/dgd","checksum":"abc123"}' > /tmp/latest.json

# Check for updates
curl http://localhost:8080/api/update/check?url=http://localhost:9000/latest.json
```

**Expected Response:**
```json
{
  "update_available": true,
  "current_version": "0.2.0",
  "latest_version": "0.3.0",
  "download_url": "https://example.com/dgd",
  "checksum": "abc123"
}
```

**Success Criteria:**
- [ ] Response indicates update available
- [ ] Latest version is "0.3.0"
- [ ] Download URL and checksum are correct
- [ ] HTTP 200 status

#### 4. Test GitHub Release Format

```bash
# Create mock GitHub API response
cat > /tmp/github-release.json << 'EOF'
{
  "tag_name": "v0.3.0",
  "assets": [
    {
      "name": "dgd-windows-amd64.exe",
      "browser_download_url": "https://github.com/TresPies-source/ollama/releases/download/v0.3.0/dgd-windows-amd64.exe"
    },
    {
      "name": "dgd-macos-amd64",
      "browser_download_url": "https://github.com/TresPies-source/ollama/releases/download/v0.3.0/dgd-macos-amd64"
    },
    {
      "name": "dgd-linux-amd64",
      "browser_download_url": "https://github.com/TresPies-source/ollama/releases/download/v0.3.0/dgd-linux-amd64"
    }
  ]
}
EOF

# Serve it
python3 -m http.server 9001 --directory /tmp &

# Check for updates
curl http://localhost:8080/api/update/check?url=http://localhost:9001/github-release.json
```

**Expected Response:**
```json
{
  "update_available": true,
  "current_version": "0.2.0",
  "latest_version": "v0.3.0",
  "download_url": "https://github.com/.../dgd-[platform]-[arch]",
  "checksum": ""
}
```

**Success Criteria:**
- [ ] GitHub format is parsed correctly
- [ ] Correct binary for current platform is selected
- [ ] Checksum is empty (GitHub doesn't provide it)
- [ ] HTTP 200 status

#### 5. Test Update Apply Endpoint

⚠️ **WARNING:** This will attempt to replace your running binary. Only test in a safe environment!

```bash
# Create a test binary (just copy current binary for safety)
cp $(which dgd) /tmp/dgd-test

# Apply update (this won't actually work without a real binary)
curl -X POST http://localhost:8080/api/update/apply \
  -H "Content-Type: application/json" \
  -d '{
    "version": "0.3.0",
    "url": "file:///tmp/dgd-test",
    "checksum": "skip"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Update is being applied. Application will restart shortly."
}
```

**Success Criteria:**
- [ ] HTTP 200 status
- [ ] Response indicates success
- [ ] (In production) Application restarts after 1-2 seconds

#### 6. Test Error Handling

**Missing fields:**
```bash
curl -X POST http://localhost:8080/api/update/apply \
  -H "Content-Type: application/json" \
  -d '{"version": "0.3.0"}'
```

**Expected:** HTTP 400 Bad Request

**Invalid URL:**
```bash
curl http://localhost:8080/api/update/check?url=http://invalid-url-that-does-not-exist.com
```

**Expected:** HTTP 500 Internal Server Error with retry message

**Success Criteria:**
- [ ] Proper error responses for invalid inputs
- [ ] No application crashes
- [ ] Errors are logged

---

### ✅ Startup Update Check

**Test:**
1. Start application
2. Wait 5 seconds
3. Check logs

**Expected Logs:**
```
Database initialized at: ~/.dgd/dgd.db
Starting Dojo Genesis Desktop server on :8080
No updates available (current version: 0.2.0)
```

**OR (if update available):**
```
Update available: 0.3.0 (current: 0.2.0)
```

**Success Criteria:**
- [ ] Update check runs automatically
- [ ] Non-blocking (app starts immediately)
- [ ] Logs show update check result
- [ ] No errors or panics

---

### ✅ Retry Logic

**Test:**
1. Start application with invalid UPDATE_URL
2. Check logs for retry attempts

```bash
export UPDATE_URL="http://invalid-server.local"
go run cmd/dgd/main.go
```

**Expected Logs:**
```
Update check failed: failed after 3 attempts: ...
```

**Success Criteria:**
- [ ] Application doesn't crash
- [ ] Retry attempts are logged
- [ ] Fails gracefully after max retries

---

### ✅ Graceful Shutdown

**Test:**
1. Register shutdown callback
2. Trigger restart
3. Verify callback is called

```go
// In main.go
updater.RegisterShutdownCallback(func() error {
    log.Println("TEST: Shutdown callback called")
    return nil
})
```

**Expected Logs (when restart triggered):**
```
Graceful shutdown: closing database...
TEST: Shutdown callback called
```

**Success Criteria:**
- [ ] Callback is called before restart
- [ ] Database closes successfully
- [ ] No errors during shutdown

---

### ✅ Platform Detection

**Test:**
```bash
cd dgd
go test -v -run TestGetPlatformBinaryName ./updater
```

**Expected Output:**
```
=== RUN   TestGetPlatformBinaryName
--- PASS: TestGetPlatformBinaryName (0.00s)
```

**Manual Verification:**
```bash
# On macOS (Intel)
dgd-macos-amd64

# On macOS (Apple Silicon)
dgd-macos-arm64

# On Linux (x64)
dgd-linux-amd64

# On Windows (x64)
dgd-windows-amd64.exe
```

**Success Criteria:**
- [ ] Correct binary name for current platform
- [ ] Includes architecture (amd64 or arm64)
- [ ] Windows has .exe extension

---

### ✅ Checksum Verification

**Test:**
```bash
cd dgd
go test -v -run TestVerifyChecksum ./updater
```

**Expected Output:**
```
=== RUN   TestVerifyChecksum
=== RUN   TestVerifyChecksum/valid_checksum
=== RUN   TestVerifyChecksum/invalid_checksum
--- PASS: TestVerifyChecksum (0.00s)
```

**Manual Test:**
```bash
# Create test binary
echo "test data" > /tmp/test-binary

# Calculate checksum
sha256sum /tmp/test-binary
# Output: abc123... /tmp/test-binary

# Verify in code (should pass)
verifyChecksum(data, "abc123...")

# Verify with wrong checksum (should fail)
verifyChecksum(data, "wrong123...")
```

**Success Criteria:**
- [ ] Valid checksums pass verification
- [ ] Invalid checksums fail verification
- [ ] Error message includes both expected and actual checksums

---

### ✅ Version Comparison

**Test:**
```bash
cd dgd
go test -v -run TestIsNewerVersion ./updater
```

**Expected Output:**
```
=== RUN   TestIsNewerVersion
=== RUN   TestIsNewerVersion/newer_major_version
=== RUN   TestIsNewerVersion/newer_minor_version
=== RUN   TestIsNewerVersion/newer_patch_version
=== RUN   TestIsNewerVersion/same_version
=== RUN   TestIsNewerVersion/older_version
=== RUN   TestIsNewerVersion/with_v_prefix
--- PASS: TestIsNewerVersion (0.00s)
```

**Success Criteria:**
- [ ] Semantic versioning works correctly
- [ ] Handles "v" prefix
- [ ] Compares major, minor, patch correctly

---

## Integration Testing

### End-to-End Update Flow

**Prerequisites:**
- Two versions of the application (e.g., 0.2.0 and 0.3.0)
- Update server with latest.json

**Steps:**
1. Start v0.2.0
2. Create latest.json pointing to v0.3.0
3. Trigger update check
4. Verify update is detected
5. Apply update
6. Verify application restarts with v0.3.0

**Success Criteria:**
- [ ] Update detected correctly
- [ ] Binary downloaded successfully
- [ ] Checksum verified
- [ ] Application restarts
- [ ] New version runs without errors
- [ ] Database migrations (if any) run successfully

---

## Performance Testing

### Update Check Performance

**Test:**
```bash
time curl http://localhost:8080/api/update/check
```

**Expected:** < 2 seconds (for network request)

**Success Criteria:**
- [ ] Response time < 2 seconds (local network)
- [ ] Response time < 5 seconds (internet)
- [ ] No memory leaks

### Binary Download Performance

**Test:**
```bash
# Download 50MB binary
time curl -o /tmp/dgd-test https://example.com/dgd-50mb
```

**Expected:** Depends on connection speed, but should complete within 10-minute timeout

**Success Criteria:**
- [ ] Large binaries download successfully
- [ ] No timeout errors (unless connection is very slow)
- [ ] Progress is tracked (future enhancement)

---

## Security Testing

### Checksum Tampering

**Test:**
1. Download binary
2. Modify binary
3. Attempt to apply update

**Expected:** Update fails with checksum mismatch error

**Success Criteria:**
- [ ] Modified binary is rejected
- [ ] Error message clearly indicates checksum mismatch
- [ ] Application remains in working state

### MITM Attack Simulation

**Test:**
1. Intercept update request
2. Replace binary URL with malicious binary
3. Attempt to apply update

**Expected:** Update fails if checksum is provided

**Success Criteria:**
- [ ] Checksum verification prevents malicious binary
- [ ] HTTPS should be used in production
- [ ] No silent failures

---

## Troubleshooting Tests

### Test: No Network Connection

**Setup:**
```bash
# Disable network (or use invalid URL)
export UPDATE_URL="http://192.0.2.1/latest.json"  # Non-routable IP
go run cmd/dgd/main.go
```

**Expected:**
- Application starts normally
- Update check fails gracefully
- Error logged but not fatal

### Test: Malformed JSON

**Setup:**
```bash
echo "invalid json" > /tmp/latest.json
curl http://localhost:8080/api/update/check?url=http://localhost:9000/latest.json
```

**Expected:**
- HTTP 500 error
- Error message: "failed to parse update info"

### Test: Missing Binary in GitHub Release

**Setup:**
Create GitHub release JSON without current platform's binary

**Expected:**
- HTTP 500 error
- Error message: "no binary found for platform: dgd-[os]-[arch]"

---

## Regression Testing

Run these tests after any changes to the updater code:

```bash
# Full test suite
cd dgd
go test ./updater/... ./api/update*.go -v -cover

# Check for race conditions
go test ./updater/... -race

# Memory leak detection
go test ./updater/... -memprofile=mem.out
go tool pprof mem.out
```

---

## Verification Report

**Date:** __________  
**Tested By:** __________  
**Version:** 0.2.0

| Test Category | Status | Notes |
|---------------|--------|-------|
| Unit Tests | ⬜ Pass / ⬜ Fail | |
| API Tests | ⬜ Pass / ⬜ Fail | |
| Manual API Testing | ⬜ Pass / ⬜ Fail | |
| Startup Check | ⬜ Pass / ⬜ Fail | |
| Retry Logic | ⬜ Pass / ⬜ Fail | |
| Graceful Shutdown | ⬜ Pass / ⬜ Fail | |
| Platform Detection | ⬜ Pass / ⬜ Fail | |
| Checksum Verification | ⬜ Pass / ⬜ Fail | |
| Version Comparison | ⬜ Pass / ⬜ Fail | |
| Security Tests | ⬜ Pass / ⬜ Fail | |
| Performance Tests | ⬜ Pass / ⬜ Fail | |

**Overall Status:** ⬜ PASS / ⬜ FAIL

**Issues Found:**
- [ ] None
- [ ] Issue 1: _____________
- [ ] Issue 2: _____________

---

**End of Auto-Updater Verification Guide**
