import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkForUpdates,
  applyUpdate,
  type UpdateCheckResponse,
  type UpdateApplyRequest,
  type UpdateApplyResponse,
} from "./update";

const mockUpdateAvailable: UpdateCheckResponse = {
  update_available: true,
  current_version: "0.1.0",
  latest_version: "0.2.0",
  download_url: "https://github.com/TresPies-source/ollama/releases/download/v0.2.0/dgd-macos-amd64",
  checksum: "abc123def456",
};

const mockNoUpdate: UpdateCheckResponse = {
  update_available: false,
  current_version: "0.2.0",
};

const mockApplyResponse: UpdateApplyResponse = {
  success: true,
  message: "Update is being applied. Application will restart shortly.",
};

describe("Update API", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("checkForUpdates", () => {
    it("should return update available when new version exists", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUpdateAvailable,
      } as Response);

      const result = await checkForUpdates();

      expect(result).toEqual(mockUpdateAvailable);
      expect(result.update_available).toBe(true);
      expect(result.latest_version).toBe("0.2.0");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/update/check"),
      );
    });

    it("should return no update when on latest version", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockNoUpdate,
      } as Response);

      const result = await checkForUpdates();

      expect(result).toEqual(mockNoUpdate);
      expect(result.update_available).toBe(false);
      expect(result.latest_version).toBeUndefined();
    });

    it("should throw error on failed request", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
      } as Response);

      await expect(checkForUpdates()).rejects.toThrow(
        "Failed to check for updates",
      );
    });

    it("should handle network errors", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      await expect(checkForUpdates()).rejects.toThrow("Network error");
    });

    it("should return proper data structure when update available", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUpdateAvailable,
      } as Response);

      const result = await checkForUpdates();

      expect(result).toHaveProperty("update_available");
      expect(result).toHaveProperty("current_version");
      expect(result).toHaveProperty("latest_version");
      expect(result).toHaveProperty("download_url");
      expect(result).toHaveProperty("checksum");
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(global.fetch).mockRejectedValue("String error");

      await expect(checkForUpdates()).rejects.toThrow(
        "Unknown error while checking for updates",
      );
    });
  });

  describe("applyUpdate", () => {
    const updateRequest: UpdateApplyRequest = {
      version: "0.2.0",
      url: "https://github.com/TresPies-source/ollama/releases/download/v0.2.0/dgd-macos-amd64",
      checksum: "abc123def456",
    };

    it("should apply update successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApplyResponse,
      } as Response);

      const result = await applyUpdate(updateRequest);

      expect(result).toEqual(mockApplyResponse);
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/update/apply"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        }),
      );
    });

    it("should throw error on failed request", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
      } as Response);

      await expect(applyUpdate(updateRequest)).rejects.toThrow(
        "Failed to apply update",
      );
    });

    it("should handle network errors", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      await expect(applyUpdate(updateRequest)).rejects.toThrow("Network error");
    });

    it("should send correct request payload", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApplyResponse,
      } as Response);

      await applyUpdate(updateRequest);

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);

      expect(requestBody).toEqual({
        version: "0.2.0",
        url: expect.stringContaining("dgd-macos-amd64"),
        checksum: "abc123def456",
      });
    });

    it("should return proper response structure", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApplyResponse,
      } as Response);

      const result = await applyUpdate(updateRequest);

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(global.fetch).mockRejectedValue("String error");

      await expect(applyUpdate(updateRequest)).rejects.toThrow(
        "Unknown error while applying update",
      );
    });
  });
});
