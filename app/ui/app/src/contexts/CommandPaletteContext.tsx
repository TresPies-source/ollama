import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import Fuse from "fuse.js";
import { getAllCommands, executeCommand } from "@/commands/registry";
import type { Command } from "@/commands/types";

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  results: Command[];
  selectedIndex: number;
}

export interface CommandPaletteContextType {
  state: CommandPaletteState;
  open: () => void;
  close: () => void;
  toggle: () => void;
  search: (query: string) => void;
  execute: (commandId?: string) => Promise<void>;
  selectNext: () => void;
  selectPrevious: () => void;
  setSelectedIndex: (index: number) => void;
}

const CommandPaletteContext = createContext<
  CommandPaletteContextType | undefined
>(undefined);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fuse = useMemo(() => {
    const commands = getAllCommands();
    return new Fuse(commands, {
      keys: [
        { name: "title", weight: 2 },
        { name: "description", weight: 1.5 },
        { name: "keywords", weight: 1 },
        { name: "category", weight: 0.5 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1,
    });
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return getAllCommands();
    }

    const searchResults = fuse.search(query);
    return searchResults.map((result) => result.item);
  }, [query, fuse]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  }, []);

  const execute = useCallback(
    async (commandId?: string) => {
      const targetCommand = commandId
        ? results.find((cmd) => cmd.id === commandId)
        : results[selectedIndex];

      if (!targetCommand) {
        console.warn("No command to execute");
        return;
      }

      try {
        await executeCommand(targetCommand.id);
        close();
      } catch (error) {
        console.error("Failed to execute command:", error);
      }
    },
    [results, selectedIndex, close],
  );

  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % results.length);
  }, [results.length]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
  }, [results.length]);

  const state = useMemo(
    () => ({
      isOpen,
      query,
      results,
      selectedIndex,
    }),
    [isOpen, query, results, selectedIndex],
  );

  const contextValue = useMemo(
    () => ({
      state,
      open,
      close,
      toggle,
      search,
      execute,
      selectNext,
      selectPrevious,
      setSelectedIndex,
    }),
    [
      state,
      open,
      close,
      toggle,
      search,
      execute,
      selectNext,
      selectPrevious,
    ],
  );

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPaletteContext() {
  const context = useContext(CommandPaletteContext);
  if (context === undefined) {
    throw new Error(
      "useCommandPaletteContext must be used within a CommandPaletteProvider",
    );
  }
  return context;
}
