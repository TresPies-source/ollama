package updater

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIsNewerVersion(t *testing.T) {
	tests := []struct {
		name           string
		currentVersion string
		newVersion     string
		expected       bool
	}{
		{
			name:           "newer major version",
			currentVersion: "0.2.0",
			newVersion:     "1.0.0",
			expected:       true,
		},
		{
			name:           "newer minor version",
			currentVersion: "0.2.0",
			newVersion:     "0.3.0",
			expected:       true,
		},
		{
			name:           "newer patch version",
			currentVersion: "0.2.0",
			newVersion:     "0.2.1",
			expected:       true,
		},
		{
			name:           "same version",
			currentVersion: "0.2.0",
			newVersion:     "0.2.0",
			expected:       false,
		},
		{
			name:           "older version",
			currentVersion: "0.2.0",
			newVersion:     "0.1.9",
			expected:       false,
		},
		{
			name:           "with v prefix",
			currentVersion: "v0.2.0",
			newVersion:     "v0.3.0",
			expected:       true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isNewerVersion(tt.currentVersion, tt.newVersion)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestVerifyChecksum(t *testing.T) {
	testData := []byte("test data for checksum")
	hash := sha256.Sum256(testData)
	validChecksum := hex.EncodeToString(hash[:])
	invalidChecksum := "0000000000000000000000000000000000000000000000000000000000000000"

	t.Run("valid checksum", func(t *testing.T) {
		err := verifyChecksum(testData, validChecksum)
		assert.NoError(t, err)
	})

	t.Run("invalid checksum", func(t *testing.T) {
		err := verifyChecksum(testData, invalidChecksum)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "checksum mismatch")
	})
}

func TestCheckForUpdates(t *testing.T) {
	t.Run("newer version available", func(t *testing.T) {
		// Create mock server
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			latest := LatestVersion{
				Version:  "0.3.0",
				URL:      "https://example.com/dgd-0.3.0",
				Checksum: "abc123",
			}
			json.NewEncoder(w).Encode(latest)
		}))
		defer server.Close()

		checker := NewUpdateChecker(server.URL)
		latest, err := checker.CheckForUpdates("0.2.0")

		require.NoError(t, err)
		require.NotNil(t, latest)
		assert.Equal(t, "0.3.0", latest.Version)
		assert.Equal(t, "https://example.com/dgd-0.3.0", latest.URL)
		assert.Equal(t, "abc123", latest.Checksum)
	})

	t.Run("no update available", func(t *testing.T) {
		// Create mock server
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			latest := LatestVersion{
				Version:  "0.2.0",
				URL:      "https://example.com/dgd-0.2.0",
				Checksum: "abc123",
			}
			json.NewEncoder(w).Encode(latest)
		}))
		defer server.Close()

		checker := NewUpdateChecker(server.URL)
		latest, err := checker.CheckForUpdates("0.2.0")

		require.NoError(t, err)
		assert.Nil(t, latest)
	})

	t.Run("older version on server", func(t *testing.T) {
		// Create mock server
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			latest := LatestVersion{
				Version:  "0.1.0",
				URL:      "https://example.com/dgd-0.1.0",
				Checksum: "abc123",
			}
			json.NewEncoder(w).Encode(latest)
		}))
		defer server.Close()

		checker := NewUpdateChecker(server.URL)
		latest, err := checker.CheckForUpdates("0.2.0")

		require.NoError(t, err)
		assert.Nil(t, latest)
	})

	t.Run("server error", func(t *testing.T) {
		// Create mock server that returns error
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}))
		defer server.Close()

		checker := NewUpdateChecker(server.URL)
		latest, err := checker.CheckForUpdates("0.2.0")

		require.Error(t, err)
		assert.Nil(t, latest)
		assert.Contains(t, err.Error(), "update server returned status 500")
	})

	t.Run("invalid JSON response", func(t *testing.T) {
		// Create mock server with invalid JSON
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("invalid json"))
		}))
		defer server.Close()

		checker := NewUpdateChecker(server.URL)
		latest, err := checker.CheckForUpdates("0.2.0")

		require.Error(t, err)
		assert.Nil(t, latest)
		assert.Contains(t, err.Error(), "failed to parse update info")
	})
}

func TestGetPlatformBinaryName(t *testing.T) {
	name := GetPlatformBinaryName()
	assert.NotEmpty(t, name)
	assert.Contains(t, name, "dgd")
	// Should include architecture
	assert.True(t, 
		assert.ObjectsAreEqual(name, "dgd-windows-amd64.exe") ||
		assert.ObjectsAreEqual(name, "dgd-windows-arm64.exe") ||
		assert.ObjectsAreEqual(name, "dgd-macos-amd64") ||
		assert.ObjectsAreEqual(name, "dgd-macos-arm64") ||
		assert.ObjectsAreEqual(name, "dgd-linux-amd64") ||
		assert.ObjectsAreEqual(name, "dgd-linux-arm64"),
		"unexpected binary name: %s", name)
}

func TestParseGitHubRelease(t *testing.T) {
	t.Run("successful parse", func(t *testing.T) {
		// Include binaries for all platforms
		release := &GitHubRelease{
			TagName: "v0.3.0",
			Assets: []struct {
				Name               string `json:"name"`
				BrowserDownloadURL string `json:"browser_download_url"`
			}{
				{
					Name:               "dgd-linux-amd64",
					BrowserDownloadURL: "https://example.com/dgd-linux-amd64",
				},
				{
					Name:               "dgd-linux-arm64",
					BrowserDownloadURL: "https://example.com/dgd-linux-arm64",
				},
				{
					Name:               "dgd-macos-amd64",
					BrowserDownloadURL: "https://example.com/dgd-macos-amd64",
				},
				{
					Name:               "dgd-macos-arm64",
					BrowserDownloadURL: "https://example.com/dgd-macos-arm64",
				},
				{
					Name:               "dgd-windows-amd64.exe",
					BrowserDownloadURL: "https://example.com/dgd-windows-amd64.exe",
				},
				{
					Name:               "dgd-windows-arm64.exe",
					BrowserDownloadURL: "https://example.com/dgd-windows-arm64.exe",
				},
			},
		}

		latest, err := parseGitHubRelease(release)
		require.NoError(t, err)
		assert.Equal(t, "v0.3.0", latest.Version)
		assert.NotEmpty(t, latest.URL)
		assert.Equal(t, "", latest.Checksum) // GitHub doesn't provide checksums
	})

	t.Run("platform not found", func(t *testing.T) {
		release := &GitHubRelease{
			TagName: "v0.3.0",
			Assets: []struct {
				Name               string `json:"name"`
				BrowserDownloadURL string `json:"browser_download_url"`
			}{
				{
					Name:               "dgd-other-platform",
					BrowserDownloadURL: "https://example.com/dgd-other",
				},
			},
		}

		_, err := parseGitHubRelease(release)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "no binary found for platform")
	})
}

func TestCheckForUpdatesRetry(t *testing.T) {
	t.Run("succeeds on second attempt", func(t *testing.T) {
		attempts := 0
		// Create mock server that fails first time, succeeds second time
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			attempts++
			if attempts == 1 {
				http.Error(w, "Temporary Error", http.StatusServiceUnavailable)
				return
			}
			latest := LatestVersion{
				Version:  "0.3.0",
				URL:      "https://example.com/dgd-0.3.0",
				Checksum: "abc123",
			}
			json.NewEncoder(w).Encode(latest)
		}))
		defer server.Close()

		checker := NewUpdateChecker(server.URL)
		checker.maxRetries = 2 // Reduce retries for faster test

		latest, err := checker.CheckForUpdates("0.2.0")

		require.NoError(t, err)
		require.NotNil(t, latest)
		assert.Equal(t, "0.3.0", latest.Version)
		assert.Equal(t, 2, attempts) // Should have retried once
	})

	t.Run("fails after max retries", func(t *testing.T) {
		// Create mock server that always fails
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Server Error", http.StatusInternalServerError)
		}))
		defer server.Close()

		checker := NewUpdateChecker(server.URL)
		checker.maxRetries = 2 // Reduce retries for faster test

		latest, err := checker.CheckForUpdates("0.2.0")

		require.Error(t, err)
		assert.Nil(t, latest)
		assert.Contains(t, err.Error(), "failed after 2 attempts")
	})
}

func TestCheckForUpdatesGitHubFormat(t *testing.T) {
	t.Run("parse GitHub release", func(t *testing.T) {
		// Create mock GitHub API server
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			release := GitHubRelease{
				TagName: "v0.3.0",
				Assets: []struct {
					Name               string `json:"name"`
					BrowserDownloadURL string `json:"browser_download_url"`
				}{
					{
						Name:               GetPlatformBinaryName(),
						BrowserDownloadURL: "https://example.com/binary",
					},
				},
			}
			json.NewEncoder(w).Encode(release)
		}))
		defer server.Close()

		checker := NewUpdateChecker(server.URL)
		latest, err := checker.CheckForUpdates("0.2.0")

		require.NoError(t, err)
		require.NotNil(t, latest)
		assert.Equal(t, "v0.3.0", latest.Version)
		assert.Equal(t, "https://example.com/binary", latest.URL)
		assert.Equal(t, "", latest.Checksum) // GitHub doesn't provide checksums
	})
}
