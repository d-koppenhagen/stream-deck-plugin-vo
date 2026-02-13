import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  VoiceOverStateService,
  SPEECH_RATE_MIN,
  SPEECH_RATE_MAX,
  SPEECH_RATE_INCREMENT,
  clampRate,
} from "./voiceover-state-service";
import type { CommandResult } from "./command-service";
import type { CommandService } from "./command-service";

// Mock the Stream Deck logger used inside the service.
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
}));

function createMockCommandService(overrides: Partial<CommandService> = {}): CommandService {
  return {
    executeAppleScript: vi.fn<(script: string) => Promise<CommandResult>>(),
    simulateKeyPress: vi.fn<() => Promise<CommandResult>>(),
    ...overrides,
  } as unknown as CommandService;
}

describe("clampRate", () => {
  it("returns the value when within range", () => {
    expect(clampRate(50)).toBe(50);
  });

  it("clamps to SPEECH_RATE_MIN when below range", () => {
    expect(clampRate(-10)).toBe(SPEECH_RATE_MIN);
    expect(clampRate(0)).toBe(SPEECH_RATE_MIN);
  });

  it("clamps to SPEECH_RATE_MAX when above range", () => {
    expect(clampRate(200)).toBe(SPEECH_RATE_MAX);
    expect(clampRate(101)).toBe(SPEECH_RATE_MAX);
  });

  it("returns boundary values unchanged", () => {
    expect(clampRate(SPEECH_RATE_MIN)).toBe(SPEECH_RATE_MIN);
    expect(clampRate(SPEECH_RATE_MAX)).toBe(SPEECH_RATE_MAX);
  });
});

describe("VoiceOverStateService", () => {
  let service: VoiceOverStateService;
  let mockCommandService: CommandService;

  beforeEach(() => {
    mockCommandService = createMockCommandService();
    service = new VoiceOverStateService(mockCommandService);
  });

  describe("isRunning", () => {
    it("returns true when VoiceOver process is found", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: true,
        output: "true",
      });

      expect(await service.isRunning()).toBe(true);
    });

    it("returns false when VoiceOver process is not found", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: true,
        output: "false",
      });

      expect(await service.isRunning()).toBe(false);
    });

    it("returns false when the command fails", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: false,
        error: "timeout",
      });

      expect(await service.isRunning()).toBe(false);
    });
  });

  describe("toggle", () => {
    it("simulates Cmd+F5 and returns the new state", async () => {
      vi.mocked(mockCommandService.simulateKeyPress).mockResolvedValue({ success: true });
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: true,
        output: "true",
      });

      const result = await service.toggle();

      expect(mockCommandService.simulateKeyPress).toHaveBeenCalledWith({
        keyCode: 96,
        modifiers: ["command"],
      });
      expect(result).toBe(true);
    });

    it("throws when the key press fails", async () => {
      vi.mocked(mockCommandService.simulateKeyPress).mockResolvedValue({
        success: false,
        error: "access denied",
      });

      await expect(service.toggle()).rejects.toThrow("Failed to toggle VoiceOver");
    });
  });

  describe("getSpeechRate", () => {
    it("returns the parsed speech rate", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: true,
        output: "42",
      });

      expect(await service.getSpeechRate()).toBe(42);
    });

    it("throws when the command fails", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: false,
        error: "not running",
      });

      await expect(service.getSpeechRate()).rejects.toThrow("Failed to get speech rate");
    });

    it("throws when the output is not a number", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: true,
        output: "abc",
      });

      await expect(service.getSpeechRate()).rejects.toThrow("Invalid speech rate value");
    });
  });

  describe("setSpeechRate", () => {
    it("sets the rate and returns the clamped value", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({ success: true });

      expect(await service.setSpeechRate(50)).toBe(50);
      expect(mockCommandService.executeAppleScript).toHaveBeenCalledWith(
        'tell application "VoiceOver" to set rate of (get default output) to 50',
      );
    });

    it("clamps values above the maximum", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({ success: true });

      expect(await service.setSpeechRate(150)).toBe(SPEECH_RATE_MAX);
    });

    it("clamps values below the minimum", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({ success: true });

      expect(await service.setSpeechRate(-5)).toBe(SPEECH_RATE_MIN);
    });

    it("throws when the command fails", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: false,
        error: "not running",
      });

      await expect(service.setSpeechRate(50)).rejects.toThrow("Failed to set speech rate");
    });
  });

  describe("increaseSpeechRate", () => {
    it("increases by the default increment", async () => {
      vi.mocked(mockCommandService.executeAppleScript)
        .mockResolvedValueOnce({ success: true, output: "50" }) // getSpeechRate
        .mockResolvedValueOnce({ success: true }); // setSpeechRate

      expect(await service.increaseSpeechRate()).toBe(50 + SPEECH_RATE_INCREMENT);
    });

    it("increases by a custom increment", async () => {
      vi.mocked(mockCommandService.executeAppleScript)
        .mockResolvedValueOnce({ success: true, output: "30" })
        .mockResolvedValueOnce({ success: true });

      expect(await service.increaseSpeechRate(5)).toBe(35);
    });

    it("clamps at the maximum", async () => {
      vi.mocked(mockCommandService.executeAppleScript)
        .mockResolvedValueOnce({ success: true, output: "95" })
        .mockResolvedValueOnce({ success: true });

      expect(await service.increaseSpeechRate()).toBe(SPEECH_RATE_MAX);
    });
  });

  describe("decreaseSpeechRate", () => {
    it("decreases by the default increment", async () => {
      vi.mocked(mockCommandService.executeAppleScript)
        .mockResolvedValueOnce({ success: true, output: "50" })
        .mockResolvedValueOnce({ success: true });

      expect(await service.decreaseSpeechRate()).toBe(50 - SPEECH_RATE_INCREMENT);
    });

    it("decreases by a custom decrement", async () => {
      vi.mocked(mockCommandService.executeAppleScript)
        .mockResolvedValueOnce({ success: true, output: "30" })
        .mockResolvedValueOnce({ success: true });

      expect(await service.decreaseSpeechRate(5)).toBe(25);
    });

    it("clamps at the minimum", async () => {
      vi.mocked(mockCommandService.executeAppleScript)
        .mockResolvedValueOnce({ success: true, output: "5" })
        .mockResolvedValueOnce({ success: true });

      expect(await service.decreaseSpeechRate()).toBe(SPEECH_RATE_MIN);
    });
  });
});
