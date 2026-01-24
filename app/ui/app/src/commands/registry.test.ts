import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  commandRegistry,
  registerDefaultCommands,
  getAllCommands,
  executeCommand,
  setCommandAction,
} from "./registry";
import type { Command } from "./types";

describe("CommandRegistry", () => {
  beforeEach(() => {
    commandRegistry.clear();
  });

  describe("register and get", () => {
    it("should register a command", () => {
      const command: Command = {
        id: "test.command",
        title: "Test Command",
        category: "Session",
        action: () => {},
      };

      commandRegistry.register(command);
      const retrieved = commandRegistry.get("test.command");

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("test.command");
      expect(retrieved?.title).toBe("Test Command");
    });

    it("should return undefined for non-existent command", () => {
      const retrieved = commandRegistry.get("non.existent");
      expect(retrieved).toBeUndefined();
    });

    it("should overwrite existing command with same id", () => {
      const command1: Command = {
        id: "test.command",
        title: "First Title",
        category: "Session",
        action: () => {},
      };

      const command2: Command = {
        id: "test.command",
        title: "Second Title",
        category: "Session",
        action: () => {},
      };

      commandRegistry.register(command1);
      commandRegistry.register(command2);

      const retrieved = commandRegistry.get("test.command");
      expect(retrieved?.title).toBe("Second Title");
    });
  });

  describe("unregister", () => {
    it("should remove a command", () => {
      const command: Command = {
        id: "test.command",
        title: "Test Command",
        category: "Session",
        action: () => {},
      };

      commandRegistry.register(command);
      expect(commandRegistry.get("test.command")).toBeDefined();

      commandRegistry.unregister("test.command");
      expect(commandRegistry.get("test.command")).toBeUndefined();
    });

    it("should not throw when unregistering non-existent command", () => {
      expect(() => {
        commandRegistry.unregister("non.existent");
      }).not.toThrow();
    });
  });

  describe("getAll", () => {
    it("should return all registered commands", () => {
      const command1: Command = {
        id: "test.command1",
        title: "Test Command 1",
        category: "Session",
        action: () => {},
      };

      const command2: Command = {
        id: "test.command2",
        title: "Test Command 2",
        category: "Navigation",
        action: () => {},
      };

      commandRegistry.register(command1);
      commandRegistry.register(command2);

      const all = commandRegistry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((c) => c.id)).toContain("test.command1");
      expect(all.map((c) => c.id)).toContain("test.command2");
    });

    it("should return empty array when no commands registered", () => {
      const all = commandRegistry.getAll();
      expect(all).toHaveLength(0);
    });
  });

  describe("getEnabled", () => {
    it("should return only enabled commands", () => {
      const enabledCommand: Command = {
        id: "enabled.command",
        title: "Enabled Command",
        category: "Session",
        action: () => {},
        enabled: true,
      };

      const disabledCommand: Command = {
        id: "disabled.command",
        title: "Disabled Command",
        category: "Session",
        action: () => {},
        enabled: false,
      };

      const defaultEnabledCommand: Command = {
        id: "default.command",
        title: "Default Command",
        category: "Session",
        action: () => {},
      };

      commandRegistry.register(enabledCommand);
      commandRegistry.register(disabledCommand);
      commandRegistry.register(defaultEnabledCommand);

      const enabled = commandRegistry.getEnabled();
      expect(enabled).toHaveLength(2);
      expect(enabled.map((c) => c.id)).toContain("enabled.command");
      expect(enabled.map((c) => c.id)).toContain("default.command");
      expect(enabled.map((c) => c.id)).not.toContain("disabled.command");
    });
  });

  describe("getByCategory", () => {
    it("should return commands filtered by category", () => {
      const sessionCommand: Command = {
        id: "session.command",
        title: "Session Command",
        category: "Session",
        action: () => {},
      };

      const navCommand: Command = {
        id: "nav.command",
        title: "Navigation Command",
        category: "Navigation",
        action: () => {},
      };

      commandRegistry.register(sessionCommand);
      commandRegistry.register(navCommand);

      const sessionCommands = commandRegistry.getByCategory("Session");
      expect(sessionCommands).toHaveLength(1);
      expect(sessionCommands[0].id).toBe("session.command");

      const navCommands = commandRegistry.getByCategory("Navigation");
      expect(navCommands).toHaveLength(1);
      expect(navCommands[0].id).toBe("nav.command");
    });

    it("should return empty array for category with no commands", () => {
      const commands = commandRegistry.getByCategory("NonExistent");
      expect(commands).toHaveLength(0);
    });
  });

  describe("execute", () => {
    it("should execute command action", async () => {
      const mockAction = vi.fn();
      const command: Command = {
        id: "test.command",
        title: "Test Command",
        category: "Session",
        action: mockAction,
      };

      commandRegistry.register(command);
      await commandRegistry.execute("test.command");

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should handle async actions", async () => {
      let executed = false;
      const asyncAction = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executed = true;
      };

      const command: Command = {
        id: "test.async",
        title: "Async Command",
        category: "Session",
        action: asyncAction,
      };

      commandRegistry.register(command);
      await commandRegistry.execute("test.async");

      expect(executed).toBe(true);
    });

    it("should not execute disabled commands", async () => {
      const mockAction = vi.fn();
      const command: Command = {
        id: "test.disabled",
        title: "Disabled Command",
        category: "Session",
        action: mockAction,
        enabled: false,
      };

      commandRegistry.register(command);
      await commandRegistry.execute("test.disabled");

      expect(mockAction).not.toHaveBeenCalled();
    });

    it("should handle errors in command execution", async () => {
      const errorAction = () => {
        throw new Error("Command failed");
      };

      const command: Command = {
        id: "test.error",
        title: "Error Command",
        category: "Session",
        action: errorAction,
      };

      commandRegistry.register(command);

      await expect(commandRegistry.execute("test.error")).rejects.toThrow(
        "Command failed",
      );
    });

    it("should warn when executing non-existent command", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await commandRegistry.execute("non.existent");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Command not found: non.existent",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("setCallback", () => {
    it("should update command action", async () => {
      const originalAction = vi.fn();
      const newAction = vi.fn();

      const command: Command = {
        id: "test.command",
        title: "Test Command",
        category: "Session",
        action: originalAction,
      };

      commandRegistry.register(command);
      commandRegistry.setCallback("test.command", newAction);

      await commandRegistry.execute("test.command");

      expect(originalAction).not.toHaveBeenCalled();
      expect(newAction).toHaveBeenCalledTimes(1);
    });

    it("should not error when setting callback for non-existent command", () => {
      expect(() => {
        commandRegistry.setCallback("non.existent", () => {});
      }).not.toThrow();
    });
  });

  describe("clear", () => {
    it("should remove all commands", () => {
      const command1: Command = {
        id: "test.command1",
        title: "Test Command 1",
        category: "Session",
        action: () => {},
      };

      const command2: Command = {
        id: "test.command2",
        title: "Test Command 2",
        category: "Session",
        action: () => {},
      };

      commandRegistry.register(command1);
      commandRegistry.register(command2);

      expect(commandRegistry.getAll()).toHaveLength(2);

      commandRegistry.clear();

      expect(commandRegistry.getAll()).toHaveLength(0);
    });
  });

  describe("registerDefaultCommands", () => {
    it("should register all default commands", () => {
      registerDefaultCommands();

      const all = commandRegistry.getAll();
      expect(all.length).toBeGreaterThan(0);

      const expectedCommands = [
        "session.new",
        "session.close",
        "session.export",
        "session.import",
        "nav.sessions",
        "nav.files",
        "nav.seeds",
        "settings.open",
        "view.command-palette",
        "view.toggle-sidebar",
      ];

      expectedCommands.forEach((id) => {
        expect(commandRegistry.get(id)).toBeDefined();
      });
    });

    it("should include keyboard shortcuts for appropriate commands", () => {
      registerDefaultCommands();

      const newSessionCmd = commandRegistry.get("session.new");
      expect(newSessionCmd?.shortcut).toBeDefined();
      expect(newSessionCmd?.shortcut?.mac).toBe("Cmd+N");
      expect(newSessionCmd?.shortcut?.windows).toBe("Ctrl+N");

      const settingsCmd = commandRegistry.get("settings.open");
      expect(settingsCmd?.shortcut).toBeDefined();
      expect(settingsCmd?.shortcut?.mac).toBe("Cmd+,");
    });

    it("should include keywords for search", () => {
      registerDefaultCommands();

      const newSessionCmd = commandRegistry.get("session.new");
      expect(newSessionCmd?.keywords).toBeDefined();
      expect(newSessionCmd?.keywords).toContain("new");
      expect(newSessionCmd?.keywords).toContain("session");
    });
  });

  describe("helper functions", () => {
    beforeEach(() => {
      commandRegistry.clear();
      registerDefaultCommands();
    });

    it("getAllCommands should return all enabled commands", () => {
      const commands = getAllCommands();
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.every((cmd) => cmd.enabled !== false)).toBe(true);
    });

    it("executeCommand should execute by id", async () => {
      const mockAction = vi.fn();
      setCommandAction("session.new", mockAction);

      await executeCommand("session.new");
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("setCommandAction should update action", async () => {
      const newAction = vi.fn();
      setCommandAction("session.new", newAction);

      await executeCommand("session.new");
      expect(newAction).toHaveBeenCalledTimes(1);
    });
  });
});
