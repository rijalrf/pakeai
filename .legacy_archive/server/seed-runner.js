const { Pool } = require('pg');
const crypto = require('crypto');

const connectionString = 'postgresql://postgres:admin123@localhost:5432/project_ai_planner';
const pool = new Pool({ connectionString });

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('Seeding PostgreSQL database project_ai_planner at localhost:5432...');

    // 1. Profile
    const userId = '00000000-0000-0000-0000-000000000001';
    await client.query(
      `INSERT INTO profiles (id, full_name, avatar_url, skill_level, goals, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [userId, 'Rijal', null, 'advanced', ['build_mvp', 'ai_automation'], true]
    );

    // 2. Project
    const projectId = '00000000-0000-0000-0000-000000000002';
    await client.query(
      `INSERT INTO projects (id, user_id, name, description, idea, project_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [
        projectId,
        userId,
        'Aplikasi Booking Lapangan Futsal',
        'Platform reservasi lapangan olahraga real-time dengan hold slot 15 menit dan QRIS.',
        'Sistem pemesanan lapangan olahraga dengan kalender interaktif dan auto-expire checkout.',
        'fullstack_saas',
        'tasks',
      ]
    );

    // 3. Stacks
    await client.query(`DELETE FROM project_stacks WHERE project_id = $1`, [projectId]);
    const stacks = [
      { category: 'frontend', technology: 'Next.js 16 (App Router)' },
      { category: 'backend', technology: 'Node.js & Express / REST API' },
      { category: 'database', technology: 'PostgreSQL (Localhost)' },
      { category: 'devops', technology: 'Docker & Turbopack' },
    ];
    for (const stack of stacks) {
      await client.query(
        `INSERT INTO project_stacks (project_id, category, technology) VALUES ($1, $2, $3)`,
        [projectId, stack.category, stack.technology]
      );
    }

    // 4. Agent Token
    const plainToken = 'pak_dev_demo_token_1234567890abcdef';
    const tokenHash = hashToken(plainToken);
    await client.query(
      `INSERT INTO agent_tokens (user_id, name, token_hash, token_prefix, is_revoked)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (token_hash) DO NOTHING`,
      [userId, 'Terminal CLI Local Token', tokenHash, 'pak_dev_de', false]
    );

    // 5. Tasks
    await client.query(`DELETE FROM tasks WHERE project_id = $1`, [projectId]);
    const tasks = [
      {
        title: 'Buat Skema Tabel Profiles dan Authentication Constraints',
        description: 'Menyiapkan tabel profiles dan relasi auth.',
        layer: 'DATABASE',
        status: 'DONE',
        priority: 'high',
        sequence: 1,
        complexity: 'low',
        criteria: ['Kolom id, full_name, skill_level', 'RLS policies'],
        aiContext: {
          instructions: 'Buat migrasi skema tabel profiles di PostgreSQL.',
          files_to_create: ['supabase/migrations/00001_profiles.sql'],
          files_to_modify: ['lib/db/database.types.ts'],
          test_criteria: 'Verifikasi insert ke profiles berhasil.',
        },
      },
      {
        title: 'Buat Skema Venues, Courts, dan Booking Slots',
        description: 'Relasi data lapangan olahraga dan status ketersediaan.',
        layer: 'DATABASE',
        status: 'DONE',
        priority: 'critical',
        sequence: 2,
        complexity: 'medium',
        criteria: ['Foreign key venues -> courts -> slots', 'Unique constraint (court_id, slot_date, start_time)'],
        aiContext: {
          instructions: 'Tulis skema PostgreSQL untuk entitas venue dan slot waktu booking.',
          files_to_create: ['supabase/migrations/00002_courts.sql'],
          files_to_modify: ['lib/db/database.types.ts'],
          test_criteria: 'Tidak boleh ada duplikasi slot waktu di court yang sama.',
        },
      },
      {
        title: 'Implementasi Booking Hold Engine dengan Concurrency Lock',
        description: 'Server Action untuk menahan slot selama 15 menit dengan lock transaction.',
        layer: 'BACKEND',
        status: 'IN_PROGRESS',
        priority: 'critical',
        sequence: 3,
        complexity: 'high',
        criteria: ['Menolak hold jika status slot sudah HELD/BOOKED', 'Reservation token 15 menit'],
        aiContext: {
          instructions: 'Buat handler Server Action untuk menahan slot booking secara atomik.',
          files_to_create: ['lib/booking/hold-engine.ts', 'app/api/bookings/hold/route.ts'],
          files_to_modify: ['lib/db/database.types.ts'],
          test_criteria: 'Uji simulasi 2 request bersamaan pada 1 slot.',
        },
      },
      {
        title: 'Integrasi Webhook Pembayaran QRIS / Midtrans',
        description: 'Endpoint penerima notifikasi sukses pembayaran.',
        layer: 'BACKEND',
        status: 'TODO',
        priority: 'high',
        sequence: 4,
        complexity: 'medium',
        criteria: ['Verifikasi signature hash', 'Atomic update status booking'],
        aiContext: {
          instructions: 'Bangun route handler /api/payments/webhook.',
          files_to_create: ['app/api/payments/webhook/route.ts'],
          files_to_modify: ['lib/booking/hold-engine.ts'],
          test_criteria: 'Kirim payload webhook dan pastikan status slot berubah.',
        },
      },
      {
        title: 'Komponen Kalender Slot Interaktif Pemain',
        description: 'Grid visual jam 08:00 - 23:00 dengan warna status.',
        layer: 'FRONTEND',
        status: 'TODO',
        priority: 'high',
        sequence: 5,
        complexity: 'medium',
        criteria: ['Pemilih tanggal responsif', 'Slot card interaktif'],
        aiContext: {
          instructions: 'Buat komponen SlotGrid.tsx dan DateSelector.tsx.',
          files_to_create: ['components/booking/slot-grid.tsx'],
          files_to_modify: ['app/booking/page.tsx'],
          test_criteria: 'Komponen merender 15 slot jam secara benar.',
        },
      },
    ];

    for (const t of tasks) {
      await client.query(
        `INSERT INTO tasks (
          project_id, title, description, layer, status, priority, sequence,
          acceptance_criteria, estimated_complexity, ai_context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          projectId,
          t.title,
          t.description,
          t.layer,
          t.status,
          t.priority,
          t.sequence,
          JSON.stringify(t.criteria),
          t.complexity,
          JSON.stringify(t.aiContext),
        ]
      );
    }

    // 6. Checkpoints
    await client.query(`DELETE FROM project_checkpoints WHERE project_id = $1`, [projectId]);
    const checkpoints = [
      {
        type: 'layer_transition',
        status: 'approved',
        message: 'Checkpoint 1: Transisi Layer Database ke Backend Disetujui',
        metadata: { layer: 'DATABASE', approved: true },
      },
      {
        type: 'layer_transition',
        status: 'pending',
        message: 'Checkpoint 2: Transisi Layer Backend ke Frontend',
        metadata: { layer: 'BACKEND', approved: false },
      },
    ];

    for (const chk of checkpoints) {
      await client.query(
        `INSERT INTO project_checkpoints (project_id, type, status, message, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [projectId, chk.type, chk.status, chk.message, JSON.stringify(chk.metadata)]
      );
    }

    console.log('✓ PostgreSQL project_ai_planner seeded successfully with Rijal user, demo project, tasks, and PAT token!');
  } finally {
    client.release();
    pool.end();
  }
}

runSeed().catch((e) => {
  console.error('Seed Error:', e);
  process.exit(1);
});
