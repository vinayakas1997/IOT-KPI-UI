import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSnapshot } from '../api/client';
import type { LiveSnapshot } from '../api/types';
import { fallbackSnapshot } from '../data/fallbackSnapshot';

export type LiveStatus = 'connecting' | 'live' | 'offline';

interface LiveData {
  /** Always populated -- starts as the offline fallback, then live data. */
  snapshot: LiveSnapshot;
  status: LiveStatus;
  /** ISO timestamp of the last successful update, or null. */
  lastUpdated: string | null;
  /** Force a one-off re-fetch (e.g. right after saving settings). */
  refresh: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const STALE_MS = 15_000;

/**
 * Listens to `GET /api/stream` (Server-Sent Events). No client-side polling:
 * the backend pushes the full snapshot on every tick. On first mount it also
 * does one `GET /api/snapshot` so the board paints immediately. Never throws
 * and never returns null -- keeps the last good snapshot and flips `status`.
 */
export function useLiveData(): LiveData {
  const [snapshot, setSnapshot] = useState<LiveSnapshot>(fallbackSnapshot);
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const lastMsgRef = useRef<number>(0);

  const apply = useCallback((next: LiveSnapshot) => {
    if (!next || !next.ready) return;
    lastMsgRef.current = Date.now();
    setSnapshot(next);
    setStatus('live');
    setLastUpdated(next.generatedAt || new Date().toISOString());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // first paint
    fetchSnapshot(controller.signal)
      .then((s) => {
        if (!cancelled) apply(s);
      })
      .catch(() => {
        /* stream will fill it in */
      });

    // live stream
    const es = new EventSource(`${API_BASE}/api/stream`);
    es.onmessage = (ev) => {
      if (cancelled) return;
      try {
        apply(JSON.parse(ev.data) as LiveSnapshot);
      } catch {
        /* ignore malformed frame */
      }
    };
    es.onerror = () => {
      // EventSource auto-reconnects; show "connecting" unless we've been dark a while
      if (!cancelled) {
        setStatus((s) => (s === 'live' && Date.now() - lastMsgRef.current < STALE_MS ? s : 'connecting'));
      }
    };

    // staleness watchdog
    const watchdog = window.setInterval(() => {
      if (!cancelled && lastMsgRef.current && Date.now() - lastMsgRef.current > STALE_MS) {
        setStatus('offline');
      }
    }, 5000);

    return () => {
      cancelled = true;
      controller.abort();
      es.close();
      window.clearInterval(watchdog);
    };
  }, [apply]);

  const refresh = useCallback(() => {
    fetchSnapshot()
      .then((s) => apply(s))
      .catch(() => {
        /* ignore */
      });
  }, [apply]);

  return { snapshot, status, lastUpdated, refresh };
}
