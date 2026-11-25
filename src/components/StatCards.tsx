import { Globe2, Hash, Mic2, Sparkles } from "lucide-react";

interface StatCardsProps {
  translationsCompleted: number;
  languagesSupported?: number;
}

export function StatCards({ translationsCompleted, languagesSupported = 10 }: StatCardsProps) {
  const stats = [
    {
      icon: Hash,
      label: "Translations completed",
      value: translationsCompleted.toLocaleString(),
    },
    {
      icon: Globe2,
      label: "Languages supported",
      value: String(languagesSupported),
    },
    {
      icon: Mic2,
      label: "Voice & speech ready",
      value: "10 locales",
    },
    {
      icon: Sparkles,
      label: "Powered by",
      value: "AI engine",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="vv-card rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-emerald">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-mint-50 text-emerald2-600 ring-1 ring-bordermint">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="font-display text-xl font-700 text-forest-900">{s.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-ink-700">{s.label}</p>
          </div>
        );
      })}
    </section>
  );
}
