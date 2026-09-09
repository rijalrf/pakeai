// Fetch wrapper ke API. credentials 'include' agar cookie session terbaca.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:6655';

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
