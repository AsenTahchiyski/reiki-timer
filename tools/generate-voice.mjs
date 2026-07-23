// Regenerates the pre-recorded voice clips in audio/voice/ using Microsoft
// Edge neural TTS. Run whenever position texts, languages or voices change:
//
//   npm install --no-save msedge-tts   (from the repo root)
//   node tools/generate-voice.mjs
//
// Existing files are skipped; delete audio/voice/ first for a full rebuild.
import { mkdir, copyFile, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import path from "path";

const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { POSITIONS } = await import(path.join(ROOT, "js/positions.js"));
const { STRINGS, numberWord } = await import(path.join(ROOT, "js/i18n.js"));

const LANGS = {
  en: {
    word: "Position",
    voices: {
      male: { voice: "en-US-ChristopherNeural", opts: { rate: "-18%", pitch: "-4Hz" } },
      female: { voice: "en-US-JennyNeural", opts: { rate: "-15%" } },
    },
  },
  bg: {
    word: "Позиция",
    voices: {
      female: { voice: "bg-BG-KalinaNeural", opts: { rate: "-10%" } },
      male: { voice: "bg-BG-BorislavNeural", opts: { rate: "-10%" } },
    },
  },
};

const OUT = path.join(ROOT, "audio/voice");
const TMP = path.join(tmpdir(), "reiki-voice-gen");
const pad = (n) => String(n).padStart(2, "0");

async function synth(lang, cfg, text, dest, attempt = 1) {
  // msedge-tts injects the text into SSML unescaped; & < > break the request.
  text = text.replace(/\s*&\s*/g, lang === "bg" ? " и " : " and ").replace(/[<>]/g, " ");
  try {
    await stat(dest);
    return; // already generated
  } catch {}
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(cfg.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioFilePath } = await tts.toFile(TMP, text, cfg.opts);
    tts.close?.();
    const s = await stat(audioFilePath);
    if (s.size < 1000) throw new Error(`suspiciously small: ${s.size}B`);
    await copyFile(audioFilePath, dest);
    await rm(audioFilePath);
    console.log(`${dest}  ${(s.size / 1024).toFixed(0)}KB`);
  } catch (err) {
    if (attempt >= 4) throw err;
    console.log(`retry ${attempt} for ${dest}: ${err.message}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
    return synth(lang, cfg, text, dest, attempt + 1);
  }
}

await mkdir(TMP, { recursive: true });
for (const [lang, langCfg] of Object.entries(LANGS)) {
  for (const [gender, cfg] of Object.entries(langCfg.voices)) {
    const dir = path.join(OUT, lang, gender);
    await mkdir(dir, { recursive: true });
    for (let n = 1; n <= 30; n++) {
      await synth(lang, cfg, `${langCfg.word} ${numberWord(lang, n)}.`, path.join(dir, `num${pad(n)}.mp3`));
    }
    for (let i = 0; i < POSITIONS.length; i++) {
      const { title, desc } = POSITIONS[i][lang];
      await synth(lang, cfg, `${title}. ${desc}`, path.join(dir, `pos${pad(i + 1)}.mp3`));
    }
    await synth(lang, cfg, STRINGS[lang].completeVoice, path.join(dir, "complete.mp3"));
  }
}
console.log("done");
