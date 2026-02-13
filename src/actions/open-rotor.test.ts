import { describe, it, expect, vi, beforeEach } from "vitest";

import { OpenRotorAction } from "./open-rotor.js";
import type { CommandService, CommandResult } from "../services/command-service.js";
import type { VoiceOverStateService } from "../services/voiceover-state-service.js";

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

const { mockIsRotorOpen, mockSetRotorOpen } = vi.hoisted(() => ({
  mockIsRotorOpen: vi.fn().mockReturnValue(false),
  mockSetRotorOpen: vi.fn(),
}));
vi.mock("../services/rotor-state", () => ({
  isRotorOpen: (...args: unknown[]) => mockIsRotorOpen(...args),
  setRotorOpen: (...args: unknown[]) => mockSetRotorOpen(...args),
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
    action: { setState: vi.fn(), setImage: vi.fn() },
    payload: { isInMultiAction: false, settings: {} },
  } as unknown as Parameters<OpenRotorAction["onKeyDown"]>[0];
}

describe("OpenRotorAction", () => {
  let actionInstance: OpenRotorAction;
  let mockCommandService: CommandService;
  let mockStateService: VoiceOverStateService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsRotorOpen.mockReturnValue(false);
    actionInstance = new OpenRotorAction();
    mockCommandService = createMockCommandService();
    mockStateService = createMockStateService();

    const instance = actionInstance as unknown as {
      commandService: CommandService;
      stateService: VoiceOverStateService;
    };
    instance.commandService = mockCommandService;
    instance.stateService = mockStateService;
  });

  describe("onKeyDown", () => {
    it("sends VO+U to open rotor when VoiceOver is running and rotor is closed", async () => {
      vi.mocked(mockStateService.isRunning).mockResolvedValue(true);
      vi.mocked(mockCommandService.simulateKeyPress).mockResolvedValue({ success: true });
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

      expect(mockCommandService.simulateKeyPress).toHaveBeenCalledWith({
        keyCode: 32,
        modifiers: ["control", "option"],
      });
      expect(mockSetRotorOpen).toHaveBeenCalledWith(true);
      expect(mockRefresh).toHaveBeenCalledOnce();
    });

    it("does nothing when VoiceOver is not running", async () => {
      vi.mocked(mockStateService.isRunning).mockResolvedValue(false);
      const ev = createMockKeyDownEvent();

      await actionInstance.onKeyDown(ev);

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
      vi.mocked(mockStateService.isRunning).mockRejectedValue(new Error("system error"));
      const ev = createMockKeyDownEvent();

      await expect(actionInstance.onKeyDown(ev)).resolves.toBeUndefined();
      expect(mockCommandService.simulateKeyPress).not.toHaveBeenCalled();
    });
  });
});
