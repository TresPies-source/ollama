# Build Guide - Dojo Genesis Desktop

This document describes how to build Dojo Genesis Desktop for Windows, macOS, and Linux.

## Prerequisites

### All Platforms

- **Git**: For version control and version detection
- **Go**: Version 1.24.1 or later
- **Node.js**: Version 22.x or later (includes npm)
- **npm**: Version 10.x or later

### Windows-Specific

- **GCC**: MinGW-w64 or TDM-GCC
  - Download from: https://www.mingw-w64.org/ or https://jmeubank.github.io/tdm-gcc/
  - Add to PATH: `C:\msys64\mingw64\bin` (or your installation directory)
- **Inno Setup** (for installer): https://jrsoftware.org/isinfo.php

### macOS-Specific

- **Xcode**: Command Line Tools (or full Xcode)
- **Code signing** (optional): Apple Developer account for signing and notarization

### Linux-Specific

- **Docker**: For cross-platform builds
- **zstd**: Compression utility
  - Ubuntu/Debian: `sudo apt-get install zstd`
  - Fedora/RHEL: `sudo dnf install zstd`
  - Arch: `sudo pacman -S zstd`

---

## Quick Build

### Option 1: Using Makefile (Unix/Linux/macOS)

```bash
# Build React UI only
make build-ui

# Build for your current platform
make build-windows  # On Windows
make build-macos    # On macOS
make build-linux    # On Linux

# Clean build artifacts
make clean

# Run in development mode
make dev
```

### Option 2: Using Build Scripts

**Windows:**
```powershell
# Full build (UI + Desktop App)
powershell -ExecutionPolicy Bypass -File .\build-dgd.ps1

# Or use the Makefile with Make for Windows
make build-windows
```

**macOS/Linux:**
```bash
# Full build (UI + Desktop App)
chmod +x build-dgd.sh
./build-dgd.sh

# Or use the Makefile
make build-macos  # macOS
make build-linux  # Linux
```

---

## Detailed Build Steps

### Step 1: Build React Frontend

The React frontend must be built before the desktop app.

```bash
cd app/ui/app
npm install
npm run build
cd ../../..
```

This creates `app/ui/app/dist/` with the compiled React application.

**Verification:**
- Check that `app/ui/app/dist/index.html` exists
- Check that `app/ui/app/dist/assets/` contains JavaScript and CSS files

### Step 2: Generate Go Code

The desktop app uses `go generate` to embed the React build and generate TypeScript types.

```bash
cd app
go generate ./...
cd ..
```

### Step 3: Build Desktop Executable

#### Windows

```batch
cd app
set CGO_ENABLED=1
go build -trimpath -ldflags "-s -w -H windowsgui -X=github.com/ollama/ollama/app/version.Version=0.1.0" -o dgd-desktop.exe ./cmd/app
```

**Output:** `app/dgd-desktop.exe`

#### macOS

```bash
cd app
export CGO_ENABLED=1
go build -trimpath -ldflags "-s -w -X=github.com/ollama/ollama/app/version.Version=0.1.0" -o dgd-desktop ./cmd/app
chmod +x dgd-desktop
```

**Output:** `app/dgd-desktop`

#### Linux

```bash
cd app
export CGO_ENABLED=1
go build -trimpath -ldflags "-s -w -X=github.com/ollama/ollama/app/version.Version=0.1.0" -o dgd-desktop ./cmd/app
chmod +x dgd-desktop
```

**Output:** `app/dgd-desktop`

---

## Development Mode

Development mode allows you to work on the React UI with hot-reload while the desktop app is running.

### Terminal 1: Start React Dev Server

```bash
cd app/ui/app
npm run dev
```

This starts Vite on http://localhost:5173

### Terminal 2: Start Desktop App in Dev Mode

**Windows:**
```batch
cd app
go generate ./...
go run ./cmd/app -dev
```

**macOS/Linux:**
```bash
cd app
go generate ./...
go run ./cmd/app -dev
```

The `-dev` flag:
- Loads UI from http://localhost:5173 instead of embedded files
- Enables CORS for cross-origin requests
- Fixes API server port to http://127.0.0.1:3001
- Enables hot-reload

---

## Build Scripts Comparison

### Simplified Scripts (Recommended for Desktop App)

**Use these for standard desktop app builds:**

- **`build-dgd.ps1`** (Windows) - Desktop app only
- **`build-dgd.sh`** (macOS/Linux) - Desktop app only
- **`Makefile`** - Cross-platform automation

**Advantages:**
- Fast build (~30 seconds)
- No GPU dependencies (CUDA/ROCm/Vulkan)
- Easier to use for development
- Creates standalone executable

**Output:**
- Windows: `dist/dgd-desktop.exe`
- macOS/Linux: `dist/dgd-desktop`

### Ollama Scripts (Advanced Builds)

**Use these for builds with GPU support:**

- **`scripts/build_windows.ps1`** - Full Ollama build (CPU + CUDA + ROCm + Vulkan)
- **`scripts/build_darwin.sh`** - macOS build with MLX acceleration
- **`scripts/build_linux.sh`** - Docker-based Linux build with GPU support

**Advantages:**
- Includes GPU acceleration (CUDA, ROCm, Vulkan, MLX)
- Creates installers and packages
- Production-ready builds
- Code signing support

**Disadvantages:**
- Requires GPU SDKs (CUDA Toolkit, ROCm, etc.)
- Longer build time (10+ minutes)
- More complex dependencies
- Not needed for desktop UI-only builds

**When to use Ollama scripts:**
- Building installers for distribution
- Need GPU acceleration for LLM inference
- Creating production releases
- Building with code signing

**When to use simplified scripts:**
- Development and testing
- Desktop app UI development
- Quick iteration cycles
- Don't need GPU acceleration

---

## Building Installers (Advanced)

> **Note:** Installers require the full Ollama build scripts. For development, use the simplified scripts above.

### Windows Installer

**Prerequisites:**
- Inno Setup: https://jrsoftware.org/isinfo.php
- CUDA Toolkit (optional, for GPU support)
- MinGW-w64 GCC

```powershell
# Full Ollama build with installer
powershell -ExecutionPolicy Bypass -File .\scripts\build_windows.ps1
```

**Output:**
- `dist/windows-amd64/ollama.exe` - Desktop app executable
- `app/Output/OllamaSetup.exe` - Windows installer

### macOS App Bundle

**Prerequisites:**
- Xcode Command Line Tools
- Code signing certificate (optional)

```bash
# Full Ollama build with .app bundle and .dmg
./scripts/build_darwin.sh
```

**Output:**
- `dist/Ollama.app` - macOS application bundle
- `dist/Ollama.dmg` - macOS disk image (if code signing enabled)

### Linux Packages

**Prerequisites:**
- Docker
- zstd compression utility

```bash
# Full Ollama build with Docker
./scripts/build_linux.sh
```

**Output:**
- `dist/ollama-linux-amd64.tar.zst` - Linux x86_64 tarball
- `dist/ollama-linux-arm64.tar.zst` - Linux ARM64 tarball

---

## Troubleshooting

### Windows: "GCC not found"

**Solution:** Install MinGW-w64 or TDM-GCC and add to PATH.

```powershell
# Add MinGW to PATH (PowerShell)
$env:PATH = "C:\msys64\mingw64\bin;$env:PATH"

# Or permanently via System Properties > Environment Variables
```

### macOS: "Command not found: npm"

**Solution:** Install Node.js from https://nodejs.org/

```bash
# Or use Homebrew
brew install node
```

### React Build: "dist directory is empty"

**Solution:** Check for build errors and ensure dependencies are installed.

```bash
cd app/ui/app
rm -rf node_modules
npm install
npm run build
```

### Go Build: "package not found"

**Solution:** Ensure you're in the correct directory and dependencies are available.

```bash
cd app
go mod download
go generate ./...
go build ./cmd/app
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Dojo Genesis Desktop

on: [push, pull_request]

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: actions/setup-go@v5
        with:
          go-version: '1.24.1'
      - name: Build
        run: powershell -ExecutionPolicy Bypass -File .\build-dgd.ps1
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dgd-desktop-windows
          path: dist/dgd-desktop.exe

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: actions/setup-go@v5
        with:
          go-version: '1.24.1'
      - name: Build
        run: ./build-dgd.sh
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dgd-desktop-macos
          path: dist/dgd-desktop
```

---

## Build Output Structure

After a successful build, you should have:

```
dist/
├── dgd-desktop.exe (Windows)
└── dgd-desktop (macOS/Linux)

app/ui/app/dist/
├── index.html
└── assets/
    ├── index-*.js
    ├── index-*.css
    └── ... (other assets)
```

---

## Version Management

The build scripts automatically detect the version from Git tags:

```bash
# Tag a new version
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# Build will use this version
./build-dgd.sh  # Version will be 0.1.0
```

If no Git tag is found, the version defaults to `0.1.0`.

---

## Next Steps

After building:

1. **Test the executable:**
   ```bash
   ./dist/dgd-desktop
   ```

2. **Verify UI loads correctly** - Should show Dojo Genesis branding

3. **Test core features:**
   - Create new session
   - Send chat message
   - Browse files
   - View seeds

4. **Create GitHub release** with built executables

---

## Support

For build issues:
- Check the [GitHub Issues](https://github.com/TresPies-source/ollama/issues)
- Review build logs in the terminal
- Ensure all prerequisites are installed
- Try cleaning and rebuilding: `make clean && make build-windows`

---

**Last Updated:** 2026-01-23  
**Version:** 0.1.0
