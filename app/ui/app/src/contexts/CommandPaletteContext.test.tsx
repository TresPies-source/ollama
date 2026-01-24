import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import {
  CommandPaletteProvider,
  useCommandPaletteContext,
} from "./CommandPaletteContext";
import { commandRegistry } from "@/commands/registry";
import type { Command } from "@/commands/types";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CommandPaletteProvider>{children}</CommandPaletteProvider>
);

describe("CommandPaletteContext", () => {
  beforeEach(() => {
    commandRegistry.clear();
    
    const testCommands: Command[] = [
      {
        id: "test.new-session",
        title: "New Session",
        description: "Create a new chat session",
        category: "Session",
        keywords: ["new", "session", "create"],
        action: async () => {
          console.log("New session");
        },
      },
      {
        id: "test.open-settings",
        title: "Open Settings",
        description: "Open application settings",
        category: "Settings",
        keywords: ["settings", "preferences"],
        action: async () => {
          console.log("Open settings");
        },
      },
      {
        id: "test.export",
        title: "Export Session",
        description: "Export current session",
        category: "Session",
        keywords: ["export", "save"],
        action: async () => {
          console.log("Export");
        },
      },
    ];

    testCommands.forEach((cmd) => commandRegistry.register(cmd));
  });

  describe("Initialization", () => {
    it("should provide initial state", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      expect(result.current.state.isOpen).toBe(false);
      expect(result.current.state.query).toBe("");
      expect(result.current.state.selectedIndex).toBe(0);
      expect(result.current.state.results.length).toBeGreaterThan(0);
    });

    it("should throw error when used outside provider", () => {
      expect(() => {
        renderHook(() => useCommandPaletteContext());
      }).toThrow("useCommandPaletteContext must be used within a CommandPaletteProvider");
    });
  });

  describe("Open/Close", () => {
    it("should open the palette", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.open();
      });

      expect(result.current.state.isOpen).toBe(true);
    });

    it("should close the palette", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.open();
      });

      expect(result.current.state.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.state.isOpen).toBe(false);
    });

    it("should toggle the palette", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.state.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.state.isOpen).toBe(false);
    });

    it("should reset query and selection when opening", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.open();
        result.current.search("test");
        result.current.setSelectedIndex(2);
      });

      act(() => {
        result.current.close();
      });

      act(() => {
        result.current.open();
      });

      expect(result.current.state.query).toBe("");
      expect(result.current.state.selectedIndex).toBe(0);
    });
  });

  describe("Search", () => {
    it("should filter commands by title", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.search("Settings");
      });

      expect(result.current.state.results.length).toBeGreaterThan(0);
      expect(
        result.current.state.results.some((cmd) =>
          cmd.title.includes("Settings"),
        ),
      ).toBe(true);
    });

    it("should filter commands by keywords", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.search("export");
      });

      expect(result.current.state.results.length).toBeGreaterThan(0);
      expect(
        result.current.state.results.some((cmd) => cmd.id === "test.export"),
      ).toBe(true);
    });

    it("should return all commands when query is empty", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.search("");
      });

      expect(result.current.state.results.length).toBe(3);
    });

    it("should reset selection index when searching", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.setSelectedIndex(2);
      });

      expect(result.current.state.selectedIndex).toBe(2);

      act(() => {
        result.current.search("settings");
      });

      expect(result.current.state.selectedIndex).toBe(0);
    });

    it("should perform fuzzy search", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.search("sesn");
      });

      expect(
        result.current.state.results.some((cmd) =>
          cmd.title.toLowerCase().includes("session"),
        ),
      ).toBe(true);
    });
  });

  describe("Selection", () => {
    it("should select next command", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      const initialIndex = result.current.state.selectedIndex;

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.state.selectedIndex).toBe(initialIndex + 1);
    });

    it("should select previous command", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.setSelectedIndex(2);
      });

      act(() => {
        result.current.selectPrevious();
      });

      expect(result.current.state.selectedIndex).toBe(1);
    });

    it("should wrap selection at the end", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      const lastIndex = result.current.state.results.length - 1;

      act(() => {
        result.current.setSelectedIndex(lastIndex);
      });

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.state.selectedIndex).toBe(0);
    });

    it("should wrap selection at the beginning", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.setSelectedIndex(0);
      });

      act(() => {
        result.current.selectPrevious();
      });

      const lastIndex = result.current.state.results.length - 1;
      expect(result.current.state.selectedIndex).toBe(lastIndex);
    });
  });

  describe("Execute", () => {
    it("should execute selected command and close palette", async () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.open();
        result.current.setSelectedIndex(0);
      });

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.state.isOpen).toBe(false);
    });

    it("should execute command by ID", async () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.open();
      });

      await act(async () => {
        await result.current.execute("test.open-settings");
      });

      expect(result.current.state.isOpen).toBe(false);
    });

    it("should handle invalid command ID gracefully", async () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      act(() => {
        result.current.open();
      });

      await act(async () => {
        await result.current.execute("invalid-id");
      });

      expect(result.current.state.isOpen).toBe(true);
    });
  });

  describe("Results", () => {
    it("should update results when query changes", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      const allResults = result.current.state.results.length;

      act(() => {
        result.current.search("session");
      });

      expect(result.current.state.results.length).toBeLessThanOrEqual(
        allResults,
      );
    });

    it("should return all enabled commands by default", () => {
      const { result } = renderHook(() => useCommandPaletteContext(), {
        wrapper,
      });

      expect(result.current.state.results.length).toBe(3);
    });
  });
});
