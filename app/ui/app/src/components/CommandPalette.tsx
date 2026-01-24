import { useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { getShortcut, formatShortcut } from "@/commands/types";
import type { Command, CommandCategory } from "@/commands/types";

/**
 * CommandPalette - A fast, keyboard-driven command palette
 * 
 * Features:
 * - Global hotkey (⌘K / Ctrl+K) to open
 * - Fuzzy search across commands
 * - Keyboard navigation (↑↓ arrows, Enter, Escape)
 * - Grouped results by category
 * - Glassmorphism design with Dojo Genesis theme
 */
export function CommandPalette() {
  const { state, open, close, search, execute, selectNext, selectPrevious, setSelectedIndex } = useCommandPalette();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, { enableOnFormTags: true });

  useEffect(() => {
    if (state.isOpen && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [state.isOpen]);

  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${state.selectedIndex}"]`);
      if (selectedElement && typeof selectedElement.scrollIntoView === "function") {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [state.selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectNext();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectPrevious();
    } else if (e.key === "Enter") {
      e.preventDefault();
      execute();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const handleCommandClick = (commandId: string) => {
    execute(commandId);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  const groupedResults = groupCommandsByCategory(state.results);

  if (!state.isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[20vh] px-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="relative w-full max-w-2xl glass-strong rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] animate-slide-up">
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={state.query}
            onChange={(e) => search(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] text-lg placeholder:text-[var(--text-tertiary)]"
            aria-label="Command search"
            aria-autocomplete="list"
            aria-controls="command-results"
            aria-activedescendant={state.results[state.selectedIndex]?.id}
          />
        </div>

        <div className="border-t border-[var(--glass-border)]" />

        <div
          ref={resultsRef}
          id="command-results"
          className="max-h-[60vh] overflow-y-auto py-2"
          role="listbox"
        >
          {state.results.length === 0 ? (
            <div className="px-4 py-8 text-center text-[var(--text-tertiary)]">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">No commands found</div>
              <div className="text-xs mt-1">Try a different search term</div>
            </div>
          ) : (
            Object.entries(groupedResults).map(([category, commands]) => (
              <div key={category} className="mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  {category}
                </div>
                {commands.map((command) => {
                  const globalIndex = state.results.indexOf(command);
                  const isSelected = globalIndex === state.selectedIndex;
                  const shortcut = getShortcut(command);

                  return (
                    <button
                      key={command.id}
                      data-index={globalIndex}
                      onClick={() => handleCommandClick(command.id)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`
                        w-full px-4 py-3 flex items-center justify-between
                        transition-colors duration-[var(--duration-fast)]
                        cursor-pointer
                        ${isSelected
                          ? "bg-[var(--glass-bg-light)] border-l-2 border-[var(--accent-primary)]"
                          : "hover:bg-[var(--glass-bg-light)] border-l-2 border-transparent"
                        }
                      `}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {command.icon && (
                          <div className="text-[var(--accent-primary)] text-lg flex-shrink-0">
                            {command.icon}
                          </div>
                        )}
                        <div className="flex flex-col items-start min-w-0">
                          <div className="text-[var(--text-primary)] font-medium text-sm">
                            {command.title}
                          </div>
                          {command.description && (
                            <div className="text-[var(--text-tertiary)] text-xs truncate max-w-full">
                              {command.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {shortcut && (
                        <div className="flex-shrink-0 px-2 py-1 rounded bg-[var(--glass-bg)] text-[var(--text-secondary)] text-xs font-mono border border-[var(--glass-border)]">
                          {formatShortcut(shortcut)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[var(--glass-border)]" />

        <div className="px-4 py-3 flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)]">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)]">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)]">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Group commands by category
 */
function groupCommandsByCategory(commands: Command[]): Record<CommandCategory, Command[]> {
  const grouped: Record<string, Command[]> = {};

  commands.forEach((command) => {
    if (!grouped[command.category]) {
      grouped[command.category] = [];
    }
    grouped[command.category].push(command);
  });

  return grouped as Record<CommandCategory, Command[]>;
}
