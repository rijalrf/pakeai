# pakeai — AI Planner (Refactored)

SaaS orchestrator untuk AI coding agent. Buat aplikasi dari ide: discovery AI → BRD → roadmap DAG → atomic tasks → eksekusi via CLI oleh AI agent user.

## Stack

- **apps/web** — Vite + React + TypeScript + Tailwind + shadcn-style + react-router v7 + TanStack Query + better-auth/react. Port **3455**.
- **apps/api** — Express + Prisma + Zod + Better Auth (Prisma adapter). Port **6655**.
- **packages/cli** — `pakeai` (commander) — dipanggil sebagai `npx pakeai`. Tanpa mock fallback.
- **DB** — PostgreSQL lokal `project_ai_planner` di `localhost:5432` (user `postgres`).
- **AI** — Gateway lokal OpenAI-compatible `http://localhost:20128/v1` (model `ai-builder`). Multi-provider via env.

## Quick Start

```bash
# dari root monorepo
npm install
cd apps/api
npx prisma migrate dev --name init   # schema fresh
npx tsx prisma/seed.ts               # data demo (opsional)

# Terminal 1 — API
cd apps/api
npx tsx src/index.ts                 # http://localhost:6655

# Terminal 2 — Web
cd apps/web
npx vite --port 3455                 # http://localhost:3455

# Terminal 3 — coba CLI
pakeai login pak_demo_seed_token_replace_in_app
pakeai next
pakeai start
pakeai context
pakeai done
```

`pakeai` saat dev dipanggil via wrapper script di `~/.local/bin/pakeai` yang menjalankan `tsx` ke `packages/cli/src/index.ts`. Untuk distribusi production, `packages/cli` dipublish ke npm.

## Alur Aplikasi

1. **Register/Login** di `http://localhost:3455` (Better Auth, cookie session).
2. **Onboarding** — masukkan ide aplikasi.
3. **Dashboard** — daftar project + tools (cards).
4. **BRD Generator** (`/projects/:id/brd`) — interview discovery (5 pertanyaan), jawab, AI generate BRD.
5. **Roadmap Visual** (`/projects/:id/roadmap`) — diagram DAG fase & fitur (xyflow + dagre).
6. **Task Kanban** (`/projects/:id/tasks`) — 5 kolom, polling 3 detik.
7. **Settings** (`/projects/:id/settings`) — generate PAT (Personal Access Token).
8. **Execute** (`/projects/:id/execute`) — salin Master Prompt, paste ke AI agent user. Agent menjalankan loop:
   ```
   npx pakeai login <token>
   npx pakeai next
   npx pakeai start
   npx pakeai context
   # kerjakan task HANYA pada file yang diizinkan
   npx pakeai done
   ```
9. **Checkpoint gate** — saat layer selesai, agent berhenti dan minta approval user.

## Isolasi & Keamanan

- PAT disimpan sebagai `sha256(token)` di DB. Plaintext hanya dikembalikan SEKALI saat generate.
- `requireAgent` middleware attach `projectId` ke request. Agent hanya bisa akses task/BRD project itu.
- Uji: token project A ditolak untuk task project B (HTTP 404 "Task tidak ditemukan di project ini.").

## Env (apps/api/.env)

```
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/project_ai_planner
PORT=6655
FE_URL=http://localhost:3455
AI_PROVIDER=openai
OPENAI_BASE_URL=http://localhost:20128/v1
OPENAI_API_KEY=<your-key>
OPENAI_MODEL=ai-builder
BETTER_AUTH_SECRET=<random>
BETTER_AUTH_URL=http://localhost:6655
```

## Endpoints API

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/health` | - | health check |
| GET | `/api/tools` | - | daftar tools (registry) |
| ALL | `/api/auth/*` | - | Better Auth handler |
| GET/POST | `/api/projects` | user | list/create project |
| GET | `/api/projects/:id` | user | detail project |
| POST | `/api/projects/:id/discovery/generate` | user | generate pertanyaan |
| GET | `/api/projects/:id/discovery` | user | list Q&A |
| POST | `/api/discovery/:qid/answer` | user | submit jawaban |
| POST | `/api/projects/:id/brd/generate` | user | AI generate BRD |
| GET | `/api/projects/:id/brd` | user | BRD viewer |
| POST | `/api/projects/:id/roadmap/generate` | user | AI generate roadmap |
| GET | `/api/projects/:id/roadmap` | user | roadmap + edges |
| POST | `/api/projects/:id/tasks/generate` | user | AI generate atomic tasks |
| GET/PATCH | `/api/projects/:id/tasks`, `/api/tasks/:id` | user | kanban ops |
| GET | `/api/projects/:id/master-prompt` | user | template prompt |
| POST | `/api/projects/:id/agent-tokens` | user | generate PAT |
| GET/DELETE | `/api/projects/:id/agent-tokens`, `/api/agent-tokens/:id` | user | list/revoke |
| GET/POST | `/api/projects/:id/checkpoints`, `/api/checkpoints/:id/approve` | user | checkpoint |
| GET | `/api/agent/whoami` | PAT | info project agent |
| GET | `/api/agent/tasks/next` | PAT | task berikutnya |
| POST | `/api/agent/tasks/:id/start` | PAT | IN_PROGRESS |
| POST | `/api/agent/tasks/:id/complete` | PAT | DONE/REVIEW + auto checkpoint |
| GET | `/api/agent/tasks/:id/context` | PAT | Markdown bounded context |
