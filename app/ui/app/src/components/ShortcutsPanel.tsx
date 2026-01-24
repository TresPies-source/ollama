import { useState } from "react";
import { useShortcutsContext } from "@/contexts/ShortcutsContext";
import type { ShortcutDefinition } from "@/contexts/ShortcutsContext";

interface ShortcutsByCategory {
  [category: string]: ShortcutDefinition[];
}

export function ShortcutsPanel() {
  const {
    shortcuts,
    shortcutDefinitions,
    platform,
    isLoading,
    updateShortcut,
    resetShortcuts,
    hasConflict,
  } = useShortcutsContext();

  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const shortcutsByCategory = shortcutDefinitions.reduce<ShortcutsByCategory>(
    (acc, def) => {
      if (!acc[def.category]) {
        acc[def.category] = [];
      }
      acc[def.category].push(def);
      return acc;
    },
    {},
  );

  const categories = Object.keys(shortcutsByCategory).sort();

  const handleStartRecording = (id: string) => {
    setRecordingId(id);
    setRecordedKeys([]);
    setError(null);
  };

  const handleCancelRecording = () => {
    setRecordingId(null);
    setRecordedKeys([]);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingId) return;

    e.preventDefault();
    e.stopPropagation();

    const keys: string[] = [];

    if (e.metaKey || e.ctrlKey) {
      keys.push(platform === "mac" ? "Cmd" : "Ctrl");
    }
    if (e.altKey) {
      keys.push(platform === "mac" ? "Option" : "Alt");
    }
    if (e.shiftKey) {
      keys.push("Shift");
    }

    const key = e.key;
    if (
      key !== "Control" &&
      key !== "Meta" &&
      key !== "Alt" &&
      key !== "Shift"
    ) {
      const displayKey =
        key === " "
          ? "Space"
          : key.length === 1
            ? key.toUpperCase()
            : key.charAt(0).toUpperCase() + key.slice(1);
      keys.push(displayKey);
    }

    if (keys.length > 0 && keys[keys.length - 1] !== "Cmd" && keys[keys.length - 1] !== "Ctrl" && keys[keys.length - 1] !== "Alt" && keys[keys.length - 1] !== "Option" && keys[keys.length - 1] !== "Shift") {
      setRecordedKeys(keys);
    }
  };

  const handleSaveShortcut = async () => {
    if (!recordingId || recordedKeys.length === 0) return;

    const newShortcut = recordedKeys.join("+");

    if (hasConflict(newShortcut, recordingId)) {
      setError(`Shortcut "${newShortcut}" is already in use`);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateShortcut(recordingId, newShortcut);
      setRecordingId(null);
      setRecordedKeys([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save shortcut");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm("Reset all shortcuts to defaults?")) return;

    try {
      setIsResetting(true);
      setError(null);
      await resetShortcuts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset shortcuts",
      );
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-dojo-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-dojo-text-primary">
            Keyboard Shortcuts
          </h2>
          <p className="mt-1 text-sm text-dojo-text-tertiary">
            Customize keyboard shortcuts for quick actions
          </p>
        </div>
        <button
          onClick={handleResetAll}
          disabled={isResetting}
          className="px-4 py-2 text-sm font-medium text-dojo-accent-primary bg-dojo-bg-secondary/50 hover:bg-dojo-bg-secondary backdrop-blur-sm border border-dojo-accent-primary/20 hover:border-dojo-accent-primary/40 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResetting ? "Resetting..." : "Reset All to Defaults"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-dojo-danger/10 border border-dojo-danger/20 rounded-lg text-dojo-danger text-sm">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="mb-3 text-lg font-semibold text-dojo-text-secondary">
              {category}
            </h3>
            <div className="bg-dojo-bg-secondary/30 backdrop-blur-sm border border-dojo-accent-primary/10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dojo-accent-primary/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-dojo-text-tertiary uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dojo-text-tertiary uppercase tracking-wider">
                      Shortcut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-dojo-text-tertiary uppercase tracking-wider">
                      Customize
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shortcutsByCategory[category].map((def) => {
                    const currentShortcut = shortcuts[def.id] || def.keys[platform];
                    const isRecording = recordingId === def.id;

                    return (
                      <tr
                        key={def.id}
                        className="border-b border-dojo-accent-primary/5 last:border-b-0 hover:bg-dojo-bg-secondary/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-dojo-text-primary">
                              {def.name}
                            </div>
                            <div className="text-xs text-dojo-text-tertiary">
                              {def.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isRecording ? (
                            <kbd className="px-3 py-1.5 bg-dojo-accent-primary/20 border border-dojo-accent-primary/40 rounded text-sm text-dojo-text-primary font-mono animate-pulse">
                              {recordedKeys.length > 0
                                ? recordedKeys.join("+")
                                : "Press keys..."}
                            </kbd>
                          ) : (
                            <kbd className="px-3 py-1.5 bg-dojo-bg-tertiary/50 border border-dojo-accent-primary/10 rounded text-sm text-dojo-text-secondary font-mono">
                              {currentShortcut}
                            </kbd>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isRecording ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={handleSaveShortcut}
                                disabled={
                                  recordedKeys.length === 0 || isSaving
                                }
                                className="px-3 py-1.5 text-xs font-medium text-white bg-dojo-success hover:bg-dojo-success/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={handleCancelRecording}
                                disabled={isSaving}
                                className="px-3 py-1.5 text-xs font-medium text-dojo-text-secondary bg-dojo-bg-secondary/50 hover:bg-dojo-bg-secondary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartRecording(def.id)}
                              className="px-3 py-1.5 text-xs font-medium text-dojo-accent-primary hover:text-dojo-accent-secondary hover:bg-dojo-accent-primary/10 rounded transition-colors"
                            >
                              Customize
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {recordingId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleCancelRecording}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div
            className="bg-dojo-bg-secondary/90 backdrop-blur-lg border border-dojo-accent-primary/20 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-dojo-text-primary mb-2">
              Recording Shortcut
            </h3>
            <p className="text-sm text-dojo-text-tertiary mb-4">
              Press the key combination you want to use
            </p>
            <div className="p-4 bg-dojo-bg-tertiary/50 border border-dojo-accent-primary/20 rounded-lg text-center">
              <kbd className="text-xl text-dojo-text-primary font-mono">
                {recordedKeys.length > 0
                  ? recordedKeys.join("+")
                  : "Waiting..."}
              </kbd>
            </div>
            {error && (
              <p className="mt-3 text-sm text-dojo-danger">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
