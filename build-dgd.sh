#!/bin/bash
# Build script for Dojo Genesis Desktop
# Builds the React UI and then the desktop app
#
# Usage: ./build-dgd.sh

set -e

echo "=== Dojo Genesis Desktop Build Script ==="
echo ""

# Get version
VERSION="0.1.0"
if git describe --tags --first-parent --abbrev=7 --long --dirty --always &>/dev/null; then
    GIT_VERSION=$(git describe --tags --first-parent --abbrev=7 --long --dirty --always 2>/dev/null || echo "")
    if [[ $GIT_VERSION =~ v(.+) ]]; then
        VERSION="${BASH_REMATCH[1]}"
    elif [[ -n $GIT_VERSION ]]; then
        VERSION="$GIT_VERSION"
    fi
fi

echo "Version: $VERSION"
echo ""

# Step 1: Build React UI
echo "Step 1: Building React UI..."
cd app/ui/app

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed. Please install Node.js and npm first:"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Install dependencies
echo "  Installing npm dependencies..."
npm install

# Build React app
echo "  Building React application..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "ERROR: dist directory was not created by npm run build"
    exit 1
fi

if [ -z "$(ls -A dist)" ]; then
    echo "ERROR: dist directory is empty after npm run build"
    exit 1
fi

echo "  ✓ React UI build complete"
cd ../../..
echo ""

# Step 2: Run go generate
echo "Step 2: Running go generate..."
cd app
go generate ./...
echo "  ✓ go generate complete"
cd ..
echo ""

# Step 3: Build desktop app
echo "Step 3: Building desktop executable..."

# Create dist directory if it doesn't exist
mkdir -p dist

cd app
export CGO_ENABLED=1

# Detect OS and build accordingly
OS=$(uname -s)
ARCH=$(uname -m)

if [ "$OS" = "Darwin" ]; then
    # macOS
    echo "  Building for macOS ($ARCH)..."
    go build -trimpath \
        -ldflags "-s -w -X=github.com/ollama/ollama/app/version.Version=$VERSION" \
        -o "../dist/dgd-desktop" \
        ./cmd/app
    
    chmod +x "../dist/dgd-desktop"
    
elif [ "$OS" = "Linux" ]; then
    # Linux
    echo "  Building for Linux ($ARCH)..."
    go build -trimpath \
        -ldflags "-s -w -X=github.com/ollama/ollama/app/version.Version=$VERSION" \
        -o "../dist/dgd-desktop" \
        ./cmd/app
    
    chmod +x "../dist/dgd-desktop"
    
else
    echo "ERROR: Unsupported OS: $OS"
    exit 1
fi

echo "  ✓ Desktop app build complete"
cd ..
echo ""

# Step 4: Summary
echo "=== Build Complete! ==="
echo ""
echo "Executable: dist/dgd-desktop"
echo "Version: $VERSION"
echo ""
echo "To run the app:"
echo "  ./dist/dgd-desktop"
echo ""
