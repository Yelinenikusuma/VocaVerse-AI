const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VOICE_MAP: Record<string, string> = {
  en: "en-in",
  te: "te-in",
  hi: "hi-in",
  ta: "ta-in",
  kn: "kn-in",
  ml: "ml-in",
  es: "es-es",
  fr: "fr-fr",
  de: "de-de",
  ja: "ja-jp",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Split text into chunks <= maxLen, breaking on sentence boundaries.
function chunkText(text: string, maxLen = 190): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const parts = text.split(/(?<=[.!?।。！？\n])/);
  let buf = "";
  for (const part of parts) {
    if ((buf + part).length > maxLen) {
      if (buf) chunks.push(buf.trim());
      if (part.length > maxLen) {
        for (let i = 0; i < part.length; i += maxLen) {
          chunks.push(part.slice(i, i + maxLen).trim());
        }
        buf = "";
      } else {
        buf = part;
      }
    } else {
      buf += part;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.filter(Boolean);
}

async function fetchTtsChunk(
  text: string,
  tl: string,
  retries: number[] = [400, 900],
): Promise<Uint8Array> {
  const url = new URL("https://translate.googleapis.com/translate_tts");
  url.searchParams.set("ie", "UTF-8");
  url.searchParams.set("client", "tw-ob");
  url.searchParams.set("tl", tl);
  url.searchParams.set("q", text);

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries.length; attempt++) {
    try {
      const upstream = await fetch(url.toString(), {
        method: "GET",
        headers: { "User-Agent": UA, Accept: "audio/mpeg, */*" },
      });

      if (upstream.status === 429 || upstream.status === 503) {
        if (attempt < retries.length) {
          await sleep(retries[attempt]);
          continue;
        }
        lastErr = new Error("rate-limit");
        break;
      }
      if (!upstream.ok) {
        lastErr = new Error(`tts_${upstream.status}`);
        break;
      }

      const audioBytes = new Uint8Array(await upstream.arrayBuffer());
      if (audioBytes.length === 0) {
        lastErr = new Error("tts_empty");
        break;
      }
      return audioBytes;
    } catch (err) {
      lastErr = err;
      if (attempt < retries.length) {
        await sleep(retries[attempt]);
        continue;
      }
      break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("tts_failed");
}

// Concatenate MP3 byte arrays. MP3 frames are self-contained so simple
// concatenation works for speech segments produced by the same TTS voice.
function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, lang } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (typeof lang !== "string" || !(lang in VOICE_MAP)) {
      return new Response(
        JSON.stringify({ error: "Unsupported language" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tl = VOICE_MAP[lang];
    const fullText = text.slice(0, 2000);
    const chunks = chunkText(fullText);

    const audioChunks: Uint8Array[] = [];
    try {
      for (const chunk of chunks) {
        const bytes = await fetchTtsChunk(chunk, tl);
        audioChunks.push(bytes);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "TTS failed";
      const isRateLimit = msg.includes("rate-limit");
      // If we got some chunks before failing, return partial audio.
      if (audioChunks.length > 0) {
        const combined = concatBytes(audioChunks);
        const base64 = btoa(String.fromCharCode(...combined));
        return new Response(
          JSON.stringify({ audioBase64: base64, mimeType: "audio/mpeg" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          error: isRateLimit
            ? "Audio service is rate-limited. Please wait a few seconds and try again."
            : `TTS service unavailable (${msg})`,
        }),
        { status: isRateLimit ? 429 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const combined = concatBytes(audioChunks);
    const base64 = btoa(String.fromCharCode(...combined));
    return new Response(
      JSON.stringify({ audioBase64: base64, mimeType: "audio/mpeg" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
