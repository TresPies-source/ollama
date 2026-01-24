/**
 * Command system types for the Command Palette
 */

export type CommandCategory =
  | "Navigation"
  | "Session"
  | "Settings"
  | "File"
  | "Edit"
  | "View";

export interface Command {
  /** Unique identifier for the command */
  id: string;

  /** Display title for the command */
  title: string;

  /** Optional description for the command */
  description?: string;

  /** Category for grouping commands */
  category: CommandCategory;

  /** Keyboard shortcut (platform-specific) */
  shortcut?: {
    mac?: string;
    windows?: string;
    linux?: string;
  };

  /** Action to execute when the command is invoked */
  action: () => void | Promise<void>;

  /** Optional icon name (can be used with icon libraries) */
  icon?: string;

  /** Keywords for improved search matching */
  keywords?: string[];

  /** Whether the command is currently enabled */
  enabled?: boolean;
}

/**
 * Platform detection helpers
 */
export const getPlatform = (): "mac" | "windows" | "linux" => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("mac")) return "mac";
  if (userAgent.includes("win")) return "windows";
  return "linux";
};

/**
 * Get the platform-specific shortcut for a command
 */
export const getShortcut = (command: Command): string | undefined => {
  if (!command.shortcut) return undefined;
  const platform = getPlatform();
  return command.shortcut[platform];
};

/**
 * Format shortcut for display (e.g., "⌘N" or "Ctrl+N")
 */
export const formatShortcut = (shortcut: string): string => {
  const platform = getPlatform();
  if (platform === "mac") {
    return shortcut
      .replace("Cmd", "⌘")
      .replace("Ctrl", "⌃")
      .replace("Alt", "⌥")
      .replace("Shift", "⇧");
  }
  return shortcut;
};
