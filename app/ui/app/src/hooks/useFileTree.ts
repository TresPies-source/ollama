import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/api/dgd-client";
import type { FileNode } from "@/types/dgd";

interface UseFileTreeOptions {
  sessionId: string;
  workingDir: string;
}

interface UseFileTreeReturn {
  fileTree: FileNode[];
  isLoading: boolean;
  error: Error | null;
  selectedFile: { path: string; content: string } | null;
  loadFile: (path: string) => Promise<void>;
  saveFile: (path: string, content: string) => Promise<void>;
  refreshTree: () => void;
}

/**
 * Hook to manage file tree operations via the Librarian agent
 *
 * Uses the chat API to communicate with the Librarian agent for file operations:
 * - List files/directories
 * - Read file content
 * - Write file content (via Builder if needed)
 */
export function useFileTree({
  sessionId,
  workingDir,
}: UseFileTreeOptions): UseFileTreeReturn {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    content: string;
  } | null>(null);

  // Fetch file tree from Librarian agent
  const {
    data: fileTree = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fileTree", sessionId, workingDir],
    queryFn: async () => {
      try {
        const response = await sendMessage({
          session_id: sessionId,
          message: `List all files and directories in ${workingDir} as a tree structure. Format the response as JSON with the following structure: { "files": [{ "name": string, "path": string, "is_dir": boolean, "children": [] }] }`,
        });

        // Try to parse JSON from the response
        const content = response.content;
        const jsonMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.files as FileNode[];
        }

        // Fallback: parse simple file listing
        return parseSimpleFileListing(content, workingDir);
      } catch (error) {
        console.error("Error fetching file tree:", error);
        throw error;
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Load file content
  const loadFile = useCallback(
    async (path: string) => {
      try {
        const response = await sendMessage({
          session_id: sessionId,
          message: `Read the contents of file: ${path}. Return only the file content without any explanation.`,
        });

        setSelectedFile({
          path,
          content: extractFileContent(response.content),
        });
      } catch (error) {
        console.error("Error loading file:", error);
        throw error;
      }
    },
    [sessionId],
  );

  // Save file mutation
  const saveFileMutation = useMutation({
    mutationFn: async ({
      path,
      content,
    }: {
      path: string;
      content: string;
    }) => {
      const response = await sendMessage({
        session_id: sessionId,
        message: `Write the following content to file ${path}:\n\n${content}\n\nConfirm when done.`,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fileTree", sessionId, workingDir],
      });
    },
  });

  const saveFile = useCallback(
    async (path: string, content: string) => {
      try {
        await saveFileMutation.mutateAsync({ path, content });
        // Update selected file content
        if (selectedFile?.path === path) {
          setSelectedFile({ path, content });
        }
      } catch (error) {
        console.error("Error saving file:", error);
        throw error;
      }
    },
    [saveFileMutation, selectedFile],
  );

  const refreshTree = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["fileTree", sessionId, workingDir],
    });
  }, [queryClient, sessionId, workingDir]);

  return {
    fileTree,
    isLoading,
    error: error as Error | null,
    selectedFile,
    loadFile,
    saveFile,
    refreshTree,
  };
}

/**
 * Extract file content from agent response
 * Removes markdown code blocks and explanatory text
 */
function extractFileContent(response: string): string {
  // Remove markdown code blocks
  const codeBlockMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }

  // If no code block, return the full response (might be plain text file)
  return response.trim();
}

/**
 * Parse simple file listing from agent response
 * Fallback when JSON parsing fails
 */
function parseSimpleFileListing(
  content: string,
  workingDir: string,
): FileNode[] {
  const lines = content.split("\n").filter((line) => line.trim());
  const nodes: FileNode[] = [];

  for (const line of lines) {
    // Look for file paths in the response
    const pathMatch = line.match(/(?:^|\s)([\w\-./]+\.\w+|\w+\/)/);
    if (pathMatch) {
      const path = pathMatch[1];
      const isDir = path.endsWith("/");
      const name = path.split("/").filter(Boolean).pop() || path;

      nodes.push({
        name: isDir ? name.slice(0, -1) : name,
        path: path.startsWith("/") ? path : `${workingDir}/${path}`,
        is_dir: isDir,
        children: isDir ? [] : undefined,
      });
    }
  }

  return nodes;
}
