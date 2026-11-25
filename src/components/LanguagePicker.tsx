import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe, Search } from "lucide-react";
import { AUTO_DETECT, Language, LANGUAGES } from "@/lib/languages";

interface LanguagePickerProps {
  value: string;
  onChange: (code: string) => void;
  allowAuto?: boolean;
  align?: "left" | "right";
  /** "default" = full-width picker; "compact" = small pill sized for cloud panels */
  variant?: "default" | "compact";
}

export function LanguagePicker({
  value,
  onChange,
  allowAuto = false,
  align = "left",
  variant = "default",
}: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const options = allowAuto ? [AUTO_DETECT, ...LANGUAGES] : LANGUAGES;
  const current =
    options.find((o) => o.code === value) ?? (allowAuto ? AUTO_DETECT : LANGUAGES[0]);

  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.name.toLowerCase().includes(q) ||
      o.nativeName.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const isCompact = variant === "compact";

  const trigger = isCompact ? (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="group inline-flex items-center gap-1.5 rounded-full bg-mint-50/80 px-2.5 py-1 text-left ring-1 ring-emerald2-400/50 backdrop-blur-sm transition hover:bg-mint-100 hover:ring-emerald2-500 focus:outline-none focus:ring-2 focus:ring-emerald2-500"
    >
      <span className="text-sm leading-none">
        {current.code === "auto" ? <Globe className="h-3.5 w-3.5 text-emerald2-600" /> : current.flag}
      </span>
      <span className="max-w-[7rem] truncate text-[12px] font-bold text-forest-900">{current.name}</span>
      <ChevronDown className="h-3 w-3 text-emerald2-600 transition group-hover:rotate-180" />
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="group flex w-full items-center justify-between gap-2 rounded-xl bg-mint-50 px-3 py-2 text-left ring-1 ring-bordermint transition hover:bg-mint-100 hover:ring-emerald2-400 focus:outline-none focus:ring-2 focus:ring-emerald2-500"
    >
      <span className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base ring-1 ring-bordermint">
          {current.code === "auto" ? <Globe className="h-4 w-4 text-emerald2-600" /> : current.flag}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold text-forest-900">{current.name}</span>
          <span className="text-[11px] text-ink-700">{current.nativeName}</span>
        </span>
      </span>
      <ChevronDown className="h-4 w-4 text-ink-700 transition group-hover:rotate-180" />
    </button>
  );

  return (
    <div className={`relative ${isCompact ? "inline-flex" : "w-full"}`} ref={ref}>
      {trigger}

      {open && (
        <div
          className={`vv-card absolute z-40 mt-2 overflow-hidden rounded-2xl ${
            isCompact ? "w-60" : "w-72"
          } ${align === "right" ? "right-0" : "left-0"}`}
        >
          <div className="border-b border-bordermint p-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-mint-50 px-3 py-2 ring-1 ring-bordermint">
              <Search className="h-4 w-4 text-ink-700" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full bg-transparent text-sm text-forest-900 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
          </div>
          <ul className="vv-scroll max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-700">No languages found</li>
            )}
            {filtered.map((o: Language) => {
              const selected = o.code === value;
              return (
                <li key={o.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-mint-50 ${
                      selected ? "text-emerald2-600" : "text-forest-900"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base ring-1 ring-bordermint">
                      {o.code === "auto" ? <Globe className="h-4 w-4 text-emerald2-600" /> : o.flag}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">{o.name}</span>
                      <span className="block text-[11px] text-ink-700">{o.nativeName}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 text-emerald2-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
