// Generate roadmap (phases + features + dependencies) dari BRD.
// Port dari lib/ai/roadmap.ts.
import { z } from 'zod';
import { generateJson } from './ai-service.js';
import type { BrdData } from './brd.js';

const RoadmapSchema = z.object({
  phases: z
    .array(
      z.object({
        order: z.number().int().min(1),
        title: z.string(),
        description: z.string().optional(),
        layer: z.enum(['DATABASE', 'BACKEND', 'FRONTEND', 'INTEGRATION']),
        features: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string().optional(),
              dependsOn: z.array(z.string()).default([]),
            }),
          )
          .min(1),
      }),
    )
    .min(2),
});

export type RoadmapData = z.infer<typeof RoadmapSchema>;

export async function generateRoadmapFromBRD(brd: BrdData): Promise<RoadmapData> {
  const system = `Anda adalah Principal Systems Architect. Pecah BRD menjadi Feature Execution Graph terstruktur.
Setiap fase mengelompokkan layer delivery (DATABASE, BACKEND, FRONTEND, INTEGRATION).
Setiap fitur dalam fase wajib memodelkan dependensi logis (dependsOn) ke fitur prasyarat agar eksekusi task otonom berjalan teratur tanpa race conditions atau circular dependency.`;

  const user = `BRD:
${JSON.stringify(brd, null, 2)}

Schema JSON:
{
  "phases": [
    {
      "order": number,
      "title": string,
      "description"?: string,
      "layer": "DATABASE" | "BACKEND" | "FRONTEND" | "INTEGRATION",
      "features": [
        {
          "id": string (slug unik, mis. "auth-db", "product-api", "cart-ui"),
          "title": string,
          "description"?: string,
          "dependsOn": string[] (array slug fitur prasyarat yang harus selesai lebih dulu)
        }
      ]
    }
  ]
}

PRINSIP EXECUTION GRAPH:
1. Fitur layer BACKEND umumnya bergantung (dependsOn) pada fitur DATABASE terkait.
2. Fitur layer FRONTEND umumnya bergantung pada fitur BACKEND terkait.
3. Fitur INTEGRATION bergantung pada fitur FRONTEND & BACKEND inti.
4. Jangan membuat siklus ketergantungan (circular dependency).
5. Minimal 3 fase, total fitur 5-15. Kembalikan HANYA JSON.`;

  return generateJson({ system, user, schema: RoadmapSchema });
}
