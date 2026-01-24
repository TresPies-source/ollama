import { useCallback, useEffect, useRef } from "react";
import { useHotkeys, type Options } from "react-hotkeys-hook";
import { useShortcutsContext } from "@/contexts/ShortcutsContext";

export interface UseShortcutOptions extends Omit<Options, "enabled"> {
  enabled?: boolean;
  preventDefault?: boolean;
}

function convertShortcutToHotkey(shortcut: string, platform: string): string {
  let key = shortcut;

  if (platform === "mac") {
    key = key.replace(/Cmd/gi, "mod");
    key = key.replace(/Command/gi, "mod");
    key = key.replace(/Option/gi, "alt");
    key = key.replace(/Opt/gi, "alt");
  } else {
    key = key.replace(/Ctrl/gi, "mod");
    key = key.replace(/Control/gi, "mod");
  }

  key = key.replace(/\s+/g, "");

  return key.toLowerCase();
}

export function useShortcut(
  shortcutId: string,
  callback: (event: KeyboardEvent) => void | Promise<void>,
  options: UseShortcutOptions = {},
) {
  const { shortcuts, platform, isLoading } = useShortcutsContext();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const shortcutKey = shortcuts[shortcutId];

  const hotkey = shortcutKey
    ? convertShortcutToHotkey(shortcutKey, platform)
    : null;

  const enabled = options.enabled !== false && !isLoading && hotkey !== null;

  const wrappedCallback = useCallback(
    (event: KeyboardEvent) => {
      if (options.preventDefault !== false) {
        event.preventDefault();
      }
      callbackRef.current(event);
    },
    [options.preventDefault],
  );

  const hotkeyOptions: Options = {
    ...options,
    enabled,
  };

  useHotkeys(hotkey || "", wrappedCallback, hotkeyOptions);

  return {
    shortcutKey,
    hotkey,
    enabled,
  };
}
