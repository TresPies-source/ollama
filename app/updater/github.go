//go:build windows || darwin

package updater

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"runtime"
	"strings"

	"github.com/ollama/ollama/app/version"
)

const (
	// GitHub repository for Dojo Genesis Desktop
	GitHubOwner = "TresPies-source"
	GitHubRepo  = "ollama" // Using the forked ollama repo
)

// GitHubRelease represents a GitHub release API response
type GitHubRelease struct {
	TagName    string        `json:"tag_name"`
	Name       string        `json:"name"`
	Draft      bool          `json:"draft"`
	Prerelease bool          `json:"prerelease"`
	Assets     []GitHubAsset `json:"assets"`
}

// GitHubAsset represents a release asset
type GitHubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

// CheckGitHubRelease checks for the latest release on GitHub
func CheckGitHubRelease(ctx context.Context) (bool, UpdateResponse, error) {
	var updateResp UpdateResponse

	// Build GitHub API URL
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", GitHubOwner, GitHubRepo)

	slog.Debug("checking GitHub for latest release", "url", apiURL, "current_version", version.Version)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return false, updateResp, fmt.Errorf("failed to create request: %w", err)
	}

	// Set User-Agent as required by GitHub API
	req.Header.Set("User-Agent", fmt.Sprintf("dojo-genesis-desktop/%s", version.Version))
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, updateResp, fmt.Errorf("failed to fetch release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		slog.Debug("no releases found on GitHub")
		return false, updateResp, nil
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return false, updateResp, fmt.Errorf("GitHub API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, updateResp, fmt.Errorf("failed to read response: %w", err)
	}

	var release GitHubRelease
	if err := json.Unmarshal(body, &release); err != nil {
		return false, updateResp, fmt.Errorf("failed to parse release JSON: %w", err)
	}

	// Skip drafts and prereleases
	if release.Draft || release.Prerelease {
		slog.Debug("skipping draft or prerelease", "tag", release.TagName)
		return false, updateResp, nil
	}

	// Parse version from tag (e.g., "v0.1.0" -> "0.1.0")
	releaseVersion := strings.TrimPrefix(release.TagName, "v")

	// Compare versions
	if !isNewerVersion(version.Version, releaseVersion) {
		slog.Debug("current version is up to date", "current", version.Version, "latest", releaseVersion)
		return false, updateResp, nil
	}

	// Find appropriate asset for current platform
	assetURL, err := findAssetForPlatform(release.Assets)
	if err != nil {
		return false, updateResp, fmt.Errorf("no suitable asset found: %w", err)
	}

	updateResp.UpdateURL = assetURL
	updateResp.UpdateVersion = releaseVersion

	slog.Info("new update available on GitHub", "current", version.Version, "latest", releaseVersion, "url", assetURL)
	return true, updateResp, nil
}

// findAssetForPlatform finds the appropriate installer for the current platform
func findAssetForPlatform(assets []GitHubAsset) (string, error) {
	var targetSuffix string

	switch runtime.GOOS {
	case "windows":
		targetSuffix = ".exe"
	case "darwin":
		targetSuffix = ".zip"
	default:
		return "", fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	for _, asset := range assets {
		if strings.HasSuffix(strings.ToLower(asset.Name), targetSuffix) {
			// Additional filtering for Windows/macOS specific installers
			name := strings.ToLower(asset.Name)
			if runtime.GOOS == "windows" && strings.Contains(name, "setup") {
				return asset.BrowserDownloadURL, nil
			}
			if runtime.GOOS == "darwin" && (strings.Contains(name, "darwin") || strings.Contains(name, "macos")) {
				return asset.BrowserDownloadURL, nil
			}
		}
	}

	return "", fmt.Errorf("no asset found for platform %s/%s", runtime.GOOS, runtime.GOARCH)
}

// isNewerVersion compares two semantic versions
// Returns true if newVersion is newer than currentVersion
func isNewerVersion(currentVersion, newVersion string) bool {
	// Normalize versions (remove 'v' prefix if present)
	current := strings.TrimPrefix(currentVersion, "v")
	new := strings.TrimPrefix(newVersion, "v")

	// Handle edge case where version is "0.0.0" (development)
	if current == "0.0.0" {
		// In development mode, any release version is considered newer
		return new != "0.0.0"
	}

	// Split versions into parts
	currentParts := strings.Split(current, ".")
	newParts := strings.Split(new, ".")

	// Compare each part
	for i := 0; i < len(currentParts) && i < len(newParts); i++ {
		var currentNum, newNum int
		fmt.Sscanf(currentParts[i], "%d", &currentNum)
		fmt.Sscanf(newParts[i], "%d", &newNum)

		if newNum > currentNum {
			return true
		} else if newNum < currentNum {
			return false
		}
	}

	// If all parts are equal but new version has more parts, it's newer
	return len(newParts) > len(currentParts)
}
