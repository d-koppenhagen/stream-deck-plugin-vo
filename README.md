# VoiceOver Stream Deck Plugin

A Stream Deck plugin for controlling VoiceOver on macOS. Designed to simplify accessibility testing by putting common VoiceOver commands at your fingertips via physical keys on the Elgato Stream Deck.

![VoiceOver Stream Deck Plugin Preview](imgs/vo-streamdeck-preview.png)

## Features

- **Toggle VoiceOver** — Turn VoiceOver on or off with a single key press
- **Interrupt Speech** — Stop the current speech output immediately
- **Navigation** — Move to the next or previous element on the page
- **Focus Navigation** — Jump between focusable items (links, buttons, form fields)
- **Rotor** — Open the VoiceOver rotor for quick access to headings, links, and form elements
- **Repeat Last Phrase** — Hear the last spoken phrase again
- **Start Reading** — Begin continuous reading from the current position
- **Open Settings** — Quick access to VoiceOver Utility settings

## Requirements

- macOS 13.0 or later
- Elgato Stream Deck with Stream Deck Software 6.4+

## Installation

1. Download the latest `com.voiceover-streamdeck.streamDeckPlugin` file from the [Releases](https://github.com/d-koppenhagen/stream-deck-plugin-vo/releases) page.
2. Double-click the downloaded file — Stream Deck will install the plugin automatically.
3. Grant Accessibility permissions if prompted:
   System Settings → Privacy & Security → Accessibility → enable "Elgato Stream Deck"

## Usage

Drag any of the following actions from the **VoiceOver Control** category onto your Stream Deck:

| Action | Description |
| --- | --- |
| VoiceOver Toggle | Turn VoiceOver on or off |
| Interrupt Speech | Stop current speech output |
| Next Element | Navigate to the next element |
| Previous Element | Navigate to the previous element |
| Next Focusable | Jump to the next focusable item |
| Previous Focusable | Jump to the previous focusable item |
| Open Rotor | Open the VoiceOver rotor |
| Repeat Last Phrase | Repeat the last spoken phrase |
| Start Reading | Start reading from current position |
| Open Settings | Open VoiceOver Utility settings |

Actions that require VoiceOver to be running will show a disabled state when VoiceOver is off.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, build instructions, and guidelines.

## License

[MIT](LICENSE)
