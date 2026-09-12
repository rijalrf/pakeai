// Essential Files Validator & Auto-Injector: Menjamin file fundamental tidak terlewat dari daftar task
import type { TaskGen } from './tasks.js';
import type { StackContract } from './stack-contract.js';

export interface EssentialValidationResult {
  valid: boolean;
  missing: string[];
}

function entryFilesFor(stack: StackContract): string[] {
  const fw = stack.frontend.framework.toLowerCase();
  if (fw.includes('next')) {
    // Next.js App Router tidak pakai index.html / main.tsx — entry-nya layout.tsx & page.tsx
    return ['apps/web/src/app/layout.tsx', 'apps/web/src/app/page.tsx'];
  }
  if (fw.includes('vue') || fw.includes('svelte')) {
    return ['apps/web/index.html', 'apps/web/src/main.ts'];
  }
  return ['apps/web/index.html', 'apps/web/src/main.tsx'];
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

  // 2. Frontend core entry files (mengikuti framework kontrak)
  for (const f of entryFilesFor(stack)) {
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

// Task sintetis saat layer target tidak ada sama sekali di hasil AI
// ponytail: judul/AC generik; perkaya kontennya saat ada kebutuhan layer lain
function syntheticTask(layer: 'BOOTSTRAP' | 'FRONTEND', files: string[], order: number): TaskGen {
  return {
    title: layer === 'BOOTSTRAP' ? 'Bootstrap: File Konfigurasi Esensial' : 'Frontend: Entrypoint & Styling Esensial',
    description: 'Task sintetis hasil auto-injection karena file esensial tidak tercakup task manapun.',
    layer,
    featureId: 'auto-essential',
    order,
    requirement_ids: [],
    depends_on: [],
    files_to_create: files,
    files_to_modify: [],
    files_readonly: [],
    forbidden: [],
    implementation_steps: [`Buat file-file berikut sesuai konvensi framework: ${files.join(', ')}`],
    acceptanceCriteria: [`Semua file berikut ada di disk dan valid: ${files.join(', ')}`],
    validation_commands: ['npm run build'],
    definition_of_done: ['File esensial terbuat', 'Build lolos'],
    out_of_scope: [],
    apiContracts: [],
    consumesApis: [],
  };
}

export function autoInjectEssentialFiles(tasks: TaskGen[], stack: StackContract, missing: string[]): TaskGen[] {
  if (missing.length === 0 || tasks.length === 0) return tasks;

  const updatedTasks = [...tasks];
  const minOrder = Math.min(...updatedTasks.map((t) => t.order));

  // 1. Inject ke task BOOTSTRAP (immutable copy; buat task sintetis jika layer absen)
  const bootstrapFiles = missing.filter((f) => !f.startsWith('apps/web'));
  if (bootstrapFiles.length > 0) {
    const idx = updatedTasks.findIndex((t) => t.layer === 'BOOTSTRAP');
    if (idx >= 0) {
      const t = updatedTasks[idx];
      updatedTasks[idx] = {
        ...t,
        files_to_create: Array.from(new Set([...(t.files_to_create || []), ...bootstrapFiles])),
        implementation_steps: [
          ...(t.implementation_steps || []),
          `Pastikan file konfigurasi environment dan repository terbuat: ${bootstrapFiles.join(', ')}`,
        ],
      };
    } else {
      updatedTasks.unshift(syntheticTask('BOOTSTRAP', bootstrapFiles, minOrder - 1));
    }
  }

  // 2. Inject ke task FRONTEND pertama (immutable copy; buat task sintetis jika layer absen)
  const frontendFiles = missing.filter((f) => f.startsWith('apps/web'));
  if (frontendFiles.length > 0) {
    const idx = updatedTasks.findIndex((t) => t.layer === 'FRONTEND');
    if (idx >= 0) {
      const t = updatedTasks[idx];
      updatedTasks[idx] = {
        ...t,
        files_to_create: Array.from(new Set([...(t.files_to_create || []), ...frontendFiles])),
        implementation_steps: [
          ...(t.implementation_steps || []),
          `Pastikan entrypoint dan konfigurasi styling aplikasi web terbuat: ${frontendFiles.join(', ')}`,
        ],
      };
    } else {
      updatedTasks.unshift(syntheticTask('FRONTEND', frontendFiles, minOrder - 1));
    }
  }

  return updatedTasks;
}
