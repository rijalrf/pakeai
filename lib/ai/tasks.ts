import { z } from 'zod';
import { getAIService } from './ai-service';
import type { TaskLayer, TaskStatus, TaskPriority, TaskComplexity } from '@/lib/db/database.types';
import type { PRDDocument } from './prd';
import type { RoadmapDocument } from './roadmap';

export const taskItemSchema = z.object({
  id: z.string(),
  sequence: z.number(),
  title: z.string(),
  description: z.string(),
  layer: z.enum(['DATABASE', 'BACKEND', 'FRONTEND', 'DEVOPS', 'TESTING']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).default('TODO'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  estimated_complexity: z.enum(['trivial', 'low', 'medium', 'high']).default('medium'),
  acceptance_criteria: z.array(z.string()),
  ai_context: z.object({
    instructions: z.string(),
    files_to_create: z.array(z.string()),
    files_to_modify: z.array(z.string()),
    test_criteria: z.string(),
  }),
  blocked_reason: z.string().optional(),
  depends_on_task_ids: z.array(z.string()).optional(),
});

export const tasksResponseSchema = z.object({
  tasks: z.array(taskItemSchema),
});

export interface TaskItemData {
  id: string;
  sequence: number;
  title: string;
  description: string;
  layer: TaskLayer;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_complexity: TaskComplexity;
  acceptance_criteria: string[];
  ai_context: {
    instructions: string;
    files_to_create: string[];
    files_to_modify: string[];
    test_criteria: string;
  };
  blocked_reason?: string;
  depends_on_task_ids?: string[];
}

export const INITIAL_TASKS: TaskItemData[] = [
  // --- DATABASE LAYER ---
  {
    id: 'task-db-1',
    sequence: 1,
    title: 'Buat Skema Tabel Profiles dan Authentication Constraints',
    description: 'Menyiapkan tabel profiles yang terhubung dengan Supabase auth.users dan trigger update timestamp.',
    layer: 'DATABASE',
    status: 'DONE',
    priority: 'high',
    estimated_complexity: 'low',
    acceptance_criteria: [
      'Tabel profiles memiliki kolom id, full_name, avatar_url, skill_level',
      'Trigger otomatis handle_new_user terpasang pada auth.users',
      'RLS aktif dengan policy user hanya bisa update profil sendiri',
    ],
    ai_context: {
      instructions: 'Buat migrasi SQL untuk tabel profiles dan pasang trigger RLS Supabase.',
      files_to_create: ['supabase/migrations/00001_profiles.sql'],
      files_to_modify: ['lib/db/database.types.ts'],
      test_criteria: 'Verifikasi insert auth.users otomatis membuat row di profiles.',
    },
  },
  {
    id: 'task-db-2',
    sequence: 2,
    title: 'Buat Skema Venues, Courts, dan Booking Slots',
    description: 'Relasi data lapangan olahraga, konfigurasi jam buka (08:00 - 23:00), dan status ketersediaan.',
    layer: 'DATABASE',
    status: 'DONE',
    priority: 'critical',
    estimated_complexity: 'medium',
    acceptance_criteria: [
      'Foreign key relasional: venues -> courts -> slots',
      'Unique constraint pada (court_id, slot_date, start_time)',
      'Status slot: AVAILABLE, HELD, BOOKED, MAINTENANCE',
    ],
    ai_context: {
      instructions: 'Tulis skema PostgreSQL untuk entitas venue dan slot waktu booking per jam.',
      files_to_create: ['supabase/migrations/00002_courts.sql'],
      files_to_modify: ['lib/db/database.types.ts'],
      test_criteria: 'Tidak boleh ada duplikasi slot waktu di court yang sama.',
    },
  },

  // --- BACKEND LAYER ---
  {
    id: 'task-be-1',
    sequence: 3,
    title: 'Implementasi Booking Hold Engine dengan Concurrency Lock',
    description: 'Server Action untuk menahan slot selama 15 menit dengan lock transaction.',
    layer: 'BACKEND',
    status: 'IN_PROGRESS',
    priority: 'critical',
    estimated_complexity: 'high',
    acceptance_criteria: [
      'Menolak hold jika status slot sudah HELD atau BOOKED',
      'Menghasilkan reservation token berbatas waktu 15 menit',
      'Ekspose method releaseExpiredHolds()',
    ],
    ai_context: {
      instructions: 'Buat handler Server Action untuk menahan slot booking secara atomik.',
      files_to_create: ['lib/booking/hold-engine.ts', 'app/api/bookings/hold/route.ts'],
      files_to_modify: ['lib/db/database.types.ts'],
      test_criteria: 'Uji simulasi 2 request bersamaan pada 1 slot, hanya 1 yang boleh berhasil.',
    },
    depends_on_task_ids: ['task-db-2'],
  },
  {
    id: 'task-be-2',
    sequence: 4,
    title: 'Integrasi Webhook Pembayaran QRIS / Midtrans',
    description: 'Endpoint penerima notifikasi sukses pembayaran untuk mengubah status slot dari HELD menjadi BOOKED.',
    layer: 'BACKEND',
    status: 'TODO',
    priority: 'high',
    estimated_complexity: 'medium',
    acceptance_criteria: [
      'Verifikasi signature hash pembayaran',
      'Atomic update status booking menjadi CONFIRMED',
      'Mengirim sinyal event WhatsApp notification',
    ],
    ai_context: {
      instructions: 'Bangun route handler /api/payments/webhook untuk verifikasi signature dan konfirmasi booking.',
      files_to_create: ['app/api/payments/webhook/route.ts'],
      files_to_modify: ['lib/booking/hold-engine.ts'],
      test_criteria: 'Kirim payload mock webhook dan pastikan status slot berubah menjadi BOOKED.',
    },
    depends_on_task_ids: ['task-be-1'],
  },

  // --- FRONTEND LAYER ---
  {
    id: 'task-fe-1',
    sequence: 5,
    title: 'Komponen Kalender Slot Interaktif Pemain',
    description: 'Grid visual jam 08:00 - 23:00 dengan warna status (Hijau = Kosong, Kuning = Hold, Merah = Terisi).',
    layer: 'FRONTEND',
    status: 'TODO',
    priority: 'high',
    estimated_complexity: 'medium',
    acceptance_criteria: [
      'Pemilih tanggal kalender responsif mobile',
      'Slot card bisa diklik dan menampilkan countdown timer jika sedang di-hold user',
      'Direct link ke modal checkout',
    ],
    ai_context: {
      instructions: 'Buat komponen SlotGrid.tsx dan DateSelector.tsx dengan Tailwind CSS.',
      files_to_create: ['components/booking/slot-grid.tsx', 'components/booking/date-selector.tsx'],
      files_to_modify: ['app/booking/page.tsx'],
      test_criteria: 'Komponen merender 15 slot jam secara benar dengan status real-time.',
    },
    depends_on_task_ids: ['task-be-1'],
  },
  {
    id: 'task-fe-2',
    sequence: 6,
    title: 'Halaman Checkout & Tampilan Dynamic QRIS',
    description: 'Form ringkas input nama tim/pemain, rincian biaya lapangan, dan tampilan barcode QRIS dinamis.',
    layer: 'FRONTEND',
    status: 'TODO',
    priority: 'medium',
    estimated_complexity: 'medium',
    acceptance_criteria: [
      'Menampilkan sisa waktu hold (15:00 mundur)',
      'Polling status pembayaran setiap 3 detik',
      'Redirect ke halaman tiket sukses saat lunas',
    ],
    ai_context: {
      instructions: 'Bangun alur checkout dengan polling TanStack Query untuk mengecek status lunas.',
      files_to_create: ['components/booking/checkout-modal.tsx'],
      files_to_modify: ['app/booking/page.tsx'],
      test_criteria: 'Timer 15 menit menghitung mundur secara akurat.',
    },
    depends_on_task_ids: ['task-fe-1', 'task-be-2'],
  },
  {
    id: 'task-fe-3',
    sequence: 7,
    title: 'Dashboard Pengelola Venue Futsal',
    description: 'Panel admin venue untuk memantau kalender booking harian dan laporan pendapatan.',
    layer: 'FRONTEND',
    status: 'TODO',
    priority: 'medium',
    estimated_complexity: 'medium',
    acceptance_criteria: [
      'Filter daftar booking berdasarkan tanggal',
      'Tombol blokir manual slot untuk jadwal latihan tetap/maintenance',
      'Ringkasan total omset harian',
    ],
    ai_context: {
      instructions: 'Buat dashboard operator venue di /dashboard/venue dengan tabel transaksi.',
      files_to_create: ['app/venue-dashboard/page.tsx'],
      files_to_modify: ['components/layout/app-sidebar.tsx'],
      test_criteria: 'Operator bisa mengklik tombol blokir slot dan status slot berubah.',
    },
    depends_on_task_ids: ['task-be-1'],
  },
];

export async function generateTasksFromRoadmap(input: {
  prd: PRDDocument;
  roadmap: RoadmapDocument;
}): Promise<TaskItemData[]> {
  const ai = getAIService();

  const systemPrompt = `Anda adalah Principal AI Autonomous Agent Coordinator & Staff Software Architect.
Keahlian Anda adalah menguraikan arsitektur sistem dan roadmap fase ke dalam sekumpulan tugas atomik (Atomic Tasks) yang mematuhi paradigma BOUNDED CONTEXT ISOLATION untuk dieksekusi oleh AI Coding Agent (seperti Claude Code, Cursor, Aider).

HUKUM BOUNDED CONTEXT (ISOLASI KONTEKS):
1. Setiap task HANYA boleh memuat 1 tanggung jawab spesifik (Single Responsibility Principle).
2. 'ai_context.files_to_create': Wajib menentukan path file spesifik yang harus dibuat baru (misal: 'lib/booking/hold-engine.ts').
3. 'ai_context.files_to_modify': Wajib membatasi file yang boleh diedit (misal: 'lib/db/database.types.ts'). Coding agent TIDAK diizinkan mengotak-atik file di luar daftar ini.
4. 'ai_context.test_criteria': Tuliskan kriteria pengujian yang konkret dan objektif (misal: "Unit test harus memverifikasi bahwa race condition 2 request booking bersamaan ditolak secara atomik").
5. 'sequence': Angka urutan logis dari 1 s/d N mengikuti hierarki DATABASE -> BACKEND -> FRONTEND -> DEVOPS.
6. 'depends_on_task_ids': Tuliskan ID task sebelumnya yang harus selesai terlebih dahulu. Task sequence 1 tidak memiliki dependensi.
7. 'status': Setel task pertama (sequence 1) sebagai 'TODO' atau 'IN_PROGRESS', dan seluruh task berikutnya sebagai 'TODO'.

BAHASA & FORMAT:
- Gunakan Bahasa Indonesia teknis yang presisi, lugas, dan instruktif.
- Kembalikan HANYA JSON murni yang mematuhi skema tanpa markdown.`;

  const userPrompt = `Uraikan PRD dan Roadmap berikut menjadi daftar 6-10 atomic tasks berurutan:
PRD Problem: ${input.prd.problem_statement}
MVP Scope: ${input.prd.mvp_scope.join(', ')}

Fase Roadmap:
${input.roadmap.phases.map((p) => `- Fase ${p.order_index} [${p.layer}]: ${p.title} (Fitur: ${p.features.join(', ')})`).join('\n')}

Format JSON yang diwajibkan:
{
  "tasks": [
    {
      "id": "task-db-1",
      "sequence": 1,
      "title": "Judul Task Ringkas & Jelas",
      "description": "Deskripsi lingkup teknis task",
      "layer": "DATABASE" | "BACKEND" | "FRONTEND" | "DEVOPS" | "TESTING",
      "status": "TODO",
      "priority": "critical" | "high" | "medium" | "low",
      "estimated_complexity": "trivial" | "low" | "medium" | "high",
      "acceptance_criteria": [
        "Kriteria penerimaan 1",
        "Kriteria penerimaan 2"
      ],
      "ai_context": {
        "instructions": "Instruksi eksekusi langkah-demi-langkah bagi coding agent",
        "files_to_create": ["path/to/file1.ts"],
        "files_to_modify": ["path/to/existing.ts"],
        "test_criteria": "Perintah atau skenario verifikasi keberhasilan"
      },
      "depends_on_task_ids": []
    }
  ]
}`;

  try {
    const res = await ai.generateJSON({
      systemPrompt,
      userPrompt,
      schema: tasksResponseSchema,
      retries: 2,
    });
    return res.tasks as TaskItemData[];
  } catch (err: any) {
    console.error('generateTasksFromRoadmap error calling AI model:', err.message);
    throw new Error(`Gagal memanggil model AI untuk Tasks: ${err.message}`);
  }
}
