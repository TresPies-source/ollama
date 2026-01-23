import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import type { Extension } from "@codemirror/state";

export function getLanguageExtension(filename: string): Extension | null {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
    case "jsx":
      return javascript({ jsx: true });
    case "ts":
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    case "py":
      return python();
    case "md":
    case "markdown":
      return markdown();
    case "json":
      return json();
    case "html":
    case "htm":
      return html();
    case "css":
      return css();
    default:
      return null;
  }
}

export function getLanguageName(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
    case "jsx":
      return "JavaScript";
    case "ts":
    case "tsx":
      return "TypeScript";
    case "py":
      return "Python";
    case "md":
    case "markdown":
      return "Markdown";
    case "json":
      return "JSON";
    case "html":
    case "htm":
      return "HTML";
    case "css":
      return "CSS";
    default:
      return "Text";
  }
}
