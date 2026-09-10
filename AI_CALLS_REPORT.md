# Laporan Pemanggilan Model AI (AI Calls Report)

Dokumen ini merinci seluruh titik pemanggilan model AI di backend `pakeai` (`apps/api`), mencakup engine konfigurasi, nama fungsi pemanggil, endpoint API, skema output, dan system prompt yang digunakan.

---

## 1. Konfigurasi Engine & Gateway AI

Seluruh pemanggilan AI dipusatkan melalui modul tunggal:
- **File:** `apps/api/src/lib/ai/ai-service.ts`
- **Metode Utama:** `generateJson<T>({ system, user, schema, maxRetries })`
- **Klien:** OpenAI SDK (`new OpenAI(...)`) kompatibel dengan OpenAI API, Ollama, vLLM, LiteLLM, dan Local Gateway.
- **Konfigurasi Environment (`.env`):**
  - `AI_PROVIDER=openai`
  - `OPENAI_BASE_URL=http://localhost:20128/v1` (default local gateway)
  - `OPENAI_MODEL=ai-builder` (default model ID)
- **Parameter Pemanggilan:**
  - `response_format: { type: 'json_object' }` (wajib JSON valid)
  - `temperature: 0.4` (konsisten dan terstruktur)
  - `maxRetries: 2` (validasi skema via Zod dengan sanitasi strip markdown code block)

---

## 2. Ringkasan Total Pemanggilan

Terdapat total **10 titik pemanggilan AI** yang tersebar dalam 5 modul logika bisnis:

| No | Modul / Fungsi | Endpoint REST | Tujuan / Peran |
|:---|:---|:---|:---|
| 1 | `replyChat` | `POST /api/chat/:sessionId/reply` | Chat persona interaktif brainstorming ide |
| 2 | `finalizeChatSession` | `POST /api/chat/:sessionId/finalize` | Ringkas chat jadi nama dan deskripsi project |
| 3 | `generateInterviewFromChat` | `POST /api/projects/:id/interview/generate` | Generate 5-8 pertanyaan wawancara discovery |
| 4 | `recommendInterviewAnswer` | `POST /api/projects/:id/interview/recommend` | Rekomendasi jawaban interview beserta alasannya |
| 5 | `recommendTechStack` | `POST /api/projects/:id/techstack/recommend` | Rekomendasi stack teknologi (default SQLite + Prisma) |
| 6 | `generateTreeFromBrd` | `POST /api/projects/:id/tree/generate` | Dekomposisi pohon hierarki fitur & sub-task |
| 7 | `generateDiscoveryQuestions` | `POST /api/projects/:id/discovery/generate` | Pertanyaan discovery dari ide mentah (alur form) |
| 8 | `generateBRDFromDiscovery` | `POST /api/projects/:id/brd/generate` | Dokumen spesifikasi kebutuhan bisnis (BRD) |
| 9 | `generateRoadmapFromBRD` | `POST /api/projects/:id/roadmap/generate` | Fase roadmap bertingkat (DB -> BE -> FE -> INT) |
| 10 | `generateTasksFromRoadmap` | `POST /api/projects/:id/tasks/generate` | **Generator Task Coding Agent** — Pemecahan atomic tasks dengan bounded context isolasi |

> **Catatan Kunci:** Titik pemanggilan **No. 10 (`generateTasksFromRoadmap`)** adalah fungsi yang membuat seluruh task eksekusi yang dikonsumsi langsung oleh AI Coding Agent milik pengguna (seperti Claude Code, Cursor, atau Aider). Task hasil fungsi inilah yang mendikte cara aplikasi dikerjakan secara teknis.

---

## 3. Rincian Pemanggilan & System Prompt

### 1. Chat Persona Brainstorming (`replyChat`)
- **File Sumber:** `apps/api/src/lib/ai/chat.ts:21`
- **Konstanta Prompt:** `CHAT_PERSONA_PROMPT` (`apps/api/src/lib/ai/prompts.ts:7`)
- **Skema Output:** `ChatMessageSchema` (`kind: 'text' | 'form' | 'done'`, konten teks, dan payload form opsional)
- **System Prompt:**
```text
Kamu adalah pake.ai, asisten yang membantu pemula non-teknis merumuskan ide aplikasi. Tugasmu membedah dan mengklarifikasi tujuan serta mekanisme ide user sampai benar-benar jelas.

Aturan:
1. Selalu gunakan Bahasa Indonesia yang ramah, sederhana, tanpa istilah teknis yang rumit, dan tanpa emoji.
2. WAJIB bertanya sebelum menyimpulkan. Gali: masalah yang dipecahkan oleh aplikasi ini, siapa pengguna utamanya, bagaimana alur pemakaiannya, dan fitur inti yang paling penting.
3. Maksimal 2 pertanyaan per giliran percakapan. Jika pertanyaan dikirim sebagai form terstruktur (kind='form'):
   - Setiap pertanyaan HANYA boleh memiliki tepat 3 opsi pilihan di array "options" yang paling mungkin dan sangat relevan untuk ide aplikasi user.
   - Jangan masukkan opsi "Lainnya" ke dalam array "options" (opsi ke-4 "Lainnya" otomatis ditambahkan oleh sistem/UI).
   - Jangan berikan lebih dari 3 opsi di array "options". Total opsi di layar akan berjumlah 4 (3 opsi relevan + 1 opsi "Lainnya").
   - Tentukan "type": gunakan "radio" jika pengguna hanya boleh memilih 1 jawaban, atau "checkbox" jika pengguna boleh memilih lebih dari 1 jawaban.
   - Tentukan apakah pertanyaan wajib ("required": true) atau opsional ("required": false). Pertanyaan utama wajib ("required": true), sedangkan pertanyaan pelengkap bisa opsional ("required": false).
4. Jawab HANYA dengan JSON valid sesuai skema ChatMessageSchema: {"kind":"text"|"form"|"done", "content": "...", "payload": ...}. Jangan tambahkan kata-kata lain di luar JSON.
5. Kirim kind='done' hanya jika kamu sudah paham minimal hal-hal berikut: masalah utama yang dipecahkan, target pengguna utama, minimal 3 fitur inti aplikasi, dan cara singkat aplikasi digunakan sehari-hari. Pada 'done', ringkas pemahamanmu tentang ide user di content.
6. Output JSON saja tanpa format markdown atau code block.
```

---

### 2. Finalisasi Ide & Penamaan Project (`finalizeChatSession`)
- **File Sumber:** `apps/api/src/lib/ai/chat.ts:60`
- **Skema Output:** `z.object({ name: z.string(), summary: z.string() })`
- **System Prompt:**
```text
Anda adalah asisten pembuat nama project yang menarik.

Input: hasil chat brainstorming user.
Output JSON: { "name": "Nama Project Menarik", "summary": "Ringkasan 3-4 kalimat tentang ide aplikasi" }.
```

---

### 3. Generate Pertanyaan Wawancara (`generateInterviewFromChat`)
- **File Sumber:** `apps/api/src/lib/ai/chat.ts:104`
- **Konstanta Prompt:** `GENERATE_INTERVIEW_FROM_CHAT_PROMPT` (`apps/api/src/lib/ai/prompts.ts:26`)
- **Skema Output:** `GenerateInterviewSchema` (Array pertanyaan dengan `options`, `required`, `type`, `context`)
- **System Prompt:**
```text
Anda adalah product manager AI. Berdasarkan hasil brainstorming chat antara user dan pake.ai, generate 5-8 pertanyaan interview untuk memperjelas kebutuhan aplikasi.

Input:
- Ringkasan ide: {summary}
- Riwayat chat: {messages}

Tugas:
1. Buat 5-8 pertanyaan kritis yang belum tergali dari chat.
2. Setiap pertanyaan harus punya context (mis. target_user, platform, integrasi eksternal).
3. Setiap pertanyaan HANYA memiliki tepat 3 opsi pilihan di array "options" yang paling relevan dan mungkin untuk aplikasi user. JANGAN sertakan opsi "Lainnya" (sistem UI otomatis menambahkan opsi ke-4 "Lainnya").
4. Tentukan apakah pertanyaan wajib ("required": true) untuk kebutuhan inti aplikasi, atau opsional ("required": false) untuk fitur pelengkap. Minimal 2-3 pertanyaan harus bernilai "required": true.
5. Tentukan "type": "radio" jika user hanya boleh memilih 1 opsi, atau "checkbox" jika boleh memilih lebih dari 1 opsi.
6. Output format JSON:
{
  "questions": [
    {
      "question": "Siapa target pengguna utama aplikasi?",
      "options": ["Masyarakat umum", "Siswa dan guru internal", "Staf dan karyawan perusahaan"],
      "required": true,
      "type": "radio",
      "context": "target_user"
    }
  ]
}

Pastikan pertanyaan relevan dengan konteks chat dan membantu memperjelas requirements.
```

---

### 4. Rekomendasi Jawaban Interview (`recommendInterviewAnswer`)
- **File Sumber:** `apps/api/src/lib/ai/chat.ts:141`
- **Konstanta Prompt:** `RECOMMEND_INTERVIEW_ANSWER_PROMPT` (`apps/api/src/lib/ai/prompts.ts:57`)
- **Skema Output:** `RecommendInterviewAnswerSchema` (`{ answer: string, reasoning: string }`)
- **System Prompt:**
```text
Anda adalah product manager yang berpengalaman membantu pemula non-teknis. Berikan rekomendasi jawaban untuk pertanyaan interview berdasarkan konteks chat sebelumnya.

Input:
- Pertanyaan: "{question}"
- Konteks chat: {chatContext}

Tugas:
1. Saran jawaban yang paling masuk akal berdasarkan pola umum aplikasi sejenis (berdasarkan context question).
2. Jelaskan reasoning di balik rekomendasi.
3. Output JSON:
{
  "question": "...",
  "answer": "saran jawaban optimal",
  "reasoning": "mengapa saran ini cocok"
}
```

---

### 5. Rekomendasi Tech Stack (`recommendTechStack`)
- **File Sumber:** `apps/api/src/lib/ai/chat.ts:169`
- **Konstanta Prompt:** `RECOMMEND_TECH_STACK_PROMPT` (`apps/api/src/lib/ai/prompts.ts:77`)
- **Skema Output:** `RecommendTechStackSchema` (`{ reasoning: string, techStack: string[] }`)
- **System Prompt:**
```text
Anda adalah software architect senior. Rekomendasikan tech stack yang cocok untuk aplikasi user berdasarkan ide, fitur, dan batasan yang diketahui.

Input:
- Nama aplikasi: {appName}
- Ide & fitur: {ideaAndFeatures}
- Target pengguna & scale: {targetAndScale}

Pertimbangan:
- User non-teknis: pilih stack modern, zero-config lokal, dan mudah dijalankan langsung.
- Prioritaskan stack JavaScript/TypeScript: React, Node.js/Express, SQLite + Prisma ORM, Tailwind CSS.
- Database default: SQLite + Prisma ORM (zero-config file lokal 'dev.db', tanpa perlu instalasi server database lokal terpisah seperti PostgreSQL/MySQL).
- Sertakan versi dasar (mis. "React v18", "Node.js 20 LTS", "SQLite + Prisma ORM").

Output JSON:
{
  "reasoning": "penjelasan singkat mengapa stack ini dipilih",
  "techStack": ["frontend: React v18", "backend: Express + TypeScript", "database: SQLite + Prisma ORM", ...]
}
```

---

### 6. Dekomposisi Tree Fitur & Sub-task (`generateTreeFromBrd`)
- **File Sumber:** `apps/api/src/lib/ai/chat.ts:193`
- **Konstanta Prompt:** `GENERATE_TREE_PROMPT` (`apps/api/src/lib/ai/prompts.ts:99`)
- **Skema Output:** `TreeDataSchema` (`appName`, `features` berisi `subfeatures` dan `tasks`)
- **System Prompt:**
```text
Anda adalah technical architect senior. Pecah aplikasi menjadi struktur hierarki monoton App -> Fitur Utama -> Sub-fitur -> Task Implementasi -> Sub-task Teknis.

Input:
- Nama aplikasi: {appName}
- BRD / deskripsi lengkap: {brdContent}

Panduan:
1. Aplikasi mungkin punya 3-7 fitur utama. Setiap fitur punya 1-3 sub-fitur opsional.
2. Setiap sub-fitur atau fitur langsung punya daftar task implementasi (UI, API/Database, Testing, Deployment setup).
3. Setiap task bisa punya sub-task teknis (mis. "Create component X with props Y", "Add unit tests for function Z").
4. Pastikan urutan logis: mulai dari setup DB/API, lalu UI base, lalu fitur-fitur, lalu testing/deployment.

Output JSON strukturnya:
{
  "appName": "Nama Aplikasi",
  "features": [
    {
      "label": "Fitur Utama 1",
      "subfeatures": [
        {
          "label": "Sub-fitur A",
          "tasks": [
            { "label": "Task 1.1", "subtasks": [{ "label": "Detail 1.1.1" }] },
            { "label": "Task 1.2", "subtasks": [] }
          ]
        }
      ],
      "tasks": [
        { "label": "Task Setup Dasar", "subtasks": [{ "label": "Inisialisasi proyek" }] }
      ]
    }
  ]
}

Pastikan JSON valid dan lengkap.
```

---

### 7. Discovery Questions Non-Chat (`generateDiscoveryQuestions`)
- **File Sumber:** `apps/api/src/lib/ai/discovery.ts:28`
- **Skema Output:** `DiscoverySchema` (Array 3-8 pertanyaan discovery)
- **System Prompt:**
```text
Anda adalah product manager AI. Berdasarkan ide aplikasi user, buat 5-7 pertanyaan discovery yang menggali kebutuhan, pengguna, fitur inti, batasan, dan kriteria sukses. Setiap pertanyaan harus spesifik terhadap ide tersebut.
```

---

### 8. Penyusunan Dokumen BRD (`generateBRDFromDiscovery`)
- **File Sumber:** `apps/api/src/lib/ai/brd.ts:16`
- **Skema Output:** `BrdSchema` (`overview`, `goals`, `features`, `techRequirements`, `nonFunctional`, `outOfScope`)
- **System Prompt:**
```text
Anda adalah arsitek produk senior. Hasilkan Business Requirements Document (BRD) yang ringkas dan dapat dieksekusi, dalam format JSON sesuai schema yang diminta user.
```

---

### 9. Pembuatan Roadmap Berfase (`generateRoadmapFromBRD`)
- **File Sumber:** `apps/api/src/lib/ai/roadmap.ts:32`
- **Skema Output:** `RoadmapSchema` (Array fase: urutan, judul, layer `DATABASE|BACKEND|FRONTEND|INTEGRATION`, dan daftar fitur bersyarat)
- **System Prompt:**
```text
Anda adalah tech lead. Pecah BRD menjadi fase & fitur yang bisa dieksekusi sebagai task atomic. Setiap fase harus berurutan secara logis (DATABASE -> BACKEND -> FRONTEND -> INTEGRATION). Fitur dalam fase boleh punya dependensi satu sama lain.
```

---

### 10. Pemecahan Atomic Tasks Bounded Context (`generateTasksFromRoadmap`)
- **File Sumber:** `apps/api/src/lib/ai/tasks.ts:27`
- **Skema Output:** `TasksSchema` (`title`, `description`, `layer`, `featureId`, `order`, `files_to_create`, `files_to_modify`, `forbidden`, `acceptanceCriteria`)
- **System Prompt:**
```text
Anda adalah AI yang memecah fitur menjadi atomic tasks untuk AI coding agent. Setiap task HARUS punya bounded context: file yang boleh dibuat, file yang boleh dimodifikasi, dan file yang DILARANG disentuh (di luar layer tsb).
```
- **Aturan Bounded Context pada User Prompt:**
  - Layer `DATABASE`: bebas di `prisma/` & `apps/api/prisma/schema.prisma`, provider `sqlite` default (`dev.db`).
  - Layer `BACKEND`: bebas di `apps/api/src/**`, dilarang sentuh `apps/web/**` atau schema database.
  - Layer `FRONTEND`: bebas di `apps/web/src/**`, dilarang sentuh `apps/api/**`.
  - Array `forbidden` wajib diisi daftar path terlarang.
  - `acceptanceCriteria` wajib konkret dan dapat diuji secara otomatis (browser/API/test script).

---

## 4. Kaitan Call No. 10 dengan AI Coding Agent Pengguna

Fungsi **`generateTasksFromRoadmap`** memegang peran sentral sebagai **perancang blueprint eksekusi**. Task yang dihasilkan fungsi inilah yang memandu coding agent otonom (seperti Claude Code, Cursor, Aider, atau Roo Code) milik pengguna.

### Bagaimana Task Ini Menentukan Cara Aplikasi Dikerjakan?
1. **Urutan Pengerjaan Monoton (`order` & `layer`)**:
   Coding agent dipandu menyelesaikan aplikasi dari akar ke cabang:
   `DATABASE` (Schema & Migrasi) → `BACKEND` (Logika Bisnis & API) → `FRONTEND` (UI & Interaksi) → `INTEGRATION` (Testing & Verification).
   Agent dilarang membuat UI sebelum API dan databasenya siap.

2. **Isolasi Bounded Context (`aiContext`)**:
   Setiap task membatasi ruang gerak file secara ketat:
   - `files_to_create`: Daftar path spesifik yang harus dibuat baru.
   - `files_to_modify`: Daftar file yang diizinkan untuk diedit.
   - `forbidden`: Daftar folder yang **diharamkan** untuk disentuh (mencegah agen merusak layer lain).

3. **Syarat Kelolosan Objektif (`acceptanceCriteria`)**:
   AI Task Generator menyusun kriteria penerimaan yang terukur (measurable), misal perintah curl, response code, atau assertion test, bukan sekadar opini.

### Alur Konsumsi via CLI `pakeai`:
Ketika coding agent berjalan di laptop pengguna, agen berinteraksi langsung dengan data task melalui endpoint agen (`requireAgent`):

```
User Web Board
      ↓ (Trigger POST /api/projects/:id/tasks/generate)
Call No. 10: generateTasksFromRoadmap(roadmap, projectName)
      ↓
Database PostgreSQL (Tabel Task: order, layer, aiContext, acceptanceCriteria)
      ↓
Laptop Pengguna (Coding Agent via CLI pakeai)
      ↓
  1. pakeai next     → Mengambil task aktif teratas (GET /api/agent/tasks/next)
  2. pakeai start    → Mengunci task ke status IN_PROGRESS (POST /api/agent/tasks/:id/start)
  3. pakeai context  → Mengunduh Bounded Context & Kriteria Penerimaan (GET /api/agent/tasks/:id/context)
  4. (Koding & Test) → Agent mengimplementasikan kode HANYA pada file yang diizinkan
  5. pakeai done     → Agent menandai task DONE setelah kriteria lolos (POST /api/agent/tasks/:id/complete)
```

