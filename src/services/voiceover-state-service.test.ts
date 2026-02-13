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

// Mock node:child_process for the defaults-based isRunning check.
const mockExecFile = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({
  execFile: mockExecFile,
}));

function createMockCommandService(overrides: Partial<CommandService> = {}): CommandService {
  return {
    executeAppleScript: vi.fn<(script: string) => Promise<CommandResult>>(),
    simulateKeyPress: vi.fn<() => Promise<CommandResult>>(),
    ...overrides,
  } as unknown as CommandService;
}

/** Helper: defaults read returns "1" (VO enabled). */
function voiceOverEnabled() {
  mockExecFile.mockImplementation(
    (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
      cb(null, "1\n");
    },
  );
}

/** Helper: defaults read returns "0" (VO disabled). */
function voiceOverDisabled() {
  mockExecFile.mockImplementation(
    (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
      cb(null, "0\n");
    },
  );
}

describe("VoiceOverStateService", () => {
  let service: VoiceOverStateService;
  let mockCommandService: CommandService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCommandService = createMockCommandService();
    service = new VoiceOverStateService(mockCommandService);
  });

  describe("isRunning", () => {
    it("returns true when VoiceOver is enabled", async () => {
      voiceOverEnabled();
      expect(await service.isRunning()).toBe(true);
    });

    it("returns false when VoiceOver is disabled", async () => {
      voiceOverDisabled();
      expect(await service.isRunning()).toBe(false);
    });

    it("returns false when defaults read fails", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
          cb(new Error("not found"), "");
        },
      );
      expect(await service.isRunning()).toBe(false);
    });
  });

  describe("toggle", () => {
    it("simulates Cmd+F5 and returns true when VO was off", async () => {
      vi.mocked(mockCommandService.simulateKeyPress).mockResolvedValue({ success: true });
      voiceOverDisabled();

      const result = await service.toggle();

      expect(mockCommandService.simulateKeyPress).toHaveBeenCalledWith({
        keyCode: 96,
        modifiers: ["command"],
      });
      expect(result).toBe(true);
    });

    it("simulates Cmd+F5 and returns false when VO was on", async () => {
      vi.mocked(mockCommandService.simulateKeyPress).mockResolvedValue({ success: true });
      voiceOverEnabled();

      const result = await service.toggle();

      expect(result).toBe(false);
    });

    it("throws when the key press fails", async () => {
      voiceOverDisabled();
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
