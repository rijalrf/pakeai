import 'server-only';
import { z } from 'zod';
import { getAIService } from './ai-service';
import type { TaskLayer, TaskStatus, TaskPriority, TaskComplexity } from '@/lib/db/database.types';
import type { PRDDocument } from './prd';
import type { RoadmapDocument } from './roadmap';
import type { TaskItemData } from './tasks';

const taskItemSchema = z.object({
  id: z.string(),
  sequence: z.number(),
  title: z.string(),
  description: z.string(),
  layer: z.enum(['DATABASE', 'BACKEND', 'FRONTEND', 'DEVOPS', 'TESTING']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).default('TODO'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  estimated_complexity: z.enum(['trivial', 'low', 'medium', 'high']).default('medium'),
  acceptance_criteria: z.array(z.string()),
  ai_context: z.object({
    instructions: z.string(),
    files_to_create: z.array(z.string()),
    files_to_modify: z.array(z.string()),
    test_criteria: z.string(),
  }),
  blocked_reason: z.string().optional(),
  depends_on_task_ids: z.array(z.string()).optional(),
});

const tasksResponseSchema = z.object({
  tasks: z.array(taskItemSchema),
});

/**
 * Generator Atomic Tasks dari PRD + Roadmap.
 *
 * Dipasang `server-only` karena ini adalah entry point server-side
 * yang memanggil AI provider + menyimpan ke database.
 *
 * File ini dipisah dari `tasks.ts` agar `tasks.ts` bisa diimpor dari
 * client component (mis. Kanban board) tanpa menyeret `ai-service`
 * -> `cost-tracker` -> `pg` ke client bundle.
 */
export async function generateTasksFromRoadmap(input: {
  prd: PRDDocument;
  roadmap: RoadmapDocument;
}): Promise<TaskItemData[]> {
  const ai = getAIService();

  const systemPrompt = `Anda adalah Principal AI Autonomous Agent Coordinator & Staff Software Architect.
Keahlian Anda adalah menguraikan arsitektur sistem dan roadmap fase ke dalam sekumpulan tugas atomik (Atomic Tasks) yang mematuhi paradigma BOUNDED CONTEXT ISOLATION untuk dieksekusi oleh AI Coding Agent (seperti Claude Code, Cursor, Aider).

HUKUM BOUNDED CONTEXT (ISOLASI KONTEKS):
1. Setiap task HANYA boleh memuat 1 tanggung jawab spesifik (Single Responsibility Principle).
2. 'ai_context.files_to_create': Wajib menentukan path file spesifik yang harus dibuat baru (misal: 'lib/booking/hold-engine.ts').
3. 'ai_context.files_to_modify': Wajib membatasi file yang boleh diedit (misal: 'lib/db/database.types.ts'). Coding agent TIDAK diizinkan mengotak-atik file di luar daftar ini.
4. 'ai_context.test_criteria': Tuliskan kriteria pengujian yang konkret dan objektif (misal: "Unit test harus memverifikasi bahwa race condition 2 request booking bersamaan ditolak secara atomik").
5. 'sequence': Angka urutan logis dari 1 s/d N mengikuti hierarki DATABASE -> BACKEND -> FRONTEND -> DEVOPS.
6. 'depends_on_task_ids': Tuliskan ID task sebelumnya yang harus selesai terlebih dahulu. Task sequence 1 tidak memiliki dependensi.
7. 'status': Setel task pertama (sequence 1) sebagai 'TODO' atau 'IN_PROGRESS', dan seluruh task berikutnya sebagai 'TODO'.

BAHASA & FORMAT:
- Gunakan Bahasa Indonesia teknis yang presisi, lugas, dan instruktif.
- Kembalikan HANYA JSON murni yang mematuhi skema tanpa markdown.`;

  const userPrompt = `Uraikan PRD dan Roadmap berikut menjadi daftar 6-10 atomic tasks berurutan:
PRD Problem: ${input.prd.problem_statement}
MVP Scope: ${input.prd.mvp_scope.join(', ')}

Fase Roadmap:
${input.roadmap.phases.map((p) => `- Fase ${p.order_index} [${p.layer}]: ${p.title} (Fitur: ${p.features.join(', ')})`).join('\n')}

Format JSON yang diwajibkan:
{
  "tasks": [
    {
      "id": "task-db-1",
      "sequence": 1,
      "title": "Judul Task Ringkas & Jelas",
      "description": "Deskripsi lingkup teknis task",
      "layer": "DATABASE" | "BACKEND" | "FRONTEND" | "DEVOPS" | "TESTING",
      "status": "TODO",
      "priority": "critical" | "high" | "medium" | "low",
      "estimated_complexity": "trivial" | "low" | "medium" | "high",
      "acceptance_criteria": [
        "Kriteria penerimaan 1",
        "Kriteria penerimaan 2"
      ],
      "ai_context": {
        "instructions": "Instruksi eksekusi langkah-demi-langkah bagi coding agent",
        "files_to_create": ["path/to/file1.ts"],
        "files_to_modify": ["path/to/existing.ts"],
        "test_criteria": "Perintah atau skenario verifikasi keberhasilan"
      },
      "depends_on_task_ids": []
    }
  ]
}`;

  try {
    const res = await ai.generateJSON({
      systemPrompt,
      userPrompt,
      schema: tasksResponseSchema,
      retries: 2,
    });
    return res.tasks as TaskItemData[];
  } catch (err: any) {
    console.error('generateTasksFromRoadmap error calling AI model:', err.message);
    throw new Error(`Gagal memanggil model AI untuk Tasks: ${err.message}`);
  }
}
