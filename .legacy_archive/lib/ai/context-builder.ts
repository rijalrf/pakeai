import type { TaskItemData } from './tasks';

export interface BoundedContextPayload {
  task: {
    id: string;
    sequence: number;
    title: string;
    layer: string;
    priority: string;
    complexity: string;
  };
  isolationBoundary: {
    allowedFilesToTouch: string[];
    forbiddenFilesPatterns: string[];
    readOnlyReferenceFiles: string[];
  };
  prerequisitesSummary: string[];
  directInstructions: string;
  acceptanceCriteria: string[];
  testVerificationSteps: string[];
}

/**
 * Menghasilkan bounded context ketat untuk AI Coding Agent.
 * Membatasi agar AI LLM tidak membaca atau mengedit file di luar kewenangannya.
 */
export function buildBoundedContextPayload(
  task: TaskItemData,
  completedPriorTasks: TaskItemData[] = []
): BoundedContextPayload {
  const allowedFiles = [
    ...task.ai_context.files_to_create,
    ...task.ai_context.files_to_modify,
  ];

  const prerequisites = completedPriorTasks
    .filter((t) => (task.depends_on_task_ids || []).includes(t.id))
    .map((t) => `Task #${t.id.toUpperCase()}: ${t.title} [SELESAI]`);

  return {
    task: {
      id: task.id,
      sequence: task.sequence,
      title: task.title,
      layer: task.layer,
      priority: task.priority,
      complexity: task.estimated_complexity || 'medium',
    },
    isolationBoundary: {
      allowedFilesToTouch: allowedFiles,
      forbiddenFilesPatterns: [
        '**/prisma/**',
        '**/migrations/**',
        '**/.env*',
        '**/auth.config.*',
        'app/api/agent/**',
      ],
      readOnlyReferenceFiles: [
        'lib/db/database.types.ts',
        'lib/utils.ts',
      ],
    },
    prerequisitesSummary: prerequisites.length > 0
      ? prerequisites
      : ['Tidak ada dependensi langsung yang belum selesai.'],
    directInstructions: task.ai_context.instructions,
    acceptanceCriteria: task.acceptance_criteria,
    testVerificationSteps: [
      task.ai_context.test_criteria,
      'Jalankan TypeScript compile check untuk memastikan tidak ada error tipe.',
      'Pastikan tidak ada unused imports atau console.log yang tertinggal.',
    ],
  };
}
