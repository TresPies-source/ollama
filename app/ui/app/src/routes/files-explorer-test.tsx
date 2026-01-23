import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileExplorer } from "@/components/files/FileExplorer";
import type { FileNode } from "@/types/dgd";

export const Route = createFileRoute("/files-explorer-test")({
  component: FileExplorerTestPage,
});

// Mock file tree data
const mockFileTree: FileNode[] = [
  {
    name: ".dgd",
    path: "~/.dgd",
    is_dir: true,
    children: [
      {
        name: "workspace",
        path: "~/.dgd/workspace",
        is_dir: true,
        children: [
          {
            name: "test.md",
            path: "~/.dgd/workspace/test.md",
            is_dir: false,
          },
          {
            name: "example.js",
            path: "~/.dgd/workspace/example.js",
            is_dir: false,
          },
          {
            name: "config.json",
            path: "~/.dgd/workspace/config.json",
            is_dir: false,
          },
        ],
      },
      {
        name: "seeds",
        path: "~/.dgd/seeds",
        is_dir: true,
        children: [
          {
            name: "memory.md",
            path: "~/.dgd/seeds/memory.md",
            is_dir: false,
          },
        ],
      },
    ],
  },
  {
    name: "README.md",
    path: "~/README.md",
    is_dir: false,
  },
];

const mockFileContents: Record<string, string> = {
  "~/.dgd/workspace/test.md":
    "# Test File\n\nThis is a test markdown file.\n\n## Features\n\n- Code highlighting\n- Auto-save\n- Glassmorphism design",
  "~/.dgd/workspace/example.js":
    "// Example JavaScript file\nfunction hello() {\n  console.log('Hello, Dojo Genesis!');\n}\n\nhello();",
  "~/.dgd/workspace/config.json":
    '{\n  "name": "dojo-genesis",\n  "version": "0.1.0",\n  "theme": "glassmorphism"\n}',
  "~/.dgd/seeds/memory.md":
    "---\nname: Memory Management\ndescription: Context Iceberg pattern\ncategory: architecture\ntags: [memory, performance]\n---\n\n# Memory Management\n\nUse the 4-tier Context Iceberg...",
  "~/README.md":
    "# Dojo Genesis Desktop\n\nA powerful desktop application for AI-assisted development.",
};

function FileExplorerTestPage() {
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    content: string;
  } | null>(null);

  const handleFileSelect = (node: FileNode) => {
    if (!node.is_dir && mockFileContents[node.path]) {
      setSelectedFile({
        path: node.path,
        content: mockFileContents[node.path],
      });
    }
  };

  const handleFileSave = (path: string, content: string) => {
    console.log("Save file:", path, content);
    mockFileContents[path] = content;
    if (selectedFile?.path === path) {
      setSelectedFile({ path, content });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dojo-bg-primary">
      <div className="flex items-center justify-between px-6 py-4 bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-dojo-text-primary">
            File Explorer Test
          </h1>
          <p className="text-sm text-dojo-text-secondary mt-1">
            Testing split-view layout with mock data
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <FileExplorer
          fileTree={mockFileTree}
          selectedPath={selectedFile?.path}
          selectedContent={selectedFile?.content}
          onSelectFile={handleFileSelect}
          onSaveFile={handleFileSave}
        />
      </div>
    </div>
  );
}
