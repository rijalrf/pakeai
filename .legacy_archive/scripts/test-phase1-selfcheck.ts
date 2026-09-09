import assert from 'assert';
import { calculateEstimatedCost } from '../lib/ai/cost-tracker';
import { hashPassword, verifyPassword } from '../lib/auth/session';
import { reviewRoadmap, reviewTasks, reviewPRD } from '../lib/ai/reviewer';
import type { RoadmapDocument } from '../lib/ai/roadmap';
import type { TaskItemData } from '../lib/ai/tasks';
import type { PRDDocument } from '../lib/ai/prd';

async function runSelfCheck() {
  console.log('Memulai self-check Phase 1...');

  // 1. Uji Kalkulator Biaya AI
  const costOpenAI = calculateEstimatedCost('gpt-4o', 1000, 1000);
  assert.strictEqual(costOpenAI, 0.02, 'gpt-4o 1k/1k harus $0.020000');

  const costClaude = calculateEstimatedCost('claude-3-5-sonnet', 1000, 1000);
  assert.strictEqual(costClaude, 0.018, 'claude-3-5-sonnet 1k/1k harus $0.018000');

  const costLocal = calculateEstimatedCost('ai-builder', 5000, 5000);
  assert.strictEqual(costLocal, 0, 'ai-builder local model harus $0');
  console.log('Test 1: Kalkulasi biaya AI valid.');

  // 2. Uji Hashing & Verifikasi Password
  const pwd = 'rahasiaPassword123';
  const hashed = await hashPassword(pwd);
  assert.notStrictEqual(hashed, pwd, 'Password harus di-hash');
  const isMatch = await verifyPassword(pwd, hashed);
  assert.strictEqual(isMatch, true, 'Verifikasi password harus berhasil');
  const isWrongMatch = await verifyPassword('wrongpassword', hashed);
  assert.strictEqual(isWrongMatch, false, 'Password salah harus ditolak');
  console.log('Test 2: Autentikasi bcrypt password valid.');

  // 3. Uji Deteksi Siklus DAG Roadmap
  const cyclicRoadmap: RoadmapDocument = {
    phases: [
      {
        id: 'p-1',
        title: 'Fase 1',
        description: 'Test 1',
        layer: 'DATABASE',
        status: 'pending',
        order_index: 1,
        depends_on_phase_ids: ['p-2'], // Siklus ke p-2
        features: ['Fitur A'],
        estimated_duration: '1 minggu',
      },
      {
        id: 'p-2',
        title: 'Fase 2',
        description: 'Test 2',
        layer: 'BACKEND',
        status: 'pending',
        order_index: 2,
        depends_on_phase_ids: ['p-1'], // Siklus kembali ke p-1
        features: ['Fitur B'],
        estimated_duration: '1 minggu',
      },
    ],
  };

  const dummyPrd: PRDDocument = {
    problem_statement: 'Test problem statement.',
    target_users: ['User A'],
    value_proposition: 'Test value',
    mvp_scope: ['Scope A'],
    non_goals: ['Non-goal A'],
    features: [
      {
        id: 'f-1',
        title: 'Fitur 1',
        description: 'Desc',
        priority: 'must',
        category: 'DATABASE',
        acceptance_criteria: ['AC 1'],
        estimated_complexity: 'low',
      },
      {
        id: 'f-2',
        title: 'Fitur 2',
        description: 'Desc',
        priority: 'should',
        category: 'BACKEND',
        acceptance_criteria: ['AC 2'],
        estimated_complexity: 'medium',
      },
      {
        id: 'f-3',
        title: 'Fitur 3',
        description: 'Desc',
        priority: 'could',
        category: 'FRONTEND',
        acceptance_criteria: ['AC 3'],
        estimated_complexity: 'low',
      },
    ],
    technical_requirements: {
      frontend: 'Next.js',
      backend: 'Node.js',
      database: 'PostgreSQL',
      architecture_notes: 'Modular',
    },
  };

  const roadmapReview = await reviewRoadmap(cyclicRoadmap, dummyPrd);
  const cycleIssue = roadmapReview.issues.find((i) => i.category === 'dependency');
  assert.ok(cycleIssue, 'Harus mendeteksi dependensi sirkular');
  console.log('Test 3: Deteksi dependensi sirkular roadmap valid.');

  // 4. Uji Bounded Context Reviewer
  const unsafeTasks: TaskItemData[] = [
    {
      id: 'task-1',
      sequence: 1,
      title: 'Ubah file konfigurasi root',
      description: 'Deskripsi task',
      layer: 'BACKEND',
      status: 'TODO',
      priority: 'high',
      estimated_complexity: 'medium',
      acceptance_criteria: ['AC 1'],
      ai_context: {
        instructions: 'Modifikasi env dan migrations',
        files_to_create: ['.env.local'],
        files_to_modify: ['supabase/migrations/00001_initial.sql'],
        test_criteria: 'Test',
      },
    },
  ];

  const tasksReview = await reviewTasks(unsafeTasks, cyclicRoadmap);
  const bcIssue = tasksReview.issues.find((i) => i.category === 'bounded_context');
  assert.ok(bcIssue, 'Harus mendeteksi pelanggaran bounded context file terproteksi');
  console.log('Test 4: Perlindungan bounded context task valid.');

  // 5. Uji PRD Rule-based Reviewer
  const invalidPrd: PRDDocument = {
    ...dummyPrd,
    features: [
      {
        id: 'f-1',
        title: 'Hanya satu fitur',
        description: 'Kurang dari 3 fitur',
        priority: 'should', // Tidak ada must
        category: 'BACKEND',
        acceptance_criteria: ['AC 1'],
        estimated_complexity: 'low',
      },
    ],
  };

  const prdReview = await reviewPRD(invalidPrd, {
    idea: 'Test',
    projectType: 'Web',
    stacks: [],
  });
  const completenessIssue = prdReview.issues.find((i) => i.category === 'completeness');
  assert.ok(completenessIssue, 'Harus mendeteksi fitur MVP kurang dari 3 dan tidak ada prioritas must');
  console.log('Test 5: Validasi rule-based PRD reviewer valid.');

  console.log('Seluruh 5 self-check logic Phase 1 berhasil tanpa galat.');
}

runSelfCheck().catch((err) => {
  console.error('Self-check gagal:', err);
  process.exit(1);
});
