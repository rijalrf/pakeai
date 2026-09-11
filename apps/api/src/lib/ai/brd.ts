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

export const DataModelFieldSchema = z.object({
  name: z.string(),
  type: z.string(), // e.g. String, Int, Boolean, DateTime
  required: z.boolean().default(true),
  unique: z.boolean().optional(),
  description: z.string().optional(),
});

export const DataModelSchema = z.object({
  name: z.string(), // e.g. User, Task, Product
  description: z.string().optional(),
  fields: z.array(DataModelFieldSchema).min(1),
  relations: z.array(z.string()).default([]),
});

export const ApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string(), // e.g. /api/tasks, /api/auth/login
  description: z.string(),
  requestBody: z.string().optional(), // TypeScript type notation
  responseBody: z.string().optional(), // TypeScript type notation
  authRequired: z.boolean().default(false),
});

export const BrdSchema = z.object({
  overview: z.string(),
  goals: z.array(z.string()).min(1),
  features: z.array(z.object({ id: z.string(), name: z.string(), description: z.string().optional() })).min(1),
  functionalRequirements: z.array(FunctionalRequirementSchema).default([]),
  businessRules: z.array(BusinessRuleSchema).default([]),
  dataModels: z.array(DataModelSchema).default([]),
  apiEndpoints: z.array(ApiEndpointSchema).default([]),
  techRequirements: z.array(z.string()),
  nonFunctional: z.array(z.string()).default([]),
  outOfScope: z.array(z.string()).default([]),
});

export type BrdData = z.infer<typeof BrdSchema>;

export async function generateBRDFromDiscovery(args: {
  idea: string;
  questions: { question: string; answer: string }[];
  projectId?: string;
  techStack?: string[];
  chatHistory?: string;
}): Promise<BrdData> {
  const qaText = args.questions
    .map((q, i) => `${i + 1}. ${q.question}\n   Jawaban: ${q.answer}`)
    .join('\n');

  const stackText = args.techStack?.length
    ? `\nTECH STACK TERPILIH:\n${args.techStack.join('\n')}`
    : '\nTECH STACK: SQLite + Prisma ORM, Express TypeScript, React TypeScript, Tailwind CSS';

  const chatText = args.chatHistory
    ? `\nRIWAYAT BRAINSTORMING AWAL:\n${args.chatHistory}`
    : '';

  const system = `Anda adalah Principal Systems Architect dan Lead Product Manager. Hasilkan Business Requirements Document (BRD) canonical teknis yang sangat presisi dan menjadi source of truth mutlak bagi AI coding agent downstream.
Wajib menyertakan rancangan model data (dataModels) dan spesifikasi endpoint API (apiEndpoints) konkret yang sinkron dengan functional requirements dan aturan bisnis.`;

  const user = `IDE USER:
${args.idea}
${chatText}
${stackText}

JAWABAN DISCOVERY:
${qaText}

Schema JSON yang WAJIB diikuti:
{
  "overview": string (2-4 kalimat ringkasan produk),
  "goals": string[] (3-6 tujuan terukur),
  "features": [{ "id": string (slug unik), "name": string, "description"?: string }] (3-8 fitur utama),
  "functionalRequirements": [
    {
      "id": "FR-001",
      "title": "Nama Kebutuhan Singkat",
      "description": "Deskripsi spesifik apa yang harus dilakukan sistem secara teknis",
      "priority": "MUST" | "SHOULD" | "COULD",
      "actor": "Pengguna" | "Admin" | "Sistem"
    }
  ],
  "businessRules": [
    {
      "id": "BR-001",
      "description": "Aturan validasi atau batasan bisnis spesifik (misal: email harus unik, status valid: PENDING, ACTIVE, DONE)"
    }
  ],
  "dataModels": [
    {
      "name": "User",
      "description": "Menyimpan data akun pengguna",
      "fields": [
        { "name": "id", "type": "String", "required": true, "unique": true, "description": "Primary key cuid" },
        { "name": "email", "type": "String", "required": true, "unique": true, "description": "Email unik login" },
        { "name": "name", "type": "String", "required": false },
        { "name": "createdAt", "type": "DateTime", "required": true }
      ],
      "relations": ["User has many Tasks"]
    }
  ],
  "apiEndpoints": [
    {
      "method": "POST",
      "path": "/api/auth/login",
      "description": "Login dengan email dan password",
      "requestBody": "{ email: string, password: string }",
      "responseBody": "{ token: string, user: { id: string, email: string, name: string } }",
      "authRequired": false
    }
  ],
  "techRequirements": string[] (tech stack yang digunakan),
  "nonFunctional": string[] (kecepatan respon, keamanan, reliabilitas),
  "outOfScope": string[] (fitur atau lingkup yang DILARANG dikerjakan)
}

ATURAN KRITIS:
1. Pastikan ID requirement berurutan (FR-001, FR-002...) dan aturan bisnis (BR-001, BR-002...).
2. Minimal buat 2-5 dataModels yang mencakup seluruh domain problem.
3. Minimal buat 4-10 apiEndpoints yang memetakan seluruh operasi CRUD dan flow bisnis utama.
4. Kembalikan HANYA JSON valid.`;

  return generateJson({ system, user, schema: BrdSchema, agentName: 'CanonicalBrdSpec', projectId: args.projectId });
}
