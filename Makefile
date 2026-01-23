# Makefile for Dojo Genesis Desktop
# Supports Windows, macOS, and Linux builds

.PHONY: help build-ui build-windows build-macos build-linux build-all clean test dev

# Default target
help:
	@echo "Dojo Genesis Desktop - Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  build-ui       - Build React frontend"
	@echo "  build-windows  - Build Windows .exe (requires Windows)"
	@echo "  build-macos    - Build macOS .app bundle (requires macOS)"
	@echo "  build-linux    - Build Linux binary (requires Docker)"
	@echo "  build-all      - Build for all platforms"
	@echo "  clean          - Clean build artifacts"
	@echo "  test           - Run tests"
	@echo "  dev            - Start development mode"
	@echo ""
	@echo "Examples:"
	@echo "  make build-ui"
	@echo "  make build-windows"
	@echo "  make build-all"

# Build React frontend
build-ui:
	@echo "Building React frontend..."
	cd app/ui/app && npm install && npm run build
	@echo "✓ React build complete"

# Build for Windows (simplified desktop-only build)
build-windows: build-ui
	@echo "Building Dojo Genesis Desktop for Windows..."
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File .\build-dgd.ps1
else
	@echo "ERROR: Windows builds must be run on Windows"
	@exit 1
endif
	@echo "✓ Windows build complete"

# Build for macOS (simplified desktop-only build)
build-macos: build-ui
	@echo "Building Dojo Genesis Desktop for macOS..."
ifeq ($(shell uname),Darwin)
	chmod +x build-dgd.sh && ./build-dgd.sh
else
	@echo "ERROR: macOS builds must be run on macOS"
	@exit 1
endif
	@echo "✓ macOS build complete"

# Build for Linux (simplified desktop-only build)
build-linux: build-ui
	@echo "Building Dojo Genesis Desktop for Linux..."
	chmod +x build-dgd.sh && ./build-dgd.sh
	@echo "✓ Linux build complete"

# Build for all platforms (requires appropriate OS or CI)
build-all: build-ui
	@echo "Building Dojo Genesis Desktop for all platforms..."
	@echo "Note: This requires running on appropriate OS or using CI"
	@make build-windows || true
	@make build-macos || true
	@make build-linux || true
	@echo "✓ Multi-platform build complete"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf build/
	rm -rf app/ui/app/dist/
	rm -rf app/ui/app/node_modules/.vite/
	@echo "✓ Clean complete"

# Run tests
test:
	@echo "Running Go tests..."
	go test ./...
	@echo "Running React tests..."
	cd app/ui/app && npm test -- --run
	@echo "✓ Tests complete"

# Development mode
dev:
	@echo "Starting Dojo Genesis Desktop in development mode..."
	@echo "1. Starting React dev server..."
	cd app/ui/app && npm run dev &
	@echo "2. Waiting for Vite to start..."
	sleep 3
	@echo "3. Starting Go app with -dev flag..."
	cd app && go generate ./... && go run ./cmd/app -dev
