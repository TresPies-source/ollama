import { useCommandPaletteContext } from "@/contexts/CommandPaletteContext";

/**
 * Hook to access the command palette
 * 
 * Provides methods to open, close, search, and execute commands.
 * 
 * @example
 * ```tsx
 * const { open, close, search, execute, state } = useCommandPalette();
 * 
 * // Open the palette
 * open();
 * 
 * // Search for commands
 * search("new session");
 * 
 * // Execute selected command
 * execute();
 * 
 * // Check state
 * if (state.isOpen) {
 *   console.log("Palette is open");
 * }
 * ```
 */
export function useCommandPalette() {
  return useCommandPaletteContext();
}
