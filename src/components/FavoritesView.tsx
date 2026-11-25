import { ArrowRight, Star, Trash2, Volume2 } from "lucide-react";
import { getLanguage } from "@/lib/languages";
import type { FavoriteItem } from "@/lib/history";

interface FavoritesViewProps {
  items: FavoriteItem[];
  onReplay: (item: FavoriteItem) => void;
  onRemove: (id: string) => void;
}

export function FavoritesView({ items, onReplay, onRemove }: FavoritesViewProps) {
  if (items.length === 0) {
    return (
      <section className="vv-card rounded-2xl p-10 text-center">
        <Star className="mx-auto h-7 w-7 text-ink-500" />
        <p className="mt-3 font-display text-lg font-700 text-forest-900">No favorites yet</p>
        <p className="mt-1 text-sm text-ink-700">Star a translation to keep it here for quick access.</p>
      </section>
    );
  }

  return (
    <section className="vv-card rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-forest-900">
        <Star className="h-4 w-4 text-amber-500" /> Favorite translations
      </h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const src = getLanguage(item.source_lang);
          const tgt = getLanguage(item.target_lang);
          return (
            <li
              key={item.id}
              className="group flex flex-col gap-2 rounded-xl bg-mint-50 p-3.5 ring-1 ring-bordermint transition hover:bg-white"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-ink-700">
                <span>{src?.flag} {src?.name}</span>
                <ArrowRight className="h-3 w-3 text-emerald2-600" />
                <span>{tgt?.flag} {tgt?.name}</span>
              </div>
              <p className="line-clamp-2 text-sm text-ink-900">{item.source_text}</p>
              <p className="line-clamp-2 text-sm font-semibold text-forest-900">{item.target_text}</p>
              <div className="flex items-center gap-0.5 self-end opacity-0 transition group-hover:opacity-100">
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
                  onClick={() => onRemove(item.id)}
                  className="rounded-lg p-1.5 text-ink-700 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Remove"
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
