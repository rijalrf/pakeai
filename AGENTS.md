# AGENTS.md — Petunjuk AI Agent untuk Project AI Planner

> **Tujuan**: Memulai sesi baru dengan **token seminimal mungkin**. Jangan scan seluruh repo — baca file ini dulu, lalu gunakan **CodeGraph** atau symbol map di bawah untuk lompat langsung ke kode yang relevan.

---

## 0. Aturan Global

- **Bahasa komunikasi**: Selalu **Bahasa Indonesia** untuk semua output ke pengguna.
- **JANGAN** membaca file secara massal di awal sesi. Mulai dari `## 3 Peta Simbol` di bawah, atau panggil `codegraph_explore` dengan nama simbol.
- **JANGAN** menjalankan `find`/`grep -r` di seluruh proyek. Gunakan CodeGraph atau symbol map.
- **Selalu** hormati *Bounded Context*: hanya sentuh file yang tercantum dalam `ai_context.files_to_create` / `files_to_modify` task terkait.

---

## 1. Ringkasan 30 Detik

Project AI Planner adalah **SaaS Orcherator untuk AI Coding Agent** dengan 3 proses:

| Proses | Port | File Entry |
|--------|------|------------|
| Frontend (Next.js) | `3455` | `app/layout.tsx` → `app/page.tsx` |
| Backend API (Node.js) | `6655` | `server/backend.js` |
| CLI Agent | — | `cli/bin/project-ai.js` |

AI Brain: gateway lokal `http://localhost:20128/v1`, model `ai-builder`.
Database: PostgreSQL lokal `project_ai_planner` di `localhost:5432`.

Alur utama: `Discovery → PRD → Roadmap → Atomic Tasks (Kanban) → CLI Agent eksekusi bounded context`.

---

## 2. Start Cepat (Cheat Sheet)

```bash
# Jalankan stack lengkap (2 terminal)
npm run dev:fe    # Next.js di :3455
npm run dev:be    # Backend API di :6655

# Cek kesehatan (1 cURL hemat token)
curl -s http://localhost:6655/health | head -c 400

# Login CLI + ambil task
npx project-ai login pak_xxxxxxxxxxxx
npx project-ai next
npx project-ai context     # salin Markdown bounded context
npx project-ai done
```

---

## 3. Peta Simbol (Baca Bagian Ini, Bukan Kode)

> **Gunakan daftar ini sebagai "remote control"** — ketika butuh tahu "di mana X", langsung cari nama simbolnya di CodeGraph atau Read dengan offset.

### 3.1 Layer AI (inti kecerdasan)

| Simbol / File | Untuk apa |
|---------------|-----------|
| [lib/ai/ai-service.ts](lib/ai/ai-service.ts) | Pilih provider (OpenAI/Anthropic/Google/Mock) |
| [lib/ai/provider-openai.ts](lib/ai/provider-openai.ts) | Klien OpenAI + retry Zod |
| [lib/ai/provider-anthropic.ts](lib/ai/provider-anthropic.ts) | Klien Anthropic Claude |
| [lib/ai/provider-google.ts](lib/ai/provider-google.ts) | Klien Google Gemini |
| [lib/ai/discovery.ts](lib/ai/discovery.ts) | `generateDiscoveryQuestions()` — 5 pertanyaan arsitektural |
| [lib/ai/prd.ts](lib/ai/prd.ts) | `generatePRDFromDiscovery()` + `FALLBACK_PRD` |
| [lib/ai/roadmap.ts](lib/ai/roadmap.ts) | `generateRoadmapFromPRD()` + `FALLBACK_ROADMAP` |
| [lib/ai/tasks.ts](lib/ai/tasks.ts) | `generateTasksFromRoadmap()` + `INITIAL_TASKS` |
| [lib/ai/context-builder.ts](lib/ai/context-builder.ts) | `buildBoundedContextPayload()` — payload terisolasi |
| [lib/ai/context.ts](lib/ai/context.ts) | `formatAgentMarkdownPrompt()` |
| [lib/ai/master-prompt.ts](lib/ai/master-prompt.ts) | `generateMasterAgentPrompt()` — prompt master untuk AI agent |
| [lib/ai/types.ts](lib/ai/types.ts) | Interface `AIProvider`, `GenerateTextParams` |

### 3.2 Layer Backend & Orchestrator

| Simbol / File | Untuk apa |
|---------------|-----------|
| [server/backend.js](server/backend.js) | HTTP server port 6655 — endpoint agent CLI |
| `formatPrompt(task)` di `backend.js:94` | Format Markdown bounded context |
| `authenticateToken(req)` di `backend.js:57` | PAT auth via SHA-256 |
| `GET /api/agent/tasks/next` di `backend.js:188` | Ambil task berikutnya |
| `POST /api/agent/tasks/:id/start` di `backend.js:236` | Tandai IN_PROGRESS |
| `POST /api/agent/tasks/:id/complete` di `backend.js:259` | Tandai DONE + cek layer |
| `GET /api/agent/tasks/:id/context` di `backend.js:296` | Ekspor Markdown context |
| [lib/agent/auth.ts](lib/agent/auth.ts) | `authenticateAgentRequest()` untuk Next.js routes |
| [lib/agent/token.ts](lib/agent/token.ts) | `hashToken()` SHA-256 |
| [lib/agent/checkpoints.ts](lib/agent/checkpoints.ts) | Logika checkpoint gate |

### 3.3 Layer Database

| Simbol / File | Untuk apa |
|---------------|-----------|
| [lib/db/postgres.ts](lib/db/postgres.ts) | Singleton Pool + `query()` + `testPostgresConnection()` |
| [lib/db/database.types.ts](lib/db/database.types.ts) | Tipe Database (generated, semua tabel) |
| [lib/db/supabase-server.ts](lib/db/supabase-server.ts) | Server-side Supabase client |
| [lib/db/supabase-client.ts](lib/db/supabase-client.ts) | Browser Supabase client |
| [lib/db/seed.ts](lib/db/seed.ts) | Seed data demo |
| `supabase/migrations/00001_initial_schema.sql` | profiles, projects, stacks |
| `…/00002_discovery_schema.sql` | discovery_questions, answers |
| `…/00003_prd_schema.sql` | prds |
| `…/00004_roadmap_schema.sql` | roadmap_phases/features/dependencies |
| `…/00005_tasks_schema.sql` | tasks, task_dependencies |
| `…/00006_agent_schema.sql` | agent_tokens, agent_sessions |
| `…/00007_checkpoints_and_logs.sql` | project_checkpoints |

### 3.4 Layer Frontend (Next.js App Router)

| Path | Untuk apa |
|------|-----------|
| [app/page.tsx](app/page.tsx) | Landing page |
| [app/onboarding/page.tsx](app/onboarding/page.tsx) | Multi-step wizard (idea→discovery→PRD→roadmap→tasks) |
| [app/dashboard/page.tsx](app/dashboard/page.tsx) | Dashboard utama |
| `app/projects/[projectId]/discovery/` | Halaman discovery + jawaban |
| `app/projects/[projectId]/prd/` | Viewer PRD |
| `app/projects/[projectId]/roadmap/` | Visualisasi DAG (xyflow + dagre) |
| `app/projects/[projectId]/tasks/` | Papan Kanban utama |
| `app/projects/[projectId]/execute/` | Panduan eksekusi + Master Prompt |
| `app/projects/[projectId]/settings/` | PAT generator |
| [components/kanban/kanban-board.tsx](components/kanban/kanban-board.tsx) | Board 5 kolom + polling real-time |
| [components/kanban/kanban-column.tsx](components/kanban/kanban-column.tsx) | Kolom TODO/IN_PROGRESS/REVIEW/DONE/BLOCKED |
| [components/kanban/kanban-card.tsx](components/kanban/kanban-card.tsx) | Kartu task dengan badge layer |
| [components/kanban/task-detail-drawer.tsx](components/kanban/task-detail-drawer.tsx) | Drawer detail task + accept/reject |
| [components/kanban/execution-guide-modal.tsx](components/kanban/execution-guide-modal.tsx) | Modal master prompt untuk AI agent |
| [components/kanban/checkpoint-banner.tsx](components/kanban/checkpoint-banner.tsx) | Banner human checkpoint gate |
| [components/layout/app-layout.tsx](components/layout/app-layout.tsx) | Layout shell (sidebar + header) |
| [middleware.ts](middleware.ts) | Route protection Next.js |

### 3.5 Layer CLI

| Simbol / File | Untuk apa |
|---------------|-----------|
| [cli/bin/project-ai.js](cli/bin/project-ai.js) | Entry CLI (shebang node) |
| [cli/src/index.ts](cli/src/index.ts) | Handler perintah `login`/`next`/`context`/`done` |
| [cli/src/api-client.ts](cli/src/api-client.ts) | HTTP client ke backend 6655 |
| [cli/src/config.ts](cli/src/config.ts) | Simpan token di `~/.project-ai/config.json` |

---

## 4. CodeGraph — Cara Pakai (Hemat Token)

> CodeGraph adalah **knowledge graph SQLite** untuk proyek ini. Setelah `codegraph init` di direktori proyek, satu panggilan `codegraph_explore` bisa menggantikan 5–10 grep + Read.

### 4.1 Jika MCP `codegraph_explore` tersedia

```ts
// Tanyakan arsitektur / alur kerja:
mcp__codegraph__codegraph_explore({
  query: "Bagaimana alur generate task dari PRD?",
  projectPath: "/home/rijal/projects/ngodingpakeaiclone"
})

// Atau minta sumber simbol tertentu:
mcp__codegraph__codegraph_explore({
  query: "generateTasksFromRoadmap formatPrompt agent_token",
  projectPath: "/home/rijal/projects/ngodingpakeaiclone"
})
```

### 4.2 Jika MCP tidak tersedia, pakai CLI

```bash
codegraph explore "generateTasksFromRoadmap buildBoundedContextPayload authenticateAgentRequest"
```

### 4.3 Query pendek yang umum

| Butuh tahu… | Query CodeGraph |
|-------------|-----------------|
| Endpoint agent CLI | `tasks next start complete context authenticateToken` |
| Alur PRD → task | `generatePRDFromDiscovery generateRoadmapFromPRD generateTasksFromRoadmap` |
| Skema task | `tasks task_dependencies ai_context files_to_create` |
| PAT auth | `authenticateAgentRequest hashToken agent_tokens token_hash` |
| Kanban state | `KanbanBoard pollServerTasks handleUpdateStatus` |

---

## 5. Pola Editing yang Harus Diikuti

1. **Sebelum edit**: Baca dulu file target (Read dengan offset/limit), jangan baca ulang seluruh file.
2. **Saat edit**: Hormati *bounded context* — jangan ubah file di luar `files_to_modify`.
3. **Setelah edit**: Jalankan `npx tsc --noEmit` (cek tipe) untuk verifikasi minimal.
4. **Migrasi DB**: Tambah file baru di `supabase/migrations/0000N_*.sql`, jangan ubah file lama.
5. **Tidak ada placeholder**: Hindari `// TODO: implement later` di kode produksi.
6. **Tidak ada emoji** di UI — gunakan `lucide-react` icon.
7. **Bahasa Indonesia** untuk semua string UI dan komentar publik.

---

## 6. Larangan (Anti-Patterns)

- ⛔ `find . -name "*.ts" | xargs cat` — boros token, gunakan CodeGraph.
- ⛔ `grep -r "TODO"` di seluruh repo — gunakan targeted search.
- ⛔ Membaca semua file di `lib/ai/` saat bersamaan — baca satu per satu sesuai kebutuhan.
- ⛔ Menulis kode yang menyentuh `app/api/agent/**` (forbidden pattern di bounded context).
- ⛔ Mengubah konvensi port (3455/6655) tanpa persetujuan.
- ⛔ Menulis ulang `FALLBACK_*` kecuali untuk perbaikan nyata.

---

## 7. Referensi Lengkap

- Laporan komprehensif: [REPORT.md](REPORT.md)
- Konfigurasi proyek & AI gateway: lihat `.env.local` dan [memory project-ai-planner-config.md](../.claude/projects/-home-rijal-projects-ngodingpakeaiclone/memory/project-ai-planner-config.md)
- Aturan komunikasi Bahasa Indonesia: lihat [memory bahasa-indonesia.md](../.claude/projects/-home-rijal-projects-ngodingpakeaiclone/memory/bahasa-indonesia.md)

---

> **Versi**: 1.0 — disusun 2026-09-08. Berisi peta simbol ringkas untuk memulai sesi baru tanpa scan seluruh repo.
