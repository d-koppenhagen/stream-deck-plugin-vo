/**
 * Shared rotor state tracker.
 * Tracks whether the VoiceOver rotor is currently open so that
 * multiple actions (open-rotor, toggle-voiceover) can coordinate.
 */
let rotorOpen = false;

export function isRotorOpen(): boolean {
  return rotorOpen;
}

export function setRotorOpen(open: boolean): void {
  rotorOpen = open;
}
