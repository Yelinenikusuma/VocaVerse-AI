import { useCallback, useEffect, useRef, useState } from "react";
import { Hash, Globe2, Loader2, Mic2, Play, Sparkles } from "lucide-react";
import { Header, NavHint, NavTab } from "@/components/Header";
import { LanguagePicker } from "@/components/LanguagePicker";
import { CloudPanel, MicState } from "@/components/CloudPanel";
import { SwapButton } from "@/components/SwapButton";
import { GlobeDeco, WaveformDeco } from "@/components/Decorations";
import { StatCards } from "@/components/StatCards";
import { QuickLangCards } from "@/components/QuickLangCards";
import { HistoryView } from "@/components/HistoryView";
import { FavoritesView } from "@/components/FavoritesView";
import { SettingsView, AppSettings } from "@/components/SettingsView";
import { Footer } from "@/components/Footer";
import { getLanguage, LANGUAGES } from "@/lib/languages";
import { base64ToDataUrl, fetchTts, translateText } from "@/lib/api";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import {
  addFavorite,
  addHistory,
  deleteHistory,
  fetchFavorites,
  fetchHistoryCount,
  fetchRecentHistory,
  FavoriteItem,
  HistoryItem,
  removeFavorite,
} from "@/lib/history";

type Status =
  | "ready"
  | "listening"
  | "processing"
  | "done"
  | "permission-denied"
  | "not-supported"
  | "no-speech"
  | "error";

const EXAMPLES: { label: string; text: string }[] = [
  { label: "How are you?", text: "How are you?" },
  { label: "What are you doing?", text: "What are you doing?" },
  { label: "Where are you going?", text: "Where are you going?" },
  { label: "I am fine.", text: "I am fine." },
  { label: "Thank you.", text: "Thank you." },
  { label: "I will come tomorrow.", text: "I will come tomorrow." },
];

const DEFAULT_SETTINGS: AppSettings = {
  autoTranslate: true,
  autoSpeakTarget: false,
  micContinuous: true,
};

export default function App() {
  const [tab, setTab] = useState<NavTab>("home");

  // translation state
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("te");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [detected, setDetected] = useState("");
  const [translating, setTranslating] = useState(false);
  const [status, setStatus] = useState<Status>("ready");
  const [errorMsg, setErrorMsg] = useState("");
  const [speakingSide, setSpeakingSide] = useState<"source" | "target" | null>(null);
  const [copied, setCopied] = useState<"source" | "target" | null>(null);
  const [favorited, setFavorited] = useState(false);

  // history / favorites
  const [recent, setRecent] = useState<HistoryItem[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [allHistory, setAllHistory] = useState<HistoryItem[]>([]);

  // settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightAbortRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSavedRef = useRef<{ source: string; target: string; text: string } | null>(null);

  const { supported: micSupported, status: micStatus, interim, start, stop, cancel } =
    useSpeechRecognition({
      onFinalText: (text) => {
        setInputText(text);
        void runTranslate(text, source, target, { fromVoice: true });
      },
    });

  const refreshRecent = useCallback(async () => {
    const [items, count] = await Promise.all([fetchRecentHistory(6), fetchHistoryCount()]);
    setRecent(items);
    setHistoryCount(count);
  }, []);

  const refreshAllHistory = useCallback(async () => {
    const items = await fetchRecentHistory(100);
    setAllHistory(items);
  }, []);

  const refreshFavorites = useCallback(async () => {
    const items = await fetchFavorites();
    setFavorites(items);
  }, []);

  useEffect(() => {
    void refreshRecent();
  }, [refreshRecent]);

  useEffect(() => {
    if (tab === "history") void refreshAllHistory();
    if (tab === "favorites") void refreshFavorites();
  }, [tab, refreshAllHistory, refreshFavorites]);

  useEffect(() => {
    if (micStatus === "listening") setStatus("listening");
    else if (micStatus === "permission-denied") setStatus("permission-denied");
    else if (micStatus === "not-supported") setStatus("not-supported");
    else if (micStatus === "no-speech" && status === "listening") setStatus("no-speech");
  }, [micStatus, status]);

  const runTranslate = useCallback(
    async (text: string, src: string, tgt: string, opts?: { fromVoice?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setOutputText("");
        setDetected("");
        setStatus("ready");
        return;
      }
      inFlightAbortRef.current = true;
      setTranslating(true);
      setStatus("processing");
      setErrorMsg("");
      try {
        const result = await translateText(trimmed, src, tgt);
        setOutputText(result.translatedText);
        setDetected(result.detectedSource || "");
        setStatus("done");
        setFavorited(false);

        const sig = { source: src, target: tgt, text: trimmed };
        const prev = lastSavedRef.current;
        if (!prev || prev.source !== sig.source || prev.target !== sig.target || prev.text !== sig.text) {
          void addHistory({
            source_lang: src,
            target_lang: tgt,
            source_text: trimmed,
            target_text: result.translatedText,
            detected_source: result.detectedSource || null,
          });
          lastSavedRef.current = sig;
          void refreshRecent();
        }

        if (opts?.fromVoice && settings.autoSpeakTarget) {
          void playTts(result.translatedText, tgt, "target");
        }
      } catch (err) {
        const e = err as Error & { status?: number };
        if (e.status === 429) {
          setErrorMsg("Translation service is rate-limited. Please wait a few seconds and try again.");
        } else {
          setErrorMsg(e?.message || "Translation failed");
        }
        setOutputText("");
        setStatus("error");
      } finally {
        setTranslating(false);
        inFlightAbortRef.current = false;
      }
    },
    [refreshRecent, settings.autoSpeakTarget],
  );

  const scheduleTranslate = useCallback(
    (text: string, src: string, tgt: string) => {
      if (!settings.autoTranslate) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        if (inFlightAbortRef.current) return;
        void runTranslate(text, src, tgt);
      }, 700);
    },
    [runTranslate, settings.autoTranslate],
  );

  const onInputChange = (value: string) => {
    setInputText(value);
    setFavorited(false);
    void scheduleTranslate(value, source, target);
  };

  const onTranslateClick = () => {
    if (translating) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    void runTranslate(inputText, source, target);
  };

  const swap = () => {
    const resolvedSource = source === "auto" ? detected || "en" : source;
    const nextSource = target;
    const nextTarget = resolvedSource;
    const nextInput = outputText;
    setSource(nextSource);
    setTarget(nextTarget);
    setInputText(nextInput);
    setOutputText(inputText);
    setDetected("");
    setFavorited(false);
    if (nextInput.trim()) void runTranslate(nextInput, nextSource, nextTarget);
  };

  const onPickSource = (code: string) => {
    setSource(code);
    if (inputText.trim()) void runTranslate(inputText, code, target);
  };

  const onPickTarget = (code: string) => {
    setTarget(code);
    if (inputText.trim()) void runTranslate(inputText, source, code);
  };

  const onMicClick = () => {
    if (status === "listening") {
      stop();
      setStatus("ready");
      return;
    }
    if (!micSupported) {
      setStatus("not-supported");
      return;
    }
    const srcLang = getLanguage(source === "auto" ? detected : source);
    const bcp47 = srcLang?.bcp47 || "en-IN";
    setStatus("listening");
    start(bcp47);
  };

  const onRetryMic = () => {
    setErrorMsg("");
    setStatus("ready");
    const srcLang = getLanguage(source === "auto" ? detected : source);
    start(srcLang?.bcp47 || "en-IN");
  };

  const onCopy = async (text: string, side: "source" | "target") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(side);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeakingSide(null);
  };

  const playTts = async (text: string, langCode: string, side: "source" | "target") => {
    if (!text.trim()) return;
    if (speakingSide === side) {
      stopAudio();
      return;
    }
    stopAudio();
    setSpeakingSide(side);
    setErrorMsg("");
    try {
      const tts = await fetchTts(text, langCode);
      const url = base64ToDataUrl(tts.audioBase64, tts.mimeType);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        audioRef.current = null;
        setSpeakingSide(null);
      };
      audio.onerror = () => {
        audioRef.current = null;
        setSpeakingSide(null);
        setErrorMsg("Audio playback failed");
        setStatus("error");
      };
      await audio.play();
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 429) {
        setErrorMsg("Audio service is rate-limited. Please wait a few seconds and try again.");
      } else {
        setErrorMsg(e?.message || "Audio failed");
      }
      setStatus("error");
      setSpeakingSide(null);
    }
  };

  const toggleFavorite = async () => {
    if (!outputText.trim() || !inputText.trim()) return;
    if (favorited) return;
    const added = await addFavorite({
      source_lang: source === "auto" ? detected || "en" : source,
      target_lang: target,
      source_text: inputText.trim(),
      target_text: outputText.trim(),
    });
    if (added) {
      setFavorited(true);
      void refreshFavorites();
    }
  };

  const clearAll = () => {
    cancel();
    stopAudio();
    setInputText("");
    setOutputText("");
    setDetected("");
    setErrorMsg("");
    setStatus("ready");
    setSpeakingSide(null);
    setFavorited(false);
  };

  const replayFromRecent = (item: HistoryItem) => {
    setTab("home");
    setSource(item.source_lang);
    setTarget(item.target_lang);
    setInputText(item.source_text);
    setOutputText(item.target_text);
    setDetected(item.detected_source ?? "");
    setFavorited(false);
  };

  const replayFromFavorite = (item: FavoriteItem) => {
    setTab("home");
    setSource(item.source_lang);
    setTarget(item.target_lang);
    setInputText(item.source_text);
    setOutputText(item.target_text);
    setFavorited(true);
  };

  const onDeleteRecent = async (id: string) => {
    await deleteHistory(id);
    void refreshRecent();
    if (tab === "history") void refreshAllHistory();
  };

  const onRemoveFavorite = async (id: string) => {
    await removeFavorite(id);
    void refreshFavorites();
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const currentSource = getLanguage(source === "auto" ? detected : source) || LANGUAGES[0];
  const currentTarget = getLanguage(target) || LANGUAGES[1];
  const charCount = inputText.length;
  const maxChars = 1500;
  const canTranslate = inputText.trim().length > 0 && !translating;
  const micState: MicState =
    status === "listening"
      ? "listening"
      : status === "permission-denied"
      ? "permission-denied"
      : status === "not-supported"
      ? "not-supported"
      : status === "no-speech"
      ? "no-speech"
      : "ready";

  return (
    <div className="flex min-h-screen flex-col vv-bg lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <Header
        active={tab}
        onNavigate={setTab}
        historyCount={historyCount}
        favoritesCount={favorites.length}
      />

      {/* HOME — one screen, no scroll on desktop (target 1440x900) */}
      {tab === "home" && (
        <main className="vv-fade mx-auto flex h-full w-full max-w-6xl flex-1 flex-col px-5 pb-3 pt-3 lg:pt-4">
          {/* Welcome heading + subtitle (globe left, waveform right) */}
          <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
            <GlobeDeco className="hidden h-11 w-11 shrink-0 sm:block vv-float" />
            <div className="flex-1 text-center">
              <h2 className="font-display text-[24px] font-800 leading-tight text-forest-900 lg:text-[28px]">
                Break Language Barriers with <span className="vv-text-emerald">AI</span>
              </h2>
              <p className="text-[12px] text-ink-700 lg:text-[13px]">
                Translate your voice and text instantly across multiple languages.
              </p>
            </div>
            <WaveformDeco className="hidden h-9 w-14 shrink-0 sm:block" active={status === "listening"} />
          </div>

          {/* Cloud translation panels + swap button centered between them */}
          <div className="relative grid min-h-0 flex-1 items-stretch gap-6 md:grid-cols-2">
            {/* Source cloud (English) — language selector inside cloud */}
            <div className="relative">
              <CloudPanel
                side="source"
                langSlot={
                  <LanguagePicker value={source} onChange={onPickSource} allowAuto align="left" variant="compact" />
                }
                value={inputText}
                placeholder="Type something to translate..."
                onChange={onInputChange}
                charCount={charCount}
                maxChars={maxChars}
                showMic
                micState={micState}
                micSupported={micSupported}
                onMicClick={onMicClick}
                onStopMic={() => {
                  stop();
                  setStatus("ready");
                }}
                onCancelMic={() => {
                  cancel();
                  setStatus("ready");
                }}
                onRetryMic={onRetryMic}
                interim={interim}
                onCopy={() => onCopy(inputText, "source")}
                copied={copied === "source"}
                onClear={clearAll}
              />
            </div>

            {/* Floating swap button between clouds */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <div className="pointer-events-auto">
                <SwapButton onClick={swap} />
              </div>
            </div>

            {/* Target cloud (Hindi) — language selector inside cloud */}
            <div className="relative">
              <CloudPanel
                side="target"
                langSlot={
                  <LanguagePicker value={target} onChange={onPickTarget} align="left" variant="compact" />
                }
                value={outputText}
                placeholder="Translation will appear here..."
                readOnly
                loading={translating}
                speaking={speakingSide === "target"}
                onSpeak={() => playTts(outputText, currentTarget.code, "target")}
                onCopy={() => onCopy(outputText, "target")}
                copied={copied === "target"}
                onFavorite={toggleFavorite}
                favorited={favorited}
              />
            </div>
          </div>

          {/* Translate Now button directly below the clouds */}
          <div className="mt-3 flex shrink-0 flex-col items-center gap-2">
            <button
              type="button"
              onClick={onTranslateClick}
              disabled={!canTranslate}
              className={`flex items-center gap-2 rounded-full px-7 py-2.5 text-[15px] font-semibold transition ${
                canTranslate
                  ? "vv-btn-emerald text-white shadow-emerald"
                  : "cursor-not-allowed bg-mint-100 text-ink-500"
              }`}
            >
              {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {translating ? "Translating..." : "Translate"}
            </button>
            {errorMsg && (
              <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 ring-1 ring-rose-100">
                {errorMsg}
              </span>
            )}
            {status === "listening" && (
              <span className="flex items-center gap-2 rounded-full bg-mint-50 px-3 py-1.5 text-xs font-medium text-emerald2-700 ring-1 ring-bordermint">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald2-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald2-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald2-500" />
                </span>
                Listening in {currentSource.name}...
              </span>
            )}
            {status === "no-speech" && (
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                No speech detected — try again.
              </span>
            )}
          </div>

          {/* Compact suggested phrases */}
          <div className="mt-2 flex shrink-0 flex-wrap items-center justify-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-700">
              Try:
            </span>
            {EXAMPLES.map((e) => (
              <button
                key={e.label}
                type="button"
                onClick={() => onInputChange(e.text)}
                className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-forest-900 ring-1 ring-bordermint transition hover:bg-mint-50 hover:text-emerald2-600"
              >
                {e.label}
              </button>
            ))}
          </div>

          {/* Compact feature bar at the bottom */}
          <div className="mt-2.5 grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
            <FeatureChip icon={Hash} label="Translations" value={historyCount.toLocaleString()} />
            <FeatureChip icon={Globe2} label="Languages" value={String(LANGUAGES.length)} />
            <FeatureChip icon={Mic2} label="Voice ready" value="10 locales" />
            <FeatureChip icon={Sparkles} label="Powered by" value="AI engine" />
          </div>
        </main>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <main className="vv-fade mx-auto w-full max-w-4xl flex-1 px-5 py-6">
          <NavHint tab="history" />
          <HistoryView items={allHistory} onReplay={replayFromRecent} onDelete={onDeleteRecent} />
        </main>
      )}

      {/* FAVORITES */}
      {tab === "favorites" && (
        <main className="vv-fade mx-auto w-full max-w-4xl flex-1 px-5 py-6">
          <NavHint tab="favorites" />
          <FavoritesView items={favorites} onReplay={replayFromFavorite} onRemove={onRemoveFavorite} />
        </main>
      )}

      {/* SETTINGS */}
      {tab === "settings" && (
        <main className="vv-fade mx-auto w-full max-w-3xl flex-1 px-5 py-6">
          <NavHint tab="settings" />
          <SettingsView settings={settings} onChange={setSettings} />
          <div className="mt-5">
            <StatCards translationsCompleted={historyCount} languagesSupported={LANGUAGES.length} />
          </div>
          <div className="mt-5">
            <QuickLangCards currentTarget={target} onPick={(c) => { setTarget(c); setTab("home"); }} />
          </div>
        </main>
      )}

      {/* Footer only on secondary tabs — keeps the Home dashboard to one screen */}
      {tab !== "home" && <Footer />}
    </div>
  );
}

function FeatureChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
}) {
  return (
    <div className="vv-card flex items-center gap-2 rounded-xl px-3 py-1.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-mint-50 text-emerald2-600 ring-1 ring-bordermint">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-display text-[13px] font-700 text-forest-900">{value}</p>
        <p className="truncate text-[10px] text-ink-700">{label}</p>
      </div>
    </div>
  );
}
