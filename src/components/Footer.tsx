import { Globe, Heart, Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-bordermint bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-display text-sm font-700 text-forest-900">
              VocaVerse <span className="vv-text-emerald">AI</span>
            </p>
            <p className="mt-1 text-xs text-ink-700">
              Every Voice. Every Language. One World.
            </p>
          </div>
          <FooterCol
            title="About"
            links={[
              { label: "Our mission", href: "#" },
              { label: "How it works", href: "#" },
              { label: "Languages", href: "#" },
            ]}
          />
          <FooterCol
            title="Help"
            links={[
              { label: "Mic troubleshooting", href: "#" },
              { label: "Supported browsers", href: "#" },
              { label: "FAQ", href: "#" },
            ]}
          />
          <FooterCol
            title="Contact"
            links={[
              { label: "Support", href: "#" },
              { label: "Feedback", href: "#" },
              { label: "Privacy", href: "#" },
            ]}
          />
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-bordermint pt-4 sm:flex-row">
          <p className="text-xs text-ink-700">
            © {new Date().getFullYear()} VocaVerse AI
          </p>
          <div className="flex items-center gap-3 text-ink-700">
            <a href="#" className="transition hover:text-emerald2-600" aria-label="Website">
              <Globe className="h-4 w-4" />
            </a>
            <a href="#" className="transition hover:text-emerald2-600" aria-label="Email">
              <Mail className="h-4 w-4" />
            </a>
            <a href="#" className="transition hover:text-emerald2-600" aria-label="Chat">
              <MessageCircle className="h-4 w-4" />
            </a>
            <span className="inline-flex items-center gap-1 text-[11px]">
              Made with <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest-900">{title}</p>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-xs text-ink-700 transition hover:text-emerald2-600">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
