import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Label, Description } from "@/components/ui/fieldset";
import { Text } from "@/components/ui/text";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/api/dgd-client";

export default function SettingsData() {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExportAll = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      // Fetch all sessions
      const sessionsResponse = await fetch(`${API_BASE}/api/sessions`);
      if (!sessionsResponse.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const { sessions } = await sessionsResponse.json();

      if (!sessions || sessions.length === 0) {
        setMessage({ type: "error", text: "No sessions to export" });
        return;
      }

      // Export each session
      let exportedCount = 0;
      for (const session of sessions) {
        try {
          const response = await fetch(`${API_BASE}/api/sessions/${session.id}/export`);
          if (!response.ok) {
            console.error(`Failed to export session ${session.id}`);
            continue;
          }

          // Get the filename from Content-Disposition header
          const contentDisposition = response.headers.get("Content-Disposition");
          let filename = `session_${session.id}.md`;
          if (contentDisposition) {
            const matches = /filename=([^;]+)/.exec(contentDisposition);
            if (matches && matches[1]) {
              filename = matches[1].replace(/['"]/g, "");
            }
          }

          // Create blob and download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          exportedCount++;
        } catch (error) {
          console.error(`Error exporting session ${session.id}:`, error);
        }
      }

      if (exportedCount === 0) {
        setMessage({ type: "error", text: "Failed to export sessions" });
      } else {
        setMessage({ type: "success", text: `Successfully exported ${exportedCount} session(s)` });
      }
    } catch (error) {
      console.error("Error exporting sessions:", error);
      setMessage({ type: "error", text: "Failed to export sessions" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setMessage(null);

    try {
      let importedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is markdown
        if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
          console.error(`Skipping ${file.name}: not a markdown file`);
          failedCount++;
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch(`${API_BASE}/api/sessions/import`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to import ${file.name}:`, errorData.error);
            failedCount++;
            continue;
          }

          importedCount++;
        } catch (error) {
          console.error(`Error importing ${file.name}:`, error);
          failedCount++;
        }
      }

      // Refresh sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      if (importedCount === 0) {
        setMessage({ type: "error", text: "Failed to import sessions" });
      } else if (failedCount > 0) {
        setMessage({ 
          type: "success", 
          text: `Imported ${importedCount} session(s), ${failedCount} failed` 
        });
      } else {
        setMessage({ type: "success", text: `Successfully imported ${importedCount} session(s)` });
      }
    } catch (error) {
      console.error("Error importing sessions:", error);
      setMessage({ type: "error", text: "Failed to import sessions" });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    setMessage(null);

    try {
      // Fetch all sessions
      const sessionsResponse = await fetch(`${API_BASE}/api/sessions`);
      if (!sessionsResponse.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const { sessions } = await sessionsResponse.json();

      if (!sessions || sessions.length === 0) {
        setMessage({ type: "error", text: "No sessions to clear" });
        setShowClearDialog(false);
        return;
      }

      // Delete each session
      let deletedCount = 0;
      for (const session of sessions) {
        try {
          const response = await fetch(`${API_BASE}/api/sessions/${session.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            deletedCount++;
          } else {
            console.error(`Failed to delete session ${session.id}`);
          }
        } catch (error) {
          console.error(`Error deleting session ${session.id}:`, error);
        }
      }

      // Refresh sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      if (deletedCount === 0) {
        setMessage({ type: "error", text: "Failed to clear history" });
      } else {
        setMessage({ type: "success", text: `Successfully cleared ${deletedCount} session(s)` });
      }
    } catch (error) {
      console.error("Error clearing history:", error);
      setMessage({ type: "error", text: "Failed to clear history" });
    } finally {
      setIsClearing(false);
      setShowClearDialog(false);
    }
  };

  return (
    <>
      <div className="space-y-3 p-4">
        {/* Export All Sessions */}
        <Field>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3 flex-1">
              <ArrowDownTrayIcon className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-accent-primary" />
              <div>
                <Label className="text-dojo-text-primary">Export all sessions</Label>
                <Description className="text-dojo-text-secondary">
                  Download all your conversations as Markdown files
                </Description>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button
                type="button"
                color="white"
                onClick={handleExportAll}
                disabled={isExporting}
                className="px-3 py-2 text-sm"
              >
                {isExporting ? "Exporting..." : "Export All"}
              </Button>
            </div>
          </div>
        </Field>

        {/* Import Sessions */}
        <Field>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3 flex-1">
              <ArrowUpTrayIcon className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-accent-primary" />
              <div>
                <Label className="text-dojo-text-primary">Import sessions</Label>
                <Description className="text-dojo-text-secondary">
                  Upload Markdown files to import conversations
                </Description>
              </div>
            </div>
            <div className="flex-shrink-0">
              <label htmlFor="import-file-input">
                <span className={`inline-flex px-3 py-2 text-sm ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} bg-white text-dojo-bg-primary rounded-md hover:bg-gray-100 transition-colors`}>
                  {isImporting ? "Importing..." : "Import"}
                </span>
              </label>
              <input
                id="import-file-input"
                type="file"
                accept=".md,.markdown"
                multiple
                onChange={handleImport}
                className="hidden"
                disabled={isImporting}
              />
            </div>
          </div>
        </Field>

        {/* Clear History */}
        <Field>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3 flex-1">
              <TrashIcon className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-error" />
              <div>
                <Label className="text-dojo-text-primary">Clear history</Label>
                <Description className="text-dojo-text-secondary">
                  Permanently delete all conversations and messages
                </Description>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button
                type="button"
                color="red"
                onClick={() => setShowClearDialog(true)}
                className="px-3 py-2 text-sm"
              >
                Clear All
              </Button>
            </div>
          </div>
        </Field>

        {/* Status Message */}
        {message && (
          <div
            className={clsx(
              "p-3 rounded-lg border",
              message.type === "success"
                ? "bg-dojo-success/10 border-dojo-success/20"
                : "bg-dojo-error/10 border-dojo-error/20"
            )}
          >
            <Text
              className={clsx(
                "text-sm",
                message.type === "success" ? "text-dojo-success" : "text-dojo-error"
              )}
            >
              {message.text}
            </Text>
          </div>
        )}
      </div>

      {/* Clear History Confirmation Dialog */}
      <AnimatePresence>
        {showClearDialog && (
          <Dialog
            open={showClearDialog}
            onClose={() => !isClearing && setShowClearDialog(false)}
            className="relative z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
              >
                <DialogPanel
                  className={clsx(
                    "w-full max-w-md rounded-dojo-lg border border-white/10",
                    "bg-[rgba(15,42,61,0.9)] backdrop-blur-dojo",
                    "shadow-dojo-xl p-6"
                  )}
                >
                  <DialogTitle className="text-2xl font-semibold text-dojo-text-primary mb-4">
                    Clear All History?
                  </DialogTitle>

                  <p className="text-dojo-text-secondary mb-2">
                    Are you sure you want to delete all conversations and messages?
                  </p>

                  <p className="text-sm text-dojo-text-tertiary mb-6">
                    This action cannot be undone. All sessions and their history will be
                    permanently removed from the database.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      ghost
                      onClick={() => setShowClearDialog(false)}
                      disabled={isClearing}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      color="red"
                      onClick={handleClearHistory}
                      disabled={isClearing}
                      className="flex-1"
                    >
                      {isClearing ? "Clearing..." : "Clear All"}
                    </Button>
                  </div>
                </DialogPanel>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
