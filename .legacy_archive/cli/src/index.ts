import readline from 'readline';
import { getConfig, saveConfig, clearConfig } from './config';
import { requestApi } from './api-client';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';

function promptUser(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

export async function runCli(args: string[]) {
  const command = args[0] || 'help';

  switch (command) {
    case 'login': {
      let token = args.find((a) => a.startsWith('pak_')) || (args[1] === '--token' ? args[2] : args[1]);
      if (!token) {
        console.log(`\n${BOLD}${CYAN}=== Project AI Planner CLI Login ===${RESET}`);
        console.log(`${DIM}Masukkan Personal Access Token (PAT) dari web UI Settings (berawalan pak_)${RESET}\n`);
        token = await promptUser(`${BOLD}Personal Access Token: ${RESET}`);
      }

      if (!token || !token.startsWith('pak_')) {
        console.log(`\n${RED}✗ Error: Token harus berawalan "pak_"!${RESET}`);
        console.log(`${DIM}Buka http://localhost:3455/projects/demo-futsal-project/settings untuk membuat token.${RESET}\n`);
        return;
      }

      console.log(`\n${DIM}Memverifikasi token ke server...${RESET}`);
      const res = await requestApi('/api/agent/auth', {
        method: 'POST',
        token,
      });

      if (!res.success) {
        console.log(`\n${RED}✗ Autentikasi gagal: ${res.error}${RESET}\n`);
        return;
      }

      saveConfig({ token });
      console.log(`\n${GREEN}✓ Login Berhasil!${RESET}`);
      if (res.activeProject) {
        console.log(`  Project: ${BOLD}${res.activeProject.name}${RESET}`);
        console.log(`  Ringkasan: ${DIM}${res.activeProject.description}${RESET}`);
      }
      console.log(`\n${CYAN}Gunakan '${BOLD}npx project-ai next${RESET}${CYAN}' untuk mengambil task pertama.${RESET}\n`);
      break;
    }

    case 'status': {
      const config = getConfig();
      console.log(`\n${BOLD}${CYAN}=== Project AI Planner CLI Status ===${RESET}`);
      console.log(`API URL: ${config.apiUrl}`);
      console.log(`Token  : ${config.token ? `${config.token.substring(0, 10)}... (Tersimpan)` : `${RED}Belum Login${RESET}`}`);

      if (!config.token) {
        console.log(`\n${YELLOW}Silakan jalankan '${BOLD}npx project-ai login${RESET}${YELLOW}' terlebih dahulu.${RESET}\n`);
        return;
      }

      const authRes = await requestApi('/api/agent/auth', { method: 'POST' });
      if (authRes.success && authRes.activeProject) {
        console.log(`Active Project: ${BOLD}${authRes.activeProject.name}${RESET}`);
      } else {
        console.log(`${RED}Koneksi API Error: ${authRes.error}${RESET}`);
      }
      console.log('');
      break;
    }

    case 'next': {
      const config = getConfig();
      if (!config.token) {
        console.log(`\n${RED}✗ Belum login. Jalankan '${BOLD}npx project-ai login${RESET}${RED}' terlebih dahulu.${RESET}\n`);
        return;
      }

      console.log(`\n${DIM}Mengecek task berikutnya dari server...${RESET}`);
      const res = await requestApi('/api/agent/tasks/next');

      if (!res.success) {
        console.log(`\n${RED}✗ Gagal mengambil task: ${res.error}${RESET}\n`);
        return;
      }

      if (!res.hasTask) {
        console.log(`\n${GREEN}🎉 ${res.message}${RESET}\n`);
        return;
      }

      const task = res.task;
      saveConfig({ activeTaskId: task.id });

      console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
      console.log(`│ ${BOLD}TASK #${task.id.toUpperCase()}${RESET} ${DIM}[Layer: ${task.layer} | Priority: ${task.priority.toUpperCase()}]${RESET}`);
      console.log(`├─────────────────────────────────────────────────────────────┤`);
      console.log(`│ ${BOLD}Judul:${RESET} ${task.title}`);
      console.log(`│ ${DIM}${task.description}${RESET}`);
      console.log(`│`);
      console.log(`│ ${BOLD}Kriteria Penerimaan (Acceptance Criteria):${RESET}`);
      task.acceptance_criteria.forEach((c: string, i: number) => {
        console.log(`│   ${CYAN}[ ] ${i + 1}.${RESET} ${c}`);
      });
      console.log(`│`);
      console.log(`│ ${BOLD}Target Files:${RESET}`);
      if (task.ai_context.files_to_create.length > 0) {
        console.log(`│   ${GREEN}+ Buat:${RESET} ${task.ai_context.files_to_create.join(', ')}`);
      }
      if (task.ai_context.files_to_modify.length > 0) {
        console.log(`│   ${YELLOW}~ Ubah:${RESET} ${task.ai_context.files_to_modify.join(', ')}`);
      }
      console.log(`└─────────────────────────────────────────────────────────────┘\n`);

      if (task.status !== 'IN_PROGRESS') {
        const confirm = await promptUser(`${BOLD}Mulai kerjakan task ini sekarang? (y/n): ${RESET}`);
        if (confirm.toLowerCase() === 'y') {
          const startRes = await requestApi(`/api/agent/tasks/${task.id}/start`, { method: 'POST' });
          if (startRes.success) {
            console.log(`\n${GREEN}✓ Status task diubah menjadi IN_PROGRESS di Web Kanban.${RESET}`);
            console.log(`${CYAN}Gunakan '${BOLD}npx project-ai context${RESET}${CYAN}' untuk mengekspor Markdown bounded context ke AI agent.${RESET}\n`);
          }
        }
      } else {
        console.log(`${YELLOW}Task ini sedang berstatus IN_PROGRESS.${RESET}`);
        console.log(`${CYAN}Gunakan '${BOLD}npx project-ai done${RESET}${CYAN}' setelah implementasi selesai.${RESET}\n`);
      }
      break;
    }

    case 'context': {
      const config = getConfig();
      if (!config.token) {
        console.log(`\n${RED}✗ Belum login.${RESET}\n`);
        return;
      }

      const taskId = args[1] || config.activeTaskId;
      if (!taskId) {
        console.log(`\n${RED}✗ Tidak ada task aktif. Jalankan '${BOLD}npx project-ai next${RESET}${RED}' terlebih dahulu.${RESET}\n`);
        return;
      }

      const res = await requestApi(`/api/agent/tasks/${taskId}/context`);
      if (!res.success) {
        console.log(`\n${RED}✗ Gagal mengambil context: ${res.error}${RESET}\n`);
        return;
      }

      console.log(`\n${BOLD}${CYAN}=== BOUNDED CONTEXT FOR AI CODING AGENT ===${RESET}\n`);
      console.log(res.markdownPrompt);
      console.log(`\n${DIM}Tip: Copy blok Markdown di atas dan paste ke Claude Code / Cursor / Aider.${RESET}\n`);
      break;
    }

    case 'done': {
      const config = getConfig();
      if (!config.token) {
        console.log(`\n${RED}✗ Belum login.${RESET}\n`);
        return;
      }

      const taskId = args[1] || config.activeTaskId;
      if (!taskId) {
        console.log(`\n${RED}✗ Tidak ada task aktif untuk diselesaikan.${RESET}\n`);
        return;
      }

      console.log(`\n${DIM}Mengirim konfirmasi selesai untuk #${taskId}...${RESET}`);
      const res = await requestApi(`/api/agent/tasks/${taskId}/complete`, { method: 'POST' });

      if (!res.success) {
        console.log(`\n${RED}✗ Gagal menandai task: ${res.error}${RESET}\n`);
        return;
      }

      console.log(`\n${GREEN}✓ Task #${taskId} BERHASIL DISELESAIKAN!${RESET}`);
      console.log(`${DIM}Status di papan Kanban web otomatis terupdate menjadi DONE.${RESET}`);

      if (res.layerCompleted && res.checkpointNotice) {
        console.log(`\n${BOLD}${YELLOW}⚠️  HUMAN CHECKPOINT GATE TRIGGERED!${RESET}`);
        console.log(`${YELLOW}${res.checkpointNotice}${RESET}`);
        console.log(`${DIM}Buka dashboard web untuk menyetujui gate sebelum melanjutkan ke layer berikutnya.${RESET}\n`);
      } else {
        console.log(`\n${CYAN}Jalankan '${BOLD}npx project-ai next${RESET}${CYAN}' untuk mengambil task berikutnya.${RESET}\n`);
      }
      break;
    }

    case 'logout': {
      clearConfig();
      console.log(`\n${GREEN}✓ Token berhasil dihapus dari sistem.${RESET}\n`);
      break;
    }

    case 'help':
    default: {
      console.log(`\n${BOLD}${CYAN}Project AI Planner — CLI Coding Agent Bridge${RESET}`);
      console.log(`${DIM}Versi 0.1.0 | Mengisolasi bounded context per task untuk AI agent${RESET}\n`);
      console.log(`${BOLD}Perintah yang tersedia:${RESET}`);
      console.log(`  ${CYAN}login [token]${RESET}    Login dengan Personal Access Token (pak_...)`);
      console.log(`  ${CYAN}status${RESET}           Cek status autentikasi dan project aktif`);
      console.log(`  ${CYAN}next${RESET}             Ambil task valid berikutnya dari Kanban`);
      console.log(`  ${CYAN}context [id]${RESET}     Tampilkan bounded Markdown context untuk Claude Code/Cursor`);
      console.log(`  ${CYAN}done [id]${RESET}        Tandai task aktif selesai dan cek checkpoint gate`);
      console.log(`  ${CYAN}logout${RESET}           Hapus token lokal`);
      console.log(`  ${CYAN}help${RESET}             Tampilkan pesan bantuan ini\n`);
      break;
    }
  }
}
