# Dojo Genesis Desktop Icons

**Created:** 2026-01-23  
**Version:** v0.1.0  
**Format:** .ico (Windows Icon)

---

## Icon Files

### 1. `tray.ico` (15KB)
**Purpose:** System tray icon  
**Sizes:** 16x16, 32x32, 48x48 pixels  
**Design:** Minimalist bonsai tree silhouette in golden-orange (#f4a261) on deep teal-navy background (#0a1e2e)

**Usage:**
```go
// In app/main.go
systray.SetIcon(trayIcon)
```

**When to use:**
- System tray (Windows, macOS, Linux)
- Notification icons
- Quick access menu

---

### 2. `app.ico` (162KB)
**Purpose:** Main application icon  
**Sizes:** 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 pixels  
**Design:** Full Dojo Genesis logo with bonsai tree, sunset gradient, temple silhouette, and layered mountains

**Usage:**
```go
// In app/main.go for Windows
app.SetIcon(appIcon)

// In Info.plist for macOS
<key>CFBundleIconFile</key>
<string>app.icns</string>

// In .desktop file for Linux
Icon=/usr/share/icons/dojo-genesis/app.png
```

**When to use:**
- Application window icon
- Taskbar/dock icon
- Desktop shortcuts
- Installer icon
- About dialog

---

### 3. `tray_upgrade.ico` (15KB)
**Purpose:** System tray icon with update indicator  
**Sizes:** 16x16, 32x32, 48x48 pixels  
**Design:** Same as `tray.ico` with a small sunset gradient badge (top-right) containing a white upward arrow

**Usage:**
```go
// In app/updater.go
if updateAvailable {
    systray.SetIcon(trayUpgradeIcon)
}
```

**When to use:**
- System tray when update is available
- Notification of new version
- Auto-updater status indicator

---

## Design System

### Color Palette

```css
/* From Dojo Genesis Logo */
--bg-primary: #0a1e2e;        /* Deep teal-navy */
--accent-primary: #f4a261;    /* Warm golden-orange */
--accent-secondary: #e76f51;  /* Deeper orange-red */
--gradient-sunset: linear-gradient(135deg, #f4a261 0%, #e76f51 50%, #ffd166 100%);
```

### Design Principles

1. **Simplicity at Small Sizes**
   - Tray icons (16x16, 32x32) use simplified silhouettes
   - High contrast for legibility
   - No fine details that disappear at small sizes

2. **Brand Consistency**
   - All icons derived from main logo
   - Same color palette across all sizes
   - Recognizable bonsai tree motif

3. **Platform Conventions**
   - Windows: .ico format with multiple sizes
   - macOS: .icns format (convert from .ico)
   - Linux: .png format (extract from .ico)

---

## Platform-Specific Instructions

### Windows

**File:** `app.ico`  
**Location:** `app/assets/app.ico`

```go
// Embed icon in Go binary
//go:embed assets/app.ico
var appIcon []byte

// Set window icon
w.SetIcon(appIcon)
```

**Build:**
```bash
# Add icon to .exe
go build -ldflags="-H windowsgui" -o dgd.exe
```

---

### macOS

**File:** `app.icns` (convert from `app.ico`)  
**Location:** `app/assets/app.icns`

**Convert:**
```bash
# Install iconutil (macOS built-in)
mkdir app.iconset
sips -z 16 16   app.png --out app.iconset/icon_16x16.png
sips -z 32 32   app.png --out app.iconset/icon_16x16@2x.png
sips -z 32 32   app.png --out app.iconset/icon_32x32.png
sips -z 64 64   app.png --out app.iconset/icon_32x32@2x.png
sips -z 128 128 app.png --out app.iconset/icon_128x128.png
sips -z 256 256 app.png --out app.iconset/icon_128x128@2x.png
iconutil -c icns app.iconset
```

**Info.plist:**
```xml
<key>CFBundleIconFile</key>
<string>app.icns</string>
```

---

### Linux

**File:** `app.png` (extract from `app.ico`)  
**Location:** `/usr/share/icons/hicolor/256x256/apps/dojo-genesis.png`

**Extract:**
```bash
# Extract 256x256 PNG from .ico
convert app.ico[5] app.png
```

**.desktop file:**
```ini
[Desktop Entry]
Name=Dojo Genesis Desktop
Icon=dojo-genesis
Exec=/usr/bin/dojo-genesis
Type=Application
Categories=Development;Utility;
```

---

## Implementation Checklist

### Phase 2: Desktop Integration (Spec 7)

- [ ] Embed `app.ico` in Go binary
- [ ] Set window icon on startup
- [ ] Create `app.icns` for macOS build
- [ ] Create `app.png` for Linux build
- [ ] Add icon to system tray
- [ ] Implement update indicator (switch to `tray_upgrade.ico`)
- [ ] Test icons on Windows, macOS, Linux
- [ ] Screenshot icons in use

---

## Source Files

**PNG Sources** (for regeneration):
- `tray_icon.png` - 1024x1024px
- `app_icon.png` - 1024x1024px
- `tray_upgrade_icon.png` - 1024x1024px

**Regenerate .ico:**
```bash
cd /home/ubuntu/dgd/assets
convert tray_icon.png -define icon:auto-resize=16,32,48 tray.ico
convert app_icon.png -define icon:auto-resize=16,32,48,64,128,256 app.ico
convert tray_upgrade_icon.png -define icon:auto-resize=16,32,48 tray_upgrade.ico
```

---

## References

- **Ollama Icon Implementation:** `app/webview/webview.go`
- **System Tray Pattern:** Ollama's tray integration
- **Icon Guidelines:** Windows, macOS HIG, Linux freedesktop.org

---

**Last Updated:** 2026-01-23  
**Status:** Ready for Phase 2 implementation
