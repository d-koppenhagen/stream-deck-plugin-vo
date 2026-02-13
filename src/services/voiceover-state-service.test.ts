import { describe, it, expect, vi, beforeEach } from "vitest";

import { VoiceOverStateService } from "./voiceover-state-service";
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

  describe("openSettings", () => {
    it("activates VoiceOver Utility", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({ success: true });

      await service.openSettings();

      expect(mockCommandService.executeAppleScript).toHaveBeenCalledWith(
        'tell application "VoiceOver Utility" to activate',
      );
    });

    it("throws when the command fails", async () => {
      vi.mocked(mockCommandService.executeAppleScript).mockResolvedValue({
        success: false,
        error: "not running",
      });

      await expect(service.openSettings()).rejects.toThrow("Failed to open VoiceOver settings");
    });
  });
});
