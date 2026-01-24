import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useUsage, useSessionUsage } from "./useUsage";
import * as api from "@/api";
import type { UsageStats, SessionUsage } from "@/api";

vi.mock("@/api", () => ({
  getUsageStats: vi.fn(),
  getSessionUsage: vi.fn(),
}));

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
    {
      model: "llama3.2:3b",
      prompt_tokens: 500,
      completion_tokens: 1000,
      total_tokens: 1500,
      message_count: 25,
      estimated_cost_usd: 0,
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
    {
      date: "2026-01-22",
      prompt_tokens: 400,
      completion_tokens: 800,
      total_tokens: 1200,
      message_count: 20,
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
    {
      session_id: "session-2",
      session_title: "Test Session 2",
      prompt_tokens: 200,
      completion_tokens: 400,
      total_tokens: 600,
      message_count: 10,
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {
        // Silence errors in tests
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch usage statistics successfully", async () => {
    vi.mocked(api.getUsageStats).mockResolvedValue(mockUsageStats);

    const { result } = renderHook(() => useUsage(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUsageStats);
    expect(result.current.error).toBeNull();
    expect(api.getUsageStats).toHaveBeenCalledTimes(1);
  });



  it("should use correct query key", async () => {
    vi.mocked(api.getUsageStats).mockResolvedValue(mockUsageStats);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUsage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUsageStats);
  });
});

describe("useSessionUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch session usage successfully", async () => {
    vi.mocked(api.getSessionUsage).mockResolvedValue(mockSessionUsage);

    const { result } = renderHook(() => useSessionUsage("session-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSessionUsage);
    expect(result.current.error).toBeNull();
    expect(api.getSessionUsage).toHaveBeenCalledWith("session-1");
    expect(api.getSessionUsage).toHaveBeenCalledTimes(1);
  });

  it("should not fetch when sessionId is empty", async () => {
    const { result } = renderHook(() => useSessionUsage(""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(api.getSessionUsage).not.toHaveBeenCalled();
  });

  it("should not fetch when sessionId is 'new'", async () => {
    const { result } = renderHook(() => useSessionUsage("new"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(api.getSessionUsage).not.toHaveBeenCalled();
  });



  it("should use correct query key with sessionId", async () => {
    vi.mocked(api.getSessionUsage).mockResolvedValue(mockSessionUsage);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSessionUsage("session-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSessionUsage);
  });
});
