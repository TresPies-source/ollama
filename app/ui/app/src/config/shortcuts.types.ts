/**
 * Type definitions for shortcuts configuration
 */

export interface ShortcutKeys {
  mac: string;
  windows: string;
  linux: string;
}

export interface ShortcutDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  keys: ShortcutKeys;
}

export interface ShortcutsConfig {
  $schema?: string;
  version: string;
  shortcuts: ShortcutDefinition[];
}

/**
 * Platform type for keyboard shortcuts
 */
export type Platform = "mac" | "windows" | "linux";

/**
 * Get the current platform
 */
export const getCurrentPlatform = (): Platform => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("mac")) return "mac";
  if (userAgent.includes("win")) return "windows";
  return "linux";
};

/**
 * Get the shortcut key for the current platform
 */
export const getShortcutForPlatform = (
  keys: ShortcutKeys,
  platform?: Platform,
): string => {
  const currentPlatform = platform || getCurrentPlatform();
  return keys[currentPlatform];
};

/**
 * Format shortcut for display
 * Converts modifiers to symbols on Mac
 */
export const formatShortcutForDisplay = (shortcut: string): string => {
  const platform = getCurrentPlatform();
  
  if (platform === "mac") {
    return shortcut
      .replace(/Cmd/g, "⌘")
      .replace(/Ctrl/g, "⌃")
      .replace(/Alt/g, "⌥")
      .replace(/Option/g, "⌥")
      .replace(/Shift/g, "⇧")
      .replace(/Enter/g, "↵")
      .replace(/Backspace/g, "⌫");
  }
  
  return shortcut;
};

/**
 * Parse shortcut string to react-hotkeys-hook format
 * Converts "Cmd+N" to "meta+n" (for mac) or "ctrl+n" (for others)
 */
export const parseShortcutToHotkey = (shortcut: string): string => {
  const platform = getCurrentPlatform();
  
  let hotkey = shortcut.toLowerCase();
  
  // Replace platform-specific modifiers
  if (platform === "mac") {
    hotkey = hotkey.replace(/cmd/g, "meta");
  } else {
    // On Windows/Linux, Cmd should map to Ctrl
    hotkey = hotkey.replace(/cmd/g, "ctrl");
  }
  
  // Normalize other modifiers
  hotkey = hotkey
    .replace(/option/g, "alt")
    .replace(/\+/g, "+");
  
  return hotkey;
};
