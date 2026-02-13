import { execFile } from "node:child_process";
import streamDeck from "@elgato/streamdeck";

/**
 * Result of a command execution.
 */
export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Represents a key combination with a key code and optional modifiers.
 */
export interface KeyCombination {
  keyCode: number;
  modifiers: ("control" | "option" | "command" | "shift")[];
}

/** Timeout in milliseconds for all command executions. */
const COMMAND_TIMEOUT_MS = 5000;

/**
 * Central service for executing macOS system commands via AppleScript.
 * All VoiceOver interactions are routed through this service to ensure
 * unified error handling, logging, and testability.
 */
export class CommandService {
  private readonly logger = streamDeck.logger.createScope("CommandService");

  /**
   * Executes an AppleScript string via `osascript -e`.
   * @param script - The AppleScript source to execute.
   * @returns A CommandResult indicating success or failure.
   */
  async executeAppleScript(script: string): Promise<CommandResult> {
    return new Promise<CommandResult>((resolve) => {
      execFile(
        "osascript",
        ["-e", script],
        { timeout: COMMAND_TIMEOUT_MS },
        (error, stdout, stderr) => {
          if (error) {
            const message = stderr?.trim() || error.message;
            this.logger.error(`AppleScript execution failed: ${message}`);
            resolve({ success: false, error: message });
            return;
          }

          resolve({ success: true, output: stdout.trim() });
        },
      );
    });
  }

  /**
   * Simulates a key press with optional modifiers via System Events AppleScript.
   * @param keys - The key combination to simulate.
   * @returns A CommandResult indicating success or failure.
   */
  async simulateKeyPress(keys: KeyCombination): Promise<CommandResult> {
    const script = this.buildKeyPressScript(keys);
    return this.executeAppleScript(script);
  }

  /**
   * Builds an AppleScript string that simulates a key press via System Events.
   */
  private buildKeyPressScript(keys: KeyCombination): string {
    const { keyCode, modifiers } = keys;

    if (modifiers.length === 0) {
      return `tell application "System Events" to key code ${keyCode}`;
    }

    const modifierList = modifiers
      .map((mod) => `${mod} down`)
      .join(", ");

    return `tell application "System Events" to key code ${keyCode} using {${modifierList}}`;
  }
}
