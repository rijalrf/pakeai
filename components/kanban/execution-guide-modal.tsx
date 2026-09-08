'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TaskItemData } from '@/lib/ai/tasks';
import {
  Terminal,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  Code2,
  FileCode,
  Layers,
  Wand2,
  Play,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface ExecutionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  tasks: TaskItemData[];
}

export function ExecutionGuideModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  tasks,
}: ExecutionGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'cli' | 'agent-prompt' | 'workflow'>('cli');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  // Ambil task pertama yang berstatus TODO atau IN_PROGRESS
  const currentTask =
    tasks.find((t) => t.status === 'IN_PROGRESS') ||
    tasks.find((t) => t.status === 'TODO') ||
    tasks[0];

  const defaultToken = 'pak_dev_terminal_agent';

  // Perintah CLI global (bisa dijalankan di folder mana saja termasuk ~/belajar/pake-ai)
  const oneLinerCli = `project-ai login ${defaultToken} && project-ai next`;
  const cliLoginCmd = `project-ai login ${defaultToken}`;
  const cliNextCmd = `project-ai next`;
  const cliContextCmd = `project-ai context`;
  const cliDoneCmd = `project-ai done`;

  // AI Prompt siap copas untuk OpenCode / Claude Code / Cursor / Windsurf
  const aiAgentPrompt = currentTask
    ? `Halo OpenCode, tolong kerjakan task berikut pada project ini secara akurat:

TASK: ${currentTask.title}
PROJECT: ${projectName}
TASK ID: #${currentTask.id} (Sequence #${currentTask.sequence})
LAYER: ${currentTask.layer} | PRIORITAS: ${currentTask.priority?.toUpperCase() || 'HIGH'}

--- DESKRIPSI FITUR ---
${currentTask.description}

--- KRITERIA PENERIMAAN (ACCEPTANCE CRITERIA) ---
${currentTask.acceptance_criteria?.map((ac, i) => `${i + 1}. ${ac}`).join('\n') || '- Sesuai spesifikasi arsitektur'}

--- BOUNDED CONTEXT (BATASAN FILE) ---
Hanya buat atau modifikasi file di bawah ini. JANGAN menyentuh atau merusak file lain di luar daftar:
• File yang harus dibuat:
${currentTask.ai_context?.files_to_create?.length ? currentTask.ai_context.files_to_create.map((f) => `  + ${f}`).join('\n') : '  (Tidak ada file baru)'}

• File yang boleh dimodifikasi:
${currentTask.ai_context?.files_to_modify?.length ? currentTask.ai_context.files_to_modify.map((f) => `  ~ ${f}`).join('\n') : '  (Tidak ada file modifikasi)'}

--- INSTRUKSI KODING & PENGUJIAN ---
Instruksi: ${currentTask.ai_context?.instructions || 'Tulis kode yang modular, efisien, dan bersih.'}
Kriteria Pengujian: ${currentTask.ai_context?.test_criteria || 'Pastikan file terbuat dan syntax valid.'}

ATURAN KETAT UNTUK ANDA:
1. Kerjakan HANYA 1 task ini sampai tuntas di folder repository saat ini.
2. Buat file-file yang tercantum di atas sekarang juga.`
    : `Silakan pilih task pada Kanban untuk melihat konteks prompt AI.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-100">
                  Panduan Eksekusi Step 4: Siap Copas doang
                </h2>
                <Badge variant="emerald" className="text-[10px] font-mono">
                  Anti-Halusinasi
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Pilih cara eksekusi task untuk proyek <span className="text-zinc-200 font-semibold">{projectName}</span>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/20 px-6 pt-2 gap-1">
          {[
            { id: 'cli', label: '⚡ Terminal CLI (Rekomendasi)', icon: Terminal },
            { id: 'agent-prompt', label: '🤖 Copas ke Claude Code / Cursor', icon: Wand2 },
            { id: 'workflow', label: '📋 Alur Kerja & Checkpoint', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-zinc-900/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* TAB 1: TERMINAL CLI */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              {/* Note callout */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] text-amber-300">
                ⚠️ <strong>PERHATIAN:</strong> Jalankan perintah di bawah ini di <strong>Terminal shell biasa Anda</strong> (bash/zsh), <strong>BUKAN</strong> di-paste ke dalam chat OpenCode / AI! Jika ingin menyuruh OpenCode koding, buka <strong>Tab 2 (Copas ke OpenCode / Claude Code)</strong>.
              </div>

              {/* Highlight Box: One-Liner Instan */}
              <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Play className="h-3.5 w-3.5 text-indigo-400" />
                    Perintah Cepat 1-Baris (Login &amp; Ambil Task Pertama)
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">Jalankan di terminal proyek (~/belajar/pake-ai)</span>
                </div>

                <div className="relative group">
                  <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre">
                    {oneLinerCli}
                  </pre>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(oneLinerCli, 'one-liner')}
                    className="absolute right-2 top-2 h-7 text-[11px] gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
                  >
                    {copiedKey === 'one-liner' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Salin 1-Baris
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step by Step Breakdown */}
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Atau Jalankan Per-Langkah:
                </h3>

                {/* Step 1 */}
                <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold">
                        1
                      </span>
                      <span className="font-semibold text-zinc-200">Login Token Agent di Terminal</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(cliLoginCmd, 'login')}
                      className="h-6 text-[10px] gap-1 text-zinc-400 hover:text-zinc-100"
                    >
                      {copiedKey === 'login' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedKey === 'login' ? 'Tersalin' : 'Salin'}
                    </Button>
                  </div>
                  <pre className="p-2 rounded bg-zinc-950 font-mono text-zinc-300 text-[11px] overflow-x-auto">
                    {cliLoginCmd}
                  </pre>
                  <p className="text-[11px] text-zinc-400">
                    Menyimpan kredensial token ke <code className="text-zinc-300 font-mono">~/.project-ai/config.json</code>.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold">
                        2
                      </span>
                      <span className="font-semibold text-zinc-200">Ambil Task Siap-Kerjakan Berikutnya</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(cliNextCmd, 'next')}
                      className="h-6 text-[10px] gap-1 text-zinc-400 hover:text-zinc-100"
                    >
                      {copiedKey === 'next' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedKey === 'next' ? 'Tersalin' : 'Salin'}
                    </Button>
                  </div>
                  <pre className="p-2 rounded bg-zinc-950 font-mono text-zinc-300 text-[11px] overflow-x-auto">
                    {cliNextCmd}
                  </pre>
                  <p className="text-[11px] text-zinc-400">
                    Status task di papan Kanban otomatis berpindah ke <span className="text-amber-400 font-semibold font-mono">IN_PROGRESS</span>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold">
                        3
                      </span>
                      <span className="font-semibold text-zinc-200">Tandai Selesai Setelah Koding Lulus Uji</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(cliDoneCmd, 'done')}
                      className="h-6 text-[10px] gap-1 text-zinc-400 hover:text-zinc-100"
                    >
                      {copiedKey === 'done' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedKey === 'done' ? 'Tersalin' : 'Salin'}
                    </Button>
                  </div>
                  <pre className="p-2 rounded bg-zinc-950 font-mono text-zinc-300 text-[11px] overflow-x-auto">
                    {cliDoneCmd}
                  </pre>
                  <p className="text-[11px] text-zinc-400">
                    Task berpindah ke <span className="text-emerald-400 font-semibold font-mono">DONE</span> di Kanban, dan sistem otomatis mengecek apakah checkpoint layer tercapai.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROMPT SIAP COPAS KE AI */}
          {activeTab === 'agent-prompt' && (
            <div className="space-y-3">
              {/* Note Callout */}
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3 text-[11px] text-emerald-300">
                👉 <strong>INI YANG DI-PASTE KE CHAT OPENCODE / CLAUDE CODE / CURSOR!</strong> Salin teks di bawah ini dan tempelkan langsung ke chat OpenCode di terminal Anda. OpenCode akan langsung paham file apa yang harus dibuat dan dikerjakan.
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                    Prompt Bounded Context untuk OpenCode &amp; AI Coding Agent
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Salin teks ini dan paste langsung ke chat <span className="text-emerald-300 font-semibold">OpenCode</span>, <span className="text-zinc-200 font-semibold">Claude Code</span>, atau <span className="text-zinc-200 font-semibold">Cursor</span>.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleCopy(aiAgentPrompt, 'ai-prompt')}
                  className="gap-1.5 text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {copiedKey === 'ai-prompt' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      Prompt Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Salin Seluruh Prompt
                    </>
                  )}
                </Button>
              </div>

              {currentTask && (
                <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {currentTask.layer}
                    </Badge>
                    <span className="font-bold text-zinc-200 truncate">{currentTask.title}</span>
                  </div>
                  <span className="text-zinc-500 font-mono">#{currentTask.id}</span>
                </div>
              )}

              <div className="relative">
                <textarea
                  readOnly
                  rows={12}
                  value={aiAgentPrompt}
                  className="w-full font-mono text-[11px] leading-relaxed p-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 focus:outline-none resize-none selection:bg-indigo-500/30"
                />
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Mengapa cara ini aman dari AI Slop?</strong> Prompt ini membatasi file yang boleh diedit
                  (<em>bounded context</em>) sehingga LLM tidak akan mengacak-acak konfigurasi atau membuat file sampah di luar scope.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: WORKFLOW GUIDE & CHECKPOINTS */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-100">
                  Alur Human-in-the-loop &amp; Checkpoint Arsitektur
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Sistem ini membagi pekerjaan dalam 4 layer terurut untuk menjamin integritas kode:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    step: '1. DATABASE LAYER',
                    desc: 'Membuat skema tabel, relasi foreign key, constraint, dan migrasi SQL awal.',
                    rule: 'Selesaikan semua task DB dulu sebelum masuk ke Backend.',
                    color: 'border-sky-500/30 bg-sky-950/20 text-sky-300',
                  },
                  {
                    step: '2. BACKEND LAYER',
                    desc: 'Menulis endpoint API, Server Actions, validasi skema Zod, dan integrasi database.',
                    rule: 'Membutuhkan database yang sudah valid dan ter-approve.',
                    color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
                  },
                  {
                    step: '3. FRONTEND LAYER',
                    desc: 'Membangun UI interaktif, form, state management Zustand, dan visual feedback.',
                    rule: 'Menyambungkan antarmuka ke API backend yang sudah stabil.',
                    color: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-300',
                  },
                  {
                    step: '4. DEVOPS & TESTING',
                    desc: 'Docker containerization, CI/CD pipeline, dan pengujian end-to-end.',
                    rule: 'Finalisasi produksi siap deploy.',
                    color: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
                  },
                ].map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${item.color} space-y-1`}>
                    <div className="font-mono text-xs font-bold tracking-wide">{item.step}</div>
                    <div className="text-[11px] text-zinc-300">{item.desc}</div>
                    <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60 font-mono">
                      ↳ {item.rule}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Checkpoint Gate Otomatis:
                </div>
                <p className="text-zinc-300">
                  Saat seluruh task Database berstatus <strong>DONE</strong>, banner checkpoint akan muncul di Kanban.
                  Anda cukup klik <em>"Approve Checkpoint"</em> untuk membuka izin agen melanjutkan ke layer Backend.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/50">
          <Link
            href={`/projects/${projectId}/execute`}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>Buka Cockpit Eksekusi Layar Penuh</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 border-zinc-700 text-zinc-300"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={() => handleCopy(oneLinerCli, 'footer-copy')}
              className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {copiedKey === 'footer-copy' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Salin Perintah CLI Cepat
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
