import { describe, it, expect, vi, beforeEach } from "vitest";

import { ToggleVoiceOverAction } from "./toggle-voiceover";
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

vi.mock("../services/command-service", () => ({
  CommandService: class {},
}));

vi.mock("../services/voiceover-state-service", () => ({
  VoiceOverStateService: class {},
}));

const mockRefresh = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("../services/voiceover-monitor", () => ({
  voiceOverMonitor: {
    trackAction: vi.fn(),
    untrackAction: vi.fn(),
    refresh: mockRefresh,
  },
}));

vi.mock("../services/rotor-state", () => ({
  isRotorOpen: vi.fn().mockReturnValue(false),
  setRotorOpen: vi.fn(),
}));

function createMockStateService(): VoiceOverStateService {
  return {
    toggle: vi.fn<() => Promise<boolean>>(),
    isRunning: vi.fn<() => Promise<boolean>>(),
    getSpeechRate: vi.fn<() => Promise<number>>(),
    setSpeechRate: vi.fn<() => Promise<number>>(),
    increaseSpeechRate: vi.fn<() => Promise<number>>(),
    decreaseSpeechRate: vi.fn<() => Promise<number>>(),
  } as unknown as VoiceOverStateService;
}

function createMockKeyDownEvent() {
  return {
    action: { setState: vi.fn(), setImage: vi.fn() },
    payload: { isInMultiAction: false, settings: {} },
  } as unknown as Parameters<ToggleVoiceOverAction["onKeyDown"]>[0];
}

describe("ToggleVoiceOverAction", () => {
  let actionInstance: ToggleVoiceOverAction;
  let mockStateService: VoiceOverStateService;

  beforeEach(() => {
    vi.clearAllMocks();
    actionInstance = new ToggleVoiceOverAction();
    mockStateService = createMockStateService();
    (actionInstance as unknown as { stateService: VoiceOverStateService }).stateService =
      mockStateService;
  });

  describe("onKeyDown", () => {
    it("calls toggle and refreshes monitor when VoiceOver becomes active", async () => {
      vi.mocked(mockStateService.toggle).mockResolvedValue(true);
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockStateService.toggle).toHaveBeenCalledOnce();
      expect(mockRefresh).toHaveBeenCalledOnce();
    });

    it("calls toggle and refreshes monitor when VoiceOver becomes inactive", async () => {
      vi.mocked(mockStateService.toggle).mockResolvedValue(false);
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockStateService.toggle).toHaveBeenCalledOnce();
      expect(mockRefresh).toHaveBeenCalledOnce();
    });

    it("does not refresh monitor when toggle throws an error", async () => {
      vi.mocked(mockStateService.toggle).mockRejectedValue(new Error("toggle failed"));
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockStateService.toggle).toHaveBeenCalledOnce();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("does not throw when toggle fails", async () => {
      vi.mocked(mockStateService.toggle).mockRejectedValue(new Error("system error"));
      const ev = createMockKeyDownEvent();

      await expect(actionInstance.onKeyDown(ev)).resolves.toBeUndefined();
    });
  });
});
