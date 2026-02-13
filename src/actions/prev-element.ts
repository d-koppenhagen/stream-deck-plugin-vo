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
 * Stream Deck action that navigates to the previous VoiceOver element
 * by sending VO+Left Arrow.
 */
@action({ UUID: "com.voiceover-streamdeck.prev-element" })
export class PrevElementAction extends SingletonAction {
  private readonly commandService: CommandService;
  private readonly stateService: VoiceOverStateService;
  private readonly logger = streamDeck.logger.createScope("PrevElementAction");

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

      const result = await this.commandService.simulateKeyPress({
        keyCode: 123,
        modifiers: ["control", "option"],
      });
      if (!result.success) {
        this.logger.error(`Failed to navigate to previous element: ${result.error}`);
      }
    } catch (error) {
      this.logger.error("Previous element navigation failed", error);
    }
  }
}
