import streamDeck, {
  action,
  KeyDownEvent,
  SingletonAction,
} from "@elgato/streamdeck";

import { CommandService } from "../services/command-service.js";
import { VoiceOverStateService } from "../services/voiceover-state-service.js";

/**
 * Stream Deck action that opens the VoiceOver Utility settings.
 * Always available, regardless of whether VoiceOver is running.
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

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      await this.stateService.openSettings();
    } catch (error) {
      this.logger.error("Open settings failed", error);
    }
  }
}
