import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchSettings, updateSettings } from "./settings";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Settings API", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchSettings", () => {
    it("should fetch settings successfully", async () => {
      const mockSettings = {
        default_model: "llama3.2:3b",
        temperature: "0.7",
        max_tokens: "4096",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: mockSettings }),
      });

      const result = await fetchSettings();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/settings",
      );
      expect(result).toEqual(mockSettings);
    });

    it("should throw error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      });

      await expect(fetchSettings()).rejects.toThrow(
        "Failed to fetch settings: Internal Server Error",
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchSettings()).rejects.toThrow("Network error");
    });

    it("should return empty object when no settings exist", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: {} }),
      });

      const result = await fetchSettings();

      expect(result).toEqual({});
    });
  });

  describe("updateSettings", () => {
    it("should update settings successfully", async () => {
      const settingsToUpdate = {
        default_model: "qwen2.5:7b",
        temperature: "0.8",
      };

      const updatedSettings = {
        default_model: "qwen2.5:7b",
        temperature: "0.8",
        max_tokens: "4096",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: updatedSettings }),
      });

      const result = await updateSettings(settingsToUpdate);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/settings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ settings: settingsToUpdate }),
        },
      );
      expect(result).toEqual(updatedSettings);
    });

    it("should throw error when update fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        text: async () => "Invalid settings format",
      });

      await expect(
        updateSettings({ invalid_key: "value" }),
      ).rejects.toThrow("Invalid settings format");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        updateSettings({ default_model: "llama3.2:3b" }),
      ).rejects.toThrow("Network error");
    });

    it("should handle server errors with no error text", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
        text: async () => "",
      });

      await expect(
        updateSettings({ default_model: "llama3.2:3b" }),
      ).rejects.toThrow("Failed to update settings: Internal Server Error");
    });

    it("should update multiple settings at once", async () => {
      const settingsToUpdate = {
        default_model: "llama3.2:3b",
        temperature: "0.9",
        max_tokens: "8192",
        theme: "dark",
        font_size: "16",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: settingsToUpdate }),
      });

      const result = await updateSettings(settingsToUpdate);

      expect(result).toEqual(settingsToUpdate);
    });
  });
});
