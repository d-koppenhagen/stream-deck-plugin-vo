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
 * Stream Deck action that moves focus to the next focusable item
 * by sending the Tab key press (key code 48).
 */
@action({ UUID: "com.voiceover-streamdeck.next-focusable" })
export class NextFocusableAction extends SingletonAction {
  private readonly commandService: CommandService;
  private readonly stateService: VoiceOverStateService;
  private readonly logger = streamDeck.logger.createScope("NextFocusableAction");

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

      const result = await this.commandService.simulateKeyPress({ keyCode: 48, modifiers: [] });
      if (!result.success) {
        this.logger.error(`Failed to focus next item: ${result.error}`);
      }
    } catch (error) {
      this.logger.error("Next focusable failed", error);
    }
  }
}
