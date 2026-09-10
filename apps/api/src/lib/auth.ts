// Konfigurasi Better Auth dengan Prisma adapter.
// Instance auth dipakai di:
//  - server: toNodeHandler() untuk mount sebagai middleware sebelum express.json()
//  - web: createAuthClient() (lihat apps/web/src/lib/auth-client.ts)
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  // Mendukung multi-host (akses via localhost:6655 atau via tunnel domain publik)
  baseURL: {
    allowedHosts: ['localhost:6655', 'pakeai.mrijal.my.id'],
    fallback: process.env.BETTER_AUTH_URL ?? 'http://localhost:6655',
  },
  trustedProxyHeaders: true,
  // FE_URL boleh berisi beberapa origin dipisah koma (lokal + domain publik).
  trustedOrigins: (process.env.FE_URL ?? 'http://localhost:3455').split(',').map((o) => o.trim()),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  // Login Google: satu-satunya metode yang ditampilkan di UI.
  // Redirect URI yang didaftarkan di Google Cloud Console:
  //   http://localhost:6655/api/auth/callback/google
  //   https://pakeai.mrijal.my.id/api/auth/callback/google
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  user: {
    additionalFields: {
      name: { type: 'string', required: false },
    },
  },
});

export type AuthInstance = typeof auth;
