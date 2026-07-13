// All sounds are synthesised with the Web Audio API — no audio files needed.
export const SOUND_IDS = ["softBell", "tibetanBowl", "chime", "gong", "beep"];

let ctx = null;

function audioCtx() {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// One decaying partial: freq in Hz, when/dur in seconds relative to now.
function partial(ac, { freq, gain = 0.2, when = 0, dur = 3, attack = 0.005, type = "sine", detune = 0 }) {
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.1);
}

const SOUNDS = {
  softBell(ac) {
    const base = 523.25; // C5
    [[1, 0.25], [2.0, 0.12], [2.92, 0.06], [4.2, 0.025]].forEach(([ratio, gain], i) =>
      partial(ac, { freq: base * ratio, gain, dur: 3.2 - i * 0.5 })
    );
  },
  tibetanBowl(ac) {
    const base = 196;
    [[1, 0.22], [2.71, 0.1], [4.85, 0.04]].forEach(([ratio, gain]) => {
      partial(ac, { freq: base * ratio, gain, dur: 6, attack: 0.06 });
      partial(ac, { freq: base * ratio, gain: gain * 0.7, dur: 6, attack: 0.06, detune: 6 });
    });
  },
  chime(ac) {
    [659.25, 783.99, 987.77].forEach((freq, i) => {
      partial(ac, { freq, gain: 0.18, when: i * 0.22, dur: 2.2 });
      partial(ac, { freq: freq * 2, gain: 0.05, when: i * 0.22, dur: 1.4 });
    });
  },
  gong(ac) {
    const base = 98;
    [[1, 0.3], [1.53, 0.18], [2.28, 0.1], [3.1, 0.06], [4.05, 0.03]].forEach(([ratio, gain]) =>
      partial(ac, { freq: base * ratio, gain, dur: 5.5, attack: 0.02, detune: 4 })
    );
  },
  beep(ac) {
    partial(ac, { freq: 880, gain: 0.2, dur: 0.18, type: "triangle" });
    partial(ac, { freq: 880, gain: 0.2, when: 0.28, dur: 0.18, type: "triangle" });
  },
};

export function playSound(id, times = 1, gap = 1.4) {
  const ac = audioCtx();
  const fn = SOUNDS[id] || SOUNDS.softBell;
  for (let i = 0; i < times; i++) setTimeout(() => fn(ac), i * gap * 1000);
}

// Called from a user gesture so iOS/Safari unlock audio playback.
export function unlockAudio() {
  audioCtx();
}

export function speak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "bg" ? "bg-BG" : "en-US";
  u.rate = 0.95;
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

export function stopSpeech() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

// Voice list loads asynchronously in some browsers; warm it up.
if ("speechSynthesis" in window) speechSynthesis.getVoices();
