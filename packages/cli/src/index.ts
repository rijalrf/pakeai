#!/usr/bin/env node
// pakeai CLI — agent loop driver untuk AI coding agent.
// Tanpa mock fallback. Semua error dilaporkan eksplisit.
import { Command } from 'commander';
import { loadConfig, saveConfig, clearConfig, type Config } from './config.js';
import { api, ApiError, probeHealth } from './api-client.js';

const program = new Command();
program
  .name('pakeai')
  .description('CLI agent loop untuk pakeai (AI Planner). Dipakai oleh AI coding agent.')
  .version('0.1.0');

program
  .command('login <token>')
  .description('Simpan Personal Access Token (PAT) dan verifikasi ke server.')
  .option('--api-url <url>', 'URL server API pakeai (default: http://localhost:6655)')
  .action(async (token: string, opts: { apiUrl?: string }) => {
    const cfg = loadConfig();
    if (opts.apiUrl) {
      cfg.apiUrl = opts.apiUrl;
    }
    cfg.token = token;
    saveConfig(cfg);
    const healthy = await probeHealth(cfg);
    if (!healthy) {
      console.error(`Tidak bisa menghubungi server di ${cfg.apiUrl}.`);
      console.error('Pastikan pakeai API jalan di port 6655.');
      process.exit(2);
    }

    console.log(`Mengecek akses token...`);

    // Fetch all projects accessible by this token
    let availableProjects: Array<{ id: string; name: string }> = [];

    try {
      const result = await api.listScopes(cfg);
      // Result should be { scopes: [...] }
      if (result && typeof result === 'object' && 'scopes' in result) {
        availableProjects = (result as any).scopes || [];
      } else {
        // Fallback: direct array
        availableProjects = Array.isArray(result) ? result : [];
      }
      console.log(`Found ${availableProjects.length} project(s)`);
    } catch (err) {
      if (err instanceof ApiError) {
        console.error('Error fetching scopes:', err.status, err.message);
        clearConfig();
        process.exit(1);
      }
      console.error('Unexpected error:', err);
      process.exit(1);
    }

    console.log(`Login berhasil!`);

    if (availableProjects.length > 0) {
      console.log(`Token valid dengan akses ke ${availableProjects.length} project:`);
      for (const proj of availableProjects) {
        console.log(`  - ${proj.name} (${proj.id})`);
      }
      if (availableProjects.length === 1) {
        cfg.projectId = availableProjects[0].id;
        saveConfig(cfg);
        console.log('');
        console.log(`Project aktif otomatis: ${availableProjects[0].name} (${availableProjects[0].id})`);
      } else {
        console.log('');
        console.log('Gunakan "pakeai switch <project-id>" untuk memilih project aktif.');
      }
    } else {
      console.log('Token valid, tetapi belum ada project yang di-scope.');
      console.log('Buat project baru atau minta admin menambahkan scope.');
    }

    console.log(`Server   : ${cfg.apiUrl}`);
  });

program
  .command('switch [projectId]')
  .description('Beralih ke project lain dengan token yang sama. Tanpa parameter: tampilkan daftar project tersedia.')
  .action(async (projectId?: string) => {
    const cfg = loadConfig();

    if (!cfg.token) {
      console.error('Belum login. Jalankan: pakeai login <token>');
      process.exit(1);
    }

    if (!projectId) {
      // List available projects by trying common endpoints
      console.log('Proyek tersedia untuk token ini:\n');
      console.log('> Gunakan: pakeai switch <project-id>');
      return;
    }

    cfg.projectId = projectId;
    saveConfig(cfg);

    try {
      const me = await api.whoami(cfg);
      console.log(`Switch berhasil!`);
      console.log(`Project  : ${me.project.name}`);
      console.log(`ProjectId: ${me.project.id}`);
    } catch (e) {
      if (e instanceof ApiError) {
        console.error(`Gagal switch ke project ${projectId}: ${e.message}`);
        process.exit(1);
      }
      throw e;
    }
  });

program
  .command('whoami')
  .description('Tampilkan info project dari token saat ini.')
  .action(async () => {
    const cfg = loadConfig();
    const me = await api.whoami(cfg);
    console.log(JSON.stringify(me, null, 2));
  });

program
  .command('next')
  .description('Ambil task berikutnya. Akan melanjutkan task IN_PROGRESS bila ada.')
  .action(async () => {
    const cfg = loadConfig();
    const out = await api.next(cfg);
    if (!out.hasTask) {
      console.log(out.message ?? 'Tidak ada task tersisa.');
      return;
    }
    cfg.activeTaskId = out.task!.id;
    saveConfig(cfg);
    console.log(`Task #${out.task!.order} [${out.task!.layer}] ${out.task!.status}`);
    console.log(`ID    : ${out.task!.id}`);
    console.log(`Judul : ${out.task!.title}`);
    if (out.task!.description) console.log(`\n${out.task!.description}`);
    console.log(`\n-> Lanjut: \`pakeai start\` lalu \`pakeai context\``);
  });

program
  .command('start [id]')
  .description('Tandai task IN_PROGRESS. Default: activeTaskId.')
  .action(async (id?: string) => {
    const cfg = loadConfig();
    const taskId = id ?? cfg.activeTaskId;
    if (!taskId) {
      console.error('Tidak ada task aktif. Jalankan: pakeai next');
      process.exit(1);
    }
    const r = await api.start(cfg, taskId);
    console.log(`Task ${r.taskId} -> ${r.status}`);
  });

program
  .command('context [id]')
  .description('Cetak Markdown bounded context task aktif. WAJIB dibaca AI agent sebelum edit file.')
  .action(async (id?: string) => {
    const cfg = loadConfig();
    const taskId = id ?? cfg.activeTaskId;
    if (!taskId) {
      console.error('Tidak ada task aktif. Jalankan: pakeai next');
      process.exit(1);
    }
    const r = await api.context(cfg, taskId);
    console.log(r.markdown);
  });

program
  .command('done [id]')
  .description('Tandai task selesai. Akan info checkpoint PENDING jika layer selesai.')
  .action(async (id?: string) => {
    const cfg = loadConfig();
    const taskId = id ?? cfg.activeTaskId;
    if (!taskId) {
      console.error('Tidak ada task aktif. Jalankan: pakeai next');
      process.exit(1);
    }
    const r = await api.done(cfg, taskId);
    console.log(`Task ${r.taskId} -> ${r.status}`);
    if (r.checkpointPending) {
      console.log(`\n!!! CHECKPOINT PENDING !!!`);
      console.log(`Layer ${r.layer} selesai. Berhenti dan minta approval user sebelum lanjut ke layer berikutnya.`);
    } else {
      console.log(`-> Lanjut: pakeai next`);
    }
  });

program
  .command('brd')
  .description('Tampilkan BRD project dalam format Markdown.')
  .action(async () => {
    const cfg = loadConfig();
    try {
      const r = await api.brd(cfg);
      const content: Record<string, unknown> = r.brd.content as unknown as Record<string, unknown>;
      const mdParts: string[] = [];

      mdParts.push('# Business Requirements Document');
      mdParts.push('');
      mdParts.push(`**Generated:** ${new Date(r.brd.generatedAt).toLocaleString('id-ID')}`);
      mdParts.push(`**Version:** ${r.brd.version}`);
      mdParts.push('');
      mdParts.push('---');
      mdParts.push('');
      mdParts.push('## Ringkasan');
      mdParts.push('');
      const overviewVal = content.overview;
      mdParts.push(overviewVal != null ? String(overviewVal) : '(tidak ada)');
      mdParts.push('');
      mdParts.push('---');
      mdParts.push('');
      mdParts.push('## Tujuan');
      mdParts.push('');

      const goals: string[] = Array.isArray(content.goals)
        ? content.goals.filter((v): v is string => typeof v === 'string')
        : [];
      goals.forEach((g: string) => {
        mdParts.push(`- ${g}`);
      });
      mdParts.push('');
      mdParts.push('---');
      mdParts.push('');
      mdParts.push('## Fitur');
      mdParts.push('');

      const features: Array<{ name?: unknown; description?: unknown }> = Array.isArray(content.features)
        ? content.features.filter((v): v is { name?: unknown; description?: unknown } => typeof v === 'object' && v !== null)
        : [];
      features.forEach((f: { name?: unknown; description?: unknown }) => {
        if (typeof f.name === 'string') {
          mdParts.push(`### ${f.name}`);
        } else if (f.name != null) {
          mdParts.push(`### ${String(f.name)}`);
        }
        if (typeof f.description === 'string' && f.description) {
          mdParts.push(f.description);
        } else {
          mdParts.push('(tidak ada deskripsi)');
        }
        mdParts.push('');
      });

      mdParts.push('---');
      mdParts.push('');
      mdParts.push('## Tech Requirements');
      mdParts.push('');

      const techReqs: string[] = Array.isArray(content.techRequirements)
        ? content.techRequirements.filter((v): v is string => typeof v === 'string')
        : [];
      techReqs.forEach((t: string) => {
        mdParts.push(`- ${t}`);
      });
      mdParts.push('');
      mdParts.push('---');
      mdParts.push('');
      mdParts.push('## Non-Functional Requirements');
      mdParts.push('');

      const nonFunc: string[] = Array.isArray(content.nonFunctional)
        ? content.nonFunctional.filter((v): v is string => typeof v === 'string')
        : [];
      nonFunc.forEach((n: string) => {
        mdParts.push(`- ${n}`);
      });
      mdParts.push('');
      mdParts.push('---');
      mdParts.push('');
      mdParts.push('## Out of Scope');
      mdParts.push('');

      const outOfScope: string[] = Array.isArray(content.outOfScope)
        ? content.outOfScope.filter((v): v is string => typeof v === 'string')
        : [];
      outOfScope.forEach((o: string) => {
        mdParts.push(`- ${o}`);
      });

      console.log(mdParts.join('\n'));
    } catch (e) {
      if (e instanceof ApiError) {
        console.error(`Error [${e.status}]: ${e.message}`);
        if (e.status === 400) {
          console.error('BRD belum ada di project ini. Generate BRD dulu via web UI.');
        }
      } else {
        console.error('Error:', e instanceof Error ? e.message : e);
      }
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Hapus token lokal.')
  .action(() => {
    clearConfig();
    console.log('Token dihapus.');
  });

program
  .command('status')
  .description('Cek koneksi server dan status token.')
  .action(async () => {
    const cfg = loadConfig();
    const healthy = await probeHealth(cfg);
    console.log(`Server : ${cfg.apiUrl} -> ${healthy ? 'OK' : 'TIDAK TERHUBUNG'}`);
    console.log(`Token  : ${cfg.token ? 'tersimpan' : 'kosong'}`);
    if (cfg.activeTaskId) console.log(`Active : ${cfg.activeTaskId}`);
    if (cfg.projectId) console.log(`Project: ${cfg.projectId}`);
  });

program.parseAsync(process.argv).catch((e) => {
  if (e instanceof ApiError) {
    console.error(`Error [${e.status}]: ${e.message}`);
    if (e.status === 401) {
      console.error('Token ditolak. Coba: pakeai login <token>');
    }
  } else {
    console.error('Error:', e instanceof Error ? e.message : e);
  }
  process.exit(1);
});
