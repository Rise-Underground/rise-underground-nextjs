import { useEffect, useState } from "react";

/** Eases from 0 to target over `durationMs` -- the RISE tracker's hero-number tick-up animation. */
export function useCountUp(target: number | null, durationMs = 1100): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === null) return;
    const targetValue = target;
    let start: number | null = null;
    let frame: number;

    function tick(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(targetValue * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
