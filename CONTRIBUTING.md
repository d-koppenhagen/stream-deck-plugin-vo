# Contributing

Thanks for your interest in contributing to the VoiceOver Stream Deck Plugin! This guide covers everything you need to get started.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later (e.g. via [nvm](https://github.com/nvm-sh/nvm))
- [Stream Deck CLI](https://docs.elgato.com/streamdeck/cli): `npm install -g @elgato/cli`
- [librsvg](https://wiki.gnome.org/Projects/LibRsvg) for icon conversion: `brew install librsvg`

## Getting Started

1. Enable Stream Deck developer mode (only needed once):

   ```bash
   streamdeck dev
   ```

2. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/d-koppenhagen/stream-deck-plugin-vo.git
   cd stream-deck-plugin-vo
   npm install
   ```

3. Build and deploy the plugin locally:

   ```bash
   npm run deploy
   ```

   This compiles TypeScript, assembles the `.sdPlugin` bundle, links it into Stream Deck, and restarts the plugin.

4. On first deploy you may need to restart the Stream Deck app (Cmd+Q, then reopen). After that, the actions appear under the "VoiceOver Control" category.

5. Make sure the Stream Deck app has Accessibility permissions:
   System Settings → Privacy & Security → Accessibility → enable "Elgato Stream Deck"

## npm Scripts

| Script | Description |
| --- | --- |
| `npm test` | Run unit and property-based tests via Vitest |
| `npm run build` | Compile TypeScript, convert icons, assemble the `.sdPlugin` bundle, and validate |
| `npm run deploy` | Full local deploy: build, link into Stream Deck, and restart the plugin |
| `npm run dev` | Watch mode — recompiles on file changes (restart plugin manually) |
| `npm run icons` | Convert SVG source icons to PNG |
| `npm run validate` | Run the Stream Deck CLI validator against the built bundle |

## Rebuilding After Changes

Once linked, rebuild and restart the plugin to pick up code changes:

```bash
npm run build
streamdeck restart com.voiceover-streamdeck
```

Or use the deploy script which does both:

```bash
npm run deploy
```

## Debugging

With developer mode enabled, you can attach a debugger (e.g. VS Code) to the running Node.js plugin process. The manifest has `"Debug": "enabled"` set.

Check the Stream Deck logs for plugin errors:

```bash
ls ~/Library/Logs/ElgatoStreamDeck/
```

## Validating the Plugin

The build script runs `streamdeck validate` automatically. You can also run it manually:

```bash
streamdeck validate com.voiceover-streamdeck.sdPlugin
```

## Unlinking

To remove the plugin from Stream Deck:

```bash
streamdeck unlink com.voiceover-streamdeck.sdPlugin
```

## Releasing

1. Build and pack the plugin:

   ```bash
   npm run build
   streamdeck pack com.voiceover-streamdeck.sdPlugin
   ```

2. Tag the release and push:

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. Create a GitHub Release for the tag and attach the generated `.streamDeckPlugin` file as asset.

## Pull Request Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make sure all tests pass (`npm test`)
4. Commit your changes (`git commit -m "Add my feature"`)
5. Push to the branch (`git push origin feature/my-feature`)
6. Open a Pull Request
