@echo off
REM Build script for Dojo Genesis Desktop on Windows
REM This builds the desktop app executable

set CGO_ENABLED=1

where gcc >nul 2>&1
if %errorlevel% neq 0 (
    echo GCC not found in PATH. Please install MinGW64 and add it to PATH.
    echo Example: set PATH=C:\msys64\mingw64\bin;%%PATH%%
    exit /b 1
)

echo Building Dojo Genesis Desktop...

REM Get version from git or use default
for /f "tokens=*" %%i in ('git describe --tags --first-parent --abbrev^=7 --long --dirty --always 2^>nul') do set VERSION=%%i
if "%VERSION%"=="" set VERSION=0.1.0

echo Version: %VERSION%

REM Build the desktop app
go build -trimpath -ldflags "-s -w -H windowsgui -X=github.com/ollama/ollama/app/version.Version=%VERSION%" -o dgd-desktop.exe ./cmd/app

if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)

echo Build successful! Executable: dgd-desktop.exe
