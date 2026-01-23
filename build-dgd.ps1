#!powershell
# Build script for Dojo Genesis Desktop
# Builds the React UI and then the desktop app
#
# Usage: powershell -ExecutionPolicy Bypass -File .\build-dgd.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Dojo Genesis Desktop Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Get version
$VERSION = "0.1.0"
try {
    $gitVersion = git describe --tags --first-parent --abbrev=7 --long --dirty --always 2>$null
    if ($gitVersion -match "v(.+)") {
        $VERSION = $matches[1]
    } elseif ($gitVersion) {
        $VERSION = $gitVersion
    }
} catch {
    Write-Host "WARNING: Could not get git version, using default: $VERSION" -ForegroundColor Yellow
}

Write-Host "Version: $VERSION" -ForegroundColor Green
Write-Host ""

# Step 1: Build React UI
Write-Host "Step 1: Building React UI..." -ForegroundColor Cyan
Push-Location app/ui/app

# Check if npm is installed
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm is not installed. Please install Node.js and npm first:" -ForegroundColor Red
    Write-Host "   Visit: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host "  Installing npm dependencies..."
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Build React app
Write-Host "  Building React application..."
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: npm run build failed" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Verify build output
if (!(Test-Path "dist")) {
    Write-Host "ERROR: dist directory was not created by npm run build" -ForegroundColor Red
    exit 1
}

$distFiles = Get-ChildItem "dist" -Recurse
if ($distFiles.Count -eq 0) {
    Write-Host "ERROR: dist directory is empty after npm run build" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ React UI build complete" -ForegroundColor Green
Pop-Location
Write-Host ""

# Step 2: Run go generate
Write-Host "Step 2: Running go generate..." -ForegroundColor Cyan
Push-Location app
go generate ./...
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: go generate failed" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "  ✓ go generate complete" -ForegroundColor Green
Pop-Location
Write-Host ""

# Step 3: Build desktop app
Write-Host "Step 3: Building desktop executable..." -ForegroundColor Cyan

# Check for GCC
$gccPath = Get-Command gcc -ErrorAction SilentlyContinue
if (!$gccPath) {
    Write-Host "ERROR: GCC not found in PATH. Please install MinGW64 and add it to PATH." -ForegroundColor Red
    Write-Host "Example: `$env:PATH = 'C:\msys64\mingw64\bin;' + `$env:PATH" -ForegroundColor Yellow
    exit 1
}

Push-Location app
$env:CGO_ENABLED = "1"

# Create dist directory if it doesn't exist
if (!(Test-Path "..\dist")) {
    New-Item -ItemType Directory -Path "..\dist" | Out-Null
}

# Build the app
Write-Host "  Compiling Go application..."
go build -trimpath `
    -ldflags "-s -w -H windowsgui -X=github.com/ollama/ollama/app/version.Version=$VERSION" `
    -o "..\dist\dgd-desktop.exe" `
    ./cmd/app

if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: go build failed" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "  OK Desktop app build complete" -ForegroundColor Green
Pop-Location
Write-Host ""

# Step 4: Summary
Write-Host "=== Build Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Executable: dist\dgd-desktop.exe" -ForegroundColor Cyan
Write-Host ("Version: " + $VERSION) -ForegroundColor Cyan
Write-Host ""
Write-Host "To run the app:" -ForegroundColor Yellow
Write-Host "  .\dist\dgd-desktop.exe" -ForegroundColor White
Write-Host ""
