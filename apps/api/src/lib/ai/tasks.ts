// Generate atomic tasks dari roadmap. Setiap task punya bounded context.
// Port dari lib/ai/tasks.ts (lib/ai/tasks-generator.ts).
import { z } from 'zod';
import { generateJson } from './ai-service.js';
import type { RoadmapData } from './roadmap.js';

const TasksSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        layer: z.enum(['DATABASE', 'BACKEND', 'FRONTEND', 'INTEGRATION']),
        featureId: z.string(),
        order: z.number().int().min(1),
        files_to_create: z.array(z.string()).default([]),
        files_to_modify: z.array(z.string()).default([]),
        forbidden: z.array(z.string()).default([]),
        acceptanceCriteria: z.array(z.string()).min(1),
      }),
    )
    .min(3),
});

export type TaskGen = z.infer<typeof TasksSchema>['tasks'][number];

export async function generateTasksFromRoadmap(args: {
  roadmap: RoadmapData;
  projectName: string;
  appRoot?: string; // mis. "apps/api", "apps/web"
}): Promise<TaskGen[]> {
  const system = `Anda adalah AI yang memecah fitur menjadi atomic tasks untuk AI coding agent. Setiap task HARUS punya bounded context: file yang boleh dibuat, file yang boleh dimodifikasi, dan file yang DILARANG disentuh (di luar layer tsb).`;

  const user = `ROADMAP:
${JSON.stringify(args.roadmap, null, 2)}

NAMA PROJECT: ${args.projectName}

Schema JSON (WAJIB):
{
  "tasks": [
    {
      "title": string,
      "description"?: string,
      "layer": "DATABASE" | "BACKEND" | "FRONTEND" | "INTEGRATION",
      "featureId": string (id fitur asal),
      "order": number,
      "files_to_create": string[],
      "files_to_modify": string[],
      "forbidden": string[],
      "acceptanceCriteria": string[] (2-5 item, dapat diverifikasi)
    }
  ]
}

Aturan bounded context:
- Task layer DATABASE: bebas di folder prisma/ & apps/api/prisma/schema.prisma saja.
- Task layer BACKEND: bebas di apps/api/src/**, JANGAN sentuh apps/web/** atau prisma schema.
- Task layer FRONTEND: bebas di apps/web/src/**, JANGAN sentuh apps/api/**.
- forbidden WAJIB berisi path di luar layer (mis. BACKEND -> ["apps/web/**", "apps/api/prisma/**"]).

Minimal 1 task per fitur. Urutkan order global. Kembalikan HANYA JSON.`;

  const out = await generateJson({ system, user, schema: TasksSchema });
  return out.tasks;
}
