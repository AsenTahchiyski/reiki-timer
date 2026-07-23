# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A pure-frontend PWA for guided Reiki self-treatment sessions. No build step, no
package.json, no framework, no tests — plain ES modules served as static files.
Deployed to GitHub Pages from `main` (all paths are relative so it works under
the `/reiki-timer/` subpath).

## Commands

```sh
# Run locally (service workers + ES modules need HTTP, not file://)
python3 -m http.server 8000

# Syntax-check a module (no linter is configured)
node --check js/app.js

# Regenerate voice clips after changing position texts or i18n strings
npm install --no-save msedge-tts
node tools/generate-voice.mjs   # skips existing files — delete stale MP3s first
```

## Architecture

Four ES modules under `js/`, wired together by `app.js`:

- `app.js` — all UI/state: view switching, session loop, settings persistence.
  Views are `<main>` elements in `index.html` toggled by `showView()`. Settings
  live in localStorage under `reiki-timer-settings` with a `settingsVersion`
  field for migrations (see the v2 migration at the top of the file).
- `audio.js` — chimes are synthesised with the Web Audio API (no sound files);
  voice guidance plays pre-recorded MP3 clips through the same AudioContext,
  with browser speechSynthesis only as an offline fallback.
- `positions.js` — hand-position data (en/bg titles + descriptions, hand
  coordinates) and the inline-SVG figure renderer.
- `i18n.js` — `STRINGS` for both languages, `t()` lookup, `numberWord()`.

Key cross-file constraints:

- **Timing is wall-clock based**: the session loop (`tick()` in `app.js`)
  derives everything from timestamps, not accumulated intervals, so it survives
  background-tab throttling. Don't replace this with setInterval counting.
- **`positions.js` and `i18n.js` are imported by both the browser and Node**:
  `tools/generate-voice.mjs` imports them to know what to synthesise. Keep them
  dependency-free and environment-agnostic.
- **Voice clips are derived artifacts**: `audio/voice/{lang}/{gender}/numNN.mp3`
  ("Position N", N=1..30), `posNN.mp3` (title + description, one per entry in
  `POSITIONS`), `complete.mp3`, where `lang` is `en`/`bg` and `gender` is
  `male`/`female`. `voiceClipUrls()` in `app.js` maps an interval index to these
  filenames using the selected `voiceGender` setting. Changing a position's text
  or `completeVoice` requires deleting and regenerating the affected clips.
- **Every user-visible string is bilingual**: add new strings to both `en` and
  `bg` in `STRINGS`, and render static HTML text via the `data-i18n` attribute
  (picked up by `applyLanguage()`).
- **Service worker (`sw.js`)**: stale-while-revalidate with `cache: "no-cache"`
  revalidation (GitHub Pages sets a 10-minute HTTP cache that would otherwise
  delay updates). Voice clips are treated as immutable once cached. When adding
  a new core file, add it to the `ASSETS` list and bump the `CACHE` version.

Device targets: Android phone + Galaxy Watch + PC.
