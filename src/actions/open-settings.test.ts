import { describe, it, expect, vi, beforeEach } from "vitest";

import { OpenSettingsAction } from "./open-settings";
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
    openSettings: vi.fn<() => Promise<void>>(),
  } as unknown as VoiceOverStateService;
}

function createMockKeyDownEvent() {
  return {
    action: { setState: vi.fn() },
    payload: { isInMultiAction: false, settings: {} },
  } as unknown as Parameters<OpenSettingsAction["onKeyDown"]>[0];
}

describe("OpenSettingsAction", () => {
  let actionInstance: OpenSettingsAction;
  let mockStateService: VoiceOverStateService;

  beforeEach(() => {
    actionInstance = new OpenSettingsAction();
    mockStateService = createMockStateService();

    const instance = actionInstance as unknown as {
      stateService: VoiceOverStateService;
    };
    instance.stateService = mockStateService;
  });

  describe("onKeyDown", () => {
    it("opens VoiceOver settings", async () => {
      vi.mocked(mockStateService.openSettings).mockResolvedValue(undefined);
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockStateService.openSettings).toHaveBeenCalledOnce();
      expect(mockStateService.isRunning).not.toHaveBeenCalled();
    });

    it("does not throw when openSettings fails", async () => {
      vi.mocked(mockStateService.openSettings).mockRejectedValue(
        new Error("open failed"),
      );
      const ev = createMockKeyDownEvent();

      await expect(actionInstance.onKeyDown(ev)).resolves.toBeUndefined();
    });
  });
});
