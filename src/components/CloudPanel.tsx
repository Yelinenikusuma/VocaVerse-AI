import { ReactNode } from "react";
import { Mic, MicOff, RotateCcw, Square, Trash2, Volume2, VolumeX } from "lucide-react";

export type PanelSide = "source" | "target";
export type MicState = "ready" | "listening" | "permission-denied" | "not-supported" | "no-speech";

interface CloudPanelProps {
  side: PanelSide;
  langSlot?: ReactNode;
  value: string;
  placeholder: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  loading?: boolean;
  charCount?: number;
  maxChars?: number;
  showMic?: boolean;
  micState?: MicState;
  micSupported?: boolean;
  onMicClick?: () => void;
  onStopMic?: () => void;
  onCancelMic?: () => void;
  onRetryMic?: () => void;
  interim?: string;
  speaking?: boolean;
  onSpeak?: () => void;
  onCopy?: () => void;
  copied?: boolean;
  onClear?: () => void;
  onFavorite?: () => void;
  favorited?: boolean;
}

export function CloudPanel(props: CloudPanelProps) {
  const {
    side,
    langSlot,
    value,
    placeholder,
    onChange,
    readOnly,
    loading,
    charCount = 0,
    maxChars = 1500,
    showMic,
    micState = "ready",
    micSupported = true,
    onMicClick,
    onStopMic,
    onRetryMic,
    interim,
    speaking,
    onSpeak,
    onCopy,
    copied,
    onClear,
    onFavorite,
    favorited,
  } = props;

  const isSource = side === "source";

  return (
    <div className="relative flex h-full w-full flex-col rounded-2xl bg-gradient-to-b from-white to-mint-50 p-4 shadow-card ring-1 ring-emerald2-500/30">
      {/* Inner double-line border accent */}
      <div className="pointer-events-none absolute inset-1.5 rounded-xl ring-1 ring-emerald2-400/40" aria-hidden="true" />

      {/* Content layer */}
      <div className="relative flex h-full w-full flex-col">
        {/* Language selector (top) */}
        {langSlot && <div className="mb-2 shrink-0">{langSlot}</div>}

        {/* Text area / output */}
        <div className="relative min-h-0 flex-1">
          {loading && !value ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-1.5 text-ink-700">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-mint-100 border-t-emerald2-600" />
                <span className="text-xs">Translating...</span>
              </div>
            </div>
          ) : (
            <>
              {isSource ? (
                <textarea
                  value={value}
                  onChange={(e) => onChange?.(e.target.value.slice(0, maxChars))}
                  placeholder={placeholder}
                  className="vv-scroll h-full w-full resize-none rounded-lg bg-transparent px-2 py-1.5 font-display text-base leading-relaxed placeholder:text-[#9CA3AF] focus:outline-none"
                  style={{ color: "#1F2937", caretColor: "#059669" }}
                />
              ) : (
                <p
                  className={`vv-scroll h-full w-full overflow-y-auto whitespace-pre-wrap px-2 py-1.5 font-display text-base leading-relaxed ${
                    value ? "text-forest-900" : "text-ink-500"
                  }`}
                >
                  {value || placeholder}
                </p>
              )}
              {isSource && micState === "listening" && interim && (
                <p className="pointer-events-none absolute inset-x-2 bottom-0 truncate text-sm italic text-emerald2-600">
                  {interim}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer controls */}
        <div className="mt-2 flex shrink-0 items-center justify-between gap-2 border-t border-bordermint/60 pt-2">
          <div className="flex items-center gap-1.5">
            {showMic && (
              <MicButton state={micState} supported={micSupported} onClick={onMicClick ?? (() => {})} />
            )}
            {isSource && (
              <span className="text-[11px] font-medium text-emerald2-600">
                {micState === "listening" ? "Listening..." : "Speak"}
              </span>
            )}
            {micState === "listening" && onStopMic && (
              <button
                type="button"
                onClick={onStopMic}
                className="flex items-center gap-1 rounded-full bg-mint-50 px-2 py-1 text-[11px] font-semibold text-forest-900 ring-1 ring-bordermint transition hover:bg-mint-100"
              >
                <Square className="h-2.5 w-2.5" /> Stop
              </button>
            )}
            {micState === "permission-denied" && onRetryMic && (
              <button
                type="button"
                onClick={onRetryMic}
                className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100"
              >
                <RotateCcw className="h-3 w-3" /> Retry mic
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            {onClear && value && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 rounded-lg bg-transparent px-1.5 py-1 text-[11px] font-semibold text-ink-700 transition hover:bg-rose-50 hover:text-rose-500"
                aria-label="Clear"
                title="Clear"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </button>
            )}
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                disabled={!value}
                className="flex items-center gap-1 rounded-lg bg-transparent px-1.5 py-1 text-[11px] font-semibold text-ink-700 transition hover:bg-mint-50 hover:text-emerald2-600 disabled:opacity-30"
                aria-label="Copy"
                title="Copy"
              >
                {copied ? <Square className="h-4 w-4 text-emerald2-600" /> : <CopyIcon />} Copy
              </button>
            )}
            {onSpeak && (
              <button
                type="button"
                onClick={onSpeak}
                disabled={!value.trim()}
                className="flex items-center gap-1 rounded-lg bg-transparent px-1.5 py-1 text-[11px] font-semibold text-ink-700 transition hover:bg-mint-50 hover:text-emerald2-600 disabled:opacity-30"
                aria-label="Listen"
                title={speaking ? "Stop audio" : "Listen"}
              >
                {speaking ? <VolumeX className="h-4 w-4 text-emerald2-600" /> : <Volume2 className="h-4 w-4" />} Listen
              </button>
            )}
            {onFavorite && (
              <button
                type="button"
                onClick={onFavorite}
                disabled={!value.trim()}
                className={`flex items-center gap-1 rounded-lg bg-transparent px-1.5 py-1 text-[11px] font-semibold transition disabled:opacity-30 ${
                  favorited
                    ? "text-amber-500 hover:bg-amber-50"
                    : "text-ink-700 hover:bg-mint-50 hover:text-amber-500"
                }`}
                aria-label="Save"
                title={favorited ? "Saved" : "Save to favorites"}
              >
                <StarIcon filled={favorited} /> Save
              </button>
            )}
          </div>
        </div>

        {/* Char count (source only) */}
        {isSource && (
          <div className="mt-0.5 flex shrink-0 justify-end">
            <span className="text-[10px] text-ink-700">
              {charCount}/{maxChars}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73L18.18 21z" />
    </svg>
  );
}

function MicButton({
  state,
  supported,
  onClick,
}: {
  state: MicState;
  supported: boolean;
  onClick: () => void;
}) {
  const listening = state === "listening";
  const denied = state === "permission-denied";
  const unsupported = state === "not-supported";

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        !supported
          ? "Speech recognition not supported in this browser"
          : listening
          ? "Stop listening"
          : "Start listening"
      }
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
        listening
          ? "vv-btn-emerald text-white shadow-emerald vv-pulse"
          : denied
          ? "bg-amber-100 text-amber-700"
          : unsupported
          ? "bg-mint-100 text-ink-500"
          : "vv-btn-emerald text-white shadow-md"
      }`}
    >
      {listening ? (
        <Square className="relative h-4 w-4" fill="currentColor" />
      ) : unsupported ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}
