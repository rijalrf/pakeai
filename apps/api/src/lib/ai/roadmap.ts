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
  const system = `Anda adalah tech lead. Pecah BRD menjadi fase & fitur yang bisa dieksekusi sebagai task atomic. Setiap fase harus berurutan secara logis (DATABASE -> BACKEND -> FRONTEND -> INTEGRATION). Fitur dalam fase boleh punya dependensi satu sama lain.`;

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
        { "id": string (slug), "title": string, "description"?: string, "dependsOn": string[] (id fitur lain yang jadi prasyarat) }
      ]
    }
  ]
}

Minimal 3 fase, total fitur 5-15. Kembalikan HANYA JSON.`;

  return generateJson({ system, user, schema: RoadmapSchema });
}
