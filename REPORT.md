# Laporan Komprehensif — Project AI Planner SaaS

> Dokumen ini merangkum arsitektur, tujuan, proses bisnis, model AI, dan tumpukan teknologi dari aplikasi **Project AI Planner** yang berada di repositori ini. Penulisan mengikuti Bahasa Indonesia profesional dan merujuk langsung pada implementasi kode di repositori (Next.js 16 + Node.js + PostgreSQL + AI Gateway Lokal).

---

## 1. Project Objective (Tujuan Proyek)

**Project AI Planner** adalah aplikasi *SaaS* berbasis web yang berfungsi sebagai **Orchestrator & Bounded Context Provider** untuk para *AI Coding Agent*. Aplikasi ini membantu seorang pengguna (product owner / developer) mengubah sebuah ide produk menjadi:

1. Dokumen **Product Requirements Document (PRD)** yang terstruktur.
2. **Roadmap** fase arsitektur (DATABASE → BACKEND → FRONTEND → DEVOPS).
3. **Daftar task atomik** (To Do list di Kanban) yang siap dijalankan oleh AI coding agent seperti Claude Code, Cursor, Aider, atau CLI `project-ai` lokal.
4. **Papan Kanban real-time** yang menampilkan progres task dan *Human Checkpoint Gate* antar layer.

Inti objektifnya: **mengubah niat produk menjadi eksekusi kode yang terisolasi dan aman**, dengan setiap task membawa **bounded context** (daftar file yang boleh disentuh, daftar file terlarang, instruksi ringkas, dan kriteria uji). Tujuannya menghindari hal-hal berikut ketika AI agent mengeksekusi kode:

- Merombak skema database yang sudah jadi.
- Menyentuh konfigurasi sistem yang sensitif (`.env`, auth.config, migrations lama).
- Menulis kode yang keluar dari tanggung jawab satu layer.

Output akhirnya adalah alur: *User ideation → AI Planner → Agent CLI → kode di repo lokal → status DONE di Kanban*.

---

## 2. Goals (Sasaran Produk)

| # | Goal | Penjelasan |
|---|------|------------|
| 1 | **Discovery Otomatis** | Menghasilkan 5 pertanyaan discovery arsitektural yang tajam (bukan klise) untuk mengkristalkan ide produk. |
| 2 | **PRD Struktural** | Mengonversi jawaban discovery menjadi dokumen PRD valid (problem statement, target user, MVP scope, fitur MoSCoW, technical requirements). |
| 3 | **Roadmap Berlapis** | Memecah PRD menjadi fase berurutan dengan aturan *Dependency Graph* tanpa siklus (DATABASE → BACKEND → FRONTEND → DEVOPS). |
| 4 | **Task Atomic + Bounded Context** | Mengurai roadmap menjadi 6–10 task yang masing-masing hanya menyentuh file yang diizinkan (`files_to_create`, `files_to_modify`). |
| 5 | **Kanban Real-time** | Menampilkan board 5 kolom (TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED) dengan sinkronisasi otomatis ke backend. |
| 6 | **CLI Bridge** | Menyediakan CLI `project-ai` agar AI agent di terminal bisa mengambil task via cURL/REST ke port 6655. |
| 7 | **Checkpoint Gate Manusia** | Memaksa approval manusia di antara transisi layer agar tidak ada layer BACKEND/FRONTEND berjalan di atas fondasi yang belum disetujui. |
| 8 | **Multi-Provider AI** | Mendukung OpenAI (default), Anthropic Claude, Google Gemini, dan fallback Mock jika API key belum diisi. |
| 9 | **Bahasa Indonesia Native** | Seluruh UI dan prompt sistem menggunakan Bahasa Indonesia profesional. |
| 10 | **Desain Dark Monokrom** | Mengikuti estetika Linear/Vercel — tanpa "AI slop". |

---

## 3. Business Process (Alur Bisnis Lengkap)

### 3.1 Peta Aktor

| Aktor | Deskripsi |
|-------|-----------|
| **Product Owner** | Pengguna SaaS yang memiliki ide produk, menjawab discovery, dan menyetujui checkpoint. |
| **SaaS Web UI (Next.js)** | Antarmuka Kanban, PRD viewer, Roadmap viewer, Agent Token manager. Berjalan di port **3455**. |
| **Dedicated Backend API (Node.js HTTP)** | Orkestrator + PAT Auth + state engine. Berjalan di port **6655**. |
| **PostgreSQL Lokal** | Penyimpanan state project, task, token, checkpoint. |
| **AI Brain (Local Gateway)** | Penyedia model `ai-builder` via OpenAI-compatible API di `localhost:20128`. |
| **CLI Agent (`project-ai`)** | Alat terminal bagi AI coding agent (Claude Code / Cursor / Aider) untuk mengambil task. |

### 3.2 Diagram Alur End-to-End (ASCII)

```
┌────────────────────┐       1. Daftar/Login        ┌──────────────────────┐
│  Product Owner     │ ───────────────────────────▶ │  Next.js FE (3455)   │
│  (browser)         │                              │  Supabase Auth       │
└────────────────────┘                              └──────────┬───────────┘
        │                                                    │
        │ 2. Isi Ide & Tech Stack                            │
        ▼                                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  ONBOARDING PROJECT (multi-step form)                    │
│   Step 1: Idea + Tipe + Stack   ─▶   Step 2: Discovery Questions         │
│   Step 3: PRD Review            ─▶   Step 4: Roadmap Review              │
│   Step 5: Task Generation (via AI) ─▶  Step 6: Kanban Execution          │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 3. Setiap langkah memanggil AI Brain (port 20128)
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│   AI BRAIN:  model = ai-builder                                         │
│   - generateDiscoveryQuestions()  → 5 pertanyaan arsitektural            │
│   - generatePRDFromDiscovery()    → PRD JSON (Zod-validated)             │
│   - generateRoadmapFromPRD()      → Fase-fase dependency graph           │
│   - generateTasksFromRoadmap()    → Atomic tasks + bounded context       │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 4. State disimpan ke PostgreSQL via Next.js Route Handlers
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL Lokal  (localhost:5432, db = project_ai_planner)            │
│   Tabel: profiles, projects, project_stacks, discovery_*,               │
│         prds, roadmap_*, tasks, task_dependencies, agent_tokens,         │
│         agent_sessions, project_checkpoints                              │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 5. Papan Kanban Live (polling 2,5 detik)
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  KANBAN WEB  (port 3455)                                                │
│   TODO → IN_PROGRESS → REVIEW → DONE  +  BLOCKED                         │
│   + Checkpoint Banner per Layer (Human-in-the-loop gate)                 │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 6. CLI Agent login + ambil task
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CLI:  npx project-ai  (Node.js standalone)                             │
│     login → next → context → done                                       │
│     PAT dikirim via HTTP ke Backend 6655                                 │
└─────────────────────────────────────────────────────────────────────────┘
        │
        │ 7. AI Coding Agent eksekusi bounded context (Claude Code, Cursor, dll)
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  HASIL: kode di repo lokal sesuai files_to_create / files_to_modify      │
│         + laporan selesai → CLI "done" → Backend update → Kanban DONE   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 State Machine Task

```
              ┌─────────┐
   create ──▶ │  TODO   │
              └────┬────┘
                   │ CLI "next" + POST /tasks/:id/start
                   ▼
              ┌─────────────┐
              │ IN_PROGRESS │
              └────┬────────┘
                   │ CLI "done" + POST /tasks/:id/complete
                   ▼
              ┌─────────┐
              │  DONE   │──── jika seluruh layer DONE ──▶ Checkpoint Gate
              └─────────┘                              (approve via Web UI)
                                                       │
                                                       ▼
                                                  Lanjut Layer Berikutnya

              ┌─────────┐
              │ BLOCKED │  (dependensi belum selesai / blocker manual)
              └─────────┘
```

### 3.4 Alur Checkpoint (Human-in-the-Loop)

1. Setelah seluruh task dalam satu layer (mis. DATABASE) berstatus `DONE`, Backend mengirim **`checkpointNotice`** + flag **`layerCompleted: true`**.
2. CLI menampilkan banner: *"⚠️ HUMAN CHECKPOINT GATE TRIGGERED!"*
3. Web UI menampilkan `CheckpointBanner` dengan tombol **Approve**.
4. Hanya setelah manusia menyetujui, CLI boleh mengambil task pada layer berikutnya.
5. Setiap checkpoint disimpan di tabel `project_checkpoints` (`type: layer_transition`, `status: approved/rejected`).

### 3.5 Alur PAT (Personal Access Token)

1. User membuka `/projects/[projectId]/settings`.
2. Menekan tombol "Generate New PAT" → Backend menghasilkan token `pak_xxx…`.
3. Token hanya ditampilkan **sekali** (prefix disimpan di DB, hash SHA-256 disimpan di `agent_tokens.token_hash`).
4. CLI `project-ai login pak_xxx…` → disimpan lokal di `~/.project-ai/config.json`.
5. Setiap request agent wajib menyertakan `Authorization: Bearer pak_…`.

---

## 4. Model AI — Fungsi, Lokasi, dan System Prompt

### 4.1 Model yang Digunakan

| Provider | Tipe | Model Default | Env yang Dipakai |
|----------|------|---------------|------------------|
| **OpenAI-compatible lokal** | `ai-builder` | `ai-builder` | `OPENAI_BASE_URL=http://localhost:20128/v1`, `OPENAI_API_KEY=sk-…`, `OPENAI_MODEL=ai-builder` |
| Anthropic (opsional) | Claude | `claude-3-5-sonnet-20241022` | `ANTHROPIC_API_KEY` |
| Google (opsional) | Gemini | default | `GOOGLE_AI_API_KEY` / `GEMINI_API_KEY` |
| Mock (fallback) | — | `mock-model-v1` | otomatis jika tidak ada API key |

Pemilihan provider diatur oleh env `AI_PROVIDER`. Implementasi ada di [lib/ai/ai-service.ts](lib/ai/ai-service.ts) dengan logika fallback: OpenAI → Anthropic → Google → Mock.

### 4.2 Peta Fungsi AI dan Lokasi System Prompt

| # | Fungsi AI | Lokasi File | Tujuan Output |
|---|-----------|-------------|---------------|
| 1 | **Generate Discovery Questions** | [lib/ai/discovery.ts:57](lib/ai/discovery.ts) | 5 pertanyaan arsitektural (`target_user`, `features`, `technical`, `business`, `ux`, `scope`) |
| 2 | **Generate PRD** | [lib/ai/prd.ts:123](lib/ai/prd.ts) | Dokumen PRD JSON (problem, MVP scope, fitur MoSCoW, tech requirements) |
| 3 | **Generate Roadmap** | [lib/ai/roadmap.ts:89](lib/ai/roadmap.ts) | Roadmap berlayer dengan dependency graph (no cycles) |
| 4 | **Generate Atomic Tasks** | [lib/ai/tasks.ts:211](lib/ai/tasks.ts) | Daftar task dengan bounded context |
| 5 | **Generate Master Prompt** | [lib/ai/master-prompt.ts:22](lib/ai/master-prompt.ts) | Prompt siap tempel untuk AI Coding Agent CLI |
| 6 | **Generate Bounded Payload** | [lib/ai/context-builder.ts:27](lib/ai/context-builder.ts) | Payload terisolasi (`allowedFiles`, `forbiddenPatterns`) |
| 7 | **Generate Markdown Prompt** | [lib/ai/context.ts:66](lib/ai/context.ts) | Format Markdown checklist untuk agent |

### 4.3 Ringkasan System Prompt Inti

#### a) Discovery (`generateDiscoveryQuestions`)
> "Anda adalah Principal Software Architect & Product Strategist elit… DILARANG menanyakan hal klise seperti 'Apakah butuh tombol login?'. Fokus pada trade-off arsitektural: concurrency, scope MVP, karakteristik pengguna, integrasi pihak ketiga, aturan bisnis non-trivial… Kembalikan HANYA JSON murni."

#### b) PRD (`generatePRDFromDiscovery`)
> "Anda adalah Principal Product Manager & Chief Software Architect elit… Mengonversi hasil wawancara menjadi PRD SANGAT PRESISI. Wajib menyertakan 6–10 fitur yang涵盖 seluruh lapisan arsitektur (DATABASE, BACKEND, FRONTEND, DEVOPS). Setiap fitur memiliki acceptance criteria teknis yang teruji… Gunakan Bahasa Indonesia profesional."

#### c) Roadmap (`generateRoadmapFromPRD`)
> "Anda adalah Enterprise Solutions & Systems Architect elit… Mengurai fitur PRD menjadi fase arsitektur bertingkat dengan dependency graph tanpa circular dependency.
> HUKUM URUTAN LAYER:
> - LAYER 1 — DATABASE (fondasi, order_index 1, depends_on: [])
> - LAYER 2 — BACKEND (depends_on phase-1)
> - LAYER 3 — FRONTEND (depends_on phase-2)
> - LAYER 4 — DEVOPS (depends_on phase-3/bebas)"

#### d) Tasks (`generateTasksFromRoadmap`)
> "Anda adalah Principal AI Autonomous Agent Coordinator… Menguraikan roadmap menjadi atomic tasks dengan paradigma BOUNDED CONTEXT ISOLATION.
> - Setiap task HANYA 1 tanggung jawab spesifik.
> - `ai_context.files_to_create`: path file baru yang spesifik.
> - `ai_context.files_to_modify`: file yang boleh diedit (coding agent DILARANG mengutak-atik di luar daftar ini).
> - `ai_context.test_criteria`: kriteria uji objektif.
> - `sequence` mengikuti hierarki DATABASE → BACKEND → FRONTEND → DEVOPS.
> - `depends_on_task_ids` harus valid."

#### e) Master Prompt untuk AI Coding Agent (`generateMasterAgentPrompt`)
> Prompt ini di-*paste* ke terminal/editor AI agent. Berisi loop 6 langkah:
> 1. `curl GET /api/agent/tasks/next` → ambil task.
> 2. `curl POST /tasks/:id/start` → tandai IN_PROGRESS.
> 3. Patuhi *Bounded Context Isolation* (hanya file yang diizinkan).
> 4. Koding lokal & jalankan verifikasi sesuai `test_criteria`.
> 5. `curl POST /tasks/:id/complete` → tandai DONE.
> 6. Konfirmasi "Lanjut ke task berikutnya? (y/n)" (semi-autonomous mode).

### 4.4 Validasi Output AI

Semua output divalidasi dengan **Zod schema** (lihat [lib/ai/prd.ts:14](lib/ai/prd.ts), [lib/ai/roadmap.ts:17](lib/ai/roadmap.ts), [lib/ai/tasks.ts:7](lib/ai/tasks.ts)) dan dilakukan **retry otomatis** sebanyak 2 kali jika parsing gagal (lihat [lib/ai/provider-openai.ts:57](lib/ai/provider-openai.ts)). Markdown codeblock otomatis dibersihkan sebelum JSON.parse.

---

## 5. Tech Stack

### 5.1 Frontend
- **Next.js 16.3.4** (App Router + Turbopack) — port `3455`.
- **React 19.2** + **TypeScript 5**.
- **Tailwind CSS 4** + `@tailwindcss/postcss`.
- **@dnd-kit/core, sortable, utilities** — untuk Kanban drag & drop.
- **@xyflow/react** + **@dagrejs/dagre** — visualisasi dependency graph (roadmap).
- **@tanstack/react-query 5** — data fetching & cache.
- **zustand 5** — state management global (project-store).
- **lucide-react** — ikon monokrom.
- **clsx + tailwind-merge** — utility className.

### 5.2 Backend (Dedicated API)
- **Node.js native `http`** (no framework) — port `6655` ([server/backend.js](server/backend.js)).
- **`pg`** (PostgreSQL driver) dengan Pool singleton.
- **`crypto`** (SHA-256) untuk hashing token PAT.
- CORS manual (middleware function).
- TypeScript mirror di `server/backend.ts` (untuk IDE reference).

### 5.3 Database
- **PostgreSQL Lokal** (port 5432) — database `project_ai_planner`, user `postgres`, password `admin123`.
- **Supabase** sebagai antarmuka ORM REST (SSR client di [lib/db/supabase-server.ts](lib/db/supabase-server.ts), browser client di [lib/db/supabase-client.ts](lib/db/supabase-client.ts)).
- Migrasi SQL ada di `supabase/migrations/00001_*.sql` s.d. `00007_*.sql`.

### 5.4 AI Layer
- **Gateway Lokal OpenAI-compatible** di `http://localhost:20128/v1`.
- Model **`ai-builder`** (model utama), streaming dimatikan (`stream: false`).
- Multi-provider fallback: **Anthropic Claude 3.5 Sonnet**, **Google Gemini**.
- Validasi output dengan **Zod**.

### 5.5 CLI Agent
- **Node.js standalone** — file `cli/bin/project-ai.js` (shebang `#!/usr/bin/env node`).
- TypeScript sources di `cli/src/*.ts`, di-bundle ke `cli/dist/`.
- Konfigurasi lokal: `~/.project-ai/config.json` (token + apiUrl).
- Perintah: `login`, `status`, `next`, `context`, `done`, `logout`, `help`.

### 5.6 Skema Database (Ringkas Tabel)

| Tabel | Fungsi |
|-------|--------|
| `profiles` | Profil user (1-to-1 dengan auth.users) |
| `projects` | Proyek SaaS user |
| `project_stacks` | Pilihan teknologi per proyek |
| `discovery_questions` | 5 pertanyaan AI-generated |
| `discovery_answers` | Jawaban user |
| `prds` | Versi dokumen PRD (status draft/approved/revision) |
| `roadmap_phases` + `roadmap_features` + `roadmap_dependencies` | Peta roadmap + DAG |
| `tasks` + `task_dependencies` | Task atomik + dependensi |
| `agent_tokens` | PAT yang di-hash SHA-256 |
| `agent_sessions` | Log eksekusi agent |
| `project_checkpoints` | Human approval gate |

### 5.7 Library Pendukung
- **zod** — validasi runtime & inference tipe.
- **clsx + tailwind-merge** — utilitas className.
- **lucide-react** — ikon vektor.

---

## 6. Hal Lain yang Disarankan untuk Ada di Laporan

### 6.1 Skrip & Cara Menjalankan

```bash
# Install dependencies
npm install

# Jalankan Frontend (Next.js) di port 3455
npm run dev:fe

# Jalankan Backend API Node.js di port 6655
npm run dev:be

# Mode production
npm run build
npm run start:fe
npm run start:be

# CLI Agent (login → ambil task)
npx project-ai login pak_xxxxxxxxxxxx
npx project-ai next
npx project-ai context
npx project-ai done
```

### 6.2 Konfigurasi Environment (`.env.local`)

```
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/project_ai_planner
FE_PORT=3455
BE_PORT=6655
NEXT_PUBLIC_APP_URL=http://localhost:3455
NEXT_PUBLIC_API_URL=http://localhost:6655
OPENAI_BASE_URL=http://localhost:20128/v1
OPENAI_API_KEY=sk-…
OPENAI_MODEL=ai-builder
```

### 6.3 Endpoint API Ringkas

| Method | Path | Tujuan |
|--------|------|--------|
| GET | `/health` | Cek status backend + DB + AI |
| POST | `/api/agent/auth` | Validasi PAT |
| GET | `/api/agent/tasks/next` | Ambil task berikutnya |
| POST | `/api/agent/tasks/:id/start` | Tandai IN_PROGRESS |
| POST | `/api/agent/tasks/:id/complete` | Tandai DONE + cek layer completion |
| GET | `/api/agent/tasks/:id/context` | Markdown prompt bounded context |
| GET | `/api/projects/:id/tasks` | Daftar task untuk FE (polling) |
| GET | `/api/checkpoints` | Daftar checkpoint |

### 6.4 Prinsip Desain UX
- **Bahasa Indonesia** di seluruh copy.
- **Dark monokrom** ala Linear/Vercel (slate/zinc palette).
- **Tanpa emoji** di UI utama, hanya ikon `lucide-react`.
- **Real-time feedback** melalui polling 2,5 detik (badge "Live Syncing").
- **Indikator status**: hijau (connected), rose (syncing), amber (reconnecting).
- **Auto-generate**: Kanban otomatis memicu AI untuk memecah tasks saat board kosong.

### 6.5 Prinsip Keamanan
- **PAT di-hash SHA-256** sebelum disimpan.
- **Token prefix** disimpan terpisah untuk preview UI.
- **Fallback dev token** (`pak_dev…`/`pak_demo…`) untuk testing lokal tanpa DB.
- **Middleware Next.js** memproteksi rute `/dashboard`, `/projects`, `/onboarding` (redirect ke `/login`).
- **Isolasi file mutlak** di tingkat prompt AI agent (tidak boleh menulis di luar `files_to_create/modify`).
- **Forbidden patterns** di `buildBoundedContextPayload`: `**/prisma/**`, `**/migrations/**`, `**/.env*`, `**/auth.config.*`, `app/api/agent/**`.

### 6.6 Strategi Anti-Halusinasi AI
1. **Zod schema validation** pada setiap output AI.
2. **Retry otomatis** sampai 2x jika schema gagal.
3. **Prompt eksplisit**: "Kembalikan HANYA JSON murni tanpa markdown".
4. **Pembersihan markdown codeblock** sebelum JSON.parse.
5. **System prompt teknis** yang melarang pertanyaan klise dan mengarahkan pada dependency graph valid.
6. **Fallback statis** (`FALLBACK_PRD`, `FALLBACK_ROADMAP`, `INITIAL_TASKS`) untuk development offline.

### 6.7 Keterbatasan & Catatan
- **Skema PRD contoh** (`FALLBACK_PRD`) menggunakan contoh "Aplikasi Booking Lapangan Futsal" sebagai showcase. Konsep produk aktual bisa berbeda per project.
- **Single-user mode**: Belum ada multi-tenant isolation di level query (semua task project diglobal-lookup).
- **Polling 2,5 detik** untuk sinkronisasi real-time, bukan WebSocket — trade-off kesederhanaan vs latency.
- **CLI `project-ai` saat ini adalah helper manual** (menampilkan prompt di terminal untuk di-copy-paste ke Claude Code / Cursor), bukan *driver* otomatis yang mengeksekusi task sendiri.

### 6.8 Roadmap Pengembangan Lanjutan (Saran)

1. **WebSocket real-time** menggantikan polling untuk mengurangi latensi dan beban server.
2. **Multi-tenant isolation** dengan `user_id` filter di setiap query.
3. **Real OAuth2 / Supabase Auth flow** (saat ini menggunakan JWT manual + Supabase SSR).
4. **AI agent driver otomatis** (Rust/Node) yang mengeksekusi bounded context langsung tanpa copy-paste.
5. **Observability**: tracing OpenTelemetry untuk setiap fase AI generation.
6. **Rate limiting & cost tracking** per provider AI.
7. **Versioning PRD** dengan diff visual antar revisi.
8. **Export roadmap** ke JSON, Markdown, atau integrasi Jira/Linear.

---

## 7. Lampiran: Struktur Direktori

```
ngodingpakeaiclone/
├── app/                         # Next.js App Router (port 3455)
│   ├── (auth)/login, register
│   ├── dashboard/
│   ├── onboarding/              # multi-step wizard
│   ├── projects/[projectId]/
│   │   ├── discovery/
│   │   ├── prd/
│   │   ├── roadmap/             # visualisasi DAG dengan @xyflow
│   │   ├── tasks/               # Kanban view
│   │   ├── execute/             # execution guide
│   │   ├── activity/
│   │   └── settings/            # PAT generator
│   └── api/                     # Route handlers Next.js
│       ├── projects/
│       ├── tasks/
│       └── agent/               # endpoint untuk AI agent CLI
├── components/
│   ├── kanban/                  # board, column, card, drawer, checkpoint
│   ├── project/                 # workflow-stepper, activity-feed
│   ├── dashboard/
│   ├── layout/                  # sidebar, header, app-layout
│   └── ui/                      # button, input, card, badge, textarea
├── lib/
│   ├── ai/                      # 13 modul AI (provider, prompt, schema)
│   ├── agent/                   # auth, checkpoints, token
│   ├── auth/                    # auth-utils
│   ├── db/                      # postgres pool, supabase clients, types
│   ├── stores/                  # zustand
│   └── validations/             # zod schemas
├── server/
│   ├── backend.js               # HTTP server Node.js (port 6655)
│   └── seed-runner.js
├── cli/
│   ├── bin/project-ai.js        # entry CLI
│   └── src/                     # index.ts, api-client.ts, config.ts
├── supabase/migrations/         # 00001 s.d. 00007
└── middleware.ts                # Next.js route protection
```

---

## 8. Kesimpulan

**Project AI Planner** adalah SaaS yang menjembatani kesenjangan antara *ide produk* dan *eksekusi kode oleh AI agent*. Dengan memaksa setiap task memiliki **bounded context** yang jelas, aplikasi ini:

1. Mengurangi risiko *scope creep* dan modifikasi tak terkontrol.
2. Mempercepat time-to-code dengan生成 PRD, roadmap, dan task secara otomatis.
3. Mempertahankan **human-in-the-loop** melalui *checkpoint gate* di setiap transisi layer.
4. Bersifat **provider-agnostic** untuk AI (OpenAI/Anthropic/Google/Mock) dan **agent-agnostic** untuk downstream (Claude Code, Cursor, Aider, atau CLI lokal).

Tumpukan teknologinya modern (Next.js 16, React 19, TanStack Query 5, Zustand 5, Zod 4) dan menggunakan gateway AI lokal sehingga biaya inference dapat ditekan serta privasi data terjaga.

> Disusun otomatis berdasarkan pembacaan langsung kode sumber di repositori `/home/rijal/projects/ngodingpakeaiclone` per **2026-09-08**.
