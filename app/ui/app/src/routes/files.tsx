import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileExplorer } from "@/components/files/FileExplorer";
import { useFileTree } from "@/hooks/useFileTree";
import { useSessions } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { FileNode } from "@/types/dgd";
import clsx from "clsx";

export const Route = createFileRoute("/files")({
  component: FilesPage,
});

function FilesPage() {
  const { data: sessions } = useSessions();
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [workingDir, setWorkingDir] = useState<string>("");

  // Use the first session or create a default one
  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSession) {
      const session = sessions[0];
      setActiveSession(session.id);
      setWorkingDir(session.working_dir || "~/.dgd/workspace");
    }
  }, [sessions, activeSession]);

  const {
    fileTree,
    isLoading,
    error,
    selectedFile,
    loadFile,
    saveFile,
    refreshTree,
  } = useFileTree({
    sessionId: activeSession || "default",
    workingDir: workingDir || "~/.dgd/workspace",
  });

  const handleFileSelect = async (node: FileNode) => {
    if (!node.is_dir) {
      try {
        await loadFile(node.path);
      } catch (error) {
        console.error("Failed to load file:", error);
      }
    }
  };

  const handleFileSave = async (path: string, content: string) => {
    try {
      await saveFile(path, content);
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dojo-bg-primary">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Error loading files
          </h2>
          <p className="text-dojo-text-secondary mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Button onClick={() => refreshTree()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dojo-bg-primary">
      {/* Header */}
      <div
        className={clsx(
          "flex items-center justify-between px-6 py-4",
          "bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo",
          "border-b border-white/10",
        )}
      >
        <div>
          <h1 className="text-2xl font-bold text-dojo-text-primary">
            File Explorer
          </h1>
          <p className="text-sm text-dojo-text-secondary mt-1">
            {workingDir || "No working directory set"}
          </p>
        </div>

        <Button
          onClick={() => refreshTree()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <ArrowPathIcon
            className={clsx("w-5 h-5", isLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* File Explorer Content */}
      <div className="flex-1 overflow-hidden">
        {!activeSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-dojo-text-primary mb-2">
                No Active Session
              </h3>
              <p className="text-dojo-text-secondary">
                Create a session first to browse files
              </p>
            </div>
          </div>
        ) : (
          <FileExplorer
            fileTree={fileTree}
            selectedPath={selectedFile?.path}
            selectedContent={selectedFile?.content}
            onSelectFile={handleFileSelect}
            onSaveFile={handleFileSave}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
