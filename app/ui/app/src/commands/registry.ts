/**
 * Command Registry
 * 
 * Central registry for all application commands.
 * Commands can be executed via the Command Palette or keyboard shortcuts.
 */

import type { Command } from "./types";

/**
 * Command registry - stores all available commands
 * This will be populated with actual navigation and action callbacks
 * when integrated with the application context.
 */
class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private callbacks: Map<string, () => void | Promise<void>> = new Map();

  /**
   * Register a command
   */
  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  /**
   * Unregister a command
   */
  unregister(id: string): void {
    this.commands.delete(id);
    this.callbacks.delete(id);
  }

  /**
   * Get a command by ID
   */
  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  /**
   * Get all commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get all enabled commands
   */
  getEnabled(): Command[] {
    return this.getAll().filter((cmd) => cmd.enabled !== false);
  }

  /**
   * Get commands by category
   */
  getByCategory(category: string): Command[] {
    return this.getAll().filter((cmd) => cmd.category === category);
  }

  /**
   * Execute a command by ID
   */
  async execute(id: string): Promise<void> {
    const command = this.commands.get(id);
    if (!command) {
      console.warn(`Command not found: ${id}`);
      return;
    }

    if (command.enabled === false) {
      console.warn(`Command disabled: ${id}`);
      return;
    }

    try {
      await command.action();
    } catch (error) {
      console.error(`Error executing command ${id}:`, error);
      throw error;
    }
  }

  /**
   * Set callback for a command
   * This allows updating command actions after initial registration
   */
  setCallback(id: string, callback: () => void | Promise<void>): void {
    const command = this.commands.get(id);
    if (command) {
      command.action = callback;
      this.callbacks.set(id, callback);
    }
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
    this.callbacks.clear();
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistry();

/**
 * Register default application commands
 * These will be wired up with actual implementations when integrated
 */
export function registerDefaultCommands(): void {
  const defaultCommands: Command[] = [
    // Session commands
    {
      id: "session.new",
      title: "New Session",
      description: "Create a new chat session",
      category: "Session",
      shortcut: {
        mac: "Cmd+N",
        windows: "Ctrl+N",
        linux: "Ctrl+N",
      },
      keywords: ["new", "session", "chat", "create"],
      action: () => {
        console.log("New session command - to be wired");
      },
    },
    {
      id: "session.close",
      title: "Close Session",
      description: "Close the current session",
      category: "Session",
      shortcut: {
        mac: "Cmd+W",
        windows: "Ctrl+W",
        linux: "Ctrl+W",
      },
      keywords: ["close", "session", "exit"],
      action: () => {
        console.log("Close session command - to be wired");
      },
    },
    {
      id: "session.export",
      title: "Export Session",
      description: "Export current session to Markdown",
      category: "Session",
      keywords: ["export", "download", "save", "markdown"],
      action: () => {
        console.log("Export session command - to be wired");
      },
    },
    {
      id: "session.import",
      title: "Import Session",
      description: "Import a session from Markdown file",
      category: "Session",
      keywords: ["import", "upload", "load", "markdown"],
      action: () => {
        console.log("Import session command - to be wired");
      },
    },

    // Navigation commands
    {
      id: "nav.sessions",
      title: "Go to Sessions",
      description: "Navigate to sessions page",
      category: "Navigation",
      keywords: ["sessions", "goto", "navigate"],
      action: () => {
        console.log("Navigate to sessions - to be wired");
      },
    },
    {
      id: "nav.files",
      title: "Go to Files",
      description: "Navigate to files explorer",
      category: "Navigation",
      keywords: ["files", "explorer", "goto", "navigate"],
      action: () => {
        console.log("Navigate to files - to be wired");
      },
    },
    {
      id: "nav.seeds",
      title: "Go to Seeds",
      description: "Navigate to seeds library",
      category: "Navigation",
      keywords: ["seeds", "library", "goto", "navigate"],
      action: () => {
        console.log("Navigate to seeds - to be wired");
      },
    },

    // Settings commands
    {
      id: "settings.open",
      title: "Open Settings",
      description: "Open application settings",
      category: "Settings",
      shortcut: {
        mac: "Cmd+,",
        windows: "Ctrl+,",
        linux: "Ctrl+,",
      },
      keywords: ["settings", "preferences", "config"],
      action: () => {
        console.log("Open settings command - to be wired");
      },
    },

    // View commands
    {
      id: "view.command-palette",
      title: "Command Palette",
      description: "Open command palette",
      category: "View",
      shortcut: {
        mac: "Cmd+K",
        windows: "Ctrl+K",
        linux: "Ctrl+K",
      },
      keywords: ["command", "palette", "search"],
      action: () => {
        console.log("Command palette - to be wired");
      },
    },
    {
      id: "view.toggle-sidebar",
      title: "Toggle Sidebar",
      description: "Show or hide the sidebar",
      category: "View",
      shortcut: {
        mac: "Cmd+B",
        windows: "Ctrl+B",
        linux: "Ctrl+B",
      },
      keywords: ["sidebar", "toggle", "hide", "show"],
      action: () => {
        console.log("Toggle sidebar - to be wired");
      },
    },
  ];

  defaultCommands.forEach((command) => {
    commandRegistry.register(command);
  });
}

// Auto-register default commands
registerDefaultCommands();

/**
 * Helper to get all commands for search/display
 */
export function getAllCommands(): Command[] {
  return commandRegistry.getEnabled();
}

/**
 * Helper to execute a command by ID
 */
export function executeCommand(id: string): Promise<void> {
  return commandRegistry.execute(id);
}

/**
 * Helper to update a command's action
 */
export function setCommandAction(
  id: string,
  action: () => void | Promise<void>,
): void {
  commandRegistry.setCallback(id, action);
}
