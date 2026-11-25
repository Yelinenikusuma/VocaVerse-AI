import { ArrowRightLeft } from "lucide-react";

export function SwapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Swap languages"
      className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white vv-btn-emerald transition hover:rotate-180 hover:shadow-emerald"
      style={{ boxShadow: "0 0 0 4px rgba(16,185,129,0.18), 0 10px 24px -8px rgba(5,150,105,0.55)" }}
    >
      <ArrowRightLeft className="h-5 w-5" color="#ffffff" strokeWidth={2.5} />
    </button>
  );
}
