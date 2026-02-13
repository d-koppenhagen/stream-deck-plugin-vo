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
 * Stream Deck action that toggles the VoiceOver Rotor.
 *
 * - First press: opens the rotor via VO+U
 * - Second press: closes the rotor via Escape
 *
 * When VoiceOver is not running, the action is a graceful no-op.
 */
@action({ UUID: "com.voiceover-streamdeck.open-rotor" })
export class OpenRotorAction extends SingletonAction {
  private readonly commandService: CommandService;
  private readonly stateService: VoiceOverStateService;
  private readonly logger = streamDeck.logger.createScope("OpenRotorAction");

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

      if (isRotorOpen()) {
        const result = await this.commandService.simulateKeyPress({ keyCode: 53, modifiers: [] });
        if (!result.success) {
          this.logger.error(`Failed to close rotor: ${result.error}`);
          return;
        }
        setRotorOpen(false);
      } else {
        const result = await this.commandService.simulateKeyPress({
          keyCode: 32,
          modifiers: ["control", "option"],
        });
        if (!result.success) {
          this.logger.error(`Failed to open rotor: ${result.error}`);
          return;
        }
        setRotorOpen(true);
      }

      await voiceOverMonitor.refresh();
    } catch (error) {
      this.logger.error("Rotor toggle failed", error);
    }
  }
}
