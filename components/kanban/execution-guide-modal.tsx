'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { TaskItemData } from '@/lib/ai/tasks';
import { generateMasterAgentPrompt } from '@/lib/ai/master-prompt';
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
  Radio,
  Bot,
} from 'lucide-react';

interface ExecutionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  tasks: TaskItemData[];
}

type TabId = 'master' | 'cli' | 'agent-prompt' | 'workflow';

export function ExecutionGuideModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  tasks,
}: ExecutionGuideModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('master');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Base URL switcher
  const [baseUrlPreset, setBaseUrlPreset] = useState<'fe' | 'be' | 'custom'>(
    'fe'
  );
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [detectedBaseUrl, setDetectedBaseUrl] = useState(
    'http://localhost:3455'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDetectedBaseUrl(window.location.origin);
    }
  }, []);

  const baseUrl =
    baseUrlPreset === 'fe'
      ? detectedBaseUrl
      : baseUrlPreset === 'be'
      ? 'http://localhost:6655'
      : customBaseUrl || detectedBaseUrl;

  const [token, setToken] = useState('pak_dev_terminal_agent');
  const [mode, setMode] = useState<'semi-autonomous' | 'autonomous'>(
    'semi-autonomous'
  );

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const currentTask =
    tasks.find((t) => t.status === 'IN_PROGRESS') ||
    tasks.find((t) => t.status === 'TODO') ||
    tasks[0];

  const defaultToken = 'pak_dev_terminal_agent';

  const oneLinerCli = `project-ai login ${defaultToken} && project-ai next`;
  const cliLoginCmd = `project-ai login ${defaultToken}`;
  const cliNextCmd = `project-ai next`;
  const cliContextCmd = `project-ai context`;
  const cliDoneCmd = `project-ai done`;

  // AI Prompt siap copas untuk AI IDE (single-task legacy)
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

  // Master Prompt Autonomous / Semi-Autonomous Loop
  const masterPrompt = generateMasterAgentPrompt({
    baseUrl,
    token,
    projectName,
    mode,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
        <div className="flex border-b border-zinc-800 bg-zinc-900/20 px-6 pt-2 gap-1 overflow-x-auto">
          {[
            {
              id: 'master',
              label: '⚡ Master Prompt Loop (Siap Copas 1x)',
              icon: Bot,
            },
            { id: 'cli', label: '🛠 Terminal CLI (project-ai)', icon: Terminal },
            {
              id: 'agent-prompt',
              label: '🤖 Single Task Prompt',
              icon: Wand2,
            },
            { id: 'workflow', label: '📋 Alur Kerja & Checkpoint', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
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
          {/* TAB MASTER PROMPT */}
          {activeTab === 'master' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3 text-[11px] text-emerald-200">
                <div className="flex items-start gap-2">
                  <Radio className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-300">
                      Master Prompt Orchestrator:
                    </strong>{' '}
                    Cukup salin 1 prompt ini ke AI Coding Agent Anda (Claude Code, OpenCode, Cursor Agent, Codex, Aider, Windsurf).
                    AI Agent akan otomatis terhubung ke API SaaS via HTTP cURL, mengambil task satu per satu, mengerjakannya sesuai Bounded Context, dan mengupdate status di Kanban secara real-time.
                  </div>
                </div>
              </div>

              {/* Configuration Panel */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                  ⚙️ Konfigurasi Master Prompt
                </h3>

                {/* Base URL Selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    Base API Orchestrator
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setBaseUrlPreset('fe')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        baseUrlPreset === 'fe'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🌐 Frontend (Port 3455)
                    </button>
                    <button
                      onClick={() => setBaseUrlPreset('be')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        baseUrlPreset === 'be'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🛢 Backend Dedicated (Port 6655)
                    </button>
                    <button
                      onClick={() => setBaseUrlPreset('custom')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        baseUrlPreset === 'custom'
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🔗 Custom URL Deploy
                    </button>
                    <code className="text-[11px] font-mono text-emerald-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                      {baseUrl}
                    </code>
                  </div>
                  {baseUrlPreset === 'custom' && (
                    <Input
                      type="text"
                      placeholder="https://project-ai-planner.example.com"
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      className="mt-2 h-8 text-xs bg-zinc-950 border-zinc-800"
                    />
                  )}
                </div>

                {/* Token */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    Personal Access Token (PAT)
                  </label>
                  <Input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-8 text-xs bg-zinc-950 border-zinc-800 font-mono"
                    placeholder="pak_dev_terminal_agent"
                  />
                </div>

                {/* Mode Toggle */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    Mode Eksekusi
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMode('semi-autonomous')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        mode === 'semi-autonomous'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🤝 Semi-Autonomous (Konfirmasi y/n)
                    </button>
                    <button
                      onClick={() => setMode('autonomous')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        mode === 'autonomous'
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🤖 Full Autonomous (Tanpa Konfirmasi)
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Prompt Block */}
              <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-indigo-400" />
                    Master Prompt Autonomous / Semi-Autonomous
                  </span>
                  <Badge variant="emerald" className="text-[10px] font-mono">
                    {mode === 'semi-autonomous' ? 'Semi-Auto' : 'Full Auto'}
                  </Badge>
                </div>

                <div className="relative">
                  <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-72">
                    {masterPrompt}
                  </pre>
                </div>

                <Button
                  size="lg"
                  onClick={() => handleCopy(masterPrompt, 'master-prompt')}
                  className={`w-full h-10 text-xs gap-2 font-bold ${
                    copiedKey === 'master-prompt'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                  }`}
                >
                  {copiedKey === 'master-prompt' ? (
                    <>
                      <Check className="h-4 w-4" />
                      ✅ Master Prompt Tersalin! Paste ke OpenCode / Claude Code Sekarang
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      ⚡ Salin Master Prompt (1x Copas)
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-zinc-400 italic text-center">
                  💡 Tip: Buka terminal di folder proyek lokal Anda, jalankan AI Coding Agent, lalu paste prompt ini di awal sesi. Agent akan otomatis loop mengerjakan seluruh task.
                </p>
              </div>

              {/* cURL Cheatsheet */}
              <details className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-zinc-300 hover:text-zinc-100 select-none">
                  📖 Cheatsheet cURL Individual (untuk debugging/testing manual)
                </summary>
                <div className="mt-3 space-y-2">
                  {[
                    {
                      key: 'curl-next',
                      label: 'GET Next Task',
                      cmd: `curl -s -X GET "${baseUrl}/api/agent/tasks/next" -H "Authorization: Bearer ${token}"`,
                    },
                    {
                      key: 'curl-start',
                      label: 'POST Start Task',
                      cmd: `curl -s -X POST "${baseUrl}/api/agent/tasks/<TASK_ID>/start" -H "Authorization: Bearer ${token}"`,
                    },
                    {
                      key: 'curl-done',
                      label: 'POST Complete Task',
                      cmd: `curl -s -X POST "${baseUrl}/api/agent/tasks/<TASK_ID>/complete" -H "Authorization: Bearer ${token}"`,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-2"
                    >
                      <code className="text-[11px] font-mono text-emerald-300 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 flex-1 overflow-x-auto">
                        {item.cmd}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(item.cmd, item.key)}
                        className="h-6 text-[10px] gap-1 text-zinc-400 hover:text-zinc-100 shrink-0"
                      >
                        {copiedKey === item.key ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedKey === item.key ? 'Tersalin' : 'Salin'}
                      </Button>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* TAB CLI */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] text-amber-300">
                ⚠️ <strong>PERHATIAN:</strong> Jalankan perintah di bawah ini di <strong>Terminal shell biasa Anda</strong> (bash/zsh), <strong>BUKAN</strong> di-paste ke dalam chat OpenCode / AI! Jika ingin menyuruh AI Agent koding otomatis, buka <strong>Tab Master Prompt Loop</strong>.
              </div>

              <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Play className="h-3.5 w-3.5 text-indigo-400" />
                    Perintah Cepat 1-Baris (Login &amp; Ambil Task Pertama)
                  </span>
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

              <div className="space-y-3 pt-1">
                {[
                  { n: 1, title: 'Login Token Agent', cmd: cliLoginCmd, key: 'login', desc: 'Menyimpan kredensial token ke ~/.project-ai/config.json.' },
                  { n: 2, title: 'Ambil Task Berikutnya', cmd: cliNextCmd, key: 'next', desc: 'Mengambil task siap-kerjakan dari API port 6655.' },
                  { n: 3, title: 'Lihat Bounded Context', cmd: cliContextCmd, key: 'context', desc: 'Menampilkan Markdown prompt untuk AI Agent.' },
                  { n: 4, title: 'Tandai Task Selesai', cmd: cliDoneCmd, key: 'done', desc: 'Mengirim konfirmasi DONE & cek checkpoint gate.' },
                ].map((step) => (
                  <div
                    key={step.key}
                    className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold">
                          {step.n}
                        </span>
                        <span className="font-semibold text-zinc-200">{step.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(step.cmd, step.key)}
                        className="h-6 text-[10px] gap-1 text-zinc-400 hover:text-zinc-100"
                      >
                        {copiedKey === step.key ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedKey === step.key ? 'Tersalin' : 'Salin'}
                      </Button>
                    </div>
                    <pre className="p-2 rounded bg-zinc-950 font-mono text-zinc-300 text-[11px] overflow-x-auto">
                      {step.cmd}
                    </pre>
                    <p className="text-[11px] text-zinc-400">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB AGENT PROMPT (single task) */}
          {activeTab === 'agent-prompt' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3 text-[11px] text-emerald-200">
                💡 <strong>Single Task Prompt:</strong> Cocok untuk sesi AI agent yang ingin menyelesaikan 1 task spesifik saja (tanpa loop otomatis). Untuk sesi loop otomatis berkelanjutan, gunakan <strong>Tab Master Prompt Loop</strong>.
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Wand2 className="h-4 w-4 text-amber-400" />
                    AI Prompt: {currentTask?.title || 'Pilih task di Kanban'}
                  </span>
                </div>

                <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-72">
                  {aiAgentPrompt}
                </pre>

                <Button
                  onClick={() => handleCopy(aiAgentPrompt, 'ai-prompt')}
                  className="w-full h-9 text-xs gap-2 font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {copiedKey === 'ai-prompt' ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Prompt Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Salin Prompt AI Agent
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* TAB WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/10 p-3 text-xs text-indigo-200">
                ℹ️ <strong>Alur:</strong> Master Prompt → AI Agent → HTTP cURL ke API → Status berubah di Kanban Real-Time → Loop task berikutnya hingga selesai.
              </div>

              {[
                { n: 1, title: 'Salin & Paste Master Prompt', desc: 'User menyalin 1 prompt dari SaaS, lalu paste ke AI Coding Agent di terminal lokal.', icon: Sparkles },
                { n: 2, title: 'Fetch Next Task via cURL', desc: 'AI Agent menjalankan GET /api/agent/tasks/next dan mengekstrak metadata task.', icon: Terminal },
                { n: 3, title: 'Mark IN_PROGRESS', desc: 'AI Agent POST /api/agent/tasks/:id/start. Kartu di Kanban otomatis pindah.', icon: Play },
                { n: 4, title: 'Patuhi Bounded Context', desc: 'AI Agent hanya membuat/mengubah file di files_to_create & files_to_modify.', icon: ShieldCheck },
                { n: 5, title: 'Kode, Tes, Mark DONE', desc: 'Setelah implementasi lolos test_criteria, AI Agent POST /complete. Kartu pindah ke kolom DONE.', icon: CheckCircle2 },
                { n: 6, title: 'Konfirmasi & Loop', desc: 'Semi-Autonomous: AI bertanya "Lanjut? (y/n)". Full Autonomous: langsung ambil task berikutnya.', icon: Radio },
              ].map((step) => (
                <div
                  key={step.n}
                  className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                    <step.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      Langkah {step.n}: {step.title}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
