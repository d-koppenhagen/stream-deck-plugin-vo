import streamDeck, {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";

import { CommandService } from "../services/command-service.js";
import { VoiceOverStateService } from "../services/voiceover-state-service.js";
import { voiceOverMonitor } from "../services/voiceover-monitor.js";

/**
 * Stream Deck action that decreases the VoiceOver speech rate.
 */
@action({ UUID: "com.voiceover-streamdeck.speed-down" })
export class SpeedDownAction extends SingletonAction {
  private readonly stateService: VoiceOverStateService;
  private readonly logger = streamDeck.logger.createScope("SpeedDownAction");

  constructor() {
    super();
    const commandService = new CommandService();
    this.stateService = new VoiceOverStateService(commandService);
  }

  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    voiceOverMonitor.trackAction(ev.action.id, ev.action.manifestId, ev.action);
  }

  override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
    voiceOverMonitor.untrackAction(ev.action.id);
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      const running = await this.stateService.isRunning();
      if (!running) return;
      await this.stateService.decreaseSpeechRate();
    } catch (error) {
      this.logger.error("Speed down failed", error);
    }
  }
}
