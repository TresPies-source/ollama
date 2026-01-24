import { useNavigate } from "@tanstack/react-router";
import { useShortcut } from "@/hooks/useShortcut";
import { useCommandPaletteContext } from "@/contexts/CommandPaletteContext";
import { setCommandAction } from "@/commands/registry";

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const { open: openCommandPalette } = useCommandPaletteContext();

  setCommandAction("view.command-palette", () => {
    openCommandPalette();
  });

  setCommandAction("settings.open", () => {
    navigate({ to: "/settings" });
  });

  setCommandAction("session.new", () => {
    navigate({ to: "/sessions" });
  });

  setCommandAction("nav.sessions", () => {
    navigate({ to: "/sessions" });
  });

  setCommandAction("nav.files", () => {
    navigate({ to: "/files" });
  });

  setCommandAction("nav.seeds", () => {
    navigate({ to: "/seeds" });
  });

  useShortcut("command-palette", () => {
    openCommandPalette();
  });

  useShortcut("open-settings", () => {
    navigate({ to: "/settings" });
  });

  useShortcut("new-session", () => {
    navigate({ to: "/sessions" });
  });

  useShortcut("go-to-sessions", () => {
    navigate({ to: "/sessions" });
  });

  useShortcut("go-to-files", () => {
    navigate({ to: "/files" });
  });

  useShortcut("go-to-seeds", () => {
    navigate({ to: "/seeds" });
  });

  useShortcut("close-session", (e) => {
    e.preventDefault();
    console.log("Close session shortcut - navigation back or close tab");
    window.history.back();
  });

  useShortcut("quit", (e) => {
    e.preventDefault();
    console.log("Quit shortcut - not available in web context");
  });

  return null;
}
