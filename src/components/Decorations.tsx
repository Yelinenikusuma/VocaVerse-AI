// Decorative emerald globe (left of welcome heading) and audio waveform (right).
// Pure SVG, no images.

export function GlobeDeco({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="globe-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#globe-grad)" opacity="0.18" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#10b981" strokeWidth="2" />
      <ellipse cx="32" cy="32" rx="11" ry="26" fill="none" stroke="#10b981" strokeWidth="1.6" />
      <path d="M6,32 H58" stroke="#10b981" strokeWidth="1.6" />
      <path d="M10,20 H54" stroke="#10b981" strokeWidth="1.2" opacity="0.7" />
      <path d="M10,44 H54" stroke="#10b981" strokeWidth="1.2" opacity="0.7" />
      <circle cx="32" cy="32" r="3" fill="#059669" />
    </svg>
  );
}

export function WaveformDeco({ className = "", active = false }: { className?: string; active?: boolean }) {
  const bars = [10, 18, 28, 20, 34, 16, 24, 12];
  return (
    <svg viewBox="0 0 80 48" className={className} aria-hidden="true">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 9 + 4}
          y={24 - h / 2}
          width="5"
          height={h}
          rx="2.5"
          fill="#10b981"
          opacity={0.55 + (i % 3) * 0.15}
        >
          {active && (
            <animate
              attributeName="height"
              values={`${h};${h * 1.6};${h}`}
              dur="0.9s"
              begin={`${i * 0.08}s`}
              repeatCount="indefinite"
            />
          )}
          {active && (
            <animate
              attributeName="y"
              values={`${24 - h / 2};${24 - (h * 1.6) / 2};${24 - h / 2}`}
              dur="0.9s"
              begin={`${i * 0.08}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
      ))}
    </svg>
  );
}
