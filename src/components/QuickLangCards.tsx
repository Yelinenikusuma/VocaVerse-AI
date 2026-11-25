import { LANGUAGES } from "@/lib/languages";

interface QuickLangCardsProps {
  currentTarget: string;
  onPick: (code: string) => void;
}

export function QuickLangCards({ currentTarget, onPick }: QuickLangCardsProps) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-700">
        Quick target language
      </h3>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => {
          const active = l.code === currentTarget;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => onPick(l.code)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold ring-1 transition ${
                active
                  ? "vv-btn-emerald text-white ring-transparent shadow-sm"
                  : "bg-white text-forest-900 ring-bordermint hover:bg-mint-50 hover:ring-emerald2-400"
              }`}
            >
              <span className="text-sm leading-none">{l.flag}</span>
              <span>{l.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
