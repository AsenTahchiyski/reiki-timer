import { t, STRINGS, numberWord } from "./i18n.js";
import { POSITIONS, getPosition, figureSVG } from "./positions.js";
import { SOUND_IDS, playSound, unlockAudio, speak, stopSpeech, playClips, prefetchClips } from "./audio.js";

const SETTINGS_KEY = "reiki-timer-settings";

const DEFAULTS = {
  lang: "en",
  intervalMinutes: 3,
  shortCount: 9,
  longCount: 15,
  sound: "softBell",
  voice: true,
  vibrate: false,
};

let settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const $ = (id) => document.getElementById(id);
const views = ["home", "session", "complete", "settings"];

function showView(name) {
  views.forEach((v) => $(`view-${v}`).classList.toggle("hidden", v !== name));
}

/* ---------- i18n rendering ---------- */

function applyLanguage() {
  document.documentElement.lang = settings.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(settings.lang, el.dataset.i18n);
  });
  const min = t(settings.lang, "min");
  $("short-sub").textContent = `${settings.shortCount} × ${settings.intervalMinutes} ${min}`;
  $("long-sub").textContent = `${settings.longCount} × ${settings.intervalMinutes} ${min}`;
  const soundSel = $("set-sound");
  soundSel.innerHTML = SOUND_IDS.map(
    (id) => `<option value="${id}">${STRINGS[settings.lang].sounds[id]}</option>`
  ).join("");
  soundSel.value = settings.sound;
}

/* ---------- Session state ---------- */

let session = null; // { totalIntervals, intervalMs, startedAt, elapsedBefore, runningSince, currentIndex, finished }
let tickHandle = null;
let wakeLock = null;

function sessionElapsed() {
  return session.elapsedBefore + (session.runningSince ? Date.now() - session.runningSince : 0);
}

async function acquireWakeLock() {
  try {
    wakeLock = await navigator.wakeLock?.request("screen");
  } catch {
    /* wake lock unavailable (e.g. power saver) — session still works */
  }
}

function releaseWakeLock() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && session && session.runningSince) {
    acquireWakeLock();
    tick();
  }
});

function startSession(totalIntervals) {
  unlockAudio();
  session = {
    totalIntervals,
    intervalMs: settings.intervalMinutes * 60_000,
    startedAt: new Date(),
    elapsedBefore: 0,
    runningSince: Date.now(),
    currentIndex: -1,
    finished: false,
  };
  $("btn-pause").classList.remove("paused");
  $("btn-pause").firstElementChild.textContent = t(settings.lang, "pause");
  $("t-start").textContent = fmtClock(session.startedAt);
  showView("session");
  acquireWakeLock();
  if (settings.voice) prefetchClips(voiceClipUrls(0, settings.lang));
  tickHandle = setInterval(tick, 250);
  tick();
}

function stopSession(showComplete) {
  clearInterval(tickHandle);
  tickHandle = null;
  releaseWakeLock();
  stopSpeech();
  session = null;
  showView(showComplete ? "complete" : "home");
}

function togglePause() {
  if (!session) return;
  const btn = $("btn-pause");
  if (session.runningSince) {
    session.elapsedBefore += Date.now() - session.runningSince;
    session.runningSince = null;
    btn.classList.add("paused");
    btn.firstElementChild.textContent = t(settings.lang, "resume");
    stopSpeech();
  } else {
    session.runningSince = Date.now();
    btn.classList.remove("paused");
    btn.firstElementChild.textContent = t(settings.lang, "pause");
  }
  tick();
}

// Vibrate the phone and post a notification with a vibration pattern.
// A web app can't reach a paired watch directly, but Wear OS mirrors phone
// notifications, so the watch buzzes on each interval too.
async function vibrateInterval(index) {
  if (!settings.vibrate) return;
  const pattern = [300, 150, 300];
  navigator.vibrate?.(pattern);
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.ready;
    reg?.showNotification(t(settings.lang, "positionOf", { a: index + 1, b: session.totalIntervals }), {
      body: getPosition(index)[settings.lang].title,
      tag: "reiki-interval",
      renotify: true,
      vibrate: pattern,
      icon: "icons/icon.svg",
    });
  } catch {
    /* notifications unavailable — vibration on the phone still fired */
  }
}

// URLs of the pre-recorded clips for one announcement: "Position N" + body.
function voiceClipUrls(index, lang) {
  const pad = (n) => String(n).padStart(2, "0");
  const urls = [];
  if (index < 30) urls.push(`audio/voice/${lang}/num${pad(index + 1)}.mp3`);
  urls.push(`audio/voice/${lang}/pos${pad((index % POSITIONS.length) + 1)}.mp3`);
  return urls;
}

function announcePosition(index) {
  playSound(settings.sound);
  vibrateInterval(index);
  if (settings.voice) {
    const pos = getPosition(index)[settings.lang];
    setTimeout(async () => {
      // Guard: session may have been paused/stopped while the chime rang.
      if (!(session && session.currentIndex === index && session.runningSince)) return;
      if (index + 1 < session.totalIntervals) prefetchClips(voiceClipUrls(index + 1, settings.lang));
      const played = await playClips(voiceClipUrls(index, settings.lang));
      // Browser TTS only when the recorded clips can't load (e.g. offline
      // before they were ever cached).
      if (!played && session && session.currentIndex === index && session.runningSince) {
        speak(
          `${t(settings.lang, "positionVoice", { a: numberWord(settings.lang, index + 1) })}. ${pos.title}. ${pos.desc}`,
          settings.lang
        );
      }
    }, 1800);
  }
}

function renderPosition(index) {
  const pos = getPosition(index);
  const loc = pos[settings.lang];
  $("pos-count").textContent = t(settings.lang, "positionOf", {
    a: index + 1,
    b: session.totalIntervals,
  });
  $("pos-title").textContent = loc.title;
  $("pos-desc").textContent = loc.desc;
  $("figure-wrap").innerHTML = figureSVG(pos);
  $("back-note").classList.toggle("hidden", !pos.back);
}

function tick() {
  if (!session) return;
  const totalMs = session.totalIntervals * session.intervalMs;
  const elapsed = Math.min(sessionElapsed(), totalMs);

  if (elapsed >= totalMs && !session.finished) {
    session.finished = true;
    renderTimes(elapsed, totalMs);
    playSound(settings.sound, 3);
    if (settings.voice) {
      const lang = settings.lang;
      setTimeout(async () => {
        if (!(await playClips([`audio/voice/${lang}/complete.mp3`]))) {
          speak(t(lang, "completeVoice"), lang);
        }
      }, 4500);
    }
    stopSession(true);
    return;
  }

  const index = Math.min(Math.floor(elapsed / session.intervalMs), session.totalIntervals - 1);
  if (index !== session.currentIndex) {
    session.currentIndex = index;
    renderPosition(index);
    announcePosition(index);
  }

  renderTimes(elapsed, totalMs);
}

function renderTimes(elapsed, totalMs) {
  const remaining = totalMs - elapsed;
  const inInterval = session.intervalMs - (elapsed % session.intervalMs || 0);
  $("interval-remaining").textContent = fmtDuration(session.finished ? 0 : inInterval);
  $("progress-fill").style.width = `${(elapsed / totalMs) * 100}%`;
  $("t-end").textContent = fmtClock(new Date(Date.now() + remaining));
  $("t-elapsed").textContent = fmtDuration(elapsed);
  $("t-remaining").textContent = fmtDuration(remaining);
}

function fmtClock(date) {
  return date.toLocaleTimeString(settings.lang === "bg" ? "bg-BG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/* ---------- Settings UI ---------- */

function loadSettingsForm() {
  $("set-lang").value = settings.lang;
  $("set-interval").value = settings.intervalMinutes;
  $("set-short").value = settings.shortCount;
  $("set-long").value = settings.longCount;
  $("set-sound").value = settings.sound;
  $("set-voice").checked = settings.voice;
  $("set-vibrate").checked = settings.vibrate;
}

function bindSettings() {
  $("set-lang").addEventListener("change", (e) => {
    settings.lang = e.target.value;
    saveSettings();
    applyLanguage();
  });
  $("set-interval").addEventListener("change", (e) => {
    settings.intervalMinutes = clampNum(e.target, 0.5, 60, DEFAULTS.intervalMinutes);
    saveSettings();
    applyLanguage();
  });
  $("set-short").addEventListener("change", (e) => {
    settings.shortCount = Math.round(clampNum(e.target, 1, 30, DEFAULTS.shortCount));
    saveSettings();
    applyLanguage();
  });
  $("set-long").addEventListener("change", (e) => {
    settings.longCount = Math.round(clampNum(e.target, 1, 30, DEFAULTS.longCount));
    saveSettings();
    applyLanguage();
  });
  $("set-sound").addEventListener("change", (e) => {
    settings.sound = e.target.value;
    saveSettings();
  });
  $("set-voice").addEventListener("change", (e) => {
    settings.voice = e.target.checked;
    saveSettings();
  });
  $("set-vibrate").addEventListener("change", async (e) => {
    settings.vibrate = e.target.checked;
    saveSettings();
    // Notification permission is what lets the alert mirror to a watch.
    if (settings.vibrate && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  });
  $("btn-preview").addEventListener("click", () => {
    unlockAudio();
    playSound(settings.sound);
  });
}

function clampNum(input, min, max, fallback) {
  let v = parseFloat(input.value);
  if (Number.isNaN(v)) v = fallback;
  v = Math.min(max, Math.max(min, v));
  input.value = v;
  return v;
}

/* ---------- Wiring ---------- */

$("btn-short").addEventListener("click", () => startSession(settings.shortCount));
$("btn-long").addEventListener("click", () => startSession(settings.longCount));
$("btn-settings").addEventListener("click", () => {
  loadSettingsForm();
  showView("settings");
});
$("btn-back").addEventListener("click", () => showView("home"));
$("btn-done").addEventListener("click", () => showView("home"));
$("btn-pause").addEventListener("click", togglePause);
$("btn-stop").addEventListener("click", () => {
  if (confirm(t(settings.lang, "confirmStop"))) stopSession(false);
});

bindSettings();
applyLanguage();
showView("home");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
  );
}
