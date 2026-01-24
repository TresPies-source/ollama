import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getUsageStats, getSessionUsage } from "@/api";
import type { UsageStats, SessionUsage } from "@/api";

const mockUsageStats: UsageStats = {
  total_prompt_tokens: 1000,
  total_completion_tokens: 2000,
  total_tokens: 3000,
  total_messages: 50,
  estimated_cost_usd: 0.15,
  usage_by_model: [
    {
      model: "gpt-4o-mini",
      prompt_tokens: 500,
      completion_tokens: 1000,
      total_tokens: 1500,
      message_count: 25,
      estimated_cost_usd: 0.075,
    },
  ],
  usage_by_day: [
    {
      date: "2026-01-23",
      prompt_tokens: 600,
      completion_tokens: 1200,
      total_tokens: 1800,
      message_count: 30,
    },
  ],
  usage_by_session: [
    {
      session_id: "session-1",
      session_title: "Test Session 1",
      prompt_tokens: 300,
      completion_tokens: 600,
      total_tokens: 900,
      message_count: 15,
    },
  ],
};

const mockSessionUsage: SessionUsage = {
  session_id: "session-1",
  session_title: "Test Session 1",
  prompt_tokens: 300,
  completion_tokens: 600,
  total_tokens: 900,
  message_count: 15,
};

describe("Usage API", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("getUsageStats", () => {
    it("should fetch usage statistics successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUsageStats,
      } as Response);

      const result = await getUsageStats();

      expect(result).toEqual(mockUsageStats);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/usage"),
      );
    });

    it("should throw error on failed request", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
      } as Response);

      await expect(getUsageStats()).rejects.toThrow(
        "Failed to fetch usage stats",
      );
    });

    it("should handle network errors", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      await expect(getUsageStats()).rejects.toThrow("Network error");
    });

    it("should return proper data structure", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUsageStats,
      } as Response);

      const result = await getUsageStats();

      expect(result).toHaveProperty("total_prompt_tokens");
      expect(result).toHaveProperty("total_completion_tokens");
      expect(result).toHaveProperty("total_tokens");
      expect(result).toHaveProperty("total_messages");
      expect(result).toHaveProperty("estimated_cost_usd");
      expect(result).toHaveProperty("usage_by_model");
      expect(result).toHaveProperty("usage_by_day");
      expect(result).toHaveProperty("usage_by_session");
      expect(Array.isArray(result.usage_by_model)).toBe(true);
      expect(Array.isArray(result.usage_by_day)).toBe(true);
      expect(Array.isArray(result.usage_by_session)).toBe(true);
    });
  });

  describe("getSessionUsage", () => {
    it("should fetch session usage successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockSessionUsage,
      } as Response);

      const result = await getSessionUsage("session-1");

      expect(result).toEqual(mockSessionUsage);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sessions/session-1/usage"),
      );
    });

    it("should throw error on failed request", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      } as Response);

      await expect(getSessionUsage("session-1")).rejects.toThrow(
        "Failed to fetch session usage",
      );
    });

    it("should handle network errors", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      await expect(getSessionUsage("session-1")).rejects.toThrow(
        "Network error",
      );
    });

    it("should return proper data structure", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockSessionUsage,
      } as Response);

      const result = await getSessionUsage("session-1");

      expect(result).toHaveProperty("session_id");
      expect(result).toHaveProperty("session_title");
      expect(result).toHaveProperty("prompt_tokens");
      expect(result).toHaveProperty("completion_tokens");
      expect(result).toHaveProperty("total_tokens");
      expect(result).toHaveProperty("message_count");
    });

    it("should use correct session ID in URL", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockSessionUsage,
      } as Response);

      await getSessionUsage("test-session-123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sessions/test-session-123/usage"),
      );
    });
  });
});
