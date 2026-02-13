import streamDeck, { type Action } from "@elgato/streamdeck";
import { CommandService } from "./command-service.js";
import { VoiceOverStateService } from "./voiceover-state-service.js";
import { setRotorOpen, isRotorOpen } from "./rotor-state.js";

/**
 * Manifest States:
 *   State 0 = Enabled (white icon)
 *   State 1 = Disabled (gray icon)
 *
 * For the rotor action, the "active" (inverted) look is applied via setImage
 * on top of state 0.
 */

const ACTIVE_IMAGES: Record<string, string> = {
  "com.voiceover-streamdeck.open-rotor": "imgs/actions/open-rotor-active",
};

const POLL_INTERVAL_MS = 1000;

/**
 * Monitors VoiceOver running state and updates all registered
 * Stream Deck action icons via setState (0=enabled, 1=disabled).
 */
export class VoiceOverMonitor {
  private readonly stateService: VoiceOverStateService;
  private readonly logger = streamDeck.logger.createScope("VoiceOverMonitor");
  private readonly trackedActions = new Map<string, { uuid: string; action: Action }>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastVoiceOverState: boolean | null = null;

  constructor() {
    const commandService = new CommandService();
    this.stateService = new VoiceOverStateService(commandService);
  }

  trackAction(actionId: string, uuid: string, action: Action): void {
    this.trackedActions.set(actionId, { uuid, action });

    // Set initial state to disabled for all actions except open-settings.
    if (action.isKey() && uuid !== "com.voiceover-streamdeck.open-settings") {
      action.setState(1).catch(() => {});
    }

    this.startPolling();
  }

  untrackAction(actionId: string): void {
    this.trackedActions.delete(actionId);
    if (this.trackedActions.size === 0) {
      this.stopPolling();
    }
  }

  async refresh(): Promise<void> {
    await this.poll();
  }

  /**
   * Update all actions using a known VoiceOver state, bypassing the poll.
   */
  async refreshWithState(voiceOverRunning: boolean): Promise<void> {
    this.lastVoiceOverState = voiceOverRunning;
    if (!voiceOverRunning) {
      setRotorOpen(false);
    }
    await this.updateAllActions(voiceOverRunning);
  }

  isVoiceOverActive(): boolean {
    return this.lastVoiceOverState === true;
  }

  private startPolling(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    this.poll();
  }

  private stopPolling(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const isRunning = await this.stateService.isRunning();

      if (this.lastVoiceOverState === true && !isRunning) {
        setRotorOpen(false);
      }

      this.lastVoiceOverState = isRunning;
      await this.updateAllActions(isRunning);
    } catch (error) {
      this.logger.error("Failed to poll VoiceOver state", error);
    }
  }

  private async updateAllActions(voiceOverRunning: boolean): Promise<void> {
    for (const [, { uuid, action }] of this.trackedActions) {
      try {
        if (!action.isKey()) continue;

        if (uuid === "com.voiceover-streamdeck.open-rotor") {
          // Rotor: state 0 when VO on, state 1 when VO off
          // Active image only when rotor is open
          if (!voiceOverRunning) {
            await action.setState(1);
            await action.setImage(undefined);
          } else if (isRotorOpen()) {
            await action.setState(0);
            await action.setImage(ACTIVE_IMAGES[uuid]);
          } else {
            await action.setState(0);
            await action.setImage(undefined);
          }
        } else if (uuid === "com.voiceover-streamdeck.open-settings") {
          // Settings: always state 0
        } else {
          // Toggle + all other actions: state 0 when VO on, state 1 when VO off
          await action.setState(voiceOverRunning ? 0 : 1);
        }
      } catch (error) {
        this.logger.error(`Failed to update action ${uuid}`, error);
      }
    }
  }
}

export const voiceOverMonitor = new VoiceOverMonitor();
