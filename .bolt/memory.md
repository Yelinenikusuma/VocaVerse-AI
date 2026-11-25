# Project memory

## Product intent & audience

- Google Translate-style voice translator web app; production-grade, fully functional (not a prototype).
- Audience: users needing bidirectional translation + speech I/O across 10 languages, with emphasis on Indic languages (Telugu, Hindi, Tamil, Kannada, Malayalam).

## Brand personality & voice

- Professional, utility-focused, Google Translate-inspired clarity.
- Status/feedback copy is direct and human: "Listening…", "Translation completed", "Microphone permission denied", "Speech not detected".

## Visual design & UX direction

- Tailwind CSS for styling; Lucide React for icons (logo + UI).
- Two-pane translator layout: source (left) and target (right) text areas with language dropdowns and a swap control between them.
- Mic button with live listening animation; interim recognition text preview.
- Speaker buttons on both source and translated panels.
- Example phrase chips for quick testing of spec sentences.
- Searchable language dropdowns with auto-detect source option.
- Responsive layout; clear loading and error states.

## Decisions, constraints & rationale

- Stack: React + TypeScript + Vite; Tailwind; Supabase Edge Functions as server-side proxy for translation + TTS.
- Secrets kept server-side via edge functions; frontend uses Supabase URL + anon key only.
- Real translation engine (Google translate endpoint) and real cloud TTS — no dummy/transliterated output.
- Exactly 10 languages with fixed speech-recognition locale codes: en-IN, te-IN, hi-IN, ta-IN, kn-IN, ml-IN, es-ES, fr-FR, de-DE, ja-JP.
- TTS must use cloud service, not browser SpeechSynthesis alone, because many devices lack Indic voices.
- Speech recognition via Web Speech API; graceful fallback/unsupported state in non-Chromium browsers.
- Path alias `@/` → `src/`; avoid deep relative imports.
- No extra UI/icon packages beyond Lucide React unless explicitly requested.

## Open questions & assumptions

- Assumes Supabase project provisioned with edge functions deployable; env vars configured server-side.
- Browser speech recognition supported only in Chromium-based + Safari; mic unsupported state handled.
- No persisted history/favorites feature requested yet.