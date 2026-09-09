import { z } from 'zod';
import { getAIService } from './ai-service';
import type { PRDDocument } from './prd';

export const roadmapPhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  order_index: z.number(),
  layer: z.enum(['DATABASE', 'BACKEND', 'FRONTEND', 'DEVOPS', 'MIXED']),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  estimated_duration: z.string().optional(),
  features: z.array(z.string()),
  depends_on_phase_ids: z.array(z.string()).default([]),
});

export const roadmapDocumentSchema = z.object({
  phases: z.array(roadmapPhaseSchema),
});

export type RoadmapPhase = z.infer<typeof roadmapPhaseSchema>;
export type RoadmapDocument = z.infer<typeof roadmapDocumentSchema>;

export const FALLBACK_ROADMAP: RoadmapDocument = {
  phases: [
    {
      id: 'phase-1',
      title: 'Fase 1: Database Schema & Relational Models',
      description: 'Fondasi skema PostgreSQL untuk venue, lapangan, slot waktu 1 jam, dan status ketersediaan.',
      order_index: 1,
      layer: 'DATABASE',
      status: 'completed',
      estimated_duration: '2 hari',
      features: [
        'Skema Tabel Venues, Courts, dan Slots',
        'Constraint Unik Anti-Dobel Booking',
        'Index Relasional & Migration Script',
      ],
      depends_on_phase_ids: [],
    },
    {
      id: 'phase-2',
      title: 'Fase 2: Booking Engine & Concurrency Lock',
      description: 'Business logic penahanan slot (hold 15 menit), validasi pembayaran, dan webhook handler.',
      order_index: 2,
      layer: 'BACKEND',
      status: 'in_progress',
      estimated_duration: '3 hari',
      features: [
        'API Reservasi Sementara dengan TTL 15 Menit',
        'Integrasi Webhook QRIS / Payment Gateway',
        'Edge Function Pemulihan Slot Kadaluarsa',
      ],
      depends_on_phase_ids: ['phase-1'],
    },
    {
      id: 'phase-3',
      title: 'Fase 3: Public Booking UI & Slot Picker',
      description: 'Antarmuka web responsif untuk pemain mencari venue, memilih jam kosong, dan checkout.',
      order_index: 3,
      layer: 'FRONTEND',
      status: 'pending',
      estimated_duration: '4 hari',
      features: [
        'Kalender Jadwal Interaktif Jam 08:00 - 23:00',
        'Indikator Warna Ketersediaan (Kosong/Hold/Booked)',
        'Halaman Checkout & Tampilan QRIS Dinamis',
      ],
      depends_on_phase_ids: ['phase-2'],
    },
    {
      id: 'phase-4',
      title: 'Fase 4: Operator Dashboard & Management',
      description: 'Panel pengelola venue untuk monitor booking harian dan rekap omset venue.',
      order_index: 4,
      layer: 'FRONTEND',
      status: 'pending',
      estimated_duration: '3 hari',
      features: [
        'Dashboard Monitoring Reservasi Real-Time',
        'Fitur Manual Block Slot untuk Maintenance',
        'Laporan Rekapitulasi Pendapatan Harian',
      ],
      depends_on_phase_ids: ['phase-3'],
    },
  ],
};

export async function generateRoadmapFromPRD(prd: PRDDocument): Promise<RoadmapDocument> {
  const ai = getAIService();

  const systemPrompt = `Anda adalah Enterprise Solutions & Systems Architect elit dengan spesialisasi Dependency Graph Engineering dan Directed Acyclic Graph (DAG) arsitektur software.

TUGAS UTAMA:
Mengurai seluruh fitur dari dokumen PRD menjadi rangkaian fase arsitektur bertingkat (Phased Roadmap) yang terorganisasi dan memiliki rantai ketergantungan yang valid tanpa dependensi sirkular (circular dependency).

HUKUM ARSITEKTUR & URUTAN LAYER WAJIB:
1. LAYER 1 - DATABASE (order_index: 1):
   - Wajib menjadi fondasi pertama. Tidak boleh bergantung pada fase manapun.
   - Bertanggung jawab atas skema DDL, tabel relasional, constraint integritas, indeks performa, dan migrasi SQL.
2. LAYER 2 - BACKEND (order_index: 2):
   - Bergantung pada fase DATABASE (depends_on_phase_ids: ['phase-1']).
   - Bertanggung jawab atas Server Actions, API Route Handlers, enkripsi/hashing token, webhook payment gateway, dan lock transaksi.
3. LAYER 3 - FRONTEND (order_index: 3):
   - Bergantung pada fase BACKEND (depends_on_phase_ids: ['phase-2']).
   - Bertanggung jawab atas antarmuka visual pengguna, form interaktif, status polling/real-time, dan integrasi UI design system.
4. LAYER 4 - DEVOPS / OPERATIONAL (order_index: 4, opsional jika ada di PRD):
   - Bergantung pada fase FRONTEND dan/atau BACKEND.
   - Bertanggung jawab atas pipeline build, verifikasi container, health check monitoring, dan migrasi produksi.

ATURAN STRUKTURAL:
- Setiap fase harus memuat daftar fitur spesifik yang dialokasikan dari PRD ('features': array of string).
- Estimasi durasi ('estimated_duration') harus realistis (misal: '2-3 Hari', '1 Minggu').
- Kembalikan HANYA JSON murni yang mematuhi skema tanpa pembungkus markdown apapun.`;

  const userPrompt = `Rancang Roadmap Graf Arsitektur berdasarkan PRD berikut:
- Problem: ${prd.problem_statement}
- MVP Scope: ${prd.mvp_scope.join(', ')}
- Rincian Fitur PRD:
${prd.features.map((f) => `- [${f.category}] ${f.title} (${f.priority.toUpperCase()}) - ${f.description}`).join('\n')}

Format Dokumen Roadmap JSON:
{
  "phases": [
    {
      "id": "phase-1",
      "title": "Nama Fase Arsitektur",
      "description": "Tujuan dan deliverable fase ini",
      "order_index": 1,
      "layer": "DATABASE" | "BACKEND" | "FRONTEND" | "DEVOPS",
      "status": "pending",
      "estimated_duration": "1-2 Hari",
      "features": ["Nama Fitur Terkait 1", "Nama Fitur Terkait 2"],
      "depends_on_phase_ids": []
    }
  ]
}`;

  try {
    const res = await ai.generateJSON({
      systemPrompt,
      userPrompt,
      schema: roadmapDocumentSchema,
      retries: 2,
    });
    return res;
  } catch (err: any) {
    console.error('generateRoadmapFromPRD error calling AI model:', err.message);
    throw new Error(`Gagal memanggil model AI untuk Roadmap: ${err.message}`);
  }
}
