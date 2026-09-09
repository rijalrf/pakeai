// Better Auth client untuk web. Base URL = API di 6655, credentials untuk cookie session.
import { createAuthClient } from 'better-auth/react';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:6655';

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: { credentials: 'include' },
});

export const { useSession, signIn, signUp, signOut } = authClient;
