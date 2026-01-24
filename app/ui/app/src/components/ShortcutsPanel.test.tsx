import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShortcutsPanel } from "./ShortcutsPanel";
import * as ShortcutsContext from "@/contexts/ShortcutsContext";
import type { ShortcutsContextType, ShortcutDefinition } from "@/contexts/ShortcutsContext";

const mockShortcutDefinitions: ShortcutDefinition[] = [
  {
    id: "new-session",
    name: "New Session",
    description: "Create a new chat session",
    category: "Session",
    keys: { mac: "Cmd+N", windows: "Ctrl+N", linux: "Ctrl+N" },
  },
  {
    id: "open-settings",
    name: "Open Settings",
    description: "Open application settings",
    category: "Settings",
    keys: { mac: "Cmd+,", windows: "Ctrl+,", linux: "Ctrl+," },
  },
  {
    id: "command-palette",
    name: "Command Palette",
    description: "Open the command palette",
    category: "View",
    keys: { mac: "Cmd+K", windows: "Ctrl+K", linux: "Ctrl+K" },
  },
  {
    id: "close-session",
    name: "Close Session",
    description: "Close the current session",
    category: "Session",
    keys: { mac: "Cmd+W", windows: "Ctrl+W", linux: "Ctrl+W" },
  },
];

const mockShortcuts = {
  "new-session": "Cmd+N",
  "open-settings": "Cmd+,",
  "command-palette": "Cmd+K",
  "close-session": "Cmd+W",
};

const createMockContext = (
  overrides?: Partial<ShortcutsContextType>,
): ShortcutsContextType => ({
  shortcuts: mockShortcuts,
  shortcutDefinitions: mockShortcutDefinitions,
  platform: "mac",
  isLoading: false,
  error: null,
  getShortcut: vi.fn((id: string) => mockShortcuts[id]),
  updateShortcut: vi.fn().mockResolvedValue(undefined),
  resetShortcuts: vi.fn().mockResolvedValue(undefined),
  hasConflict: vi.fn().mockReturnValue(false),
  ...overrides,
});

describe("ShortcutsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    const mockContext = createMockContext({ isLoading: true });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );

    render(<ShortcutsPanel />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
  });

  it("renders shortcuts grouped by category", () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );

    render(<ShortcutsPanel />);

    expect(screen.getByText("Session")).toBeTruthy();
    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.getByText("View")).toBeTruthy();

    expect(screen.getByText("New Session")).toBeTruthy();
    expect(screen.getByText("Open Settings")).toBeTruthy();
    expect(screen.getByText("Command Palette")).toBeTruthy();
    expect(screen.getByText("Close Session")).toBeTruthy();
  });

  it("displays current shortcuts correctly", () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );

    render(<ShortcutsPanel />);

    const sessionSection = screen.getByText("Session").closest("div");
    expect(sessionSection).toBeTruthy();

    const cmdNElements = screen.getAllByText("Cmd+N");
    expect(cmdNElements.length).toBeGreaterThan(0);
  });

  it("displays shortcut descriptions", () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );

    render(<ShortcutsPanel />);

    expect(screen.getByText("Create a new chat session")).toBeTruthy();
    expect(screen.getByText("Open application settings")).toBeTruthy();
    expect(screen.getByText("Open the command palette")).toBeTruthy();
  });

  it.skip("starts recording when customize button clicked", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    expect(
      screen.queryByText("Press the key combination you want to use"),
    ).toBeTruthy();
  });

  it.skip("cancels recording when cancel button clicked", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeNull();
    });
  });

  it.skip("cancels recording when backdrop clicked", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    const backdrop = modal?.parentElement;
    if (backdrop) {
      await user.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeNull();
    });
  });

  it.skip("records key combination correctly", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    if (!modal) throw new Error("Modal not found");

    fireEvent.keyDown(modal, { key: "P", code: "KeyP", metaKey: true });

    await waitFor(() => {
      expect(screen.queryByText("Cmd+P")).toBeTruthy();
    });
  });

  it.skip("saves shortcut when save button clicked", async () => {
    const mockUpdateShortcut = vi.fn().mockResolvedValue(undefined);
    const mockContext = createMockContext({
      updateShortcut: mockUpdateShortcut,
    });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    if (!modal) throw new Error("Modal not found");

    fireEvent.keyDown(modal, { key: "P", code: "KeyP", metaKey: true });

    await waitFor(() => {
      expect(screen.queryByText("Cmd+P")).toBeTruthy();
    });

    const saveButton = screen.getByText("Save");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateShortcut).toHaveBeenCalledWith("new-session", "Cmd+P");
    });
  });

  it.skip("disables save button when no keys recorded", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeDisabled();
  });

  it.skip("shows error when shortcut conflicts", async () => {
    const mockContext = createMockContext({
      hasConflict: vi.fn().mockReturnValue(true),
    });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    if (!modal) throw new Error("Modal not found");

    fireEvent.keyDown(modal, { key: "K", code: "KeyK", metaKey: true });

    await waitFor(() => {
      expect(screen.queryByText("Cmd+K")).toBeTruthy();
    });

    const saveButton = screen.getByText("Save");
    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Shortcut "Cmd+K" is already in use'),
      ).toBeTruthy();
    });
  });

  it.skip("shows error when save fails", async () => {
    const mockUpdateShortcut = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));
    const mockContext = createMockContext({
      updateShortcut: mockUpdateShortcut,
    });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    if (!modal) throw new Error("Modal not found");

    fireEvent.keyDown(modal, { key: "P", code: "KeyP", metaKey: true });

    await waitFor(() => {
      expect(screen.queryByText("Cmd+P")).toBeTruthy();
    });

    const saveButton = screen.getByText("Save");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByText("Network error")).toBeTruthy();
    });
  });

  it("resets all shortcuts when reset button clicked", async () => {
    const mockResetShortcuts = vi.fn().mockResolvedValue(undefined);
    const mockContext = createMockContext({
      resetShortcuts: mockResetShortcuts,
    });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    global.confirm = vi.fn().mockReturnValue(true);

    render(<ShortcutsPanel />);

    const resetButton = screen.getByText("Reset All to Defaults");
    await user.click(resetButton);

    await waitFor(() => {
      expect(mockResetShortcuts).toHaveBeenCalled();
    });
  });

  it("does not reset shortcuts when confirmation cancelled", async () => {
    const mockResetShortcuts = vi.fn().mockResolvedValue(undefined);
    const mockContext = createMockContext({
      resetShortcuts: mockResetShortcuts,
    });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    global.confirm = vi.fn().mockReturnValue(false);

    render(<ShortcutsPanel />);

    const resetButton = screen.getByText("Reset All to Defaults");
    await user.click(resetButton);

    expect(mockResetShortcuts).not.toHaveBeenCalled();
  });

  it("shows error when reset fails", async () => {
    const mockResetShortcuts = vi
      .fn()
      .mockRejectedValue(new Error("Reset failed"));
    const mockContext = createMockContext({
      resetShortcuts: mockResetShortcuts,
    });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    global.confirm = vi.fn().mockReturnValue(true);

    render(<ShortcutsPanel />);

    const resetButton = screen.getByText("Reset All to Defaults");
    await user.click(resetButton);

    await waitFor(() => {
      expect(screen.queryByText("Reset failed")).toBeTruthy();
    });
  });

  it("displays platform-specific shortcuts", () => {
    const mockContext = createMockContext({ platform: "windows" });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue({
      ...mockContext,
      shortcuts: {
        "new-session": "Ctrl+N",
        "open-settings": "Ctrl+,",
        "command-palette": "Ctrl+K",
        "close-session": "Ctrl+W",
      },
    });

    render(<ShortcutsPanel />);

    const ctrlNElements = screen.getAllByText("Ctrl+N");
    expect(ctrlNElements.length).toBeGreaterThan(0);
  });

  it("groups shortcuts correctly by category", () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );

    render(<ShortcutsPanel />);

    const sessionSection = screen.getByText("Session").parentElement;
    if (!sessionSection) throw new Error("Session section not found");

    const sessionDiv = within(sessionSection);
    expect(sessionDiv.getByText("New Session")).toBeTruthy();
    expect(sessionDiv.getByText("Close Session")).toBeTruthy();
  });

  it.skip("shows recording state visually", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    expect(screen.queryByText("Press keys...") || screen.queryByText("Waiting...")).toBeTruthy();

    const modal = screen.getByText("Recording Shortcut").closest("div");
    expect(modal).toBeTruthy();
  });

  it.skip("handles modifier keys correctly", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    if (!modal) throw new Error("Modal not found");

    fireEvent.keyDown(modal, { key: "P", code: "KeyP", metaKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.queryByText("Cmd+Shift+P")).toBeTruthy();
    });
  });

  it.skip("normalizes key display correctly", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    if (!modal) throw new Error("Modal not found");

    fireEvent.keyDown(modal, { key: "a", code: "KeyA", metaKey: true });

    await waitFor(() => {
      expect(screen.queryByText("Cmd+A")).toBeTruthy();
    });
  });

  it.skip("handles space key correctly", async () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    if (!modal) throw new Error("Modal not found");

    fireEvent.keyDown(modal, { key: " ", code: "Space", metaKey: true });

    await waitFor(() => {
      expect(screen.queryByText("Cmd+Space")).toBeTruthy();
    });
  });

  it.skip("disables buttons while saving", async () => {
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    const mockUpdateShortcut = vi.fn().mockReturnValue(savePromise);
    const mockContext = createMockContext({
      updateShortcut: mockUpdateShortcut,
    });
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );
    const user = userEvent.setup();

    render(<ShortcutsPanel />);

    const customizeButtons = screen.getAllByText("Customize");
    await user.click(customizeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Recording Shortcut")).toBeTruthy();
    });

    const modal = screen.getByText("Recording Shortcut").closest("div");
    if (!modal) throw new Error("Modal not found");

    fireEvent.keyDown(modal, { key: "P", code: "KeyP", metaKey: true });

    await waitFor(() => {
      expect(screen.queryByText("Cmd+P")).toBeTruthy();
    });

    const saveButton = screen.getByText("Save");
    await user.click(saveButton);

    expect(screen.getByText("Saving...")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeDisabled();

    resolveSave!();

    await waitFor(() => {
      expect(screen.queryByText("Saving...")).toBeNull();
    });
  });

  it("displays all table headers", () => {
    const mockContext = createMockContext();
    vi.spyOn(ShortcutsContext, "useShortcutsContext").mockReturnValue(
      mockContext,
    );

    render(<ShortcutsPanel />);

    expect(screen.getAllByText("Action")[0]).toBeTruthy();
    expect(screen.getAllByText("Shortcut")[0]).toBeTruthy();
    expect(screen.getAllByText("Customize")[0]).toBeTruthy();
  });
});
