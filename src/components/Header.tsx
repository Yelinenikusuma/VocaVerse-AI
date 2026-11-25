import { History, Home, Mic, Settings, Star, User } from "lucide-react";

export type NavTab = "home" | "history" | "favorites" | "settings";

interface HeaderProps {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
  historyCount: number;
  favoritesCount: number;
}

const NAV: { id: NavTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "history", label: "History", icon: History },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

// Custom logo: microphone inside a speech bubble with a small translate glyph.
export function VocaVerseLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl text-white vv-logo-grad shadow-emerald"
      style={{ width: size, height: size }}
    >
      <Mic className="h-1/2 w-1/2" />
      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-emerald-600 ring-2 ring-mint-50">
        AI
      </span>
    </div>
  );
}

export function Header({ active, onNavigate, historyCount, favoritesCount }: HeaderProps) {
  return (
    <header className="vv-glass sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        {/* Logo + name */}
        <div className="flex items-center gap-2.5">
          <VocaVerseLogo size={38} />
          <div className="leading-none">
            <h1 className="font-display text-[20px] font-700 tracking-tight">
              <span className="text-forest-900">VocaVerse</span>{" "}
              <span className="vv-text-emerald">AI</span>
            </h1>
            <p className="mt-0.5 hidden text-[11px] font-medium text-ink-700 sm:block">
              Every Voice. Every Language. One World.
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-bordermint md:flex">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const badge =
              item.id === "history"
                ? historyCount
                : item.id === "favorites"
                ? favoritesCount
                : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  isActive
                    ? "vv-btn-emerald text-white shadow-sm"
                    : "text-forest-900 hover:bg-mint-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {badge > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-white/25 text-white" : "bg-mint-100 text-emerald2-600"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest-900 ring-1 ring-bordermint transition hover:text-emerald2-600"
          aria-label="Profile"
        >
          <User className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "vv-btn-emerald text-white"
                  : "bg-white/70 text-forest-900 ring-1 ring-bordermint"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
              {item.id === "history" && historyCount > 0 && (
                <span className="text-[10px]">{historyCount}</span>
              )}
              {item.id === "favorites" && favoritesCount > 0 && (
                <span className="text-[10px]">{favoritesCount}</span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

export function NavHint({ tab }: { tab: NavTab }) {
  const map: Record<NavTab, { icon: typeof Home; label: string }> = {
    home: { icon: Home, label: "Translator" },
    history: { icon: History, label: "Translation history" },
    favorites: { icon: Star, label: "Your favorite translations" },
    settings: { icon: Settings, label: "Settings" },
  };
  const { icon: Icon, label } = map[tab];
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-forest-900">
      <Icon className="h-4 w-4 text-emerald2-600" />
      {label}
    </div>
  );
}
