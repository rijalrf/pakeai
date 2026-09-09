import type { CheckpointType, CheckpointStatus, TaskLayer } from '@/lib/db/database.types';

export interface CheckpointRecord {
  id: string;
  projectId: string;
  type: CheckpointType;
  layer?: TaskLayer;
  status: CheckpointStatus;
  title: string;
  description: string;
  reviewChecklist: string[];
  reviewedAt?: string;
  reviewedBy?: string;
  feedback?: string;
}

export const INITIAL_CHECKPOINTS: CheckpointRecord[] = [
  {
    id: 'chk-prd-1',
    projectId: 'demo-futsal-project',
    type: 'prd_approval',
    status: 'approved',
    title: 'Checkpoint 1: Verifikasi Dokumen PRD',
    description: 'Human review terhadap spesifikasi teknis, MoSCoW features, dan non-goals sebelum pembuatan roadmap.',
    reviewChecklist: [
      'Problem statement jelas dan terdefinisi',
      'Fitur Must-Have tidak memuat scope creep',
      'Tech stack (Next.js, Supabase, Tailwind) telah dikonfirmasi',
    ],
    reviewedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    reviewedBy: 'Lead Architect',
  },
  {
    id: 'chk-roadmap-1',
    projectId: 'demo-futsal-project',
    type: 'roadmap_approval',
    status: 'approved',
    title: 'Checkpoint 2: Validasi Graf Ketergantungan Roadmap',
    description: 'Pengecekan tidak adanya circular dependency dan memastikan urutan Database -> Backend -> Frontend.',
    reviewChecklist: [
      'Semua layer memiliki fase terstruktur',
      'Tidak ada loop tertutup antar fase',
      'Fase Database mendahului Backend API',
    ],
    reviewedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    reviewedBy: 'Lead Architect',
  },
  {
    id: 'chk-layer-db',
    projectId: 'demo-futsal-project',
    type: 'layer_transition',
    layer: 'DATABASE',
    status: 'approved',
    title: 'Checkpoint 3: Transisi Layer Database ke Backend',
    description: 'Audit skema tabel profiles, venues, dan slots sebelum AI coding agent menulis Server Action dan endpoint.',
    reviewChecklist: [
      'Foreign key constraints dan unique indexes sudah terpasang',
      'Supabase Row Level Security (RLS) policies aktif',
      'Tipe data TypeScript sinkron dengan skema database',
    ],
    reviewedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    reviewedBy: 'Database Administrator',
  },
  {
    id: 'chk-layer-be',
    projectId: 'demo-futsal-project',
    type: 'layer_transition',
    layer: 'BACKEND',
    status: 'pending',
    title: 'Checkpoint 4: Transisi Layer Backend ke Frontend',
    description: 'Verifikasi stabilitas API reservasi slot, idempotency lock 15 menit, dan webhook pembayaran.',
    reviewChecklist: [
      'Simulasi double-booking dicegah oleh concurrency lock',
      'Signature webhook pembayaran terverifikasi aman',
      'Error response terstandarisasi',
    ],
  },
];

export function canAgentProceedToLayer(
  targetLayer: TaskLayer,
  checkpoints: CheckpointRecord[] = INITIAL_CHECKPOINTS
): { allowed: boolean; blockingCheckpoint?: CheckpointRecord } {
  // Jika target layer adalah FRONTEND, maka checkpoint layer BACKEND harus approved
  if (targetLayer === 'FRONTEND') {
    const beCheckpoint = checkpoints.find(
      (c) => c.layer === 'BACKEND' && c.type === 'layer_transition'
    );
    if (beCheckpoint && beCheckpoint.status !== 'approved') {
      return { allowed: false, blockingCheckpoint: beCheckpoint };
    }
  }

  // Jika target layer adalah BACKEND, maka checkpoint layer DATABASE harus approved
  if (targetLayer === 'BACKEND') {
    const dbCheckpoint = checkpoints.find(
      (c) => c.layer === 'DATABASE' && c.type === 'layer_transition'
    );
    if (dbCheckpoint && dbCheckpoint.status !== 'approved') {
      return { allowed: false, blockingCheckpoint: dbCheckpoint };
    }
  }

  return { allowed: true };
}
