import streamDeck from "@elgato/streamdeck";

import { CommandService } from "./command-service.js";

/**
 * Service that manages VoiceOver state (running status).
 * All system interactions are delegated to the injected CommandService.
 */
export class VoiceOverStateService {
  private readonly logger = streamDeck.logger.createScope("VoiceOverStateService");

  constructor(private readonly commandService: CommandService) {}

  /**
   * Checks whether VoiceOver is currently running.
   */
  async isRunning(): Promise<boolean> {
    const result = await this.commandService.executeAppleScript(
      'tell application "System Events" to return (name of processes) contains "VoiceOver"',
    );

    if (!result.success) {
      this.logger.error(`Failed to check VoiceOver status: ${result.error}`);
      return false;
    }

    return result.output === "true";
  }

  /**
   * Toggles VoiceOver on or off by simulating Cmd+F5.
   * @returns The new VoiceOver running state after the toggle.
   */
  async toggle(): Promise<boolean> {
    const result = await this.commandService.simulateKeyPress({
      keyCode: 96,
      modifiers: ["command"],
    });

    if (!result.success) {
      this.logger.error(`Failed to toggle VoiceOver: ${result.error}`);
      throw new Error(`Failed to toggle VoiceOver: ${result.error}`);
    }

    return this.isRunning();
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
