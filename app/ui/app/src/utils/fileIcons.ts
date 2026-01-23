import {
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  PhotoIcon,
  DocumentIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType } from "react";

const extensionMap: Record<string, ComponentType<{ className?: string }>> = {
  // Code files
  js: CodeBracketIcon,
  jsx: CodeBracketIcon,
  ts: CodeBracketIcon,
  tsx: CodeBracketIcon,
  py: CodeBracketIcon,
  go: CodeBracketIcon,
  rs: CodeBracketIcon,
  java: CodeBracketIcon,
  c: CodeBracketIcon,
  cpp: CodeBracketIcon,
  h: CodeBracketIcon,
  hpp: CodeBracketIcon,
  cs: CodeBracketIcon,
  php: CodeBracketIcon,
  rb: CodeBracketIcon,
  swift: CodeBracketIcon,
  kt: CodeBracketIcon,
  scala: CodeBracketIcon,

  // Markup/Config
  html: DocumentTextIcon,
  css: DocumentTextIcon,
  scss: DocumentTextIcon,
  less: DocumentTextIcon,
  xml: DocumentTextIcon,
  json: DocumentTextIcon,
  yaml: DocumentTextIcon,
  yml: DocumentTextIcon,
  toml: DocumentTextIcon,
  ini: DocumentTextIcon,
  cfg: DocumentTextIcon,
  conf: DocumentTextIcon,

  // Documentation
  md: DocumentTextIcon,
  mdx: DocumentTextIcon,
  txt: DocumentTextIcon,
  rst: DocumentTextIcon,

  // Images
  png: PhotoIcon,
  jpg: PhotoIcon,
  jpeg: PhotoIcon,
  gif: PhotoIcon,
  svg: PhotoIcon,
  webp: PhotoIcon,
  ico: PhotoIcon,

  // Video
  mp4: FilmIcon,
  webm: FilmIcon,
  mov: FilmIcon,
  avi: FilmIcon,

  // Audio
  mp3: MusicalNoteIcon,
  wav: MusicalNoteIcon,
  ogg: MusicalNoteIcon,
  flac: MusicalNoteIcon,

  // Archives
  zip: ArchiveBoxIcon,
  tar: ArchiveBoxIcon,
  gz: ArchiveBoxIcon,
  rar: ArchiveBoxIcon,
  "7z": ArchiveBoxIcon,
};

export function getFileIcon(
  filename: string,
  isDirectory: boolean = false,
): ComponentType<{ className?: string }> {
  if (isDirectory) {
    return FolderIcon;
  }

  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) {
    return DocumentIcon;
  }

  return extensionMap[ext] || DocumentIcon;
}

export function getFolderIcon(
  isOpen: boolean,
): ComponentType<{ className?: string }> {
  return isOpen ? FolderOpenIcon : FolderIcon;
}
