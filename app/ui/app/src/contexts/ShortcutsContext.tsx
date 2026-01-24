import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import defaultShortcuts from "@/config/shortcuts.json";
import { fetchSettings, updateSettings } from "@/api/settings";

type Platform = "mac" | "windows" | "linux";

export interface ShortcutDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  keys: {
    mac: string;
    windows: string;
    linux: string;
  };
}

export interface ShortcutMap {
  [shortcutId: string]: string;
}

export interface ShortcutsContextType {
  shortcuts: ShortcutMap;
  shortcutDefinitions: ShortcutDefinition[];
  platform: Platform;
  isLoading: boolean;
  error: Error | null;
  getShortcut: (id: string) => string | undefined;
  updateShortcut: (id: string, key: string) => Promise<void>;
  resetShortcuts: () => Promise<void>;
  hasConflict: (key: string, excludeId?: string) => boolean;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(
  undefined,
);

function detectPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("mac")) return "mac";
  if (userAgent.includes("win")) return "windows";
  return "linux";
}

function normalizeShortcutKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/command|cmd/gi, "mod")
    .replace(/control|ctrl/gi, "mod")
    .replace(/option|opt/gi, "alt");
}

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const platform = useMemo(() => detectPlatform(), []);
  const shortcutDefinitions = useMemo(
    () => defaultShortcuts.shortcuts as ShortcutDefinition[],
    [],
  );

  const loadDefaultShortcuts = useCallback((): ShortcutMap => {
    const defaults: ShortcutMap = {};
    for (const shortcut of shortcutDefinitions) {
      defaults[shortcut.id] = shortcut.keys[platform];
    }
    return defaults;
  }, [shortcutDefinitions, platform]);

  const loadShortcuts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const defaults = loadDefaultShortcuts();

      try {
        const settings = await fetchSettings();
        const overrides: ShortcutMap = {};

        for (const [key, value] of Object.entries(settings)) {
          if (key.startsWith("shortcut_")) {
            const shortcutId = key.replace("shortcut_", "");
            overrides[shortcutId] = value;
          }
        }

        setShortcuts({ ...defaults, ...overrides });
      } catch (err) {
        console.warn("Failed to fetch shortcut overrides, using defaults:", err);
        setShortcuts(defaults);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to load shortcuts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadDefaultShortcuts]);

  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  const getShortcut = useCallback(
    (id: string): string | undefined => {
      return shortcuts[id];
    },
    [shortcuts],
  );

  const hasConflict = useCallback(
    (key: string, excludeId?: string): boolean => {
      const normalizedKey = normalizeShortcutKey(key);
      for (const [id, shortcutKey] of Object.entries(shortcuts)) {
        if (id === excludeId) continue;
        if (normalizeShortcutKey(shortcutKey) === normalizedKey) {
          return true;
        }
      }
      return false;
    },
    [shortcuts],
  );

  const updateShortcut = useCallback(
    async (id: string, key: string): Promise<void> => {
      try {
        if (!key.trim()) {
          throw new Error("Shortcut key cannot be empty");
        }

        if (hasConflict(key, id)) {
          throw new Error(
            `Shortcut "${key}" is already in use by another action`,
          );
        }

        setShortcuts((prev) => ({
          ...prev,
          [id]: key,
        }));

        await updateSettings({
          [`shortcut_${id}`]: key,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        await loadShortcuts();
        throw error;
      }
    },
    [hasConflict, loadShortcuts],
  );

  const resetShortcuts = useCallback(async (): Promise<void> => {
    try {
      const defaults = loadDefaultShortcuts();
      setShortcuts(defaults);

      const settingsToDelete: Record<string, string> = {};
      for (const id of Object.keys(shortcuts)) {
        settingsToDelete[`shortcut_${id}`] = defaults[id] || "";
      }

      await updateSettings(settingsToDelete);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await loadShortcuts();
      throw error;
    }
  }, [loadDefaultShortcuts, shortcuts, loadShortcuts]);

  const contextValue = useMemo(
    () => ({
      shortcuts,
      shortcutDefinitions,
      platform,
      isLoading,
      error,
      getShortcut,
      updateShortcut,
      resetShortcuts,
      hasConflict,
    }),
    [
      shortcuts,
      shortcutDefinitions,
      platform,
      isLoading,
      error,
      getShortcut,
      updateShortcut,
      resetShortcuts,
      hasConflict,
    ],
  );

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcutsContext() {
  const context = useContext(ShortcutsContext);
  if (context === undefined) {
    throw new Error(
      "useShortcutsContext must be used within a ShortcutsProvider",
    );
  }
  return context;
}
