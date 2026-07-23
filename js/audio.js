// All sounds are synthesised with the Web Audio API — no audio files needed.
export const SOUND_IDS = ["softBell", "tibetanBowl", "chime", "gong", "beep"];

let ctx = null;
let chimeGain = null; // chimes route through here
let voiceGain = null; // recorded voice clips route through here
let chimeVolume = 1;
let voiceVolume = 1;

function audioCtx() {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  if (!chimeGain) {
    chimeGain = ctx.createGain();
    chimeGain.gain.value = chimeVolume;
    chimeGain.connect(ctx.destination);
    voiceGain = ctx.createGain();
    voiceGain.gain.value = voiceVolume;
    voiceGain.connect(ctx.destination);
  }
  return ctx;
}

export function setChimeVolume(v) {
  chimeVolume = v;
  if (chimeGain) chimeGain.gain.value = v;
}

export function setVoiceVolume(v) {
  voiceVolume = v;
  if (voiceGain) voiceGain.gain.value = v;
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
  osc.connect(g).connect(chimeGain);
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

/* ---------- Recorded voice clips ----------
   Pre-generated neural-TTS MP3s (audio/voice/{lang}/…), played through the
   already-unlocked AudioContext. Far better quality than browser speech
   synthesis and independent of which TTS voices the device has installed.
   Browser TTS below remains only as a fallback when a clip can't load. */

const clipCache = new Map(); // url -> Promise<AudioBuffer>
let clipSources = [];
let clipToken = 0;

function clipBuffer(url) {
  if (!clipCache.has(url)) {
    const p = fetch(url)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => audioCtx().decodeAudioData(data));
    p.catch(() => clipCache.delete(url)); // don't cache failures
    clipCache.set(url, p);
  }
  return clipCache.get(url);
}

export function prefetchClips(urls) {
  urls.forEach((u) => clipBuffer(u).catch(() => {}));
}

// Plays clips back to back with a short breath between them. Returns false
// when a clip can't be fetched/decoded so the caller can fall back to speak().
export async function playClips(urls, gap = 0.35) {
  const token = ++clipToken;
  let buffers;
  try {
    buffers = await Promise.all(urls.map(clipBuffer));
  } catch {
    return false;
  }
  if (token !== clipToken) return true; // stopped while loading
  const ac = audioCtx();
  let t = ac.currentTime + 0.05;
  clipSources = buffers.map((buf) => {
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(voiceGain);
    src.start(t);
    t += buf.duration + gap;
    return src;
  });
  return true;
}

function stopClips() {
  clipToken++;
  clipSources.forEach((s) => {
    try { s.stop(); } catch { /* already ended */ }
  });
  clipSources = [];
}

/* ---------- Browser speech synthesis (fallback only) ---------- */

let voices = [];
let speakTimer = null;
let keepAlive = null;

// Higher score = better voice. Natural/neural network voices sound far less
// robotic than the local eSpeak-style ones, which matters most for Bulgarian.
function voiceScore(v, lang) {
  const name = v.name.toLowerCase();
  let s = 0;
  if (/natural|neural|premium|enhanced/.test(name)) s += 8;
  if (name.includes("google") || name.includes("online")) s += 4;
  if (!v.localService) s += 2;
  if (v.default) s += 1;
  if (lang === "en" && v.lang.toLowerCase().startsWith("en-us")) s += 1;
  return s;
}

function pickVoice(lang) {
  const matches = voices.filter((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith(lang)
  );
  return matches.sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0] || null;
}

export function speak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  stopSpeech();
  // Chrome (notably on Windows) silently drops an utterance queued right
  // after cancel(); wait a beat before speaking.
  speakTimer = setTimeout(() => {
    speakTimer = null;
    const voice = pickVoice(lang);
    // One utterance per sentence: prosody is better, natural pauses appear
    // between sentences, and short utterances dodge Chrome's ~15 s cutoff.
    const parts = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
    for (const part of parts) {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = lang === "bg" ? "bg-BG" : "en-US";
      // English: unhurried, slightly lower pitch. Bulgarian: modest slowdown
      // only — dropping the rate further makes the synthetic voice sound worse.
      u.rate = lang === "bg" ? 0.9 : 0.8;
      u.pitch = lang === "bg" ? 1 : 0.88;
      u.volume = voiceVolume;
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    }
    // Chrome desktop can wedge in a paused state; nudge it periodically.
    speechSynthesis.resume();
    clearInterval(keepAlive);
    keepAlive = setInterval(() => {
      if (!speechSynthesis.speaking) {
        clearInterval(keepAlive);
        keepAlive = null;
      } else {
        speechSynthesis.resume();
      }
    }, 5000);
  }, 100);
}

export function stopSpeech() {
  stopClips();
  if (!("speechSynthesis" in window)) return;
  clearTimeout(speakTimer);
  speakTimer = null;
  clearInterval(keepAlive);
  keepAlive = null;
  speechSynthesis.cancel();
}

// The voice list loads asynchronously in Chrome/Edge — an empty getVoices()
// at speak time meant no voice on PC. Cache it and refresh on voiceschanged.
if ("speechSynthesis" in window) {
  const loadVoices = () => {
    const v = speechSynthesis.getVoices();
    if (v.length) voices = v;
  };
  loadVoices();
  speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}
