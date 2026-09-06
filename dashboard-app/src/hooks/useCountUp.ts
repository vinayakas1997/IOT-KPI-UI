import { useEffect, useRef, useState } from 'react';

/**
 * Eases a displayed number toward `value`. Animates from 0 on mount, then
 * tweens on every change. Returns the current (rounded) display value.
 */
export function useCountUp(value: number, durationMs = 800): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (value - from) * eased;
      setDisplay(cur);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs]);

  return Math.round(display);
}
