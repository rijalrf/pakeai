import { z } from 'zod';
import { getAIService } from './ai-service';

export const prdFeatureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['must', 'should', 'could', 'wont']),
  category: z.string(),
  acceptance_criteria: z.array(z.string()),
  estimated_complexity: z.enum(['low', 'medium', 'high']),
});

export const prdDocumentSchema = z.object({
  problem_statement: z.string(),
  target_users: z.array(z.string()),
  value_proposition: z.string(),
  mvp_scope: z.array(z.string()),
  non_goals: z.array(z.string()),
  features: z.array(prdFeatureSchema),
  technical_requirements: z.object({
    frontend: z.string(),
    backend: z.string(),
    database: z.string(),
    architecture_notes: z.string(),
  }),
});

export type PRDDocument = z.infer<typeof prdDocumentSchema>;
export type PRDFeature = z.infer<typeof prdFeatureSchema>;

export const FALLBACK_PRD: PRDDocument = {
  problem_statement:
    'Pemain olahraga futsal sering kesulitan mengecek ketersediaan lapangan kosong secara real-time dan harus konfirmasi via chat berulang kali. Di sisi lain, pemilik lapangan sering mengalami dobel booking dan kesulitan merekap pembayaran.',
  target_users: [
    'Pemain Futsal Komunitas (Pencari slot cepat, butuh kepastian jadwal & pembayaran instan)',
    'Operator / Pemilik Venue Futsal (Mengelola kalender jadwal, harga per jam, dan rekap keuangan)',
  ],
  value_proposition:
    'SaaS booking lapangan olahraga mandiri berbasis web real-time yang mengunci slot booking otomatis selama 15 menit dengan verifikasi pembayaran instan tanpa kontak manual.',
  mvp_scope: [
    'Autentikasi Pengguna (Pemain & Operator Venue)',
    'Katalog Lapangan & Kalender Slot Ketersediaan Real-Time',
    'Alur Booking dengan Lock Timer 15 Menit',
    'Webhook Pembayaran QRIS / Midtrans',
    'Dashboard Ringkas Pengelola Lapangan',
  ],
  non_goals: [
    'Aplikasi Native Android/iOS di tahap MVP (fokus Web Mobile PWA)',
    'Sistem Turnamen / Klasemen Liga (fase pasca-MVP)',
    'Fitur Chat In-App antar Pemain',
  ],
  features: [
    {
      id: 'feat-1',
      title: 'Skema Database Venue, Lapangan & Kalender Jadwal',
      description: 'Struktur tabel PostgreSQL untuk venue, jenis lapangan, slot waktu 1 jam, dan status ketersediaan.',
      priority: 'must',
      category: 'DATABASE',
      acceptance_criteria: [
        'Tabel venues, courts, slots, dan bookings terhubung dengan foreign key yang tepat',
        'Constraint unik: 1 court tidak boleh memiliki 2 booking berstatus confirmed di slot waktu yang sama',
        'Index pada court_id dan slot_time untuk query cepat',
      ],
      estimated_complexity: 'medium',
    },
    {
      id: 'feat-2',
      title: 'API Booking Engine dengan Hold Slot Otomatis',
      description: 'Mekanisme concurrency lock untuk menahan slot selama 15 menit saat pengguna berada di layar checkout.',
      priority: 'must',
      category: 'BACKEND',
      acceptance_criteria: [
        'Menerbitkan token reservasi sementara berdurasi 15 menit',
        'Jika tidak dibayar dalam 15 menit, cron job / edge function mengembalikan status menjadi AVAILABLE',
      ],
      estimated_complexity: 'high',
    },
    {
      id: 'feat-3',
      title: 'Antarmuka Pencarian Slot & Checkout Mobile-First',
      description: 'Halaman publik pemilih tanggal dan kartu jam interaktif dengan indikator warna status slot.',
      priority: 'must',
      category: 'FRONTEND',
      acceptance_criteria: [
        'Render grid jam 08:00 - 23:00 dengan pembeda slot Kosong / Terisi / Sedang Di-hold',
        'Form ringkas pemesanan dan integrasi QRIS display',
      ],
      estimated_complexity: 'medium',
    },
    {
      id: 'feat-4',
      title: 'Dashboard Operator Venue & Rekap Finansial',
      description: 'Panel admin venue untuk melihat rekap booking hari ini dan omset harian.',
      priority: 'should',
      category: 'FRONTEND',
      acceptance_criteria: [
        'Tabel daftar reservasi dengan filter tanggal',
        'Tombol manual override untuk memblokir slot maintenance',
      ],
      estimated_complexity: 'medium',
    },
    {
      id: 'feat-5',
      title: 'Notifikasi WhatsApp / Email Konfirmasi Tiket',
      description: 'Kirim invoice dan barcode tiket booking setelah pembayaran diverifikasi oleh webhook.',
      priority: 'could',
      category: 'BACKEND',
      acceptance_criteria: [
        'Mengirim payload pesan instan konfirmasi jadwal booking',
      ],
      estimated_complexity: 'low',
    },
  ],
  technical_requirements: {
    frontend: 'Next.js 15 App Router, React 19, TailwindCSS, TanStack Query',
    backend: 'Next.js Server Actions & Route Handlers terenkapsulasi',
    database: 'PostgreSQL Supabase dengan RLS dan pgcrypto',
    architecture_notes: 'Pola modular bounded-context: database schema didahulukan sebelum API routes dan UI.',
  },
};

export async function generatePRDFromDiscovery(discoveryData: {
  idea: string;
  projectType: string;
  stacks: { category: string; technology: string }[];
  answers: Record<string, string>;
}): Promise<PRDDocument> {
  const ai = getAIService();

  const systemPrompt = `Anda adalah Principal Product Manager & Chief Software Architect elit yang berpengalaman membangun produk SaaS skala global.

TUGAS UTAMA:
Mengonversi hasil wawancara Product Discovery menjadi dokumen Product Requirements Document (PRD) yang SANGAT PRESISI, TEKNIKAL, dan STRUKTURAL dalam format JSON murni.

PRINSIP PENYUSUNAN PRD:
1. PROBLEM STATEMENT & VALUE PROPOSITION:
   - Definisikan akar masalah teknis dan operasional yang dihadapi pengguna.
   - Jelaskan proposisi nilai pembeda yang ditawarkan produk.
2. SCOPE CONTROL & ANTI-SCOPE CREEP:
   - MVP Scope: Hanya fitur esensial yang mutlak diperlukan agar produk dapat digunakan end-to-end.
   - Non-Goals: Tuliskan secara tegas hal-hal yang TIDAK akan dikerjakan pada rilis MVP untuk menjaga fokus engineer.
3. FITUR BERDASARKAN METODE MoSCoW:
   - Wajib menyertakan minimal 6-10 fitur yang mencakup seluruh lapisan arsitektur: "DATABASE", "BACKEND", "FRONTEND", dan "DEVOPS".
   - Klasifikasikan prioritas: "must" (kritis untuk MVP), "should" (penting), "could" (pelengkap), "wont" (ditunda).
   - Setiap fitur WAJIB memiliki acceptance criteria teknis yang teruji (misalnya: nama tabel, HTTP status code, format payload, atau batas waktu timeout).
   - Cantumkan estimated_complexity: "low" | "medium" | "high".
4. TECHNICAL REQUIREMENTS:
   - Jelaskan arsitektur Frontend, Backend, Database, serta catatan arsitektural (architecture_notes) seperti pola transaksi, caching, dan keamanan.
5. BAHASA & FORMAT:
   - Gunakan Bahasa Indonesia profesional dan baku untuk istilah umum, serta terminologi teknis standar industri software.
   - Kembalikan HANYA JSON murni yang mematuhi skema tanpa markdown.`;

  const userPrompt = `Susun PRD terstruktur untuk spesifikasi produk berikut:
- Ide Produk: ${discoveryData.idea}
- Tipe Aplikasi: ${discoveryData.projectType}
- Komposisi Tech Stack: ${discoveryData.stacks && discoveryData.stacks.length > 0 ? discoveryData.stacks.map((s) => `${s.category}: ${s.technology}`).join(', ') : 'Modern Web Stack'}

Hasil Wawancara Discovery Pengguna:
${Object.entries(discoveryData.answers)
  .map(([k, v]) => `- [${k}]: ${v}`)
  .join('\n')}

Format Dokumen PRD JSON yang diwajibkan:
{
  "problem_statement": "Deskripsi masalah dan celah solusi saat ini",
  "target_users": ["Persona 1", "Persona 2"],
  "value_proposition": "Nilai inti produk yang memecahkan masalah di atas",
  "mvp_scope": ["Lingkup MVP 1", "Lingkup MVP 2", "..."],
  "non_goals": ["Hal yang secara eksplisit tidak dibuat di fase ini", "..."],
  "features": [
    {
      "id": "feat-1",
      "title": "Nama Fitur Teknis",
      "description": "Deskripsi fungsi dan mekanisme kerja fitur",
      "priority": "must" | "should" | "could" | "wont",
      "category": "DATABASE" | "BACKEND" | "FRONTEND" | "DEVOPS",
      "acceptance_criteria": [
        "Kriteria penerimaan teknis 1",
        "Kriteria penerimaan teknis 2"
      ],
      "estimated_complexity": "low" | "medium" | "high"
    }
  ],
  "technical_requirements": {
    "frontend": "Spesifikasi arsitektur client & state management",
    "backend": "Spesifikasi business logic & pattern API",
    "database": "Spesifikasi model data, indexing, & integritas relasional",
    "architecture_notes": "Prinsip keamanan, penanganan konkurensi, dan transaksi"
  }
}`;

  try {
    const res = await ai.generateJSON({
      systemPrompt,
      userPrompt,
      schema: prdDocumentSchema,
      retries: 2,
    });
    return res;
  } catch (err: any) {
    console.error('generatePRDFromDiscovery error calling AI model:', err.message);
    throw new Error(`Gagal memanggil model AI untuk PRD: ${err.message}`);
  }
}
