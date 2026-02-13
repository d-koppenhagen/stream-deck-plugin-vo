import streamDeck, {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";

import { CommandService } from "../services/command-service.js";
import { VoiceOverStateService } from "../services/voiceover-state-service.js";
import { isRotorOpen, setRotorOpen } from "../services/rotor-state.js";
import { voiceOverMonitor } from "../services/voiceover-monitor.js";

/**
 * Stream Deck action that toggles VoiceOver on or off.
 *
 * If the rotor is currently open, it is closed first (via Escape)
 * before toggling VoiceOver off.
 */
@action({ UUID: "com.voiceover-streamdeck.toggle" })
export class ToggleVoiceOverAction extends SingletonAction {
  private readonly commandService: CommandService;
  private readonly stateService: VoiceOverStateService;
  private readonly logger = streamDeck.logger.createScope("ToggleVoiceOverAction");

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
      if (isRotorOpen()) {
        await this.commandService.simulateKeyPress({ keyCode: 53, modifiers: [] });
        setRotorOpen(false);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      await this.stateService.toggle();
      await voiceOverMonitor.refresh();
    } catch (error) {
      this.logger.error("VoiceOver toggle failed", error);
    }
  }
}
