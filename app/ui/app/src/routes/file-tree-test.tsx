import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { FileNode } from "@/types/dgd";
import { FileTree } from "@/components/files/FileTree";

const mockFileTree: FileNode[] = [
  {
    name: "src",
    path: "/src",
    is_dir: true,
    children: [
      {
        name: "components",
        path: "/src/components",
        is_dir: true,
        children: [
          {
            name: "Button.tsx",
            path: "/src/components/Button.tsx",
            is_dir: false,
          },
          {
            name: "Input.tsx",
            path: "/src/components/Input.tsx",
            is_dir: false,
          },
          { name: "Card.tsx", path: "/src/components/Card.tsx", is_dir: false },
        ],
      },
      {
        name: "utils",
        path: "/src/utils",
        is_dir: true,
        children: [
          { name: "helpers.ts", path: "/src/utils/helpers.ts", is_dir: false },
          { name: "api.ts", path: "/src/utils/api.ts", is_dir: false },
        ],
      },
      { name: "index.tsx", path: "/src/index.tsx", is_dir: false },
      { name: "App.tsx", path: "/src/App.tsx", is_dir: false },
    ],
  },
  {
    name: "public",
    path: "/public",
    is_dir: true,
    children: [
      { name: "logo.png", path: "/public/logo.png", is_dir: false },
      { name: "favicon.ico", path: "/public/favicon.ico", is_dir: false },
    ],
  },
  {
    name: "docs",
    path: "/docs",
    is_dir: true,
    children: [
      { name: "README.md", path: "/docs/README.md", is_dir: false },
      { name: "API.md", path: "/docs/API.md", is_dir: false },
    ],
  },
  { name: "package.json", path: "/package.json", is_dir: false },
  { name: "tsconfig.json", path: "/tsconfig.json", is_dir: false },
  { name: ".gitignore", path: "/.gitignore", is_dir: false },
];

function FileTreeTest() {
  const [selectedPath, setSelectedPath] = useState<string>();

  const handleSelect = (node: FileNode) => {
    setSelectedPath(node.path);
    console.log("Selected:", node);
  };

  return (
    <div className="min-h-screen bg-dojo-bg-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-dojo-text-primary mb-6">
          File Tree Component Test
        </h1>

        <div className="bg-dojo-bg-secondary/50 backdrop-blur-dojo rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-dojo-text-primary mb-4">
            File Explorer
          </h2>

          <div className="bg-dojo-bg-primary/30 rounded-lg border border-white/10 h-[500px] overflow-hidden">
            <FileTree
              nodes={mockFileTree}
              selectedPath={selectedPath}
              onSelect={handleSelect}
            />
          </div>

          {selectedPath && (
            <div className="mt-4 p-4 bg-dojo-accent-primary/10 border border-dojo-accent-primary/30 rounded-lg">
              <p className="text-sm text-dojo-text-secondary">
                <span className="font-semibold text-dojo-text-primary">
                  Selected:
                </span>{" "}
                <code className="font-mono text-dojo-accent-primary">
                  {selectedPath}
                </code>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-dojo-bg-secondary/30 backdrop-blur-dojo rounded-lg border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-dojo-text-primary mb-2">
            Features:
          </h3>
          <ul className="space-y-1 text-sm text-dojo-text-secondary">
            <li>✅ Recursive file tree structure</li>
            <li>✅ Folder expand/collapse with chevron animation</li>
            <li>✅ File type icons (folders, code files, images, etc.)</li>
            <li>✅ Click to select files/folders</li>
            <li>✅ Indent by depth</li>
            <li>✅ Glassmorphism design</li>
            <li>✅ Hover and selection effects</li>
            <li>✅ Smooth animations (Framer Motion)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/file-tree-test")({
  component: FileTreeTest,
});
