import { z } from 'zod';
import { getAIService } from './ai-service';

export const discoveryQuestionItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  category: z.enum(['target_user', 'features', 'technical', 'business', 'ux', 'scope']),
  hint: z.string().optional(),
});

export const discoveryQuestionsResponseSchema = z.object({
  questions: z.array(discoveryQuestionItemSchema),
});

export type DiscoveryQuestionItem = z.infer<typeof discoveryQuestionItemSchema>;

export interface DiscoveryInput {
  idea: string;
  projectType: string;
  stacks: { category: string; technology: string }[];
  skillLevel?: string;
}

export const FALLBACK_QUESTIONS: DiscoveryQuestionItem[] = [
  {
    id: 'q-1',
    question: 'Siapa target pengguna utama aplikasi ini (apakah end-user umum, bisnis/venue, atau keduanya)?',
    category: 'target_user',
    hint: 'Misal: Pemain futsal kasual & pemilik/operator lapangan futsal.',
  },
  {
    id: 'q-2',
    question: 'Bagaimana alur utama pengguna dalam melakukan pencarian slot hingga reservasi berhasil?',
    category: 'ux',
    hint: 'Misal: Pilih tanggal → cek slot kosong per jam → input info booking → bayar via QRIS.',
  },
  {
    id: 'q-3',
    question: 'Fitur apa saja yang dibutuhkan pemilik/pengelola venue di sisi dashboard mereka?',
    category: 'features',
    hint: 'Misal: Atur jadwal & tarif per jam, konfirmasi reservasi manual, rekap pendapatan harian.',
  },
  {
    id: 'q-4',
    question: 'Bagaimana mekanisme penanganan pembayaran dan batas waktu booking (hold slot)?',
    category: 'business',
    hint: 'Misal: Slot di-hold selama 15 menit, verifikasi otomatis via webhook payment gateway.',
  },
  {
    id: 'q-5',
    question: 'Fitur apa yang HARUS ada di MVP pertama vs yang bisa ditunda ke fase selanjutnya?',
    category: 'scope',
    hint: 'Misal: MVP pertama fokus web booking & cek jadwal; fitur mobile app & turnamen ditunda.',
  },
];

export async function generateDiscoveryQuestions(input: DiscoveryInput): Promise<DiscoveryQuestionItem[]> {
  const ai = getAIService();

  const systemPrompt = `Anda adalah Principal Software Architect & Product Strategist elit dengan keahlian mendalam dalam rekayasa sistem terdistribusi, perancangan basis data, dan arsitektur aplikasi modern.

TUGAS UTAMA:
Menganalisis ide produk perangkat lunak yang diajukan oleh pengguna dan menghasilkan 5 (lima) pertanyaan Product Discovery yang SANGAT TAJAM, SPESIFIK, dan KRITIS secara arsitektural.

PRINSIP WAWANCARA DISCOVERY:
1. DILARANG mengajukan pertanyaan klise seperti "Apakah Anda butuh tombol login?" atau "Berapa anggaran Anda?".
2. FOKUS pada trade-off arsitektural yang menentukan keberhasilan sistem:
   - Mekanisme konkurensi data (concurrency control, race condition, holding locks).
   - Batas ruang lingkup MVP vs fitur sekunder (scope boundaries & anti-scope creep).
   - Karakteristik pengguna nyata (end-user mobile vs operator desktop, volume transaksi, frekuensi akses).
   - Integrasi sistem pihak ketiga (payment gateway, webhook, verifikasi identitas, notifikasi).
   - Aturan bisnis non-trivial (denda, timeout, pembatalan, split revenue/escrow).
3. Gunakan Bahasa Indonesia profesional, lugas, baku, dan langsung pada substansi teknis.
4. Setiap pertanyaan harus disertai rekomendasi arahan jawaban ("hint") yang realistis dan aplikatif.
5. Kategori pertanyaan WAJIB salah satu dari: "target_user", "features", "technical", "business", "ux", "scope".

OUTPUT:
Kembalikan HANYA JSON murni yang mematuhi skema tanpa pembungkus markdown apapun.`;

  const userPrompt = `Analisis ide project berikut secara mendalam:
- Tipe Project: ${input.projectType}
- Ide Inti: "${input.idea}"
- Pilihan Tech Stack: ${input.stacks && input.stacks.length > 0 ? input.stacks.map((s) => `${s.category}: ${s.technology}`).join(', ') : 'Belum ditentukan'}
- Tingkat Kemahiran Tim: ${input.skillLevel || 'Intermediate'}

Susun 5 pertanyaan penemuan (discovery) terstruktur untuk mengeliminasi ambiguitas sebelum menyusun PRD teknis. Format respon:
{
  "questions": [
    {
      "id": "q-1",
      "question": "Kalimat pertanyaan yang tajam dan spesifik",
      "category": "target_user" | "features" | "technical" | "business" | "ux" | "scope",
      "hint": "Contoh arahan jawaban teknis/bisnis yang konkret"
    }
  ]
}`;

  try {
    const res = await ai.generateJSON({
      systemPrompt,
      userPrompt,
      schema: discoveryQuestionsResponseSchema,
      retries: 2,
    });
    return res.questions;
  } catch (err: any) {
    console.error('generateDiscoveryQuestions error calling AI model:', err.message);
    throw new Error(`Gagal memanggil model AI untuk Discovery: ${err.message}`);
  }
}
