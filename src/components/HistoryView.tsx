import { Clock, Trash2, Volume2 } from "lucide-react";
import { getLanguage } from "@/lib/languages";
import type { HistoryItem } from "@/lib/history";

interface HistoryViewProps {
  items: HistoryItem[];
  onReplay: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export function HistoryView({ items, onReplay, onDelete }: HistoryViewProps) {
  if (items.length === 0) {
    return (
      <section className="vv-card rounded-2xl p-10 text-center">
        <Clock className="mx-auto h-7 w-7 text-ink-500" />
        <p className="mt-3 font-display text-lg font-700 text-forest-900">No history yet</p>
        <p className="mt-1 text-sm text-ink-700">Your past translations will appear here automatically.</p>
      </section>
    );
  }

  return (
    <section className="vv-card rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-forest-900">
        <Clock className="h-4 w-4 text-emerald2-600" /> Translation history
      </h3>
      <ul className="vv-scroll max-h-[60vh] space-y-2 overflow-y-auto pr-1">
        {items.map((item) => {
          const src = getLanguage(item.source_lang === "auto" ? item.detected_source ?? "en" : item.source_lang);
          const tgt = getLanguage(item.target_lang);
          return (
            <li
              key={item.id}
              className="group flex items-start gap-3 rounded-xl bg-mint-50 p-3 ring-1 ring-bordermint transition hover:bg-white"
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-ink-700">
                  <span>{src?.flag} {src?.name}</span>
                  <span className="text-emerald2-600">→</span>
                  <span>{tgt?.flag} {tgt?.name}</span>
                  <span className="ml-auto">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-ink-900">{item.source_text}</p>
                <p className="text-sm font-semibold text-forest-900">{item.target_text}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onReplay(item)}
                  className="rounded-lg p-1.5 text-ink-700 hover:bg-mint-50 hover:text-emerald2-600"
                  aria-label="Play"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="rounded-lg p-1.5 text-ink-700 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
