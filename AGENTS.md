# AGENTS.md — pakeai (refactored)

Monorepo AI Planner hasil refactor. Stack final: Vite+React (FE), Express+Prisma+Better Auth (BE), `pakeai` CLI (agent loop driver). Lihat [README.md](README.md) untuk quick start.

## Struktur

```
.
├── apps/
│   ├── api/          # Express + Prisma + Zod + Better Auth (port 6655)
│   │   ├── prisma/   # schema.prisma + migrations + seed.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── lib/{prisma,auth,ai/*}.ts
│   │       ├── middleware/{require-user,require-agent}.ts
│   │       ├── tools/registry.ts
│   │       └── routes (semua di index.ts untuk kesederhanaan)
│   └── web/          # Vite + React + Tailwind + shadcn (port 3455)
│       └── src/
│           ├── main.tsx, App.tsx
│           ├── components/{ui,layout,kanban,roadmap,tools}/
│           ├── lib/{utils,api,auth-client}.ts
│           └── pages/ (login, register, dashboard, onboarding, projects/*)
├── packages/cli/     # pakeai (commander) — dipanggil via npx
│   └── src/{index,config,api-client}.ts
└── .legacy_archive/  # kode lama (Next.js, server backend.js, lib/ai lama) — untuk rollback
```

## Aturan Penting

- **Port**: 3455 (web), 6655 (api). Jangan diubah.
- **Bahasa**: semua string UI, komentar publik, dan komunikasi ke user dalam Bahasa Indonesia.
- **Tanpa emoji** di UI/kode/komunikasi. Pakai `lucide-react` icons.
- **Tanpa mock fallback** di CLI/API. Error AI harus eksplisit (HTTP 502 + pesan).
- **PAT**: token disimpan sebagai `sha256` di DB. Plaintext hanya dikembalikan SEKALI saat generate.
- **Isolasi project**: `requireAgent` middleware attach `projectId` ke request. Endpoint agent cek `task.projectId === agent.projectId`.
- **Akses publik**: lewat tunnel Cloudflare di `https://pakeai.mrijal.my.id` (ingress: `/api/*` → 6655, sisanya → 3455). `FE_URL` di `apps/api/.env` berisi daftar origin dipisah koma (lokal + publik); `VITE_API_URL` di `apps/web/.env` mengarah ke domain publik. CLI komputer lain: install tarball `packages/cli/pakeai-*.tgz` (`npm i -g`) lalu set `PAKEAI_API_URL=https://pakeai.mrijal.my.id`. Detail: README.md bagian "Akses dari Komputer Lain".

## Tambah Tool Baru

Edit `apps/api/src/tools/registry.ts` — tambah entry `{id, name, description, icon, href, status}`. Halaman yang merujuk tools: `apps/web/src/pages/dashboard.tsx` (otomatis via `/api/tools`).

## Tambah Endpoint Baru

`apps/api/src/index.ts` — semua route dideklarasikan di sini (sengaja flat untuk visibilitas). Pakai middleware `requireUser` (cookie session) atau `requireAgent` (PAT). Validasi body dengan Zod.

## Reset DB

```bash
cd apps/api
PGPASSWORD=admin123 psql -h localhost -U postgres -c "DROP DATABASE project_ai_planner; CREATE DATABASE project_ai_planner;"
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

## Verifikasi

```bash
# Stack hidup
curl -s http://localhost:6655/health
curl -s http://localhost:3455/ | head -c 100

# Loop CLI
pakeai login <token>
pakeai next && pakeai start && pakeai context && pakeai done
```
