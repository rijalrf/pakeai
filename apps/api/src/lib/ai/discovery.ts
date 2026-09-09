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
  { question: 'Masalah utama apa yang ingin diselesaikan?' },
  { question: 'Fitur inti apa yang WAJIB ada di versi pertama?' },
  { question: 'Bagaimana pengguna menyelesaikan masalah itu saat ini (alternatif)?' },
  { question: 'Apa batasan teknologi atau platform yang harus dipakai?' },
];

export async function generateDiscoveryQuestions(idea: string): Promise<DiscoveryQuestionGen[]> {
  const system = `Anda adalah product manager AI. Berdasarkan ide aplikasi user, buat 5-7 pertanyaan discovery yang menggali kebutuhan, pengguna, fitur inti, batasan, dan kriteria sukses. Setiap pertanyaan harus spesifik terhadap ide tersebut.`;

  const user = `IDE APLIKASI:\n${idea}\n\nSchema JSON WAJIB:\n{\n  "questions": [\n    { "question": string, "context"?: string }\n  ]\n}\n\nKembalikan HANYA JSON. Jangan sapa.`;

  return generateJson({ system, user, schema: DiscoverySchema }).then((o) => o.questions);
}
