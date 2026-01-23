import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import clsx from "clsx";

type NewSessionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, workingDir: string) => void | Promise<void>;
};

export function NewSessionModal({
  isOpen,
  onClose,
  onCreate,
}: NewSessionModalProps) {
  const [title, setTitle] = useState("");
  const [workingDir, setWorkingDir] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workingDir.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(title, workingDir);
      setTitle("");
      setWorkingDir("");
      onClose();
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setTitle("");
      setWorkingDir("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
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
                  "shadow-dojo-xl p-6",
                )}
              >
                <DialogTitle className="text-2xl font-semibold text-dojo-text-primary mb-6">
                  New Session
                </DialogTitle>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="session-title"
                      className="block text-sm font-medium text-dojo-text-secondary mb-2"
                    >
                      Session Title
                    </label>
                    <Input
                      id="session-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Project Planning"
                      disabled={isCreating}
                      className="w-full"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="working-dir"
                      className="block text-sm font-medium text-dojo-text-secondary mb-2"
                    >
                      Working Directory
                    </label>
                    <Input
                      id="working-dir"
                      type="text"
                      value={workingDir}
                      onChange={(e) => setWorkingDir(e.target.value)}
                      placeholder="e.g., /home/user/projects"
                      disabled={isCreating}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      ghost
                      onClick={handleClose}
                      disabled={isCreating}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      primary
                      disabled={
                        !title.trim() || !workingDir.trim() || isCreating
                      }
                      className="flex-1"
                    >
                      {isCreating ? "Creating..." : "Create Session"}
                    </Button>
                  </div>
                </form>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
