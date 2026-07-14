export const STRINGS = {
  en: {
    appName: "Reiki Timer",
    tagline: "Guided self-treatment sessions",
    startShort: "Short session",
    startLong: "Long session",
    settings: "Settings",
    back: "Back",
    language: "Language",
    intervalLength: "Interval length (minutes)",
    shortCount: "Short session intervals",
    longCount: "Long session intervals",
    sound: "Chime sound",
    voice: "Voice guidance",
    preview: "Play",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    started: "Started",
    ends: "Ends",
    elapsed: "Elapsed",
    remaining: "Remaining",
    positionOf: "Position {a} of {b}",
    positionVoice: "Position {a}",
    vibrate: "Vibrate on interval (phone & watch)",
    backViewNote: "Hands shown from behind",
    complete: "Session complete",
    completeMsg: "Take a quiet moment before returning.",
    completeVoice: "Your session is complete. Well done.",
    done: "Done",
    confirmStop: "Stop this session?",
    min: "min",
    sounds: {
      softBell: "Soft Bell",
      tibetanBowl: "Tibetan Bowl",
      chime: "Chime",
      gong: "Gong",
      beep: "Beep",
    },
  },
  bg: {
    appName: "Рейки Таймер",
    tagline: "Водени сесии за самолечение",
    startShort: "Кратка сесия",
    startLong: "Дълга сесия",
    settings: "Настройки",
    back: "Назад",
    language: "Език",
    intervalLength: "Продължителност на интервала (минути)",
    shortCount: "Интервали в кратка сесия",
    longCount: "Интервали в дълга сесия",
    sound: "Звук",
    voice: "Гласови указания",
    preview: "Пробвай",
    pause: "Пауза",
    resume: "Продължи",
    stop: "Стоп",
    started: "Начало",
    ends: "Край",
    elapsed: "Изминало",
    remaining: "Оставащо",
    positionOf: "Позиция {a} от {b}",
    positionVoice: "Позиция {a}",
    vibrate: "Вибрация на интервал (телефон и часовник)",
    backViewNote: "Ръцете са показани в гръб",
    complete: "Сесията приключи",
    completeMsg: "Отделете си спокоен момент, преди да продължите.",
    completeVoice: "Сесията приключи. Браво.",
    done: "Готово",
    confirmStop: "Да спра ли сесията?",
    min: "мин",
    sounds: {
      softBell: "Мек звънец",
      tibetanBowl: "Тибетска купа",
      chime: "Камбанки",
      gong: "Гонг",
      beep: "Сигнал",
    },
  },
};

// Spelled-out numbers for speech: digits like "1." get read as ordinals in
// Bulgarian ("първи"), but the spoken form should be "едно", "две", …
const NUMBER_WORDS = {
  en: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
    "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five", "twenty-six", "twenty-seven", "twenty-eight", "twenty-nine", "thirty"],
  bg: ["едно", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет", "десет",
    "единадесет", "дванадесет", "тринадесет", "четиринадесет", "петнадесет", "шестнадесет", "седемнадесет", "осемнадесет", "деветнадесет", "двадесет",
    "двадесет и едно", "двадесет и две", "двадесет и три", "двадесет и четири", "двадесет и пет", "двадесет и шест", "двадесет и седем", "двадесет и осем", "двадесет и девет", "тридесет"],
};

export function numberWord(lang, n) {
  return NUMBER_WORDS[lang]?.[n - 1] || String(n);
}

export function t(lang, key, vars) {
  let s = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
