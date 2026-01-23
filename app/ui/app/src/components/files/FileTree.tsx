import type { FileNode } from "@/types/dgd";
import { FileTreeNode } from "./FileTreeNode";

interface FileTreeProps {
  nodes: FileNode[];
  selectedPath?: string;
  onSelect: (node: FileNode) => void;
  className?: string;
}

export function FileTree({
  nodes,
  selectedPath,
  onSelect,
  className = "",
}: FileTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-dojo-text-tertiary text-sm">No files found</p>
      </div>
    );
  }

  return (
    <div className={`overflow-y-auto h-full ${className}`}>
      <div className="p-2 space-y-1">
        {nodes.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
