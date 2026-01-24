import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useShortcut } from "./useShortcut";
import {
  ShortcutsProvider,
  useShortcutsContext,
} from "@/contexts/ShortcutsContext";
import * as settingsApi from "@/api/settings";

vi.mock("@/api/settings");
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}));

const mockFetchSettings = vi.mocked(settingsApi.fetchSettings);

describe("useShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSettings.mockResolvedValue({});
  });

  it("returns shortcut information", async () => {
    const callback = vi.fn();

    const { result } = renderHook(
      () => {
        const context = useShortcutsContext();
        const shortcut = useShortcut("new-session", callback);
        return { context, shortcut };
      },
      {
        wrapper: ShortcutsProvider,
      },
    );

    await waitFor(() => {
      expect(result.current.context.isLoading).toBe(false);
    });

    expect(result.current.shortcut.shortcutKey).toBeDefined();
    expect(result.current.shortcut.hotkey).toBeDefined();
    expect(typeof result.current.shortcut.enabled).toBe("boolean");
  });

  it("converts Mac shortcuts correctly", async () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      configurable: true,
    });

    mockFetchSettings.mockResolvedValue({});

    const callback = vi.fn();

    const { result } = renderHook(
      () => {
        const context = useShortcutsContext();
        const shortcut = useShortcut("new-session", callback);
        return { context, shortcut };
      },
      {
        wrapper: ShortcutsProvider,
      },
    );

    await waitFor(() => {
      expect(result.current.context.isLoading).toBe(false);
    });

    expect(result.current.shortcut.hotkey).toContain("mod");
  });

  it("converts Windows shortcuts correctly", async () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      configurable: true,
    });

    mockFetchSettings.mockResolvedValue({});

    const callback = vi.fn();

    const { result } = renderHook(
      () => {
        const context = useShortcutsContext();
        const shortcut = useShortcut("new-session", callback);
        return { context, shortcut };
      },
      {
        wrapper: ShortcutsProvider,
      },
    );

    await waitFor(() => {
      expect(result.current.context.isLoading).toBe(false);
    });

    expect(result.current.shortcut.hotkey).toContain("mod");
  });

  it("disables shortcut when loading", async () => {
    const callback = vi.fn();

    const { result } = renderHook(() => useShortcut("new-session", callback), {
      wrapper: ShortcutsProvider,
    });

    const initialEnabled = result.current.enabled;

    await waitFor(() => {
      expect(result.current.enabled).toBe(true);
    });

    expect(initialEnabled).toBe(false);
  });

  it("disables shortcut when enabled option is false", async () => {
    mockFetchSettings.mockResolvedValue({});

    const callback = vi.fn();

    const { result } = renderHook(
      () =>
        useShortcut("new-session", callback, {
          enabled: false,
        }),
      {
        wrapper: ShortcutsProvider,
      },
    );

    await waitFor(() => {
      expect(result.current.enabled).toBe(false);
    });
  });

  it("returns null hotkey for non-existent shortcut", async () => {
    mockFetchSettings.mockResolvedValue({});

    const callback = vi.fn();

    const { result } = renderHook(
      () => {
        const context = useShortcutsContext();
        const shortcut = useShortcut("non-existent-shortcut", callback);
        return { context, shortcut };
      },
      {
        wrapper: ShortcutsProvider,
      },
    );

    await waitFor(() => {
      expect(result.current.context.isLoading).toBe(false);
    });

    expect(result.current.shortcut.hotkey).toBeNull();
    expect(result.current.shortcut.enabled).toBe(false);
  });
});
