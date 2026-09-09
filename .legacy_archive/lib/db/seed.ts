import { pool } from './postgres';
import { hashToken } from '../agent/token';
import { INITIAL_TASKS } from '../ai/tasks';
import { FALLBACK_PRD } from '../ai/prd';
import { FALLBACK_ROADMAP } from '../ai/roadmap';
import { INITIAL_CHECKPOINTS } from '../agent/checkpoints';

export async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('Seeding PostgreSQL database: project_ai_planner...');

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
    const stacks = [
      { category: 'frontend', technology: 'Next.js 16 (App Router)' },
      { category: 'backend', technology: 'Server Actions & API Routes' },
      { category: 'database', technology: 'PostgreSQL (Localhost)' },
      { category: 'devops', technology: 'Docker & Turbopack' },
    ];
    for (const stack of stacks) {
      await client.query(
        `INSERT INTO project_stacks (project_id, category, technology)
         VALUES ($1, $2, $3)`,
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
    for (const task of INITIAL_TASKS) {
      await client.query(
        `INSERT INTO tasks (
          project_id, title, description, layer, status, priority, sequence,
          acceptance_criteria, estimated_complexity, ai_context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          projectId,
          task.title,
          task.description,
          task.layer,
          task.status,
          task.priority,
          task.sequence,
          JSON.stringify(task.acceptance_criteria),
          task.estimated_complexity,
          JSON.stringify(task.ai_context),
        ]
      );
    }

    // 6. Checkpoints
    for (const chk of INITIAL_CHECKPOINTS) {
      await client.query(
        `INSERT INTO project_checkpoints (project_id, type, status, message, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          projectId,
          chk.type,
          chk.status,
          chk.title,
          JSON.stringify({
            description: chk.description,
            checklist: chk.reviewChecklist,
            layer: chk.layer,
          }),
        ]
      );
    }

    console.log('Database project_ai_planner berhasil di-seed dengan data awal!');
  } finally {
    client.release();
  }
}
