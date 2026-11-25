import { Globe, Mic, Volume2 } from "lucide-react";

export interface AppSettings {
  autoTranslate: boolean;
  autoSpeakTarget: boolean;
  micContinuous: boolean;
}

interface SettingsViewProps {
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
}

export function SettingsView({ settings, onChange }: SettingsViewProps) {
  const toggle = (key: keyof AppSettings) =>
    onChange({ ...settings, [key]: !settings[key] });

  const items: {
    key: keyof AppSettings;
    icon: typeof Globe;
    title: string;
    desc: string;
  }[] = [
    {
      key: "autoTranslate",
      icon: Globe,
      title: "Auto-translate while typing",
      desc: "Translate automatically as you type, with a short debounce.",
    },
    {
      key: "autoSpeakTarget",
      icon: Volume2,
      title: "Auto-speak target after voice input",
      desc: "Play the translated audio automatically after speech recognition.",
    },
    {
      key: "micContinuous",
      icon: Mic,
      title: "Continuous microphone listening",
      desc: "Keep the mic open across pauses. Turn off for single-phrase capture.",
    },
  ];

  return (
    <section className="vv-card rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-semibold text-forest-900">Settings</h3>
      <ul className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const on = settings[item.key];
          return (
            <li
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-xl bg-mint-50 p-4 ring-1 ring-bordermint"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald2-600 ring-1 ring-bordermint">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest-900">{item.title}</p>
                  <p className="text-xs text-ink-700">{item.desc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(item.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "vv-toggle-on" : "bg-ink-500/40"}`}
                aria-pressed={on}
                aria-label={item.title}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    on ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
