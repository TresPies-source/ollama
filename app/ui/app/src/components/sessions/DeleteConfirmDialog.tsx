import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "../ui/button";
import clsx from "clsx";
import type { Session } from "../../types/dgd";

type DeleteConfirmDialogProps = {
  isOpen: boolean;
  session: Session | null;
  onClose: () => void;
  onConfirm: (sessionId: string) => void | Promise<void>;
};

export function DeleteConfirmDialog({
  isOpen,
  session,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!session) return;

    setIsDeleting(true);
    try {
      await onConfirm(session.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && session && (
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
                <DialogTitle className="text-2xl font-semibold text-dojo-text-primary mb-4">
                  Delete Session?
                </DialogTitle>

                <p className="text-dojo-text-secondary mb-2">
                  Are you sure you want to delete "{session.title}"?
                </p>

                <p className="text-sm text-dojo-text-tertiary mb-6">
                  This action cannot be undone. All messages and history will be
                  permanently removed.
                </p>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    ghost
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    color="red"
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
