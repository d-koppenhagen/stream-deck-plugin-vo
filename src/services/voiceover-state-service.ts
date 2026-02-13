import streamDeck from "@elgato/streamdeck";

import { CommandService } from "./command-service.js";

/** Minimum allowed speech rate. */
export const SPEECH_RATE_MIN = 1;

/** Maximum allowed speech rate. */
export const SPEECH_RATE_MAX = 100;

/** Default increment/decrement step for speech rate adjustments. */
export const SPEECH_RATE_INCREMENT = 10;

/**
 * Clamps a value to the valid speech rate range [SPEECH_RATE_MIN, SPEECH_RATE_MAX].
 */
export function clampRate(rate: number): number {
  return Math.max(SPEECH_RATE_MIN, Math.min(SPEECH_RATE_MAX, rate));
}

/**
 * Service that manages VoiceOver state (running status and speech rate).
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
   * Reads the current VoiceOver speech rate.
   */
  async getSpeechRate(): Promise<number> {
    const result = await this.commandService.executeAppleScript(
      'tell application "VoiceOver" to get rate of (get default output)',
    );

    if (!result.success) {
      this.logger.error(`Failed to get speech rate: ${result.error}`);
      throw new Error(`Failed to get speech rate: ${result.error}`);
    }

    const rate = Number(result.output);
    if (Number.isNaN(rate)) {
      this.logger.error(`Invalid speech rate value: ${result.output}`);
      throw new Error(`Invalid speech rate value: ${result.output}`);
    }

    return rate;
  }

  /**
   * Sets the VoiceOver speech rate, clamped to [SPEECH_RATE_MIN, SPEECH_RATE_MAX].
   * @param rate - The desired speech rate.
   * @returns The actual speech rate after clamping and applying.
   */
  async setSpeechRate(rate: number): Promise<number> {
    const clamped = clampRate(rate);

    const result = await this.commandService.executeAppleScript(
      `tell application "VoiceOver" to set rate of (get default output) to ${clamped}`,
    );

    if (!result.success) {
      this.logger.error(`Failed to set speech rate: ${result.error}`);
      throw new Error(`Failed to set speech rate: ${result.error}`);
    }

    return clamped;
  }

  /**
   * Increases the speech rate by the given increment (default: SPEECH_RATE_INCREMENT).
   * The result is clamped to SPEECH_RATE_MAX.
   * @returns The new speech rate after the increase.
   */
  async increaseSpeechRate(increment: number = SPEECH_RATE_INCREMENT): Promise<number> {
    const current = await this.getSpeechRate();
    return this.setSpeechRate(current + increment);
  }

  /**
   * Decreases the speech rate by the given decrement (default: SPEECH_RATE_INCREMENT).
   * The result is clamped to SPEECH_RATE_MIN.
   * @returns The new speech rate after the decrease.
   */
  async decreaseSpeechRate(decrement: number = SPEECH_RATE_INCREMENT): Promise<number> {
    const current = await this.getSpeechRate();
    return this.setSpeechRate(current - decrement);
  }
}
