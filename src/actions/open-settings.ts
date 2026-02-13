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
 * Stream Deck action that opens the VoiceOver Utility settings.
 */
@action({ UUID: "com.voiceover-streamdeck.open-settings" })
export class OpenSettingsAction extends SingletonAction {
  private readonly stateService: VoiceOverStateService;
  private readonly logger = streamDeck.logger.createScope("OpenSettingsAction");

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
      await this.stateService.openSettings();
    } catch (error) {
      this.logger.error("Open settings failed", error);
    }
  }
}
