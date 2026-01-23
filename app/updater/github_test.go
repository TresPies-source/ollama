//go:build windows || darwin

package updater

import (
	"context"
	"testing"
	"time"
)

func TestCheckGitHubRelease(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Test GitHub releases API
	available, resp, err := CheckGitHubRelease(ctx)
	
	if err != nil {
		t.Logf("GitHub API check returned error (may be expected if no releases): %v", err)
	}

	if available {
		t.Logf("Update available:")
		t.Logf("  Version: %s", resp.UpdateVersion)
		t.Logf("  URL: %s", resp.UpdateURL)
	} else {
		t.Logf("No update available (current version is latest)")
	}
}

func TestVersionComparison(t *testing.T) {
	tests := []struct {
		current  string
		new      string
		expected bool
		name     string
	}{
		{"0.0.0", "0.1.0", true, "dev to release"},
		{"0.1.0", "0.2.0", true, "minor version bump"},
		{"0.1.0", "0.1.1", true, "patch version bump"},
		{"0.1.0", "1.0.0", true, "major version bump"},
		{"0.1.0", "0.1.0", false, "same version"},
		{"0.2.0", "0.1.0", false, "newer current"},
		{"1.0.0", "0.9.0", false, "newer current major"},
		{"v0.1.0", "0.2.0", true, "with v prefix"},
		{"0.1.0", "v0.2.0", true, "new with v prefix"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isNewerVersion(tt.current, tt.new)
			if result != tt.expected {
				t.Errorf("isNewerVersion(%s, %s) = %v, expected %v",
					tt.current, tt.new, result, tt.expected)
			}
		})
	}
}

func TestFindAssetForPlatform(t *testing.T) {
	tests := []struct {
		name     string
		assets   []GitHubAsset
		platform string
		expected string
		wantErr  bool
	}{
		{
			name: "Windows installer",
			assets: []GitHubAsset{
				{Name: "DojoGenesisSetup.exe", BrowserDownloadURL: "https://example.com/setup.exe"},
				{Name: "dojo-darwin.zip", BrowserDownloadURL: "https://example.com/darwin.zip"},
			},
			expected: "https://example.com/setup.exe",
			wantErr:  false,
		},
		{
			name: "No matching asset",
			assets: []GitHubAsset{
				{Name: "source.tar.gz", BrowserDownloadURL: "https://example.com/source.tar.gz"},
			},
			expected: "",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := findAssetForPlatform(tt.assets)
			if (err != nil) != tt.wantErr {
				t.Errorf("findAssetForPlatform() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && result != tt.expected {
				t.Errorf("findAssetForPlatform() = %v, expected %v", result, tt.expected)
			}
		})
	}
}
