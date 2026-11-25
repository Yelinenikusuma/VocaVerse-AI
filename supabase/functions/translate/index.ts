const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPPORTED = new Set([
  "auto", "en", "te", "hi", "ta", "kn", "ml", "es", "fr", "de", "ja",
]);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Split text into chunks under maxLen, breaking on sentence boundaries / newlines.
function chunkText(text: string, maxLen = 1800): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const parts = text.split(/(?<=[.!?।。！？\n])/);
  let buf = "";
  for (const part of parts) {
    if ((buf + part).length > maxLen) {
      if (buf) chunks.push(buf);
      if (part.length > maxLen) {
        // hard split very long single sentence
        for (let i = 0; i < part.length; i += maxLen) {
          chunks.push(part.slice(i, i + maxLen));
        }
        buf = "";
      } else {
        buf = part;
      }
    } else {
      buf += part;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

async function translateGoogle(
  text: string,
  src: string,
  target: string,
): Promise<{ translatedText: string; detectedSource: string }> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("dt", "t");
  url.searchParams.set("sl", src);
  url.searchParams.set("tl", target);
  url.searchParams.set("q", text);

  const upstream = await fetch(url.toString(), {
    method: "GET",
    headers: { "User-Agent": UA, Accept: "application/json, text/plain, */*" },
  });

  if (upstream.status === 429 || upstream.status === 503) {
    throw Object.assign(new Error("rate-limit"), { status: upstream.status });
  }
  if (!upstream.ok) {
    throw Object.assign(new Error(`google_${upstream.status}`), { status: upstream.status });
  }

  const data = await upstream.json();
  const segments = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
  const translated = segments
    .map((s: unknown) => (Array.isArray(s) && typeof s[0] === "string" ? s[0] : ""))
    .join("");
  const detected =
    Array.isArray(data) && typeof data[2] === "string" ? data[2] : src === "auto" ? "" : src;

  if (!translated) throw new Error("google_empty");
  return { translatedText: translated, detectedSource: detected };
}

async function translateMyMemory(
  text: string,
  src: string,
  target: string,
): Promise<{ translatedText: string; detectedSource: string }> {
  const sourceLang = src === "auto" ? "Autodetect" : src;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${sourceLang}|${target}`);
  url.searchParams.set("de", "translator@example.com");

  const upstream = await fetch(url.toString(), {
    method: "GET",
    headers: { "User-Agent": UA },
  });

  if (upstream.status === 429 || upstream.status === 503) {
    throw Object.assign(new Error("rate-limit"), { status: upstream.status });
  }
  if (!upstream.ok) {
    throw Object.assign(new Error(`mymemory_${upstream.status}`), { status: upstream.status });
  }

  const data = await upstream.json();
  const translated = data?.responseData?.translatedText;
  if (typeof translated !== "string" || !translated) {
    throw new Error("mymemory_empty");
  }
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)) {
    throw new Error("mymemory_quota");
  }
  const detected = src === "auto" ? data?.responseData?.detectedSourceLanguage || "" : src;
  return { translatedText: translated, detectedSource: detected };
}

// Translate full text, chunking long inputs and stitching results.
async function translateChunked(
  text: string,
  src: string,
  target: string,
  fn: (t: string, s: string, tg: string) => Promise<{ translatedText: string; detectedSource: string }>,
): Promise<{ translatedText: string; detectedSource: string }> {
  const chunks = chunkText(text);
  let combined = "";
  let detected = "";
  for (const chunk of chunks) {
    const result = await fn(chunk, src, target);
    combined += result.translatedText;
    if (!detected && result.detectedSource) detected = result.detectedSource;
  }
  return { translatedText: combined, detectedSource: detected || (src === "auto" ? "" : src) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, source, target } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (typeof target !== "string" || !SUPPORTED.has(target) || target === "auto") {
      return new Response(
        JSON.stringify({ error: "A valid target language is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const src = typeof source === "string" && SUPPORTED.has(source) ? source : "auto";

    const backoffMs = [400, 900, 1800];
    let lastErr: unknown = null;

    for (let attempt = 0; attempt <= backoffMs.length; attempt++) {
      try {
        const result = await translateChunked(text, src, target, translateGoogle);
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number }).status;
        if (status === 429 || status === 503) {
          if (attempt < backoffMs.length) {
            await sleep(backoffMs[attempt]);
            continue;
          }
        }
        break;
      }
    }

    // Fallback to MyMemory.
    try {
      const result = await translateChunked(text, src, target, translateMyMemory);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      if (status === 429 || status === 503) {
        return new Response(
          JSON.stringify({ error: "Translation service is rate-limited. Please wait a few seconds and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const msg = lastErr instanceof Error ? lastErr.message : "Translation failed";
    return new Response(
      JSON.stringify({ error: `Translation service unavailable (${msg})` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
