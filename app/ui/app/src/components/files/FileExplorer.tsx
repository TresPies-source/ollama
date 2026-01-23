import { useState, useRef, useCallback } from "react";
import { FileTree } from "./FileTree";
import { FileEditor } from "./FileEditor";
import type { FileNode } from "@/types/dgd";
import clsx from "clsx";

interface FileExplorerProps {
  fileTree: FileNode[];
  selectedPath?: string;
  selectedContent?: string;
  onSelectFile: (node: FileNode) => void;
  onSaveFile?: (path: string, content: string) => void;
  isLoading?: boolean;
}

export function FileExplorer({
  fileTree,
  selectedPath,
  selectedContent,
  onSelectFile,
  onSaveFile,
  isLoading = false,
}: FileExplorerProps) {
  const [leftWidth, setLeftWidth] = useState(30); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain between 15% and 50%
    const constrainedWidth = Math.min(Math.max(newWidth, 15), 50);
    setLeftWidth(constrainedWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Set up global mouse event listeners
  useState(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const handleFileSelect = (node: FileNode) => {
    if (!node.is_dir) {
      onSelectFile(node);
    }
  };

  const handleFileSave = (content: string) => {
    if (selectedPath && onSaveFile) {
      onSaveFile(selectedPath, content);
    }
  };

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden">
      {/* Left Panel - File Tree */}
      <div
        className={clsx(
          "flex-shrink-0 overflow-hidden",
          "bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo",
          "border-r border-white/10",
        )}
        style={{ width: `${leftWidth}%` }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-dojo-text-secondary text-sm">
              Loading files...
            </div>
          </div>
        ) : (
          <FileTree
            nodes={fileTree}
            selectedPath={selectedPath}
            onSelect={handleFileSelect}
            className="p-4"
          />
        )}
      </div>

      {/* Resizable Divider */}
      <div
        className={clsx(
          "w-1 cursor-col-resize",
          "bg-dojo-accent-primary/20 hover:bg-dojo-accent-primary/40",
          "transition-all duration-300 ease-natural",
          "active:bg-dojo-accent-primary",
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Right Panel - File Editor */}
      <div
        className={clsx(
          "flex-1 overflow-hidden",
          "bg-[rgba(10,30,46,0.5)] backdrop-blur-dojo",
        )}
      >
        {selectedPath && selectedContent !== undefined ? (
          <FileEditor
            filename={selectedPath.split("/").pop() || selectedPath}
            content={selectedContent}
            onSave={handleFileSave}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div
              className={clsx(
                "w-24 h-24 rounded-full mb-6",
                "bg-gradient-to-br from-dojo-accent-primary/20 to-dojo-accent-secondary/20",
                "flex items-center justify-center",
              )}
            >
              <svg
                className="w-12 h-12 text-dojo-accent-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-dojo-text-primary mb-2">
              No File Selected
            </h3>
            <p className="text-dojo-text-secondary max-w-md">
              Select a file from the tree on the left to view and edit its
              contents
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
