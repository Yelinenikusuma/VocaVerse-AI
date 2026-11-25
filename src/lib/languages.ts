export interface Language {
  code: string;        // ISO 639-1 used for translation
  bcp47: string;       // BCP-47 used for speech recognition + TTS
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", bcp47: "en-IN", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "te", bcp47: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "hi", bcp47: "hi-IN", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ta", bcp47: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "kn", bcp47: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", bcp47: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "es", bcp47: "es-ES", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", bcp47: "fr-FR", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", bcp47: "de-DE", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ja", bcp47: "ja-JP", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
];

export const AUTO_DETECT: Language = {
  code: "auto",
  bcp47: "",
  name: "Detect language",
  nativeName: "Auto",
  flag: "🌐",
};

export function getLanguage(code: string): Language | undefined {
  if (code === "auto") return AUTO_DETECT;
  return LANGUAGES.find((l) => l.code === code);
}
