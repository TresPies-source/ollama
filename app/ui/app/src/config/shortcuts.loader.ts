/**
 * Shortcuts configuration loader
 */

import shortcutsConfig from "./shortcuts.json";
import type {
  ShortcutsConfig,
  ShortcutDefinition,
  ShortcutKeys,
} from "./shortcuts.types";

/**
 * Load default shortcuts configuration
 */
export function loadDefaultShortcuts(): ShortcutsConfig {
  return shortcutsConfig as ShortcutsConfig;
}

/**
 * Get all shortcut definitions
 */
export function getAllShortcuts(): ShortcutDefinition[] {
  const config = loadDefaultShortcuts();
  return config.shortcuts;
}

/**
 * Get a shortcut by ID
 */
export function getShortcutById(id: string): ShortcutDefinition | undefined {
  const shortcuts = getAllShortcuts();
  return shortcuts.find((shortcut) => shortcut.id === id);
}

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: string): ShortcutDefinition[] {
  const shortcuts = getAllShortcuts();
  return shortcuts.filter((shortcut) => shortcut.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const shortcuts = getAllShortcuts();
  const categories = new Set(shortcuts.map((s) => s.category));
  return Array.from(categories).sort();
}

/**
 * Validate shortcuts configuration
 * Returns array of validation errors (empty if valid)
 */
export function validateShortcuts(): string[] {
  const errors: string[] = [];
  const config = loadDefaultShortcuts();
  
  if (!config.version) {
    errors.push("Missing version field");
  }
  
  if (!Array.isArray(config.shortcuts)) {
    errors.push("Shortcuts must be an array");
    return errors;
  }
  
  const ids = new Set<string>();
  const platformKeys = new Map<string, Set<string>>();
  
  config.shortcuts.forEach((shortcut, index) => {
    const prefix = `Shortcut ${index + 1} (${shortcut.id || "unnamed"})`;
    
    // Check required fields
    if (!shortcut.id) {
      errors.push(`${prefix}: Missing id`);
    } else {
      // Check for duplicate IDs
      if (ids.has(shortcut.id)) {
        errors.push(`${prefix}: Duplicate id "${shortcut.id}"`);
      }
      ids.add(shortcut.id);
    }
    
    if (!shortcut.name) {
      errors.push(`${prefix}: Missing name`);
    }
    
    if (!shortcut.description) {
      errors.push(`${prefix}: Missing description`);
    }
    
    if (!shortcut.category) {
      errors.push(`${prefix}: Missing category`);
    }
    
    // Check keys
    if (!shortcut.keys) {
      errors.push(`${prefix}: Missing keys`);
    } else {
      const platforms: Array<keyof ShortcutKeys> = ["mac", "windows", "linux"];
      platforms.forEach((platform) => {
        if (!shortcut.keys[platform]) {
          errors.push(`${prefix}: Missing ${platform} key`);
        } else {
          // Check for duplicate keys per platform
          if (!platformKeys.has(platform)) {
            platformKeys.set(platform, new Set());
          }
          const keys = platformKeys.get(platform)!;
          const key = shortcut.keys[platform];
          
          if (keys.has(key)) {
            errors.push(
              `${prefix}: Duplicate ${platform} key "${key}" (conflicts with another shortcut)`,
            );
          }
          keys.add(key);
        }
      });
    }
  });
  
  return errors;
}

/**
 * Check if shortcuts configuration is valid
 */
export function isShortcutsValid(): boolean {
  const errors = validateShortcuts();
  return errors.length === 0;
}

/**
 * Log validation errors to console
 */
export function logValidationErrors(): void {
  const errors = validateShortcuts();
  if (errors.length > 0) {
    console.error("Shortcuts configuration validation errors:");
    errors.forEach((error) => console.error(`  - ${error}`));
  } else {
    console.log(
      `✓ Shortcuts configuration valid (${getAllShortcuts().length} shortcuts loaded)`,
    );
  }
}

// Validate on load in development
if (import.meta.env.DEV) {
  logValidationErrors();
}
