// Generate BRD dari discovery answers. Port dari lib/ai/prd.ts (rename PRD->BRD).
import { z } from 'zod';
import { generateJson } from './ai-service.js';

export const BrdSchema = z.object({
  overview: z.string(),
  goals: z.array(z.string()).min(1),
  features: z.array(z.object({ id: z.string(), name: z.string(), description: z.string().optional() })).min(1),
  techRequirements: z.array(z.string()),
  nonFunctional: z.array(z.string()).default([]),
  outOfScope: z.array(z.string()).default([]),
});

export type BrdData = z.infer<typeof BrdSchema>;

export async function generateBRDFromDiscovery(args: {
  idea: string;
  questions: { question: string; answer: string }[];
}): Promise<BrdData> {
  const qaText = args.questions
    .map((q, i) => `${i + 1}. ${q.question}\n   Jawaban: ${q.answer}`)
    .join('\n');

  const system = `Anda adalah arsitek produk senior. Hasilkan Business Requirements Document (BRD) yang ringkas dan dapat dieksekusi, dalam format JSON sesuai schema yang diminta user.`;

  const user = `IDE USER:
${args.idea}

JAWABAN DISCOVERY:
${qaText}

Schema JSON yang WAJIB diikuti (jangan tambahkan field lain):
{
  "overview": string (2-4 kalimat),
  "goals": string[] (3-6 tujuan terukur),
  "features": [{ "id": string (slug), "name": string, "description"?: string }] (4-10 fitur),
  "techRequirements": string[] (stack teknologi yang disarankan),
  "nonFunctional": string[] (kualitas: performa, keamanan, dsb),
  "outOfScope": string[] (yang TIDAK dibangun)
}

Kembalikan HANYA JSON valid.`;

  return generateJson({ system, user, schema: BrdSchema });
}
