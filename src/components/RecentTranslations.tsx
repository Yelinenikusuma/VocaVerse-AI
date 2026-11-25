import { Clock, Trash2, Volume2 } from "lucide-react";
import { getLanguage } from "@/lib/languages";
import type { HistoryItem } from "@/lib/history";

interface RecentTranslationsProps {
  items: HistoryItem[];
  onReplay: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onSeeAll: () => void;
}

export function RecentTranslations({
  items,
  onReplay,
  onDelete,
  onSeeAll,
}: RecentTranslationsProps) {
  if (items.length === 0) {
    return (
      <section className="vv-card rounded-2xl p-5 text-center">
        <Clock className="mx-auto h-6 w-6 text-ink-500" />
        <p className="mt-2 text-sm text-ink-700">No translations yet. Start speaking or typing above.</p>
      </section>
    );
  }

  return (
    <section className="vv-card rounded-2xl p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-forest-900">
          <Clock className="h-4 w-4 text-emerald2-600" /> Recent translations
        </h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold text-emerald2-600 hover:underline"
        >
          View all
        </button>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const src = getLanguage(item.source_lang === "auto" ? item.detected_source ?? "en" : item.source_lang);
          const tgt = getLanguage(item.target_lang);
          return (
            <li
              key={item.id}
              className="group flex items-start gap-3 rounded-xl bg-mint-50 p-2.5 ring-1 ring-bordermint transition hover:bg-white"
            >
              <button type="button" onClick={() => onReplay(item)} className="flex-1 text-left">
                <div className="mb-0.5 flex items-center gap-1.5 text-[11px] text-ink-700">
                  <span>{src?.flag} {src?.name}</span>
                  <span className="text-emerald2-600">→</span>
                  <span>{tgt?.flag} {tgt?.name}</span>
                </div>
                <p className="line-clamp-1 text-[13px] text-ink-900">{item.source_text}</p>
                <p className="line-clamp-1 text-[13px] font-semibold text-forest-900">{item.target_text}</p>
              </button>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onReplay(item)}
                  className="rounded-lg p-1.5 text-ink-700 hover:bg-mint-50 hover:text-emerald2-600"
                  aria-label="Replay"
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
