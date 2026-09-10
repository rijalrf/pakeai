// Runtime scope guard (Fase 2).
// Validasi eksekusi task secara lokal di mesin user (git diff vs forbidden + validation commands)
// sebelum pakeai done mengirim status ke API. Server tidak bisa akses filesystem laptop user,
// jadi guard ini wajib berjalan di CLI.
import { spawn } from 'node:child_process';

export type GuardSpec = {
  layer?: string;
  forbidden?: string[];
  files_readonly?: string[];
  validation_commands?: string[];
};

export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardError';
  }
}

// === Glob matching minimal (tanpa dependency eksternal) ===
// Dukungan: `dir/**`, `dir/*`, `*.ext`, `?` single char, prefix `dir` (match isi folder).
function globToRegExp(pattern: string): RegExp {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        re += '.*';
        i += 1;
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if (/[.+^${}()|[\]\\]/.test(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

export function matchesGlob(pattern: string, path: string): boolean {
  if (pattern === path) return true;
  if (globToRegExp(pattern).test(path)) return true;
  // `dir/**` juga mencakup file tepat di bawah `dir/` (tanpa subpath tambahan)
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    if (path.startsWith(prefix + '/')) return true;
  }
  return false;
}

// === Utils git ===
export function gitStatusPorcelain(cwd: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const p = spawn('git', ['status', '--porcelain'], { cwd, shell: false });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => {
      if (code !== 0) {
        reject(new GuardError(`git status gagal (exit ${code}): ${err.trim()}`));
        return;
      }
      resolve(out.split('\n').map(parsePorcelainLine).filter((x): x is string => x !== null));
    });
    p.on('error', (e) => reject(new GuardError(`Tidak dapat menjalankan git: ${e.message}`)));
  });
}

function parsePorcelainLine(line: string): string | null {
  if (!line) return null;
  // Format: XY <path>. Rename: "R  old -> new" -> ambil target.
  const path = line.slice(3);
  const arrow = path.indexOf(' -> ');
  const target = arrow >= 0 ? path.slice(arrow + 4) : path;
  // Strip quoting core.quotepath (non-ASCII)
  if (target.startsWith('"') && target.endsWith('"') && target.length >= 2) {
    return target.slice(1, -1);
  }
  return target;
}

// === Eksekusi validation commands ===
export function runValidationCommands(commands: string[], cwd: string): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve, reject) => {
    if (commands.length === 0) {
      resolve({ ok: true, output: '' });
      return;
    }
    const run = (i: number, logs: string[]): void => {
      const cmd = commands[i];
      const p = spawn('sh', ['-c', cmd], { cwd, shell: false });
      let out = '';
      let err = '';
      p.stdout.on('data', (d) => (out += d.toString()));
      p.stderr.on('data', (d) => (err += d.toString()));
      p.on('error', (e) => {
        reject(new GuardError(`Gagal menjalankan "${cmd}": ${e.message}`));
      });
      p.on('close', (code) => {
        logs.push(`$ ${cmd}\n${out}${err}`.trim());
        if (code !== 0) {
          resolve({ ok: false, output: logs.join('\n\n') });
          return;
        }
        if (i + 1 < commands.length) run(i + 1, logs);
        else resolve({ ok: true, output: logs.join('\n\n') });
      });
    };
    run(0, []);
  });
}

// === Orchestrasi guard utama ===
export async function runGuard(spec: GuardSpec, cwd: string): Promise<void> {
  const forbidden = spec.forbidden ?? [];

  const changed = await gitStatusPorcelain(cwd);
  const violations: Array<{ file: string; pattern: string }> = [];
  for (const file of changed) {
    for (const pattern of forbidden) {
      if (matchesGlob(pattern, file)) {
        violations.push({ file, pattern });
      }
    }
  }
  if (violations.length > 0) {
    const list = violations.map((v) => `- ${v.file}  (larangan: ${v.pattern})`).join('\n');
    throw new GuardError(
      `Task menyentuh file terlarang (forbidden).\n${list}\n\nPerbaiki dengan revert perubahan tersebut, atau jalankan: pakeai done --force`,
    );
  }

  if (changed.length > 0 && !spec.validation_commands?.length) {
    console.log(`Catatan: ${changed.length} file berubah, tanpa validation_commands pada task ini.`);
  }

  const commands = spec.validation_commands ?? [];
  if (commands.length > 0) {
    console.log('Menjalankan validation_commands...\n');
    const { ok, output } = await runValidationCommands(commands, cwd);
    console.log(output);
    if (!ok) {
      throw new GuardError(
        'Validation commands GAGAL. Task belum layak ditandai selesai.\nPerbaiki kegagalan di atas, atau jalankan: pakeai done --force',
      );
    }
    console.log('\nSemua validation commands lolos.');
  }
}