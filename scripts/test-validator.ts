import assert from 'node:assert';
import { validateApiCoverage } from '../apps/api/src/lib/ai/api-coverage-validator.js';
import type { TaskGen } from '../apps/api/src/lib/ai/tasks.js';

console.log('--- Testing ApiCoverageValidator ---');

// 1. Kasus Terlewat (Mirip Masalah Studido)
const tasksWithoutConsumer: TaskGen[] = [
  {
    taskId: 'TASK-004',
    title: 'API Workspace dan Member',
    layer: 'BACKEND',
    featureId: 'feat-workspace',
    order: 4,
    requirement_ids: ['FR-002'],
    depends_on: ['TASK-003'],
    files_to_create: ['apps/api/src/routes/workspace.ts'],
    files_to_modify: [],
    files_readonly: [],
    forbidden: ['apps/web/**'],
    implementation_steps: ['Buat route POST /api/workspaces/:id/members'],
    acceptanceCriteria: ['Endpoint POST /api/workspaces/:id/members merespons 201'],
    validation_commands: ['npm run typecheck'],
    definition_of_done: ['Selesai'],
    out_of_scope: [],
    apiContracts: [
      {
        method: 'POST',
        path: '/api/workspaces/:id/members',
        description: 'Undang anggota workspace',
      },
    ],
  },
  {
    taskId: 'TASK-008',
    title: 'Halaman Workspace',
    layer: 'FRONTEND',
    featureId: 'feat-workspace',
    order: 8,
    requirement_ids: ['FR-002'],
    depends_on: ['TASK-007'],
    files_to_create: ['apps/web/src/pages/Workspace.tsx', 'apps/web/src/components/CreateWorkspaceDialog.tsx'],
    files_to_modify: [],
    files_readonly: [],
    forbidden: ['apps/api/**'],
    implementation_steps: ['Buat halaman workspace dan modal buat workspace'],
    acceptanceCriteria: ['Halaman tampil dinamis'],
    validation_commands: ['npm run typecheck'],
    definition_of_done: ['Selesai'],
    out_of_scope: [],
    apiContracts: [],
  },
];

const resultUncovered = validateApiCoverage(tasksWithoutConsumer, [
  { method: 'POST', path: '/api/workspaces/:id/members', description: 'Undang anggota' },
]);
assert.strictEqual(resultUncovered.uncovered.length, 1, 'Harus mendeteksi 1 endpoint uncovered');
assert.strictEqual(resultUncovered.uncovered[0].path, '/api/workspaces/:id/members');
console.log('✓ Kasus uncovered berhasil dideteksi.');

// 2. Kasus Ter-cover via consumesApis eksplisit
const tasksWithExplicitConsumer: TaskGen[] = [
  ...tasksWithoutConsumer,
  {
    taskId: 'TASK-009',
    title: 'Modal Undang Anggota',
    layer: 'FRONTEND',
    featureId: 'feat-workspace',
    order: 9,
    requirement_ids: ['FR-002'],
    depends_on: ['TASK-008'],
    files_to_create: ['apps/web/src/components/InviteMemberDialog.tsx'],
    files_to_modify: [],
    files_readonly: [],
    forbidden: ['apps/api/**'],
    implementation_steps: ['Panggil API undang anggota'],
    acceptanceCriteria: ['Modal memanggil POST /api/workspaces/:id/members'],
    validation_commands: ['npm run typecheck'],
    definition_of_done: ['Selesai'],
    out_of_scope: [],
    apiContracts: [],
    consumesApis: [
      {
        method: 'POST',
        path: '/api/workspaces/:workspaceId/members',
        description: 'Panggil endpoint undang anggota',
      },
    ],
  },
];

const resultCovered = validateApiCoverage(tasksWithExplicitConsumer, [
  { method: 'POST', path: '/api/workspaces/:id/members', description: 'Undang anggota' },
]);
assert.strictEqual(resultCovered.uncovered.length, 0, 'Harus 0 uncovered karena path normalization dan consumesApis cocok');
console.log('✓ Kasus covered via consumesApis (dengan beda nama param :id vs :workspaceId) berhasil diverifikasi.');

// 3. Kasus Ter-cover via fallback string match di steps
const tasksWithFallbackConsumer: TaskGen[] = [
  tasksWithoutConsumer[0],
  {
    ...tasksWithoutConsumer[1],
    implementation_steps: [
      'Gunakan modal InviteMemberDialog untuk memanggil endpoint POST /api/workspaces/:id/members',
    ],
  },
];

const resultFallback = validateApiCoverage(tasksWithFallbackConsumer, [
  { method: 'POST', path: '/api/workspaces/:id/members', description: 'Undang anggota' },
]);
assert.strictEqual(resultFallback.uncovered.length, 0, 'Harus 0 uncovered karena string match fallback berhasil');
console.log('✓ Kasus covered via fallback string-match berhasil.');

console.log('--- Seluruh unit test ApiCoverageValidator lolos! ---');
