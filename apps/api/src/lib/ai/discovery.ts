// Generate pertanyaan discovery dari ide project.
import { z } from 'zod';
import { generateJson } from './ai-service.js';

const DiscoverySchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        context: z.string().optional(),
      }),
    )
    .min(3)
    .max(8),
});

export type DiscoveryQuestionGen = z.infer<typeof DiscoverySchema>['questions'][number];

// Fallback deterministik bila AI tidak tersedia.
export const DEFAULT_DISCOVERY_QUESTIONS: DiscoveryQuestionGen[] = [
  { question: 'Siapa target pengguna utama aplikasi ini?', context: 'user' },
  { question: 'Masalah inti apa yang ingin diselesaikan?', context: 'problem' },
  { question: 'Fitur-fitur utama apa yang WAJIB ada di versi pertama (MVP)?', context: 'features' },
  { question: 'Entitas atau data utama apa saja yang disimpan dan dikelola aplikasi (misal: Pengguna, Produk, Pesanan)?', context: 'data_entities' },
  { question: 'Bagaimana mekanisme login atau hak akses pengguna (misal: Tanpa login, Login Email/Password, Multi-role Admin & Member)?', context: 'auth_access' },
  { question: 'Bagaimana alur utama saat pengguna membuka aplikasi pertama kali sampai menyelesaikan tugas?', context: 'workflow' },
];

export async function generateDiscoveryQuestions(idea: string): Promise<DiscoveryQuestionGen[]> {
  const system = `Anda adalah Lead Technical Product Manager AI. Berdasarkan ide aplikasi user, buat 5-8 pertanyaan discovery yang menggali kebutuhan fungsional, entitas data, alur autentikasi, fitur inti MVP, dan batasan teknis. Wajib ada pertanyaan tentang entitas data yang dikelola dan model autentikasi.`;

  const user = `IDE APLIKASI:\n${idea}\n\nSchema JSON WAJIB:\n{\n  "questions": [\n    { "question": string, "context"?: string }\n  ]\n}\n\nKembalikan HANYA JSON. Jangan sapa.`;

  return generateJson({ system, user, schema: DiscoverySchema, agentName: 'DiscoveryQuestions' }).then((o) => o.questions);
}
