import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { FileNode } from "@/types/dgd";
import { getFileIcon, getFolderIcon } from "@/utils/fileIcons";
import clsx from "clsx";

interface FileTreeNodeProps {
  node: FileNode;
  depth?: number;
  selectedPath?: string;
  onSelect: (node: FileNode) => void;
}

export function FileTreeNode({
  node,
  depth = 0,
  selectedPath,
  onSelect,
}: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedPath === node.path;
  const hasChildren = node.is_dir && node.children && node.children.length > 0;

  const Icon = node.is_dir
    ? getFolderIcon(isExpanded)
    : getFileIcon(node.name, false);

  const handleClick = () => {
    if (node.is_dir) {
      setIsExpanded(!isExpanded);
    }
    onSelect(node);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <motion.div
        className={clsx(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-lg",
          "transition-all duration-200 ease-natural",
          "hover:bg-white/10",
          isSelected &&
            "bg-dojo-accent-primary/20 border border-dojo-accent-primary/30",
          !isSelected && "border border-transparent",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {node.is_dir && (
          <motion.div
            className="flex-shrink-0"
            onClick={handleChevronClick}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
          >
            <ChevronRightIcon className="w-4 h-4 text-dojo-text-secondary" />
          </motion.div>
        )}

        {!node.is_dir && <div className="w-4" />}

        <Icon
          className={clsx(
            "w-4 h-4 flex-shrink-0",
            node.is_dir
              ? "text-dojo-accent-primary"
              : "text-dojo-text-secondary",
          )}
        />

        <span
          className={clsx(
            "text-sm truncate",
            isSelected
              ? "text-dojo-text-primary font-medium"
              : "text-dojo-text-secondary",
          )}
        >
          {node.name}
        </span>
      </motion.div>

      <AnimatePresence>
        {node.is_dir && isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {node.children?.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
