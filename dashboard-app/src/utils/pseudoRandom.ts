/** Seeded PRNG so demo jitter stays stable across re-renders instead of reshuffling every time. */
export function createSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
}
