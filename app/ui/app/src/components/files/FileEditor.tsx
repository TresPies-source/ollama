import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { getLanguageExtension, getLanguageName } from "@/utils/editorLanguage";

interface FileEditorProps {
  filename: string;
  content: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  readOnly?: boolean;
}

export function FileEditor({
  filename,
  content,
  onChange,
  onSave,
  readOnly = false,
}: FileEditorProps) {
  const [value, setValue] = useState(content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const originalContentRef = useRef(content);

  // Reset editor state when filename or content changes from parent
  useEffect(() => {
    setValue(content);
    originalContentRef.current = content;
    setHasUnsavedChanges(false);
  }, [filename, content]);

  useEffect(() => {
    setHasUnsavedChanges(value !== originalContentRef.current);
  }, [value]);

  const handleChange = (val: string) => {
    setValue(val);
  };

  const handleBlur = () => {
    if (hasUnsavedChanges && onSave && !readOnly) {
      onSave(value);
      originalContentRef.current = value;
      setHasUnsavedChanges(false);
    }
    onChange?.(value);
  };

  const languageExtension = getLanguageExtension(filename);
  const languageName = getLanguageName(filename);
  const extensions = languageExtension ? [languageExtension] : [];

  return (
    <div className="h-full flex flex-col bg-dojo-bg-secondary/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-dojo-bg-secondary/30 border-b border-dojo-accent-primary/20">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-dojo-text-primary">
            {filename}
          </span>
          {hasUnsavedChanges && (
            <span
              className="w-2 h-2 rounded-full bg-dojo-accent-primary animate-pulse"
              title="Unsaved changes"
            />
          )}
        </div>
        <span className="text-xs text-dojo-text-tertiary">{languageName}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={value}
          height="100%"
          theme={dojoGenesisTheme}
          extensions={extensions}
          onChange={handleChange}
          onBlur={handleBlur}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}

const dojoGenesisTheme = EditorView.theme(
  {
    "&": {
      color: "#ffffff",
      backgroundColor: "rgba(15, 42, 61, 0.3)",
      height: "100%",
      fontFamily: "JetBrains Mono, ui-monospace, Courier New, monospace",
    },
    ".cm-content": {
      caretColor: "#f4a261",
      padding: "16px 0",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#f4a261",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "rgba(244, 162, 97, 0.3)",
      },
    ".cm-activeLine": {
      backgroundColor: "rgba(244, 162, 97, 0.05)",
    },
    ".cm-gutters": {
      backgroundColor: "rgba(10, 30, 46, 0.5)",
      color: "#8a9fb8",
      border: "none",
      borderRight: "1px solid rgba(244, 162, 97, 0.2)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(244, 162, 97, 0.1)",
      color: "#f4a261",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 16px 0 8px",
      minWidth: "40px",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "rgba(244, 162, 97, 0.2)",
      border: "1px solid rgba(244, 162, 97, 0.3)",
      color: "#f4a261",
    },
    ".cm-tooltip": {
      backgroundColor: "rgba(15, 42, 61, 0.95)",
      border: "1px solid rgba(244, 162, 97, 0.3)",
      backdropFilter: "blur(12px)",
      color: "#ffffff",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: "rgba(244, 162, 97, 0.2)",
        color: "#f4a261",
      },
    },
    ".cm-searchMatch": {
      backgroundColor: "rgba(244, 162, 97, 0.2)",
      outline: "1px solid rgba(244, 162, 97, 0.3)",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "rgba(244, 162, 97, 0.4)",
    },
    ".cm-panels": {
      backgroundColor: "rgba(10, 30, 46, 0.8)",
      color: "#ffffff",
      borderTop: "1px solid rgba(244, 162, 97, 0.2)",
    },
    ".cm-panel input": {
      backgroundColor: "rgba(15, 42, 61, 0.7)",
      border: "1px solid rgba(244, 162, 97, 0.2)",
      color: "#ffffff",
      padding: "4px 8px",
      borderRadius: "6px",
    },
    ".cm-panel input:focus": {
      outline: "none",
      borderColor: "#f4a261",
    },
    ".cm-scroller": {
      fontFamily: "JetBrains Mono, ui-monospace, Courier New, monospace",
      lineHeight: "1.6",
    },
  },
  { dark: true },
);
