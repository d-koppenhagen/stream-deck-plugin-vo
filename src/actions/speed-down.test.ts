import { describe, it, expect, vi, beforeEach } from "vitest";

import { SpeedDownAction } from "./speed-down";
import type { CommandService } from "../services/command-service";
import type { VoiceOverStateService } from "../services/voiceover-state-service";

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
  } as unknown as Parameters<SpeedDownAction["onKeyDown"]>[0];
}

describe("SpeedDownAction", () => {
  let actionInstance: SpeedDownAction;
  let mockStateService: VoiceOverStateService;

  beforeEach(() => {
    actionInstance = new SpeedDownAction();
    mockStateService = createMockStateService();

    // Inject mock service.
    const instance = actionInstance as unknown as {
      stateService: VoiceOverStateService;
    };
    instance.stateService = mockStateService;
  });

  describe("onKeyDown", () => {
    it("decreases speech rate when VoiceOver is running", async () => {
      vi.mocked(mockStateService.isRunning).mockResolvedValue(true);
      vi.mocked(mockStateService.decreaseSpeechRate).mockResolvedValue(40);
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockStateService.isRunning).toHaveBeenCalledOnce();
      expect(mockStateService.decreaseSpeechRate).toHaveBeenCalledOnce();
    });

    it("does nothing when VoiceOver is not running", async () => {
      vi.mocked(mockStateService.isRunning).mockResolvedValue(false);
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockStateService.isRunning).toHaveBeenCalledOnce();
      expect(mockStateService.decreaseSpeechRate).not.toHaveBeenCalled();
    });

    it("does not throw when decreaseSpeechRate fails", async () => {
      vi.mocked(mockStateService.isRunning).mockResolvedValue(true);
      vi.mocked(mockStateService.decreaseSpeechRate).mockRejectedValue(
        new Error("rate change failed"),
      );
      const ev = createMockKeyDownEvent();

      await expect(actionInstance.onKeyDown(ev)).resolves.toBeUndefined();
    });

    it("does not throw when isRunning throws", async () => {
      vi.mocked(mockStateService.isRunning).mockRejectedValue(
        new Error("system error"),
      );
      const ev = createMockKeyDownEvent();

      await expect(actionInstance.onKeyDown(ev)).resolves.toBeUndefined();
      expect(mockStateService.decreaseSpeechRate).not.toHaveBeenCalled();
    });
  });
});
