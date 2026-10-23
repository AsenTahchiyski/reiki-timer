# Reiki Timer

A pure-frontend PWA for guided Reiki self-treatment sessions. No build step,
no runtime dependencies — chimes are synthesised with the Web Audio API and
position illustrations are inline SVG. Voice guidance plays pre-recorded
neural-TTS clips (see below).

<img width="270" height="585" alt="Screenshot_20261023_162636_Brave" src="https://github.com/user-attachments/assets/b76b8ff7-5bba-4c66-9738-7ffd3de7a75b" />
<img width="270" height="585" alt="Screenshot_20261023_162647_Brave" src="https://github.com/user-attachments/assets/3abd7e73-80dc-4e8c-825d-8079ae0d6cfd" />
<img width="270" height="585" alt="Screenshot_20261023_162657_Brave" src="https://github.com/user-attachments/assets/cf50a811-b388-42bb-904e-d6e5d2dcef07" />

## Features

- **Short (9 × 3 min) and long (15 × 3 min) sessions** — counts and interval
  length are configurable in Settings.
- A chime plays at the start of the session and at the end of every interval;
  choose between Soft Bell (default), Tibetan Bowl, Chime, Gong or Beep.
- At the start of each interval the hand position is shown with a large
  illustration and a short description of where to place your hands and why.
- Optional voice guidance (off by default) reads each position aloud from
  pre-recorded clips ("Position N. Title. Description."), in a male or
  female voice.
- Separate chime and voice volume sliders.
- Session controls: Previous, Replay voice and Next to move between positions
  or hear the current one again; pause/resume and stop.
- Session progress: start time and expected end above the progress bar,
  elapsed and remaining time below it, plus a per-interval countdown.
- **English and Bulgarian** interface, positions and voice, switchable in
  Settings.
- Installable PWA, works fully offline, keeps the screen awake during a
  session (Wake Lock API where available). On Android, keep the screen on
  during a session — background power management may otherwise pause the
  timer.

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

Spoken guidance lives in `audio/voice/{en,bg}/{male,female}/` as MP3s
generated with Microsoft Edge neural voices (English: Christopher / Jenny;
Bulgarian: Borislav / Kalina): `numNN.mp3` ("Position N"), `posNN.mp3`
(title + description) and `complete.mp3`. Clips are fetched on demand and
cached by the service worker.
After changing position texts, regenerate with:

```sh
npm install --no-save msedge-tts
node tools/generate-voice.mjs   # skips existing files — delete stale MP3s first
```

## Notes

- If a voice clip can't be loaded (first-ever session while offline), the app
  falls back to the browser's speech synthesis.
- Timing is computed from wall-clock timestamps, so it stays accurate even
  when the browser throttles background tabs.
