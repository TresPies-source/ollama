/**
 * Command System
 * 
 * Exports for the command registry and command palette system.
 */

export {
  commandRegistry,
  registerDefaultCommands,
  getAllCommands,
  executeCommand,
  setCommandAction,
} from "./registry";

export type { Command, CommandCategory } from "./types";

export { getPlatform, getShortcut, formatShortcut } from "./types";
