import { createFileRoute } from "@tanstack/react-router";
import { FileEditor } from "@/components/files/FileEditor";
import { useState } from "react";

export const Route = createFileRoute("/files-test")({
  component: FilesTestPage,
});

function FilesTestPage() {
  const [pythonCode, setPythonCode] = useState(`def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Test the function
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`);

  const [jsCode, setJsCode] = useState(`function fibonacci(n) {
  // Calculate the nth Fibonacci number
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Test the function
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`);

  const [markdown, setMarkdown] = useState(`# File Editor Test

This is a test of the **FileEditor** component with glassmorphism design.

## Features

- Syntax highlighting for multiple languages
- Glass background theme
- Auto-save on blur
- Unsaved indicator (pulsing dot)
- JetBrains Mono font

## Supported Languages

- JavaScript/TypeScript
- Python
- Markdown
- JSON
- HTML
- CSS

\`\`\`javascript
console.log('Hello, Dojo Genesis!');
\`\`\`
`);

  return (
    <div className="h-screen bg-gradient-ocean p-4">
      <div className="h-full flex flex-col gap-4">
        <div className="glass rounded-lg p-4">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            File Editor Component Test
          </h1>
          <p className="text-text-secondary">
            Testing CodeMirror integration with Dojo Genesis glassmorphism theme
          </p>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
          <div className="glass rounded-lg overflow-hidden">
            <FileEditor
              filename="fibonacci.py"
              content={pythonCode}
              onChange={setPythonCode}
              onSave={(value) => console.log("Saved Python:", value)}
            />
          </div>

          <div className="glass rounded-lg overflow-hidden">
            <FileEditor
              filename="fibonacci.js"
              content={jsCode}
              onChange={setJsCode}
              onSave={(value) => console.log("Saved JS:", value)}
            />
          </div>

          <div className="glass rounded-lg overflow-hidden">
            <FileEditor
              filename="README.md"
              content={markdown}
              onChange={setMarkdown}
              onSave={(value) => console.log("Saved Markdown:", value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
