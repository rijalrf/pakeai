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

export const UserStorySchema = z.object({
  id: z.string(), // Format: US-001, US-002, dst.
  persona: z.string(),
  action: z.string(),
  benefit: z.string(),
  acceptanceCriteria: z.array(z.string()).default([]),
});

export const EdgeCaseSchema = z.object({
  id: z.string(), // Format: EC-001, EC-002, dst.
  scenario: z.string(),
  expectedBehavior: z.string(),
});

export const SuccessMetricSchema = z.object({
  metric: z.string(),
  target: z.string(),
});

export const BrdSchema = z.object({
  overview: z.string(),
  goals: z.array(z.string()).min(1),
  features: z.array(z.object({ id: z.string(), name: z.string(), description: z.string().optional() })).min(1),
  userStories: z.array(UserStorySchema).default([]),
  functionalRequirements: z.array(FunctionalRequirementSchema).default([]),
  businessRules: z.array(BusinessRuleSchema).default([]),
  dataModels: z.array(DataModelSchema).default([]),
  apiEndpoints: z.array(ApiEndpointSchema).default([]),
  edgeCases: z.array(EdgeCaseSchema).default([]),
  successMetrics: z.array(SuccessMetricSchema).default([]),
  techRequirements: z.array(z.string()),
  nonFunctional: z.array(z.string()).default([]),
  outOfScope: z.array(z.string()).default([]),
});

export type BrdData = z.infer<typeof BrdSchema>;

export async function generateBRDFromDiscovery(args: {
  idea: string;
  questions?: { question: string; answer: string }[];
  projectId?: string;
  techStack?: string[];
  chatHistory?: string;
}): Promise<BrdData> {
  const qaText = args.questions && args.questions.length > 0
    ? `\nJAWABAN PERTANYAAN TAMBAHAN:\n` + args.questions
        .map((q, i) => `${i + 1}. ${q.question}\n   Jawaban: ${q.answer}`)
        .join('\n')
    : '';

  const stackText = args.techStack?.length
    ? `\nTECH STACK TERPILIH:\n${args.techStack.join('\n')}`
    : '\nTECH STACK: SQLite + Prisma ORM, Express TypeScript, React TypeScript, Tailwind CSS';

  const chatText = args.chatHistory
    ? `\nRIWAYAT PERCAKAPAN LENGKAP DENGAN PENGGUNA (SUMBER KEBUTUHAN UTAMA):\n${args.chatHistory}`
    : '';

  const system = `Anda adalah Principal Systems Architect dan Lead Product Manager. Hasilkan Business Requirements Document (BRD) canonical teknis yang sangat presisi dan menjadi source of truth mutlak bagi AI coding agent downstream.
Wajib menyertakan rancangan model data (dataModels) dan spesifikasi endpoint API (apiEndpoints) konkret yang sinkron dengan functional requirements dan aturan bisnis. Gali sedalam mungkin dari riwayat percakapan pengguna.`;

  const user = `IDE USER:
${args.idea}
${chatText}
${stackText}
${qaText}

Schema JSON yang WAJIB diikuti:
{
  "overview": string (2-4 kalimat ringkasan produk),
  "goals": string[] (3-6 tujuan terukur),
  "features": [{ "id": string (slug unik), "name": string, "description"?: string }] (3-8 fitur utama),
  "userStories": [
    {
      "id": "US-001",
      "persona": "Sebagai Pengguna Baru",
      "action": "saya ingin mendaftar akun dengan verifikasi email",
      "benefit": "supaya data dan aktivitas saya tersimpan aman",
      "acceptanceCriteria": ["Form validasi email unik", "Kirim link verifikasi", "Akun aktif setelah klik"]
    }
  ],
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
  "edgeCases": [
    {
      "id": "EC-001",
      "scenario": "Pengguna mengirim form saat koneksi offline atau token kedaluwarsa",
      "expectedBehavior": "Tampilkan notifikasi kegagalan ramah, data input dipertahankan lokal, dan refresh auth otomatis jika memungkinkan"
    }
  ],
  "successMetrics": [
    {
      "metric": "Kecepatan Respons API",
      "target": "p95 di bawah 300ms untuk seluruh endpoint query list"
    }
  ],
  "techRequirements": string[] (tech stack yang digunakan),
  "nonFunctional": string[] (WAJIB mencakup item berikut jika relevan:
    - "Keamanan: JWT_SECRET wajib dari environment variable, dilarang hardcode atau fallback default. Password wajib di-hash dengan bcrypt."
    - "Pagination: Semua endpoint GET yang mengembalikan daftar WAJIB mendukung query parameter ?page=&limit= dengan default limit 20."
    - "Sorting: Endpoint GET list HARUS mendukung parameter ?sortBy=&order=asc|desc."
    - "Error handling: Semua error API mengembalikan format JSON konsisten {error: string} dengan HTTP status code yang tepat."
    - "Reliabilitas: Operasi yang melibatkan perubahan stok/saldo/kuota WAJIB atomik dalam database transaction."
  ),
  "outOfScope": string[] (fitur atau lingkup yang DILARANG dikerjakan)
}

ATURAN KRITIS:
1. Pastikan ID requirement berurutan (FR-001, FR-002...), aturan bisnis (BR-001, BR-002...), user stories (US-001, US-002...), dan edge cases (EC-001, EC-002...).
2. Minimal buat 3-5 userStories yang mencakup seluruh aktor utama dalam format Sebagai... saya ingin... supaya...
3. Minimal buat 3 edgeCases kritis yang mengantisipasi kegagalan sistem atau input tak terduga.
4. Minimal buat 2-4 successMetrics terukur (waktu proses, tingkat error, atau performa).
5. Minimal buat 2-5 dataModels yang mencakup seluruh domain problem.
6. Minimal buat 4-10 apiEndpoints yang memetakan seluruh operasi CRUD dan flow bisnis utama.
7. Jika aplikasi memiliki autentikasi (login/register), BRD WAJIB menyertakan fitur manajemen pengguna (minimal: register, lihat profil, ubah password) — bukan hanya login via seed.
8. businessRules WAJIB menyertakan aturan integritas referensial: jika entitas A memiliki relasi aktif ke entitas B (misal: peminjaman PENDING), maka penghapusan entitas B harus DITOLAK atau memerlukan penyelesaian relasi terlebih dahulu. Dilarang silent cascade delete pada data berelasi aktif.
9. businessRules WAJIB menyertakan aturan atomisitas untuk operasi konkuren: jika dua user dapat mengubah resource yang sama secara bersamaan (misal: approve peminjaman yang mengurangi stok), aturan bisnis harus menyebutkan bahwa operasi tersebut wajib atomik dan mencegah race condition.
10. Kembalikan HANYA JSON valid.`;

  return generateJson({ system, user, schema: BrdSchema, agentName: 'CanonicalBrdSpec', projectId: args.projectId });
}
