// Generate BRD dari discovery answers. Port dari lib/ai/prd.ts (rename PRD->BRD).
import { z } from 'zod';
import { generateJson } from './ai-service.js';

export const FunctionalRequirementSchema = z.object({
  id: z.string(), // Format: FR-001, FR-002, dst.
  title: z.string(),
  description: z.string(),
  priority: z.enum(['MUST', 'SHOULD', 'COULD']).default('MUST'),
  actor: z.string().optional(),
});

export const BusinessRuleSchema = z.object({
  id: z.string(), // Format: BR-001, BR-002, dst.
  description: z.string(),
});

export const BrdSchema = z.object({
  overview: z.string(),
  goals: z.array(z.string()).min(1),
  features: z.array(z.object({ id: z.string(), name: z.string(), description: z.string().optional() })).min(1),
  functionalRequirements: z.array(FunctionalRequirementSchema).default([]),
  businessRules: z.array(BusinessRuleSchema).default([]),
  techRequirements: z.array(z.string()),
  nonFunctional: z.array(z.string()).default([]),
  outOfScope: z.array(z.string()).default([]),
});

export type BrdData = z.infer<typeof BrdSchema>;

export async function generateBRDFromDiscovery(args: {
  idea: string;
  questions: { question: string; answer: string }[];
  projectId?: string;
}): Promise<BrdData> {
  const qaText = args.questions
    .map((q, i) => `${i + 1}. ${q.question}\n   Jawaban: ${q.answer}`)
    .join('\n');

  const system = `Anda adalah arsitek produk senior. Hasilkan Business Requirements Document (BRD) canonical yang presisi dan menjadi source of truth bagi AI coding agent. Setiap requirement fungsional dan aturan bisnis WAJIB memiliki ID unik stabil (FR-xxx dan BR-xxx).`;

  const user = `IDE USER:
${args.idea}

JAWABAN DISCOVERY:
${qaText}

Schema JSON yang WAJIB diikuti:
{
  "overview": string (2-4 kalimat ringkasan produk),
  "goals": string[] (3-6 tujuan terukur),
  "features": [{ "id": string (slug), "name": string, "description"?: string }] (3-8 fitur utama),
  "functionalRequirements": [
    {
      "id": "FR-001",
      "title": "Nama Kebutuhan Singkat",
      "description": "Deskripsi spesifik apa yang harus dilakukan sistem",
      "priority": "MUST" | "SHOULD" | "COULD",
      "actor": "Pengguna" | "Admin" | "Sistem"
    }
  ],
  "businessRules": [
    {
      "id": "BR-001",
      "description": "Aturan validasi atau batasan bisnis spesifik (misal: harga > 0, email harus unik)"
    }
  ],
  "techRequirements": string[] (stack teknologi: SQLite + Prisma, Express TS, React TS),
  "nonFunctional": string[] (kecepatan respon, keamanan, reliabilitas),
  "outOfScope": string[] (fitur atau lingkup yang DILARANG dikerjakan)
}

Pastikan ID requirement berurutan (FR-001, FR-002...) dan aturan bisnis (BR-001, BR-002...). Kembalikan HANYA JSON valid.`;

  return generateJson({ system, user, schema: BrdSchema, agentName: 'CanonicalBrdSpec', projectId: args.projectId });
}
