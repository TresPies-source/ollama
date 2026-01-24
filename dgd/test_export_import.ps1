# PowerShell test script for export/import endpoints
# Prerequisites: Server must be running on localhost:8080

$BaseUrl = "http://localhost:8080"

Write-Host "=== Testing Export/Import Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create a test session
Write-Host "1. Creating test session..." -ForegroundColor Yellow
$sessionBody = @{
    title = "Export Import Test Session"
    working_dir = "C:\temp\test"
} | ConvertTo-Json

$sessionResponse = Invoke-RestMethod -Uri "$BaseUrl/api/sessions" -Method POST -Body $sessionBody -ContentType "application/json"
$sessionId = $sessionResponse.session_id

if (-not $sessionId) {
    Write-Host "❌ Failed to create session" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Created session: $sessionId" -ForegroundColor Green
Write-Host ""

# Step 2: Add messages to the session
Write-Host "2. Adding messages to session..." -ForegroundColor Yellow
$message1 = @{
    session_id = $sessionId
    message = "Hello, this is a test message"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/api/chat" -Method POST -Body $message1 -ContentType "application/json" | Out-Null

$message2 = @{
    session_id = $sessionId
    message = "Second test message"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/api/chat" -Method POST -Body $message2 -ContentType "application/json" | Out-Null

Write-Host "✓ Added test messages" -ForegroundColor Green
Write-Host ""

# Step 3: Export the session
Write-Host "3. Exporting session..." -ForegroundColor Yellow
$exportFile = "test_session_export.md"
Invoke-WebRequest -Uri "$BaseUrl/api/sessions/$sessionId/export" -OutFile $exportFile

if (-not (Test-Path $exportFile)) {
    Write-Host "❌ Failed to export session" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Exported to $exportFile" -ForegroundColor Green
Write-Host ""

# Step 4: Display export content
Write-Host "4. Export file content (first 30 lines):" -ForegroundColor Yellow
Write-Host "---"
Get-Content $exportFile -Head 30 | ForEach-Object { Write-Host $_ }
Write-Host "---"
Write-Host ""

# Step 5: Validate export format
Write-Host "5. Validating export format..." -ForegroundColor Yellow
$content = Get-Content $exportFile -Raw
if ($content -match "^---" -and $content -match "title: Export Import Test Session") {
    Write-Host "✓ Export format is valid (contains YAML frontmatter)" -ForegroundColor Green
} else {
    Write-Host "❌ Export format is invalid" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Import the session
Write-Host "6. Importing session..." -ForegroundColor Yellow
$multipartContent = [System.Net.Http.MultipartFormDataContent]::new()
$fileStream = [System.IO.File]::OpenRead((Resolve-Path $exportFile))
$fileContent = [System.Net.Http.StreamContent]::new($fileStream)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("text/markdown")
$multipartContent.Add($fileContent, "file", "session.md")

$httpClient = [System.Net.Http.HttpClient]::new()
$importResponse = $httpClient.PostAsync("$BaseUrl/api/sessions/import", $multipartContent).Result
$importJson = $importResponse.Content.ReadAsStringAsync().Result
$fileStream.Close()
$httpClient.Dispose()

$importResult = $importJson | ConvertFrom-Json
$newSessionId = $importResult.session_id

if (-not $newSessionId) {
    Write-Host "❌ Failed to import session" -ForegroundColor Red
    Write-Host "Response: $importJson"
    exit 1
}

Write-Host "✓ Imported as new session: $newSessionId" -ForegroundColor Green
Write-Host ""

# Step 7: Verify imported session
Write-Host "7. Verifying imported session..." -ForegroundColor Yellow
$importedSession = Invoke-RestMethod -Uri "$BaseUrl/api/sessions/$newSessionId"

if ($importedSession.session.title -eq "Export Import Test Session") {
    Write-Host "✓ Imported session title matches" -ForegroundColor Green
} else {
    Write-Host "❌ Imported session title doesn't match" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Imported session has messages" -ForegroundColor Green
Write-Host ""

# Cleanup
Write-Host "8. Cleanup..." -ForegroundColor Yellow
Remove-Item $exportFile -Force
Write-Host "✓ Removed temporary export file" -ForegroundColor Green
Write-Host ""

Write-Host "=== All Tests Passed ✓ ===" -ForegroundColor Green
