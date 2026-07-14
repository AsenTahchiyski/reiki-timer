# Reiki Timer

A pure-frontend PWA for guided Reiki self-treatment sessions. No build step,
no runtime dependencies — chimes are synthesised with the Web Audio API and
position illustrations are inline SVG. Voice guidance plays pre-recorded
neural-TTS clips (see below).

## Features

- **Short (9 × 3 min) and long (15 × 3 min) sessions** — counts and interval
  length are configurable in Settings.
- A chime plays at the start of the session and at the end of every interval;
  choose between Soft Bell (default), Tibetan Bowl, Chime, Gong or Beep.
- At the start of each interval the hand position is shown with a large
  illustration and a short description of where to place your hands and why —
  optionally read aloud from pre-recorded clips ("Position N. Title.
  Description.").
- Optional vibration on each interval: the phone vibrates and a notification
  is posted, which Wear OS mirrors to a paired smartwatch so it buzzes too.
- Session progress: start time, expected end, elapsed and remaining time,
  per-interval countdown and an overall progress bar. Pause/resume and stop.
- **English and Bulgarian** interface, positions and voice, switchable in
  Settings.
- Installable PWA, works fully offline, keeps the screen awake during a
  session (Wake Lock API where available).

## Run locally

Service workers and ES modules need HTTP, so serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a GitHub repository and push this folder to it:

   ```sh
   git init
   git add .
   git commit -m "Reiki timer PWA"
   git branch -M main
   git remote add origin git@github.com:<you>/reiki-timer.git
   git push -u origin main
   ```

2. In the repository: **Settings → Pages → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`.

3. The app will be served at `https://<you>.github.io/reiki-timer/`. All
   paths are relative, so it works under the subpath without changes.

## Voice clips

Spoken guidance lives in `audio/voice/{en,bg}/` as MP3s generated with
Microsoft Edge neural voices (Christopher for English, Kalina for Bulgarian):
`numNN.mp3` ("Position N"), `posNN.mp3` (title + description) and
`complete.mp3`. Clips are fetched on demand and cached by the service worker.
After changing position texts, regenerate with:

```sh
npm install --no-save msedge-tts
node tools/generate-voice.mjs   # skips files that already exist
```

## Notes

- If a voice clip can't be loaded (first-ever session while offline), the app
  falls back to the browser's speech synthesis.
- Timing is computed from wall-clock timestamps, so it stays accurate even
  when the browser throttles background tabs.
