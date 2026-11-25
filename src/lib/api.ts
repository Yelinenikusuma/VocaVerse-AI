const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const headers = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
};

export interface TranslateResponse {
  translatedText: string;
  detectedSource: string;
}

export interface TtsResponse {
  audioBase64: string;
  mimeType: string;
}

// In-flight request deduplication: identical concurrent requests share one fetch.
const inflightTranslate = new Map<string, Promise<TranslateResponse>>();
const inflightTts = new Map<string, Promise<TtsResponse>>();

export function translateText(
  text: string,
  source: string,
  target: string,
): Promise<TranslateResponse> {
  const trimmed = text.trim();
  const key = `${source}:${target}:${trimmed}`;
  const existing = inflightTranslate.get(key);
  if (existing) return existing;

  const p = (async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/translate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: trimmed, source, target }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || `Translation failed (${res.status})`;
      const err = new Error(msg);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    if (typeof data.translatedText !== "string") {
      throw new Error("Unexpected response from translation service");
    }
    return data as TranslateResponse;
  })();

  inflightTranslate.set(key, p);
  // Clean up after settle so later identical calls can retry (e.g. after rate-limit clears).
  p.finally(() => inflightTranslate.delete(key));
  return p;
}

export function fetchTts(text: string, lang: string): Promise<TtsResponse> {
  const trimmed = text.trim();
  const key = `${lang}:${trimmed}`;
  const existing = inflightTts.get(key);
  if (existing) return existing;

  const p = (async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/tts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: trimmed, lang }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || `Audio failed (${res.status})`;
      const err = new Error(msg);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    if (typeof data.audioBase64 !== "string") {
      throw new Error("Unexpected response from TTS service");
    }
    return data as TtsResponse;
  })();

  inflightTts.set(key, p);
  p.finally(() => inflightTts.delete(key));
  return p;
}

export function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}
