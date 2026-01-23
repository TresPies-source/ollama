import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import StreamingMarkdownContent from "../StreamingMarkdownContent";
import type { Seed } from "../../types/dgd";

type SeedDetailModalProps = {
  seed: Seed | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyToChat?: (seed: Seed) => void;
  className?: string;
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

export function SeedDetailModal({
  seed,
  isOpen,
  onClose,
  onApplyToChat,
  className,
}: SeedDetailModalProps) {
  if (!seed) return null;

  const { metadata, content } = seed;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleApplyToChat = () => {
    onApplyToChat?.(seed);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleBackdropClick}
          className={clsx(
            "fixed inset-0 z-50",
            "bg-black/60 backdrop-blur-sm",
            "flex items-center justify-center",
            "p-4 sm:p-6 lg:p-8",
            className,
          )}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
              "relative w-full max-w-4xl max-h-[90vh]",
              "bg-[rgba(15,42,61,0.95)] backdrop-blur-dojo",
              "border border-white/10",
              "rounded-dojo-lg shadow-dojo-xl",
              "overflow-hidden",
              "flex flex-col",
            )}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-white/10">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-semibold text-dojo-text-primary mb-2">
                  {metadata.name}
                </h2>
                <p className="text-sm text-dojo-text-secondary mb-3">
                  {metadata.description}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="accent" className="capitalize">
                    {metadata.category}
                  </Badge>
                  {metadata.tags.map((tag, index) => (
                    <Badge key={index} color="zinc" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className={clsx(
                  "flex-shrink-0 p-2 rounded-lg",
                  "text-dojo-text-tertiary hover:text-dojo-text-primary",
                  "hover:bg-white/5",
                  "transition-all duration-300 ease-natural",
                )}
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <StreamingMarkdownContent content={content} isStreaming={false} />
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <Button
                ghost
                onClick={onClose}
                className="text-dojo-text-secondary hover:text-dojo-text-primary"
              >
                Close
              </Button>
              {onApplyToChat && (
                <Button
                  primary
                  onClick={handleApplyToChat}
                  className="bg-gradient-sunset text-white"
                >
                  Apply to Chat
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
