/**
 * Master Prompt Generator for AI Coding Agents
 * (Claude Code, OpenCode, Codex, Cursor Agent, Aider, Windsurf)
 *
 * Mengikuti spesifikasi prompt eksekusi autonomous agent PakeAI.
 */

export interface MasterPromptOptions {
  planId?: string;
  workspaceId?: string;
  token?: string;
  cliName?: string;
  baseUrl?: string;
  projectName?: string;
  mode?: 'semi-autonomous' | 'autonomous';
}

/**
 * Menghasilkan Master Prompt standar PakeAI (siap copas ke Claude Code / AI Agent)
 */
export function generatePakeAIPrompt({
  planId = 'db947f40-0ed1-4391-8fd4-7b00b1da1f56',
  workspaceId = '45e9f263-2699-4143-9d8b-47cab5d866a8',
  token = 'pak_dev_demo_token_1234567890abcdef',
  cliName = 'project-ai',
}: {
  planId?: string;
  workspaceId?: string;
  token?: string;
  cliName?: string;
}): string {
  if (cliName === 'project-ai') {
    return `Kamu adalah AI Coding Agent otonom yang akan menyelesaikan atomic tasks pada proyek ini secara berurutan.

Identitas Proyek:
Plan / Project ID : ${planId}
Token Akses (PAT) : ${token}

Prasyarat: Node.js (cek \`node -v\`). CLI dijalankan lewat npx tanpa install manual.

--- SIKLUS EKSEKUSI (JALANKAN DI TERMINAL BASH / SHELL) ---

Langkah 1 — Login Kredensial (jalankan 1x di awal):
npx project-ai login --token ${token}

Langkah 2 — Siklus Pengerjaan Task (Ulangi langkah ini sampai semua task selesai):
1. Ambil task berikutnya dari server:
   npx project-ai next
   (Akan menampilkan judul task, layer, acceptance criteria, dan target file).

2. Tampilkan Bounded Context spesifik task ini:
   npx project-ai context

3. Implementasikan kode di workspace:
   - Buat file baru pada daftar "Files to create".
   - Modifikasi file pada daftar "Files to modify".
   - Dilarang menyentuh atau merusak file konfigurasi di luar bounded context.
   - Verifikasi bahwa kode berjalan dan kriteria tes terpenuhi.

4. Tandai task selesai di server:
   npx project-ai done
   (Status di papan Kanban web otomatis berubah menjadi DONE).

5. Ulangi kembali ke langkah (1) untuk task berikutnya sampai CLI menyatakan semua task selesai.

Jika terjadi Human Checkpoint Gate (pergantian layer frontend/backend):
Tunggu verifikasi pengguna sebelum melanjutkan task berikutnya.`;
  }

  return `Kamu akan mengerjakan task dari PakeAI lewat CLI \`npx ${cliName}\`.

Identitas proyek:
Plan ID      : ${planId}
Workspace ID : ${workspaceId}


Prasyarat: Node.js (cek \`node -v\`). CLI otomatis ter-download saat dijalankan
via npx — tidak perlu install manual. (Opsional biar lebih cepat: \`npm i -g ${cliName}\`.)

Langkah 1 — login + hubungkan repo + pasang skill (sekali saja):
npx ${cliName} login --token ${token}    # simpan token (tanpa browser)
npx ${cliName} connect --workspace ${workspaceId}    # ikat repo ke workspace (tulis .${cliName}/config.json — cuma id, aman di-commit)
npx ${cliName} init     # pasang skill "${cliName}" ke agent (auto-load)

Langkah 2 — baca PRD dulu (konteks proyek, sekali saja):
npx ${cliName} plan get ${planId}    # PRD lengkap → tujuan, fitur, tech stack

Langkah 3 — LOOP: kerjakan SATU task per satu, BERHENTI tiap ganti fase/layer.
Server yang pilih task berikutnya (frontend & HALAMAN PERTAMA diselesaikan dulu di
atas data tiruan/stub; backend menyusul). Kamu TIDAK perlu lihat seluruh backlog.
INGAT \`layer\` (frontend/backend) & \`phase.current\` task yang BARU kamu selesaikan.

Ulangi siklus ini:
  npx ${cliName} task next --plan ${planId} --json   # SATU task berikutnya
      # respons: { done, task:{ref,title,...}, progress:{ phase:{current,total}, layer, page, ... } }
      # kerjakan dari title + PRD + baca kode; TAK ADA field prompt/description.
      # kalau "done": true → SEMUA task selesai. BERHENTI & lapor ke user.
      #
      # [CHECKPOINT] (SEBELUM \`task start\`): bandingkan \`progress\` task ini dengan
      #    task yang BARUSAN selesai. Kalau \`layer\` BEDA (mis. frontend→backend)
      #    ATAU \`phase.current\` NAIK → JANGAN mulai. BERHENTI, lapor apa yang beres
      #    (mis. "[Selesai] Frontend fase 1 selesai — coba klik-klik dulu di browser"), lalu
      #    TUNGGU user bilang "lanjut". \`task next\` PERTAMA di sesi ini (belum ada
      #    task sebelumnya) BUKAN checkpoint → langsung kerjakan.
  npx ${cliName} task start <ref>                     # tandai mulai
  → kerjakan HANYA task ini sampai kelar (eksplor kode dulu, ikuti polanya).
    JANGAN sentuh task lain / baca task lain dulu.
  npx ${cliName} task complete <ref>                  # tandai selesai
  → balik ke \`task next\` untuk task berikutnya.

Kalau ke-block: npx ${cliName} task fail <ref> "alasan singkat" lalu lanjut \`task next\`.

Kenapa berhenti tiap fase/layer: user bisa verifikasi hasil tiap layer (mis. klik-klik
UI frontend di atas data tiruan) sebelum agent lanjut ke backend / fase berikutnya.
Kenapa satu-per-satu: tiap task dapat konteks bersih & fokus penuh → hasil lebih tajam.
Percayakan urutan ke \`task next\` — jangan borong banyak task sekaligus.

Codebase sync: skill "${cliName}" yang barusan terpasang berisi alur sync
(\`sync --plan\` → tulis summaries → \`sync\`). Jalankan sync pertama setelah ada kode,
lalu \`sync --if-changed --plan\` tiap selesai task — index workspace tetap segar.`;
}

/**
 * Alias untuk kompatibilitas ke belakang
 */
export const generateNgodingPakeAIPrompt = generatePakeAIPrompt;

/**
 * Backward-compatible helper untuk Master Agent Prompt
 */
export function generateMasterAgentPrompt(opts: MasterPromptOptions): string {
  const planId = opts.planId || 'db947f40-0ed1-4391-8fd4-7b00b1da1f56';
  const workspaceId = opts.workspaceId || '45e9f263-2699-4143-9d8b-47cab5d866a8';
  const token = opts.token || 'pak_dev_demo_token_1234567890abcdef';
  const cliName = opts.cliName || 'project-ai';

  return generatePakeAIPrompt({
    planId,
    workspaceId,
    token,
    cliName,
  });
}
