import { describe, it, expect, beforeEach } from "vitest";
import {
  getPlatform,
  getShortcut,
  formatShortcut,
  type Command,
} from "./types";

describe("Command Types", () => {
  describe("getPlatform", () => {
    beforeEach(() => {
      // Reset navigator object before each test
      void 0;
    });

    it("should detect macOS", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        configurable: true,
      });

      expect(getPlatform()).toBe("mac");
    });

    it("should detect Windows", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        configurable: true,
      });

      expect(getPlatform()).toBe("windows");
    });

    it("should default to linux for unknown platforms", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (X11; Linux x86_64)",
        configurable: true,
      });

      expect(getPlatform()).toBe("linux");
    });

    it("should be case insensitive", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (MACINTOSH)",
        configurable: true,
      });

      expect(getPlatform()).toBe("mac");
    });
  });

  describe("getShortcut", () => {
    it("should return platform-specific shortcut for mac", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        configurable: true,
      });

      const command: Command = {
        id: "test",
        title: "Test",
        category: "Session",
        shortcut: {
          mac: "Cmd+N",
          windows: "Ctrl+N",
          linux: "Ctrl+N",
        },
        action: () => {},
      };

      expect(getShortcut(command)).toBe("Cmd+N");
    });

    it("should return platform-specific shortcut for windows", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        configurable: true,
      });

      const command: Command = {
        id: "test",
        title: "Test",
        category: "Session",
        shortcut: {
          mac: "Cmd+N",
          windows: "Ctrl+N",
          linux: "Ctrl+N",
        },
        action: () => {},
      };

      expect(getShortcut(command)).toBe("Ctrl+N");
    });

    it("should return platform-specific shortcut for linux", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (X11; Linux x86_64)",
        configurable: true,
      });

      const command: Command = {
        id: "test",
        title: "Test",
        category: "Session",
        shortcut: {
          mac: "Cmd+N",
          windows: "Ctrl+N",
          linux: "Ctrl+N",
        },
        action: () => {},
      };

      expect(getShortcut(command)).toBe("Ctrl+N");
    });

    it("should return undefined if command has no shortcut", () => {
      const command: Command = {
        id: "test",
        title: "Test",
        category: "Session",
        action: () => {},
      };

      expect(getShortcut(command)).toBeUndefined();
    });

    it("should return undefined if platform shortcut is missing", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        configurable: true,
      });

      const command: Command = {
        id: "test",
        title: "Test",
        category: "Session",
        shortcut: {
          windows: "Ctrl+N",
          linux: "Ctrl+N",
        },
        action: () => {},
      };

      expect(getShortcut(command)).toBeUndefined();
    });
  });

  describe("formatShortcut", () => {
    it("should format shortcuts with symbols on mac", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        configurable: true,
      });

      expect(formatShortcut("Cmd+N")).toBe("⌘+N");
      expect(formatShortcut("Ctrl+K")).toBe("⌃+K");
      expect(formatShortcut("Alt+F")).toBe("⌥+F");
      expect(formatShortcut("Shift+A")).toBe("⇧+A");
    });

    it("should format multiple modifiers on mac", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        configurable: true,
      });

      expect(formatShortcut("Cmd+Shift+P")).toBe("⌘+⇧+P");
      expect(formatShortcut("Ctrl+Alt+Delete")).toBe("⌃+⌥+Delete");
    });

    it("should not format shortcuts on windows", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        configurable: true,
      });

      expect(formatShortcut("Ctrl+N")).toBe("Ctrl+N");
      expect(formatShortcut("Alt+F4")).toBe("Alt+F4");
    });

    it("should not format shortcuts on linux", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (X11; Linux x86_64)",
        configurable: true,
      });

      expect(formatShortcut("Ctrl+N")).toBe("Ctrl+N");
      expect(formatShortcut("Alt+F4")).toBe("Alt+F4");
    });

    it("should handle empty string", () => {
      expect(formatShortcut("")).toBe("");
    });

    it("should handle shortcuts without modifiers", () => {
      expect(formatShortcut("Enter")).toBe("Enter");
      expect(formatShortcut("Escape")).toBe("Escape");
    });
  });
});
