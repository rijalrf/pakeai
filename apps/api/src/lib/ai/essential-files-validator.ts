// Essential Files Validator (No-op): Bounded context file fisik kaku dinonaktifkan
// Task penentu kelulusan bergeser ke Acceptance Criteria dan Validation Commands multi-stack.
import type { TaskGen } from './tasks.js';
import type { StackContract } from './stack-contract.js';

export interface EssentialValidationResult {
  valid: boolean;
  missing: string[];
}

export function validateEssentialFiles(_tasks: TaskGen[], _stack: StackContract): EssentialValidationResult {
  // ponytail: validasi file fisik dinonaktifkan agar mendukung arsitektur multi-stack non-Node (Laravel, Django, Go)
  return {
    valid: true,
    missing: [],
  };
}

export function autoInjectEssentialFiles(tasks: TaskGen[], _stack: StackContract, _missing: string[]): TaskGen[] {
  // ponytail: injeksi sintetis dinonaktifkan; biarkan task murni dari output generator AI
  return tasks;
}

