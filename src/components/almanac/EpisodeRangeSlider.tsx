"use client";

/** Dual-thumb range slider limiting search to an episode-number window within one numbered series -- two overlapping range inputs, CSS makes only each thumb clickable. */
export function EpisodeRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (next: { min: number; max: number }) => void;
}) {
  const fillLeft = max > min ? ((value.min - min) / (max - min)) * 100 : 0;
  const fillRight = max > min ? 100 - ((value.max - min) / (max - min)) * 100 : 0;

  return (
    <div className="mx-auto mt-3.5 flex max-w-[900px] items-center gap-2.5">
      <span className="min-w-[34px] text-center font-ibm-plex-mono text-xs text-gold-bright">{value.min}</span>
      <div className="relative h-6 flex-1">
        <div className="absolute top-1/2 right-0 left-0 h-[3px] -translate-y-1/2 rounded-sm bg-line" />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-sm bg-gold"
          style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value.min}
          onChange={(e) => onChange({ min: Math.min(Number(e.target.value), value.max), max: value.max })}
          className="dual-range-thumb pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value.max}
          onChange={(e) => onChange({ min: value.min, max: Math.max(Number(e.target.value), value.min) })}
          className="dual-range-thumb pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent"
        />
      </div>
      <span className="min-w-[34px] text-center font-ibm-plex-mono text-xs text-gold-bright">{value.max}</span>
      <span className="text-nowrap font-ibm-plex-mono text-[11px] text-dim">episode range</span>
    </div>
  );
}
