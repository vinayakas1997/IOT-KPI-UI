import type { AppSettings, ConfigResponse } from '../types';
import type { LiveSnapshot } from './types';

/**
 * Where the backend lives. In dev, Vite proxies "/api" to the Python server
 * (see vite.config.ts). Override at build time with VITE_API_BASE if the API
 * is hosted elsewhere.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** Thrown by saveConfig() when the backend rejects the settings (HTTP 422). */
export class ConfigValidationError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(issues.join('; '));
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

export async function fetchSnapshot(signal?: AbortSignal): Promise<LiveSnapshot> {
  const res = await fetch(`${API_BASE}/api/snapshot`, { signal });
  if (!res.ok) throw new Error(`snapshot HTTP ${res.status}`);
  return (await res.json()) as LiveSnapshot;
}

export async function postReset(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`reset HTTP ${res.status}`);
}

export async function fetchConfig(signal?: AbortSignal): Promise<ConfigResponse> {
  const res = await fetch(`${API_BASE}/api/config`, { signal });
  if (!res.ok) throw new Error(`config HTTP ${res.status}`);
  return (await res.json()) as ConfigResponse;
}

export async function saveConfig(settings: AppSettings): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 422) {
    const detail = Array.isArray(data?.detail) ? data.detail : ['Invalid settings'];
    throw new ConfigValidationError(detail);
  }
  if (!res.ok) throw new Error(`config save HTTP ${res.status}`);
  return (data.config ?? settings) as AppSettings;
}

export async function resetConfig(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/config/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`config reset HTTP ${res.status}`);
  return (await res.json()).config as AppSettings;
}
