# Startup Cheatsheet — Project AI Planner

> **Untuk AI Agent baru**: baca file ini dulu (~1K token) sebelum menyentuh kode apa pun.

---

## 1. Satu Kalimat

Project AI Planner adalah **SaaS Next.js 16 + Node.js (port 3455/6655) + PostgreSQL** yang menghasilkan PRD → Roadmap → Atomic Tasks, lalu AI coding agent CLI (`project-ai`) mengeksekusi setiap task dengan **bounded context** terisolasi.

## 2. Yang TIDAK Perlu Dibaca Ulang

- ❌ 85 file `.ts/.tsx` di repo.
- ❌ Semua migrasi SQL.
- ❌ Fallback PRD/Roadmap/Tasks (`lib/ai/prd.ts`, `roadmap.ts`, `tasks.ts`) kecuali untuk referensi shape.

**Yang dipakai sebagai gantinya**:
- ✅ `.codegraph/SYMBOL_INDEX.md` — peta simbol + line number.
- ✅ `AGENTS.md` — aturan main & code style.
- ✅ `codegraph query/explore` — lompat ke simbol tertentu.

## 3. Pintasan CLI

```bash
# Backend stack (2 terminal)
npm run dev:fe                       # Next.js :3455
npm run dev:be                       # Backend API :6655

# Cek koneksi (1 cURL, hemat token)
curl -s http://localhost:6655/health | head -c 300

# CLI Agent
npx project-ai login pak_xxxxxxxxxxxx
npx project-ai next                  # ambil task berikutnya
npx project-ai context               # salin Markdown bounded context
npx project-ai done                  # tandai selesai + cek checkpoint

# CodeGraph
codegraph query "<symbol>"           # cari simbol
codegraph explore "<flow>"           # lihat call path
codegraph node "<symbol>"            # source + trail
codegraph impact "<symbol>"          # analisis dampak
```

## 4. Simbol yang Paling Sering Disentuh

| Tugas | Simbol (cukup query CodeGraph) |
|-------|-------------------------------|
| "Cek alur login agent" | `authenticateToken` `authenticateAgentRequest` `hashToken` |
| "Lihat generator PRD" | `generatePRDFromDiscovery` `FALLBACK_PRD` |
| "Edit Kanban" | `KanbanBoard` `KanbanColumn` `KanbanCard` |
| "Tambah task baru" | `generateTasksFromRoadmap` `INITIAL_TASKS` |
| "Ubah endpoint CLI" | `runCli` `requestApi` |
| "Schema tabel" | `Database` (di `lib/db/database.types.ts`) |
| "Tambah prompt AI" | `generateMasterAgentPrompt` `formatAgentMarkdownPrompt` |

## 5. Konvensi Cepat

- **Port**: FE `3455`, BE `6655`, AI gateway `20128`, DB `5432`.
- **Bahasa**: Indonesia untuk UI, prompt, komentar publik.
- **Path bound**:
  - Boleh tulis: file di `ai_context.files_to_create` task.
  - Dilarang: `**/prisma/**`, `**/migrations/**`, `**/.env*`, `**/auth.config.*`, `app/api/agent/**`.
- **Tanpa emoji** di UI — gunakan `lucide-react`.
- **Tanpa placeholder** (`// TODO`) di kode produksi.
- **Migrasi DB**: buat file `0000N_*.sql` baru, jangan edit lama.

## 6. Alur yang Paling Penting untuk Diingat

```
Ide → Discovery (5 Q) → PRD → Roadmap (DAG) → Atomic Tasks (Kanban)
                                                            ↓
                                      CLI Agent: login → next → context → done
                                                            ↓
                                            Backend update → Kanban DONE
                                                            ↓
                                       Jika layer selesai → Checkpoint Gate (human)
```

## 7. Referensi Cepat

- Laporan lengkap: [REPORT.md](REPORT.md)
- Aturan main: [AGENTS.md](AGENTS.md)
- Peta simbol detail: [.codegraph/SYMBOL_INDEX.md](.codegraph/SYMBOL_INDEX.md)
- Memory global: `~/.claude/projects/-home-rijal-projects-ngodingpakeaiclone/memory/`

---

> Disusun 2026-09-08. Update setiap kali ada simbol baru yang sering disentuh.
