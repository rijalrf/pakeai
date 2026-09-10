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
        layer: z.enum(['DATABASE', 'BACKEND', 'FRONTEND', 'INTEGRATION']),
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
  };
  uiSpec?: UiSpecData | null;
  projectId?: string;
}): Promise<TaskGen[]> {
  const system = `Anda adalah Principal AI Task Architect. Tugas Anda adalah memecah fitur aplikasi menjadi atomic tasks terstruktur yang dirancang agar DAPAT DIEKSEKUSI DENGAN SUKSES OLEH LOW-COST AI CODING AGENT ATAU JUNIOR DEVELOPER.

PRINSIP ATOMIC & LOW-COST COMPATIBILITY:
1. Satu task fokus pada 1 tanggung jawab spesifik (Single Responsibility Principle).
2. Setiap task wajib memiliki Bounded Context ketat: file yang boleh dibuat, file yang boleh dimodifikasi, dan file yang DILARANG disentuh.
3. Berikan 'implementation_steps' yang konkret (langkah 1, 2, 3 langkah demi langkah) agar model tidak berhalusinasi.
4. Kaitkan setiap task dengan ID kebutuhan ('requirement_ids', misal FR-001, BR-001).
5. Berikan 'validation_commands' otomatis (misal: "npm test", "npm run typecheck") yang bisa dijalankan coding agent untuk membuktikan keberhasilan task.
6. Pisahkan 'acceptanceCriteria' (kondisi lulus fitur) dari 'definition_of_done' (kondisi siap ditutup) dan 'out_of_scope' (hal yang dilarang dilakukan di task ini).`;

  const reqText = args.brd?.functionalRequirements?.length
    ? `\nKEBUTUHAN FUNGSIONAL TERSEDIA:\n${args.brd.functionalRequirements.map((r) => `- [${r.id}] ${r.title}: ${r.description}`).join('\n')}`
    : '';

  const rulesText = args.brd?.businessRules?.length
    ? `\nATURAN BISNIS TERSEDIA:\n${args.brd.businessRules.map((b) => `- [${b.id}] ${b.description}`).join('\n')}`
    : '';

  const uiSpecText = args.uiSpec
    ? `\nSPESIFIKASI UI/UX TERSTRUKTUR (DEDICATED UI SPEC CONTRACT):\n${JSON.stringify(args.uiSpec, null, 2)}\n(Gunakan halaman, komponen, tata letak, dan state interaktif di atas secara ketat untuk semua task berlayer FRONTEND)`
    : '';

  const user = `ROADMAP:
${JSON.stringify(args.roadmap, null, 2)}
${reqText}
${rulesText}
${uiSpecText}

NAMA PROJECT: ${args.projectName}

Schema JSON (WAJIB):
{
  "tasks": [
    {
      "taskId": "TASK-001",
      "title": "Judul task singkat & instruktif",
      "description": "Deskripsi lingkup teknis task",
      "layer": "DATABASE" | "BACKEND" | "FRONTEND" | "INTEGRATION",
      "featureId": string (id fitur asal),
      "order": number,
      "requirement_ids": ["FR-001", "BR-001"],
      "depends_on": ["ID task atau fitur sebelumnya yang menjadi prasyarat"],
      "files_to_create": ["path/file.ts"],
      "files_to_modify": ["path/existing.ts"],
      "files_readonly": ["path/schema.prisma"],
      "forbidden": ["apps/web/**"],
      "implementation_steps": [
        "1. Buat model data di schema",
        "2. Jalankan migrasi",
        "3. Verifikasi kueri"
      ],
      "acceptanceCriteria": [
        "Kriteria penerimaan measurable dan testable"
      ],
      "validation_commands": [
        "npm test",
        "npm run typecheck"
      ],
      "definition_of_done": [
        "Implementasi selesai",
        "Typecheck lolos",
        "Tidak ada file forbidden berubah"
      ],
      "out_of_scope": [
        "Tidak menyentuh UI frontend",
        "Tidak menambahkan authentication baru"
      ]
    }
  ]
}

Aturan bounded context:
- Task layer DATABASE: bebas di folder prisma/ & apps/api/prisma/schema.prisma saja. Gunakan provider "sqlite" secara default (file lokal dev.db) agar aplikasi hasil generate tidak memerlukan instalasi database server eksternal.
- Task layer BACKEND: bebas di apps/api/src/**, JANGAN sentuh apps/web/** atau prisma schema.
- Task layer FRONTEND: bebas di apps/web/src/**, JANGAN sentuh apps/api/**.
- forbidden WAJIB berisi path di luar layer (mis. BACKEND -> ["apps/web/**", "apps/api/prisma/**"]).

Aturan taskId dan depends_on (WAJIB KONSISTEN):
- Gunakan format 'taskId' standar: TASK-001, TASK-002, TASK-003, dst secara berurutan.
- 'depends_on' HARUS mereferensikan 'taskId' task prasyarat (misal ["TASK-001"]). Jangan gunakan ID sembarang agar Execution Graph dapat terhubung sempurna.

Aturan khusus FRONTEND (Design System Contract & UI/UX Specs):
- Terapkan Design System Contract: mobile-first, clean layout, semantic HTML, dan konsistensi visual.
- Spacing terstandarisasi: gunakan kelipatan 4px (Tailwind: gap-1, gap-2, p-3, p-4, p-6, space-y-4).
- Border Radius konsisten: rounded-sm, rounded-md, rounded-lg.
- Tangani state interaksi secara lengkap pada acceptance criteria: idle, loading (spinner/skeleton), error, dan success.
- Hindari duplikasi komponen dan hindari icon/elemen dekoratif tanpa fungsi nyata.

Aturan acceptance criteria (HARUS DIPATUHI):
- Setiap acceptance criterion HARUS measurable dan testable, bukan subjektif.
- ❌ SALAH: "Fitur login berhasil"
- ✅ BENAR: "Akses http://localhost:9999/login dengan kredensial valid menampilkan halaman dashboard home, URL tetap http://localhost:9999/dashboard"

Wajib pada layer INTEGRATION include minimal 2-3 task khusus ini:
1. Setup Testing Infrastructure - config jest/vitest + basic test setup scripts
2. E2E Test Configuration - setup playwright/cypress untuk end-to-end verification
3. Local Verification Scripts - command npm run dev/start yang user bisa jalankan

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
