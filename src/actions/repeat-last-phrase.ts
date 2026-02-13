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
 * Stream Deck action that repeats the last spoken VoiceOver phrase
 * by sending the VO+Z key press (Ctrl+Option+Z, key code 6).
 */
@action({ UUID: "com.voiceover-streamdeck.repeat-last-phrase" })
export class RepeatLastPhraseAction extends SingletonAction {
  private readonly commandService: CommandService;
  private readonly stateService: VoiceOverStateService;
  private readonly logger = streamDeck.logger.createScope("RepeatLastPhraseAction");

  constructor() {
    super();
    this.commandService = new CommandService();
    this.stateService = new VoiceOverStateService(this.commandService);
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

      const result = await this.commandService.simulateKeyPress({ keyCode: 6, modifiers: ["control", "option"] });
      if (!result.success) {
        this.logger.error(`Failed to repeat last phrase: ${result.error}`);
      }
    } catch (error) {
      this.logger.error("Repeat last phrase failed", error);
    }
  }
}
