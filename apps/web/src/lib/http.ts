// Fetch wrapper ke backend pakeai. credentials 'include' agar cookie session terbaca.
function resolveApiUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:6655';
    }
  }
  return import.meta.env.VITE_API_URL ?? 'http://localhost:6655';
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await resp.text();
  const body = text ? JSON.parse(text) : null;
  if (!resp.ok) {
    throw new ApiError(body?.error ?? `HTTP ${resp.status}`, resp.status, body);
  }
  return body as T;
}
