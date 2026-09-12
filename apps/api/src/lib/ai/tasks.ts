// Generate atomic tasks dari roadmap. Setiap task punya bounded context.
// Port dari lib/ai/tasks.ts (lib/ai/tasks-generator.ts).
import { z } from 'zod';
import { generateJson } from './ai-service.js';
import type { RoadmapData } from './roadmap.js';
import type { UiSpecData } from './ui-spec.js';

const TasksSchema = z.object({
  tasks: z
    .array(
      z.object({
        taskId: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        layer: z.enum(['BOOTSTRAP', 'DATABASE', 'BACKEND', 'FRONTEND', 'INTEGRATION']),
        featureId: z.string(),
        order: z.number().int().min(1),
        requirement_ids: z.array(z.string()).default([]),
        depends_on: z.array(z.string()).default([]),
        files_to_create: z.array(z.string()).default([]),
        files_to_modify: z.array(z.string()).default([]),
        files_readonly: z.array(z.string()).default([]),
        forbidden: z.array(z.string()).default([]),
        implementation_steps: z.array(z.string()).default([]),
        acceptanceCriteria: z.array(z.string()).min(1),
        validation_commands: z.array(z.string()).default(['npm run build']),
        definition_of_done: z.array(z.string()).default([]),
        out_of_scope: z.array(z.string()).default([]),
        apiContracts: z
          .array(
            z.object({
              method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
              path: z.string(),
              description: z.string().optional(),
              requestBody: z.string().optional(),
              responseBody: z.string().optional(),
            }),
          )
          .default([]),
        consumesApis: z
          .array(
            z.object({
              method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
              path: z.string(),
              description: z.string().optional(),
            }),
          )
          .default([]),
      }),
    )
    .min(3),
});

export type TaskGen = z.infer<typeof TasksSchema>['tasks'][number];

export async function generateTasksFromRoadmap(args: {
  roadmap: RoadmapData;
  projectName: string;
  appRoot?: string; // mis. "apps/api", "apps/web"
  brd?: {
    functionalRequirements?: Array<{ id: string; title: string; description: string; priority?: string }>;
    businessRules?: Array<{ id: string; description: string }>;
    dataModels?: Array<{ name: string; description?: string; fields: Array<{ name: string; type: string; required?: boolean }>; relations?: string[] }>;
    apiEndpoints?: Array<{ method: string; path: string; description: string; requestBody?: string; responseBody?: string; authRequired?: boolean }>;
    techRequirements?: string[];
  };
  uiSpec?: UiSpecData | null;
  projectId?: string;
  feedback?: string;
}): Promise<TaskGen[]> {
  const system = `Anda adalah Principal AI Task Architect. Tugas Anda adalah memecah fitur aplikasi menjadi atomic tasks terstruktur yang dirancang agar DAPAT DIEKSEKUSI DENGAN SUKSES OLEH LOW-COST AI CODING AGENT ATAU JUNIOR DEVELOPER TANPA HALUSINASI DAN MENGHASILKAN APLIKASI YANG BISA DIJALANKAN 100% END-TO-END.

PRINSIP ATOMIC & LOW-COST COMPATIBILITY:
1. Satu task fokus pada 1 tanggung jawab spesifik (Single Responsibility Principle).
2. Setiap task wajib memiliki Bounded Context ketat: file yang boleh dibuat, file yang boleh dimodifikasi, file yang boleh dibaca sebagai referensi (files_readonly), dan file yang DILARANG disentuh (forbidden).
3. Berikan 'implementation_steps' yang konkret dan instruktif. WAJIB sertakan potongan kode contoh konkret (code snippets) jika membuat konfigurasi, skema, atau route agar agent tidak menebak-nebak nama field/fungsi.
4. Kaitkan setiap task dengan ID kebutuhan ('requirement_ids', misal FR-001, BR-001).
5. Berikan 'validation_commands' otomatis (misal: "npm test", "npm run typecheck", "npm run build") yang bisa dijalankan coding agent untuk membuktikan keberhasilan task.
6. Pisahkan 'acceptanceCriteria' (kondisi lulus fitur) dari 'definition_of_done' (kondisi siap ditutup) dan 'out_of_scope' (hal yang dilarang dilakukan di task ini).
7. Setiap task layer BACKEND yang membuat API endpoint WAJIB mendeklarasikan 'apiContracts' lengkap dengan method, path, requestBody, dan responseBody type signature.
8. KONSISTENSI & PARITY API KE UI (SANGAT KRUSIAL):
   - Setiap endpoint MUTASI (POST, PUT, PATCH, DELETE) yang ada di SPESIFIKASI ENDPOINT API atau task BACKEND WAJIB memiliki task FRONTEND pemanggil (form, modal, dialog, atau tombol aksi interaktif). Dilarang menyisakan endpoint backend tanpa antarmuka pemanggil di frontend.
   - Setiap task FRONTEND yang memanggil endpoint mutasi WAJIB mendeklarasikan field 'consumesApis' dengan array [{ method, path, description }].
   - Komponen UI untuk aksi spesifik (seperti InviteMemberDialog, ConfirmDeleteModal, UploadProofModal) WAJIB dimasukkan ke 'files_to_create' di task FRONTEND yang relevan, tidak boleh terlewat.
9. WAJIB ada task BOOTSTRAP di awal (order: 1): "Project Initialization & Shared Configuration" yang menyiapkan package.json, tsconfig, folder structure, .env.example, .gitignore (wajib exclude: node_modules, .env, *.db, dist), README.md (cara install, setup env, dan jalankan aplikasi), dan shared types.
10. WAJIB ada WIRING tasks di transisi antar layer:
   - Transisi DATABASE -> BACKEND: "Setup Prisma Client Connection & Shared Client Export" agar controller API bisa langsung mengimpor prisma instance.
   - Transisi BACKEND -> FRONTEND: "Create API Client Wrapper & Environment Variables" (membuat fetch wrapper di apps/web/src/lib/api.ts dengan VITE_API_URL).
   - Di layer INTEGRATION: "Wire Frontend Pages to Real Backend Endpoints" (menghubungkan setiap halaman React ke endpoint backend asli) DAN "E2E Smoke Test Verification" (menjalankan aplikasi dan memastikan halaman utama dapat dibuka).

ATURAN WAJIB LAYER BACKEND (KEAMANAN, ERROR HANDLING, VALIDASI):
11. KEAMANAN: Dilarang menggunakan fallback default untuk secret/credential. Contoh DILARANG: process.env.JWT_SECRET || 'secret'. WAJIB: process.env.JWT_SECRET! atau throw error jika undefined saat boot. Password WAJIB di-hash dengan bcrypt. WAJIB pasang helmet() dan cors() di Express app.
12. ERROR HANDLING: Setiap controller async Express WAJIB dibungkus try-catch atau menggunakan wrapper asyncHandler/express-async-errors agar error tidak crash server. WAJIB buat global error middleware (err, req, res, next) yang mengembalikan { error: string } dengan status code yang tepat.
13. VALIDASI INPUT: Setiap endpoint POST/PUT/PATCH WAJIB memvalidasi request body menggunakan Zod schema sebelum memproses. Contoh: const parsed = Schema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
14. TRANSAKSI & ATOMISITAS: Operasi yang melibatkan baca-lalu-tulis pada resource bersama (stok, saldo, kuota) WAJIB menggunakan prisma.$transaction dengan pembacaan DAN penulisan di dalam transaction yang sama. Dilarang membaca status di luar transaction lalu menulis di dalamnya.
15. INTEGRITAS RELASI: Endpoint DELETE WAJIB memeriksa relasi aktif (record PENDING/ACTIVE). Jika ada relasi aktif, TOLAK penghapusan dengan HTTP 409 Conflict, BUKAN silent cascade delete.
16. PAGINATION: Setiap endpoint GET yang mengembalikan daftar WAJIB menerima query params ?page=1&limit=20 dan mengembalikan { data: T[], meta: { total, page, limit, totalPages } }.`;

  const reqText = args.brd?.functionalRequirements?.length
    ? `\nKEBUTUHAN FUNGSIONAL TERSEDIA:\n${args.brd.functionalRequirements.map((r) => `- [${r.id}] ${r.title}: ${r.description}`).join('\n')}`
    : '';

  const rulesText = args.brd?.businessRules?.length
    ? `\nATURAN BISNIS TERSEDIA:\n${args.brd.businessRules.map((b) => `- [${b.id}] ${b.description}`).join('\n')}`
    : '';

  const dataModelsText = args.brd?.dataModels?.length
    ? `\nMODEL DATA (DATABASE CONTRACT):\n${JSON.stringify(args.brd.dataModels, null, 2)}`
    : '';

  const apiEndpointsText = args.brd?.apiEndpoints?.length
    ? `\nSPESIFIKASI ENDPOINT API TERSEDIA:\n${JSON.stringify(args.brd.apiEndpoints, null, 2)}`
    : '';

  const uiSpecText = args.uiSpec
    ? `\nSPESIFIKASI UI/UX TERSTRUKTUR (DEDICATED UI SPEC CONTRACT):\n${JSON.stringify(args.uiSpec, null, 2)}\n(Gunakan halaman, komponen, tata letak, dan state interaktif di atas secara ketat untuk semua task berlayer FRONTEND)`
    : '';

  const feedbackText = args.feedback ? `\nCATATAN PERBAIKAN DARI GENERASI SEBELUMNYA (WAJIB DIPENUHI):\n${args.feedback}` : '';

  const user = `ROADMAP:
${JSON.stringify(args.roadmap, null, 2)}
${reqText}
${rulesText}
${dataModelsText}
${apiEndpointsText}
${uiSpecText}
${feedbackText}

NAMA PROJECT: ${args.projectName}

Schema JSON (WAJIB):
{
  "tasks": [
    {
      "taskId": "TASK-001",
      "title": "Judul task singkat & instruktif",
      "description": "Deskripsi lingkup teknis task",
      "layer": "BOOTSTRAP" | "DATABASE" | "BACKEND" | "FRONTEND" | "INTEGRATION",
      "featureId": string (id fitur asal),
      "order": number,
      "requirement_ids": ["FR-001", "BR-001"],
      "depends_on": ["ID task sebelumnya yang menjadi prasyarat"],
      "files_to_create": ["path/file.ts"],
      "files_to_modify": ["path/existing.ts"],
      "files_readonly": ["apps/api/prisma/schema.prisma"],
      "forbidden": ["apps/web/**"],
      "implementation_steps": [
        "1. Langkah satu disertai cuplikan kode contoh konkret",
        "2. Langkah dua verifikasi"
      ],
      "acceptanceCriteria": [
        "Kriteria penerimaan measurable dan testable"
      ],
      "validation_commands": [
        "npm run typecheck",
        "npm run build"
      ],
      "definition_of_done": [
        "Implementasi selesai",
        "Typecheck lolos",
        "Tidak ada file forbidden berubah"
      ],
      "out_of_scope": [
        "Hal yang dilarang dikerjakan di task ini"
      ],
      "apiContracts": [
        {
          "method": "POST",
          "path": "/api/auth/login",
          "description": "Login pengguna",
          "requestBody": "{ email: string, password: string }",
          "responseBody": "{ token: string, user: { id: string, email: string } }"
        }
      ],
      "consumesApis": [
        {
          "method": "POST",
          "path": "/api/auth/login",
          "description": "Form login memanggil endpoint ini"
        }
      ]
    }
  ]
}

Aturan bounded context:
- Task layer BOOTSTRAP: bebas di seluruh project root (package.json, tsconfig.json, .env.example, shared/).
- Task layer DATABASE: bebas di folder prisma/ & apps/api/prisma/schema.prisma saja. Gunakan provider "sqlite" secara default (file lokal dev.db) agar aplikasi hasil generate zero-config.
- Task layer BACKEND: bebas di apps/api/src/**. BOLEH BACA (files_readonly: ["apps/api/prisma/schema.prisma"]) untuk import types Prisma. JANGAN MODIFIKASI prisma schema atau apps/web/**.
- Task layer FRONTEND: bebas di apps/web/src/**. JANGAN sentuh apps/api/** atau prisma schema.
- Task layer INTEGRATION: bebas di seluruh project untuk wiring koneksi dan testing verifikasi.
- forbidden WAJIB berisi path di luar layer (kecuali file yang masuk files_readonly).

Aturan taskId dan depends_on (WAJIB KONSISTEN):
- Gunakan format 'taskId' standar: TASK-001, TASK-002, TASK-003, dst secara berurutan.
- 'depends_on' HARUS mereferensikan 'taskId' task prasyarat (misal ["TASK-001"]). Jangan gunakan ID sembarang agar Execution Graph dapat terhubung sempurna.

Aturan khusus FRONTEND (Design System Contract & UI/UX Specs):
- Terapkan Design System Contract: mobile-first, clean layout, semantic HTML, dan konsistensi visual.
- Spacing terstandarisasi: gunakan kelipatan 4px (Tailwind: gap-1, gap-2, p-3, p-4, p-6, space-y-4).
- Tangani state interaksi secara lengkap pada acceptance criteria: idle, loading (spinner/skeleton), error, dan success.
- Halaman UI WAJIB memanggil API Client (bukan hardcoded data mock).
- PARITY UI: Setiap endpoint mutasi (POST/PUT/PATCH/DELETE) di backend HARUS punya dialog/modal/form pemanggil yang terdaftar eksplisit di 'files_to_create' dan 'consumesApis' pada task FRONTEND. Jangan abaikan modal aksi seperti InviteMemberDialog, EditProfileModal, dsb.
- DILARANG menggunakan window.alert() atau alert() untuk menampilkan error/notifikasi. WAJIB gunakan komponen AlertBanner atau Toast yang konsisten di seluruh aplikasi.
- Setiap <label> WAJIB memiliki atribut htmlFor yang menunjuk ke id elemen input terkait. Setiap tombol ikon (tanpa teks visible) WAJIB punya aria-label.
- Loading state WAJIB menggunakan skeleton loader (animated placeholder), BUKAN teks "Loading..." polos. Masukkan skeleton loader ke acceptance criteria setiap halaman yang fetch data.
- Tipe data yang sudah didefinisikan di shared package (misal: shared/src/types.ts) WAJIB di-import dari sana. DILARANG menduplikasi/redefinisi tipe yang sama di apps/web.

Aturan acceptance criteria (HARUS DIPATUHI):
- Setiap acceptance criterion HARUS measurable dan testable, bukan subjektif.
- BACKEND: "Endpoint [METHOD] [PATH] merespons HTTP status yang sesuai dan format JSON valid sesuai contract".
- FRONTEND: "Halaman [Nama] memuat data dari API [PATH] dengan skeleton loader saat loading, AlertBanner saat error, empty state saat data kosong, dan menampilkan data secara dinamis. Label terhubung ke input via htmlFor/id."
- INTEGRATION: "Jalankan npm run dev di root project, akses http://localhost:PORT di browser, halaman utama tampil tanpa error console".

Wajib pada layer INTEGRATION include minimal 4 task khusus ini:
1. Wire Database to Backend API - pastikan Prisma client ter-import dan terhubung di semua route controller
2. Wire Frontend to Backend API - buat API client/fetch wrapper dengan base URL terkonfigurasi dan hubungkan seluruh page ke API
3. Setup Testing Infrastructure - config test runner + basic test setup scripts
4. Local E2E Verification & Smoke Test - command npm run dev berhasil, landing page render, dan minimal 1 alur bisnis utama berhasil dijalankan

Minimal 1 task per fitur. Urutkan order global. Pastikan semua task acceptance criteria testable sebelum submit. Kembalikan HANYA JSON.`;

  const out = await generateJson({
    system,
    user,
    schema: TasksSchema,
    agentName: 'AtomicTaskArchitect',
    projectId: args.projectId,
  });
  return out.tasks;
}
