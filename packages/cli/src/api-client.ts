// HTTP client ke pakeai API (port 6655). TIDAK ADA mock fallback — semua error eksplisit.
import type { Config } from './config.js';

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(cfg: Config, path: string, init: RequestInit = {}): Promise<T> {
  if (!cfg.token) {
    throw new ApiError('Belum login. Jalankan: pakeai login <token>', 401);
  }
  const url = `${cfg.apiUrl.replace(/\/$/, '')}${path}`;
  const resp = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.token}`,
      ...(init.headers ?? {}),
    },
  });
  let body: unknown = null;
  const text = await resp.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!resp.ok) {
    const msg = (body as { error?: string })?.error ?? `HTTP ${resp.status}`;
    throw new ApiError(msg, resp.status, body);
  }
  return body as T;
}

// === Endpoint types & wrappers ===

export type Whoami = { project: { id: string; name: string } };
export type NextTask = {
  hasTask: boolean;
  task?: { id: string; title: string; description: string | null; layer: string; order: number; status: string };
  message?: string;
};
export type ContextResp = { ok: true; taskId: string; markdown: string };
export type StatusResp = { ok: true; taskId: string; status: string; checkpointPending?: boolean; layer?: string };

export const api = {
  whoami(cfg: Config) {
    return request<Whoami>(cfg, '/api/agent/whoami');
  },
  next(cfg: Config) {
    return request<NextTask>(cfg, '/api/agent/tasks/next');
  },
  start(cfg: Config, id: string) {
    return request<StatusResp>(cfg, `/api/agent/tasks/${id}/start`, { method: 'POST' });
  },
  context(cfg: Config, id: string) {
    return request<ContextResp>(cfg, `/api/agent/tasks/${id}/context`);
  },
  done(cfg: Config, id: string) {
    return request<StatusResp>(cfg, `/api/agent/tasks/${id}/complete`, { method: 'POST' });
  },
};

export async function probeHealth(cfg: Config): Promise<boolean> {
  try {
    const r = await fetch(`${cfg.apiUrl}/health`);
    return r.ok;
  } catch {
    return false;
  }
}
