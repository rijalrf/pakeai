// Essential Files Validator & Auto-Injector: Menjamin file fundamental tidak terlewat dari daftar task
import type { TaskGen } from './tasks.js';
import type { StackContract } from './stack-contract.js';

export interface EssentialValidationResult {
  valid: boolean;
  missing: string[];
}

export function validateEssentialFiles(tasks: TaskGen[], stack: StackContract): EssentialValidationResult {
  const allCreated = new Set<string>();
  for (const t of tasks) {
    for (const f of t.files_to_create || []) {
      allCreated.add(f.replace(/^\.\//, ''));
    }
  }

  const missing: string[] = [];

  // 1. Root & Bootstrap files
  const requiredBootstrap = ['.env.example', '.env', '.gitignore', 'package.json'];
  for (const f of requiredBootstrap) {
    if (!allCreated.has(f)) missing.push(f);
  }

  // 2. Frontend core entry files
  const isVue = stack.frontend.framework.toLowerCase().includes('vue');
  const feEntryFiles = isVue
    ? ['apps/web/index.html', 'apps/web/src/main.ts']
    : ['apps/web/index.html', 'apps/web/src/main.tsx'];

  for (const f of feEntryFiles) {
    if (!allCreated.has(f)) missing.push(f);
  }

  // 3. Styling files (jika Tailwind)
  if (stack.styling.toLowerCase().includes('tailwind')) {
    if (!allCreated.has('apps/web/tailwind.config.js') && !allCreated.has('apps/web/tailwind.config.ts')) {
      missing.push('apps/web/tailwind.config.js');
    }
    if (!allCreated.has('apps/web/postcss.config.js') && !allCreated.has('apps/web/postcss.config.cjs')) {
      missing.push('apps/web/postcss.config.js');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function autoInjectEssentialFiles(tasks: TaskGen[], stack: StackContract, missing: string[]): TaskGen[] {
  if (missing.length === 0 || tasks.length === 0) return tasks;

  const updatedTasks = [...tasks];

  const bootstrapFiles = missing.filter((f) => !f.startsWith('apps/web'));
  const frontendFiles = missing.filter((f) => f.startsWith('apps/web'));

  // 1. Inject ke task BOOTSTRAP (biasanya order: 1)
  if (bootstrapFiles.length > 0) {
    const bootstrapTask = updatedTasks.find((t) => t.layer === 'BOOTSTRAP') || updatedTasks[0];
    const newFiles = Array.from(new Set([...(bootstrapTask.files_to_create || []), ...bootstrapFiles]));
    bootstrapTask.files_to_create = newFiles;
    bootstrapTask.implementation_steps = [
      ...(bootstrapTask.implementation_steps || []),
      `Pastikan file konfigurasi environment dan repository terbuat: ${bootstrapFiles.join(', ')}`,
    ];
  }

  // 2. Inject ke task FRONTEND pertama
  if (frontendFiles.length > 0) {
    const frontendTask = updatedTasks.find((t) => t.layer === 'FRONTEND') || updatedTasks[0];
    const newFiles = Array.from(new Set([...(frontendTask.files_to_create || []), ...frontendFiles]));
    frontendTask.files_to_create = newFiles;
    frontendTask.implementation_steps = [
      ...(frontendTask.implementation_steps || []),
      `Pastikan entrypoint dan konfigurasi styling aplikasi web terbuat: ${frontendFiles.join(', ')}`,
    ];
  }

  return updatedTasks;
}
