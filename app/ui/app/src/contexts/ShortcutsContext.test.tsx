import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  ShortcutsProvider,
  useShortcutsContext,
} from "./ShortcutsContext";
import * as settingsApi from "@/api/settings";

vi.mock("@/api/settings");

const mockFetchSettings = vi.mocked(settingsApi.fetchSettings);
const mockUpdateSettings = vi.mocked(settingsApi.updateSettings);

describe("ShortcutsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSettings.mockResolvedValue({});
    mockUpdateSettings.mockResolvedValue({});
  });

  it("loads default shortcuts on mount", async () => {
    mockFetchSettings.mockResolvedValue({});

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shortcuts).toBeDefined();
    expect(Object.keys(result.current.shortcuts).length).toBeGreaterThan(0);
    expect(result.current.shortcuts["new-session"]).toBeDefined();
  });

  it("merges user overrides with defaults", async () => {
    mockFetchSettings.mockResolvedValue({
      "shortcut_new-session": "Cmd+Shift+N",
    });

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shortcuts["new-session"]).toBe("Cmd+Shift+N");
  });

  it("detects platform correctly", async () => {
    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(["mac", "windows", "linux"]).toContain(result.current.platform);
  });

  it("provides shortcut definitions", async () => {
    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shortcutDefinitions).toBeDefined();
    expect(result.current.shortcutDefinitions.length).toBeGreaterThan(0);
    expect(result.current.shortcutDefinitions[0]).toHaveProperty("id");
    expect(result.current.shortcutDefinitions[0]).toHaveProperty("name");
    expect(result.current.shortcutDefinitions[0]).toHaveProperty("keys");
  });

  it("getShortcut returns the correct shortcut key", async () => {
    mockFetchSettings.mockResolvedValue({});

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const shortcut = result.current.getShortcut("new-session");
    expect(shortcut).toBeDefined();
    expect(typeof shortcut).toBe("string");
  });

  it("updateShortcut updates the shortcut and saves to backend", async () => {
    mockFetchSettings.mockResolvedValue({});
    mockUpdateSettings.mockResolvedValue({
      "shortcut_new-session": "Cmd+Shift+N",
    });

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.updateShortcut("new-session", "Cmd+Shift+N");

    await waitFor(() => {
      expect(result.current.shortcuts["new-session"]).toBe("Cmd+Shift+N");
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      "shortcut_new-session": "Cmd+Shift+N",
    });
  });

  it("updateShortcut throws error for empty key", async () => {
    mockFetchSettings.mockResolvedValue({});

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      result.current.updateShortcut("new-session", ""),
    ).rejects.toThrow("Shortcut key cannot be empty");
  });

  it("hasConflict detects conflicting shortcuts", async () => {
    mockFetchSettings.mockResolvedValue({});

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const existingShortcut = result.current.shortcuts["new-session"];
    expect(result.current.hasConflict(existingShortcut!)).toBe(true);
  });

  it("hasConflict excludes the specified shortcut ID", async () => {
    mockFetchSettings.mockResolvedValue({});

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const existingShortcut = result.current.shortcuts["new-session"];
    expect(result.current.hasConflict(existingShortcut!, "new-session")).toBe(
      false,
    );
  });

  it("resetShortcuts restores default shortcuts", async () => {
    mockFetchSettings.mockResolvedValue({
      "shortcut_new-session": "Cmd+Shift+N",
    });
    mockUpdateSettings.mockResolvedValue({});

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shortcuts["new-session"]).toBe("Cmd+Shift+N");

    await result.current.resetShortcuts();

    await waitFor(() => {
      expect(result.current.shortcuts["new-session"]).not.toBe("Cmd+Shift+N");
    });
  });

  it("handles API errors gracefully when loading", async () => {
    mockFetchSettings.mockRejectedValue(new Error("Network error"));

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useShortcutsContext(), {
      wrapper: ShortcutsProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shortcuts).toBeDefined();
    expect(Object.keys(result.current.shortcuts).length).toBeGreaterThan(0);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("throws error when used outside provider", () => {
    expect(() => {
      renderHook(() => useShortcutsContext());
    }).toThrow("useShortcutsContext must be used within a ShortcutsProvider");
  });
});
