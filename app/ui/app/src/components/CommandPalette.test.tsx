import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";
import { commandRegistry } from "@/commands/registry";
import type { Command } from "@/commands/types";

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <CommandPaletteProvider>{component}</CommandPaletteProvider>
  );
};

describe("CommandPalette", () => {
  beforeEach(() => {
    commandRegistry.clear();

    const testCommands: Command[] = [
      {
        id: "test.new-session",
        title: "New Session",
        description: "Create a new chat session",
        category: "Session",
        shortcut: {
          mac: "Cmd+N",
          windows: "Ctrl+N",
          linux: "Ctrl+N",
        },
        keywords: ["new", "session", "create"],
        action: vi.fn(),
      },
      {
        id: "test.open-settings",
        title: "Open Settings",
        description: "Open application settings",
        category: "Settings",
        shortcut: {
          mac: "Cmd+,",
          windows: "Ctrl+,",
          linux: "Ctrl+,",
        },
        keywords: ["settings", "preferences"],
        action: vi.fn(),
      },
      {
        id: "test.export",
        title: "Export Session",
        description: "Export current session to markdown",
        category: "Session",
        keywords: ["export", "save", "download"],
        action: vi.fn(),
      },
      {
        id: "test.navigate",
        title: "Go to Files",
        description: "Navigate to files explorer",
        category: "Navigation",
        keywords: ["files", "goto"],
        action: vi.fn(),
      },
    ];

    testCommands.forEach((cmd) => commandRegistry.register(cmd));
  });

  describe("Rendering", () => {
    it("should not render when closed", () => {
      renderWithProvider(<CommandPalette />);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("should render search input when opened", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeTruthy();
    });

    it("should render all commands by default", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByText("New Session")).toBeTruthy();
        expect(screen.getByText("Open Settings")).toBeTruthy();
        expect(screen.getByText("Export Session")).toBeTruthy();
        expect(screen.getByText("Go to Files")).toBeTruthy();
      });
    });

    it("should group commands by category", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByText("Session")).toBeTruthy();
        expect(screen.getByText("Settings")).toBeTruthy();
        expect(screen.getByText("Navigation")).toBeTruthy();
      });
    });

    it("should display shortcuts for commands", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByText(/⌘N|Ctrl\+N/)).toBeTruthy();
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("should open with Cmd+K on Mac", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });
    });

    it("should open with Ctrl+K on Windows", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });
    });

    it("should close with Escape", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      fireEvent.keyDown(input, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    });

    it("should close when clicking backdrop", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    });

    it("should navigate down with ArrowDown", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      
      fireEvent.keyDown(input, { key: "ArrowDown" });

      const options = screen.getAllByRole("option");
      expect(options[1].className).toContain("bg-[var(--glass-bg-light)]");
    });

    it("should navigate up with ArrowUp", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowUp" });

      const options = screen.getAllByRole("option");
      expect(options[1].className).toContain("bg-[var(--glass-bg-light)]");
    });

    it("should execute command with Enter", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    });
  });

  describe("Search", () => {
    it("should filter commands by query", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      fireEvent.change(input, { target: { value: "settings" } });

      await waitFor(() => {
        expect(screen.getByText("Open Settings")).toBeTruthy();
        expect(screen.queryByText("New Session")).toBeNull();
      });
    });

    it("should show empty state when no results", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      fireEvent.change(input, { target: { value: "nonexistent" } });

      await waitFor(() => {
        expect(screen.getByText("No commands found")).toBeTruthy();
      });
    });

    it("should search by keywords", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      fireEvent.change(input, { target: { value: "export" } });

      await waitFor(() => {
        expect(screen.getByText("Export Session")).toBeTruthy();
      });
    });

    it("should perform fuzzy search", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      fireEvent.change(input, { target: { value: "sesn" } });

      await waitFor(() => {
        expect(screen.getByText("New Session")).toBeTruthy();
      });
    });
  });

  describe("Command Execution", () => {
    it("should execute command when clicked", async () => {
      const mockAction = vi.fn();
      commandRegistry.clear();
      commandRegistry.register({
        id: "test.click",
        title: "Test Click",
        category: "Session",
        action: mockAction,
      });

      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByText("Test Click")).toBeTruthy();
      });

      const commandButton = screen.getByText("Test Click");
      fireEvent.click(commandButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    });

    it("should close palette after execution", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog.getAttribute("aria-modal")).toBe("true");
      });

      const input = screen.getByPlaceholderText(/Type a command or search/i);
      expect(input.getAttribute("aria-label")).toBeTruthy();
      expect(input.getAttribute("aria-autocomplete")).toBe("list");
      expect(input.getAttribute("aria-controls")).toBeTruthy();
    });

    it("should have listbox role for results", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeTruthy();
      });
    });

    it("should have option role for commands", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      });
    });

    it("should indicate selected option with aria-selected", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options[0].getAttribute("aria-selected")).toBe("true");
      });
    });
  });

  describe("Styling", () => {
    it("should apply glassmorphism styles", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        const container = screen.getByRole("dialog").querySelector(".glass-strong");
        expect(container).toBeTruthy();
      });
    });

    it("should highlight selected item", async () => {
      renderWithProvider(<CommandPalette />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options[0].className).toContain("bg-[var(--glass-bg-light)]");
      });
    });
  });
});
