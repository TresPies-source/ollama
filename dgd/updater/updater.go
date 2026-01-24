package updater

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/inconshreveable/go-update"
)

// LatestVersion represents the latest version information from the update server
type LatestVersion struct {
	Version  string `json:"version"`
	URL      string `json:"url"`
	Checksum string `json:"checksum"`
}

// GitHubRelease represents a GitHub release API response
type GitHubRelease struct {
	TagName string `json:"tag_name"`
	Assets  []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

// UpdateChecker provides methods for checking and applying updates
type UpdateChecker struct {
	updateURL      string
	client         *http.Client
	downloadClient *http.Client
	maxRetries     int
}

// NewUpdateChecker creates a new UpdateChecker with default settings
func NewUpdateChecker(updateURL string) *UpdateChecker {
	return &UpdateChecker{
		updateURL: updateURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		downloadClient: &http.Client{
			Timeout: 10 * time.Minute, // Longer timeout for binary downloads
		},
		maxRetries: 3,
	}
}

// CheckForUpdates checks if a newer version is available with retry logic
func (uc *UpdateChecker) CheckForUpdates(currentVersion string) (*LatestVersion, error) {
	var lastErr error
	
	// Retry up to maxRetries times with exponential backoff
	for attempt := 0; attempt < uc.maxRetries; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(attempt*attempt) * time.Second
			time.Sleep(backoff)
		}

		latest, err := uc.checkForUpdatesOnce(currentVersion)
		if err == nil {
			return latest, nil
		}
		lastErr = err
	}

	return nil, fmt.Errorf("failed after %d attempts: %w", uc.maxRetries, lastErr)
}

// checkForUpdatesOnce performs a single update check
func (uc *UpdateChecker) checkForUpdatesOnce(currentVersion string) (*LatestVersion, error) {
	resp, err := uc.client.Get(uc.updateURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch update info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("update server returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Try to parse as custom JSON format first
	var latest LatestVersion
	if err := json.Unmarshal(body, &latest); err == nil && latest.Version != "" {
		// Successfully parsed custom format
		if !isNewerVersion(currentVersion, latest.Version) {
			return nil, nil // No update available
		}
		return &latest, nil
	}

	// Try to parse as GitHub Release API format
	var ghRelease GitHubRelease
	if err := json.Unmarshal(body, &ghRelease); err == nil && ghRelease.TagName != "" {
		latest, err := parseGitHubRelease(&ghRelease)
		if err != nil {
			return nil, fmt.Errorf("failed to parse GitHub release: %w", err)
		}

		if !isNewerVersion(currentVersion, latest.Version) {
			return nil, nil // No update available
		}
		return latest, nil
	}

	return nil, fmt.Errorf("failed to parse update info: unknown format")
}

// parseGitHubRelease converts a GitHub release to LatestVersion
func parseGitHubRelease(release *GitHubRelease) (*LatestVersion, error) {
	platformBinary := GetPlatformBinaryName()
	
	// Find the asset matching our platform
	for _, asset := range release.Assets {
		if asset.Name == platformBinary {
			// Note: GitHub doesn't provide checksums in the API
			// Checksum should be provided separately or calculated
			return &LatestVersion{
				Version:  release.TagName,
				URL:      asset.BrowserDownloadURL,
				Checksum: "", // Must be provided separately
			}, nil
		}
	}

	return nil, fmt.Errorf("no binary found for platform: %s", platformBinary)
}

// DownloadAndApply downloads and applies an update
func (uc *UpdateChecker) DownloadAndApply(latest *LatestVersion) error {
	// Use downloadClient with longer timeout for binary downloads
	resp, err := uc.downloadClient.Get(latest.URL)
	if err != nil {
		return fmt.Errorf("failed to download update: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download server returned status %d", resp.StatusCode)
	}

	// Read the binary data
	binaryData, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read update binary: %w", err)
	}

	// Verify checksum if provided
	if latest.Checksum != "" {
		if err := verifyChecksum(binaryData, latest.Checksum); err != nil {
			return fmt.Errorf("checksum verification failed: %w", err)
		}
	}

	// Apply the update using bytes.NewReader (fixes binary corruption bug)
	if err := update.Apply(bytes.NewReader(binaryData), update.Options{}); err != nil {
		return fmt.Errorf("failed to apply update: %w", err)
	}

	return nil
}

// isNewerVersion compares two semantic version strings
// Returns true if newVersion is greater than currentVersion
func isNewerVersion(currentVersion, newVersion string) bool {
	// Simple version comparison (assumes format like "0.2.0")
	currentParts := strings.Split(strings.TrimPrefix(currentVersion, "v"), ".")
	newParts := strings.Split(strings.TrimPrefix(newVersion, "v"), ".")

	// Pad to same length
	for len(currentParts) < 3 {
		currentParts = append(currentParts, "0")
	}
	for len(newParts) < 3 {
		newParts = append(newParts, "0")
	}

	// Compare each part
	for i := 0; i < 3; i++ {
		var currentNum, newNum int
		fmt.Sscanf(currentParts[i], "%d", &currentNum)
		fmt.Sscanf(newParts[i], "%d", &newNum)

		if newNum > currentNum {
			return true
		} else if newNum < currentNum {
			return false
		}
	}

	return false // Versions are equal
}

// verifyChecksum verifies the SHA256 checksum of the downloaded binary
func verifyChecksum(data []byte, expectedChecksum string) error {
	hash := sha256.Sum256(data)
	actualChecksum := hex.EncodeToString(hash[:])

	if actualChecksum != expectedChecksum {
		return fmt.Errorf("checksum mismatch: expected %s, got %s", expectedChecksum, actualChecksum)
	}

	return nil
}

// GetPlatformBinaryName returns the platform-specific binary name with architecture support
func GetPlatformBinaryName() string {
	arch := runtime.GOARCH
	os := runtime.GOOS

	// Build binary name based on OS and architecture
	var name string
	switch os {
	case "windows":
		name = fmt.Sprintf("dgd-windows-%s.exe", arch)
	case "darwin":
		name = fmt.Sprintf("dgd-macos-%s", arch)
	case "linux":
		name = fmt.Sprintf("dgd-linux-%s", arch)
	default:
		name = fmt.Sprintf("dgd-unknown-%s", arch)
	}

	return name
}

// ShutdownCallback is a function type for cleanup before restart
type ShutdownCallback func() error

var globalShutdownCallback ShutdownCallback

// RegisterShutdownCallback sets a callback to be called before restart
func RegisterShutdownCallback(callback ShutdownCallback) {
	globalShutdownCallback = callback
}

// RestartApplication restarts the current application with graceful shutdown
func RestartApplication() error {
	// Call shutdown callback if registered
	if globalShutdownCallback != nil {
		if err := globalShutdownCallback(); err != nil {
			return fmt.Errorf("shutdown callback failed: %w", err)
		}
	}

	// Give time for cleanup to complete
	time.Sleep(1 * time.Second)

	executable, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	// Get current process arguments
	args := os.Args[1:]

	// Start new process
	procAttr := &os.ProcAttr{
		Files: []*os.File{os.Stdin, os.Stdout, os.Stderr},
	}

	_, err = os.StartProcess(executable, append([]string{executable}, args...), procAttr)
	if err != nil {
		return fmt.Errorf("failed to start new process: %w", err)
	}

	// Give the new process time to start
	time.Sleep(500 * time.Millisecond)

	// Exit current process
	os.Exit(0)

	return nil
}
