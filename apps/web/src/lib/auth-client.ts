// Better Auth client untuk web. Base URL = API di 6655, credentials untuk cookie session.
import { createAuthClient } from 'better-auth/react';

function resolveApiUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:6655';
    }
    return window.location.origin;
  }
  return import.meta.env.VITE_API_URL ?? 'http://localhost:6655';
}

const baseURL = resolveApiUrl();

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: { credentials: 'include' },
});

export const { useSession, signIn, signOut } = authClient;
