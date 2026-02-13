import streamDeck from "@elgato/streamdeck";
import { execFile } from "node:child_process";

import { CommandService } from "./command-service.js";

/**
 * Service that manages VoiceOver state (running status).
 * All system interactions are delegated to the injected CommandService.
 */
export class VoiceOverStateService {
  private readonly logger = streamDeck.logger.createScope("VoiceOverStateService");

  constructor(private readonly commandService: CommandService) {}

  /**
   * Checks whether VoiceOver is currently enabled by reading the
   * macOS accessibility preference. This is instant and reliable
   * across all macOS versions.
   */
  async isRunning(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      execFile(
        "defaults",
        ["read", "com.apple.universalaccess", "voiceOverOnOffKey"],
        { timeout: 2000 },
        (error, stdout) => {
          if (error) {
            resolve(false);
            return;
          }
          resolve(stdout.trim() === "1");
        },
      );
    });
  }

  /**
   * Toggles VoiceOver on or off by simulating Cmd+F5.
   * Returns the expected new state immediately without polling,
   * since the caller (monitor) handles state verification.
   * @returns The expected new VoiceOver running state.
   */
  async toggle(): Promise<boolean> {
    const wasPreviouslyRunning = await this.isRunning();

    const result = await this.commandService.simulateKeyPress({
      keyCode: 96,
      modifiers: ["command"],
    });

    if (!result.success) {
      this.logger.error(`Failed to toggle VoiceOver: ${result.error}`);
      throw new Error(`Failed to toggle VoiceOver: ${result.error}`);
    }

    return !wasPreviouslyRunning;
  }

  /**
   * Opens the VoiceOver Utility settings application.
   */
  async openSettings(): Promise<void> {
    const result = await this.commandService.executeAppleScript(
      'tell application "VoiceOver Utility" to activate',
    );

    if (!result.success) {
      this.logger.error(`Failed to open VoiceOver settings: ${result.error}`);
      throw new Error(`Failed to open VoiceOver settings: ${result.error}`);
    }
  }
}
