// Cleanup Validator post-task generation (Framework Vibe Coding Tahap 6: Cleanup/Refactoring).
// Pemeriksaan heuristik non-AI untuk mendeteksi duplikasi pembuatan file, task berukuran terlalu besar (oversized),
// atau task tanpa validation commands. Zero external cost & instan.

import type { TaskGen } from './tasks.js';

export interface CleanupValidationResult {
  warnings: string[];
  duplicateFiles: Array<{ file: string; taskIds: string[] }>;
  oversizedTasks: Array<{ taskId: string; title: string; fileCount: number }>;
}

/**
 * Validasi kebersihan struktur task sebelum disimpan ke database.
 */
export function validateCleanup(tasks: TaskGen[]): CleanupValidationResult {
  const warnings: string[] = [];
  const fileCreationMap = new Map<string, string[]>(); // filePath -> taskId[]
  const oversizedTasks: Array<{ taskId: string; title: string; fileCount: number }> = [];

  for (const task of tasks) {
    const taskId = task.taskId || `order-${task.order}`;
    const filesToCreate = task.files_to_create || [];

    // 1. Deteksi task oversized (>5 files_to_create)
    if (filesToCreate.length > 5) {
      oversizedTasks.push({
        taskId,
        title: task.title,
        fileCount: filesToCreate.length,
      });
      warnings.push(
        `Task [${taskId}] "${task.title}" membuat ${filesToCreate.length} file (rekomendasi: maksimal 5 file per atomic task).`
      );
    }

    // 2. Petakan pembuatan file untuk deteksi konflik duplikasi antar task
    for (const rawPath of filesToCreate) {
      const normalizedPath = rawPath.trim().replace(/\/+/g, '/').toLowerCase();
      if (!normalizedPath) continue;

      const existing = fileCreationMap.get(normalizedPath) ?? [];
      existing.push(taskId);
      fileCreationMap.set(normalizedPath, existing);
    }

    // 3. Deteksi task tanpa validation commands
    if (!task.validation_commands || task.validation_commands.length === 0) {
      warnings.push(`Task [${taskId}] "${task.title}" tidak memiliki validation_commands otomatis.`);
    }
  }

  // Cari file yang dibuat oleh lebih dari 1 task
  const duplicateFiles: Array<{ file: string; taskIds: string[] }> = [];
  for (const [file, taskIds] of fileCreationMap.entries()) {
    if (taskIds.length > 1) {
      duplicateFiles.push({ file, taskIds });
      warnings.push(
        `File "${file}" didaftarkan di 'files_to_create' oleh beberapa task: ${taskIds.join(', ')}. Pastikan hanya 1 task yang membuat dan task lain mencantumkannya di 'files_to_modify'.`
      );
    }
  }

  return {
    warnings,
    duplicateFiles,
    oversizedTasks,
  };
}
