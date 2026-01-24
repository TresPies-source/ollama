import { describe, it, expect } from "vitest";
import {
  loadDefaultShortcuts,
  getAllShortcuts,
  getShortcutById,
  getShortcutsByCategory,
  getAllCategories,
  validateShortcuts,
  isShortcutsValid,
} from "./shortcuts.loader";
import {
  getCurrentPlatform,
  getShortcutForPlatform,
  formatShortcutForDisplay,
  parseShortcutToHotkey,
} from "./shortcuts.types";

describe("Shortcuts Configuration", () => {
  describe("loadDefaultShortcuts", () => {
    it("should load shortcuts configuration", () => {
      const config = loadDefaultShortcuts();
      expect(config).toBeDefined();
      expect(config.version).toBe("1.0.0");
      expect(Array.isArray(config.shortcuts)).toBe(true);
    });

    it("should have all required shortcuts", () => {
      const shortcuts = getAllShortcuts();
      expect(shortcuts.length).toBeGreaterThan(0);

      const requiredShortcuts = [
        "new-session",
        "open-settings",
        "command-palette",
        "close-session",
        "quit",
        "next-session",
        "prev-session",
      ];

      requiredShortcuts.forEach((id) => {
        const shortcut = getShortcutById(id);
        expect(shortcut).toBeDefined();
        expect(shortcut?.id).toBe(id);
      });
    });
  });

  describe("getShortcutById", () => {
    it("should return shortcut by id", () => {
      const shortcut = getShortcutById("new-session");
      expect(shortcut).toBeDefined();
      expect(shortcut?.id).toBe("new-session");
      expect(shortcut?.name).toBe("New Session");
      expect(shortcut?.keys.mac).toBeDefined();
      expect(shortcut?.keys.windows).toBeDefined();
      expect(shortcut?.keys.linux).toBeDefined();
    });

    it("should return undefined for non-existent shortcut", () => {
      const shortcut = getShortcutById("non-existent");
      expect(shortcut).toBeUndefined();
    });
  });

  describe("getShortcutsByCategory", () => {
    it("should return shortcuts by category", () => {
      const sessionShortcuts = getShortcutsByCategory("Session");
      expect(sessionShortcuts.length).toBeGreaterThan(0);
      sessionShortcuts.forEach((shortcut) => {
        expect(shortcut.category).toBe("Session");
      });
    });

    it("should return empty array for non-existent category", () => {
      const shortcuts = getShortcutsByCategory("NonExistent");
      expect(shortcuts.length).toBe(0);
    });
  });

  describe("getAllCategories", () => {
    it("should return all unique categories", () => {
      const categories = getAllCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain("Session");
      expect(categories).toContain("Navigation");
      expect(categories).toContain("View");
      expect(categories).toContain("Settings");
    });

    it("should return sorted categories", () => {
      const categories = getAllCategories();
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });
  });

  describe("validateShortcuts", () => {
    it("should validate shortcuts configuration without errors", () => {
      const errors = validateShortcuts();
      if (errors.length > 0) {
        console.error("Validation errors:", errors);
      }
      expect(errors.length).toBe(0);
    });

    it("should confirm configuration is valid", () => {
      const isValid = isShortcutsValid();
      expect(isValid).toBe(true);
    });
  });

  describe("Platform utilities", () => {
    it("should detect current platform", () => {
      const platform = getCurrentPlatform();
      expect(["mac", "windows", "linux"]).toContain(platform);
    });

    it("should get shortcut for platform", () => {
      const shortcut = getShortcutById("new-session");
      expect(shortcut).toBeDefined();

      const macKey = getShortcutForPlatform(shortcut!.keys, "mac");
      expect(macKey).toBe("Cmd+N");

      const windowsKey = getShortcutForPlatform(shortcut!.keys, "windows");
      expect(windowsKey).toBe("Ctrl+N");

      const linuxKey = getShortcutForPlatform(shortcut!.keys, "linux");
      expect(linuxKey).toBe("Ctrl+N");
    });

    it("should format shortcut for display", () => {
      const formatted = formatShortcutForDisplay("Cmd+N");
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe("string");
    });

    it("should parse shortcut to hotkey format", () => {
      const hotkey = parseShortcutToHotkey("Cmd+N");
      expect(hotkey).toBeDefined();
      expect(hotkey.toLowerCase()).toMatch(/ctrl\+n|meta\+n/);
    });
  });

  describe("Shortcut structure", () => {
    it("should have consistent structure for all shortcuts", () => {
      const shortcuts = getAllShortcuts();

      shortcuts.forEach((shortcut) => {
        expect(shortcut.id).toBeDefined();
        expect(typeof shortcut.id).toBe("string");
        expect(shortcut.id.length).toBeGreaterThan(0);

        expect(shortcut.name).toBeDefined();
        expect(typeof shortcut.name).toBe("string");
        expect(shortcut.name.length).toBeGreaterThan(0);

        expect(shortcut.description).toBeDefined();
        expect(typeof shortcut.description).toBe("string");
        expect(shortcut.description.length).toBeGreaterThan(0);

        expect(shortcut.category).toBeDefined();
        expect(typeof shortcut.category).toBe("string");
        expect(shortcut.category.length).toBeGreaterThan(0);

        expect(shortcut.keys).toBeDefined();
        expect(shortcut.keys.mac).toBeDefined();
        expect(shortcut.keys.windows).toBeDefined();
        expect(shortcut.keys.linux).toBeDefined();
      });
    });

    it("should have no duplicate IDs", () => {
      const shortcuts = getAllShortcuts();
      const ids = shortcuts.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("should have no duplicate keys per platform", () => {
      const shortcuts = getAllShortcuts();
      const platforms = ["mac", "windows", "linux"] as const;

      platforms.forEach((platform) => {
        const keys = shortcuts.map((s) => s.keys[platform]);
        const uniqueKeys = new Set(keys);
        if (keys.length !== uniqueKeys.size) {
          const duplicates = keys.filter(
            (key, index) => keys.indexOf(key) !== index,
          );
          console.error(`Duplicate keys on ${platform}:`, duplicates);
        }
        expect(keys.length).toBe(uniqueKeys.size);
      });
    });
  });
});
