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
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.FE_URL ?? 'http://localhost:3455'],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      name: { type: 'string', required: false },
    },
  },
});

export type AuthInstance = typeof auth;
