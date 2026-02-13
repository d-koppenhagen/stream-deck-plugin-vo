import { describe, it, expect, vi, beforeEach } from "vitest";

import { NextElementAction } from "./next-element.js";
import type { CommandService, CommandResult } from "../services/command-service.js";
import type { VoiceOverStateService } from "../services/voiceover-state-service.js";

// Mock the Stream Deck SDK.
vi.mock("@elgato/streamdeck", () => ({
  default: {
    logger: {
      createScope: () => ({
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }),
    },
  },
  action: () => (_target: unknown) => {},
  SingletonAction: class {},
}));

// Mock the services so the constructor doesn't create real instances.
vi.mock("../services/command-service", () => ({
  CommandService: class {},
}));

vi.mock("../services/voiceover-state-service", () => ({
  VoiceOverStateService: class {},
}));

function createMockCommandService(): CommandService {
  return {
    executeAppleScript: vi.fn<() => Promise<CommandResult>>(),
    simulateKeyPress: vi.fn<() => Promise<CommandResult>>(),
  } as unknown as CommandService;
}

function createMockStateService(): VoiceOverStateService {
  return {
    isRunning: vi.fn<() => Promise<boolean>>(),
    toggle: vi.fn<() => Promise<boolean>>(),
    getSpeechRate: vi.fn<() => Promise<number>>(),
    setSpeechRate: vi.fn<() => Promise<number>>(),
    increaseSpeechRate: vi.fn<() => Promise<number>>(),
    decreaseSpeechRate: vi.fn<() => Promise<number>>(),
  } as unknown as VoiceOverStateService;
}

function createMockKeyDownEvent() {
  return {
    action: { setState: vi.fn() },
    payload: { isInMultiAction: false, settings: {} },
  } as unknown as Parameters<NextElementAction["onKeyDown"]>[0];
}

describe("NextElementAction", () => {
  let actionInstance: NextElementAction;
  let mockCommandService: CommandService;
  let mockStateService: VoiceOverStateService;

  beforeEach(() => {
    actionInstance = new NextElementAction();
    mockCommandService = createMockCommandService();
    mockStateService = createMockStateService();

    // Inject mock services.
    const instance = actionInstance as unknown as {
      commandService: CommandService;
      stateService: VoiceOverStateService;
    };
    instance.commandService = mockCommandService;
    instance.stateService = mockStateService;
  });

  describe("onKeyDown", () => {
    it("sends VO+Right Arrow when VoiceOver is running", async () => {
      vi.mocked(mockStateService.isRunning).mockResolvedValue(true);
      vi.mocked(mockCommandService.simulateKeyPress).mockResolvedValue({
        success: true,
      });
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockStateService.isRunning).toHaveBeenCalledOnce();
      expect(mockCommandService.simulateKeyPress).toHaveBeenCalledWith({
        keyCode: 124,
        modifiers: ["control", "option"],
      });
    });

    it("does nothing when VoiceOver is not running", async () => {
      vi.mocked(mockStateService.isRunning).mockResolvedValue(false);
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockStateService.isRunning).toHaveBeenCalledOnce();
      expect(mockCommandService.simulateKeyPress).not.toHaveBeenCalled();
    });

    it("does not throw when simulateKeyPress fails", async () => {
      vi.mocked(mockStateService.isRunning).mockResolvedValue(true);
      vi.mocked(mockCommandService.simulateKeyPress).mockResolvedValue({
        success: false,
        error: "key press failed",
      });
      const ev = createMockKeyDownEvent();

      await expect(actionInstance.onKeyDown(ev)).resolves.toBeUndefined();
    });

    it("does not throw when isRunning throws", async () => {
      vi.mocked(mockStateService.isRunning).mockRejectedValue(
        new Error("system error"),
      );
      const ev = createMockKeyDownEvent();

      await expect(actionInstance.onKeyDown(ev)).resolves.toBeUndefined();
      expect(mockCommandService.simulateKeyPress).not.toHaveBeenCalled();
    });
  });
});
