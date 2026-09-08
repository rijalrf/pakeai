'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjectStore } from '@/lib/stores/project-store';
import { WorkflowStepper } from '@/components/project/workflow-stepper';
import { INITIAL_TASKS, type TaskItemData } from '@/lib/ai/tasks';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Code2,
  FileCode,
  Layers,
  Wand2,
  Play,
  Key,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  FolderPlus,
  FileEdit,
  TestTube2,
  ListTodo,
} from 'lucide-react';

export default function ProjectExecutePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, saveTasks } = useProjectStore();

  const project = getProject(projectId);

  const tasks: TaskItemData[] =
    project?.tasks && project.tasks.length > 0
      ? project.tasks
      : project?.id === 'futsal-booking-01'
      ? INITIAL_TASKS
      : [];

  // Default ke task yang berstatus IN_PROGRESS atau TODO pertama
  const initialTaskIndex = tasks.findIndex(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'TODO'
  );
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(
    initialTaskIndex >= 0 ? initialTaskIndex : 0
  );
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const selectedTask: TaskItemData | undefined = tasks[selectedTaskIndex] || tasks[0];

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2200);
  };

  const handleMarkStatus = (newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!selectedTask || !project) return;
    const updatedTasks = tasks.map((t) =>
      t.id === selectedTask.id ? { ...t, status: newStatus } : t
    );
    saveTasks(projectId, updatedTasks);
  };

  const defaultToken = 'pak_dev_terminal_agent';
  const oneLinerCmd = `project-ai login ${defaultToken} && project-ai next`;

  const aiPrompt = selectedTask
    ? `Halo OpenCode, tolong kerjakan task berikut pada project ini secara akurat:

TASK: ${selectedTask.title}
PROJECT: ${project?.name || 'Aplikasi Software'}
TASK ID: #${selectedTask.id} (Sequence #${selectedTask.sequence})
LAYER: ${selectedTask.layer} | PRIORITAS: ${selectedTask.priority?.toUpperCase() || 'HIGH'}

--- DESKRIPSI FITUR ---
${selectedTask.description}

--- ACCEPTANCE CRITERIA ---
${selectedTask.acceptance_criteria?.map((ac, i) => `${i + 1}. ${ac}`).join('\n') || '- Sesuai spesifikasi PRD'}

--- DAFTAR FILE (ISOLASI BOUNDED CONTEXT) ---
Hanya buat dan modifikasi file berikut. JANGAN mengubah file lain di luar daftar ini:
• File yang harus dibuat:
${selectedTask.ai_context?.files_to_create?.length ? selectedTask.ai_context.files_to_create.map((f) => `  + ${f}`).join('\n') : '  (Tidak ada file baru)'}

• File yang boleh dimodifikasi:
${selectedTask.ai_context?.files_to_modify?.length ? selectedTask.ai_context.files_to_modify.map((f) => `  ~ ${f}`).join('\n') : '  (Tidak ada file modifikasi)'}

--- INSTRUKSI KODING & PENGUJIAN ---
Instruksi: ${selectedTask.ai_context?.instructions || 'Implementasikan kode secara modular dan clean.'}
Kriteria Pengujian: ${selectedTask.ai_context?.test_criteria || 'Pastikan file terbuat dan syntax valid.'}

ATURAN KETAT UNTUK ANDA:
1. Kerjakan HANYA 1 task ini sampai tuntas di folder repository saat ini.
2. Buat file-file yang tercantum di atas sekarang juga.`
    : '';

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-zinc-400 text-xs">
        Memuat proyek...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Workflow Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
              ⚡
            </span>
            <h1 className="text-base font-bold tracking-tight text-zinc-100">
              Cockpit Eksekusi AI Coding Agent (Siap Copas)
            </h1>
            <Badge variant="emerald" className="text-[10px] font-mono">
              Live Bounded Context
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Salin instruksi terisolasi ke terminal CLI atau langsung paste ke Claude Code / Cursor / Windsurf.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/tasks`)}
            className="text-xs h-8 gap-1.5 border-zinc-700"
          >
            <ListTodo className="h-3.5 w-3.5" />
            Buka Papan Kanban
          </Button>

          <Button
            size="sm"
            onClick={() => handleCopy(oneLinerCmd, 'header-oneliner')}
            className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            {copiedSection === 'header-oneliner' ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Salin Perintah CLI (1-Baris)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Task Selector (30%) + Right Copas Cockpit (70%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Task Queue Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              Antrean Task ({tasks.length})
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Pilih untuk ganti context</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {tasks.map((task, idx) => {
              const isSelected = idx === selectedTaskIndex;
              const isDone = task.status === 'DONE';
              const isInProgress = task.status === 'IN_PROGRESS';

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskIndex(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500/80 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/30'
                      : 'border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] text-zinc-500 font-bold">
                      #{task.id}
                    </span>
                    <Badge
                      variant={isDone ? 'emerald' : isInProgress ? 'amber' : 'secondary'}
                      className="text-[9px] font-mono capitalize px-1.5 py-0"
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="text-xs font-semibold text-zinc-200 line-clamp-1 mb-1.5">
                    {task.title}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                    <span className="uppercase text-indigo-300 font-bold">{task.layer}</span>
                    <span>•</span>
                    <span>{task.estimated_complexity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Task Copas Cockpit */}
        {selectedTask ? (
          <div className="lg:col-span-8 space-y-4">
            {/* Active Task Summary Card */}
            <Card className="border-zinc-800 bg-zinc-900/70 shadow-lg">
              <CardHeader className="pb-3 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo" className="font-mono text-[10px] uppercase">
                      {selectedTask.layer}
                    </Badge>
                    <span className="font-mono text-xs text-zinc-400">#{selectedTask.id}</span>
                  </div>

                  {/* Quick Status Updater */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-mono">Status:</span>
                    {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleMarkStatus(st)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                          selectedTask.status === st
                            ? st === 'DONE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                              : st === 'IN_PROGRESS'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                              : 'bg-zinc-800 text-zinc-200 border-zinc-700 font-bold'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <CardTitle className="text-base font-bold text-zinc-100 pt-2 leading-snug">
                  {selectedTask.title}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-300">
                  {selectedTask.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* 1. Terminal One-Liner Box (Siap Copas) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                      <Terminal className="h-3.5 w-3.5" />
                      1. Jalankan di Terminal (CLI Agent Otomatis)
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(oneLinerCmd, 'cli-cmd')}
                      className="h-6 text-[11px] gap-1 text-emerald-400 hover:text-emerald-300"
                    >
                      {copiedSection === 'cli-cmd' ? (
                        <>
                          <Check className="h-3 w-3" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Salin Perintah
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-xs overflow-x-auto">
                    {oneLinerCmd}
                  </pre>
                </div>

                {/* 2. Full AI Agent Prompt Box (Siap Copas) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-mono">
                      <Wand2 className="h-3.5 w-3.5 text-indigo-400" />
                      2. Atau Copas ke AI Coding Agent (Claude Code / Cursor / Windsurf)
                    </label>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(aiPrompt, 'prompt-full')}
                      className="h-6 text-[11px] gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    >
                      {copiedSection === 'prompt-full' ? (
                        <>
                          <Check className="h-3 w-3" />
                          Prompt Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Salin Seluruh Prompt
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <textarea
                      readOnly
                      rows={10}
                      value={aiPrompt}
                      className="w-full font-mono text-[11px] leading-relaxed p-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* 3. Bounded Context File Isolations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Files to Create */}
                  <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                      <span className="flex items-center gap-1.5 text-sky-400">
                        <FolderPlus className="h-3.5 w-3.5" />
                        Files to Create:
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {selectedTask.ai_context?.files_to_create?.length || 0} file
                      </span>
                    </div>
                    {selectedTask.ai_context?.files_to_create?.length ? (
                      <div className="space-y-1 font-mono text-[10px] text-sky-300">
                        {selectedTask.ai_context.files_to_create.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-1.5 rounded bg-zinc-900 border border-zinc-800/60"
                          >
                            <span className="truncate">{f}</span>
                            <button
                              onClick={() => handleCopy(f, `f-create-${i}`)}
                              className="text-zinc-500 hover:text-zinc-300 p-0.5"
                            >
                              {copiedSection === `f-create-${i}` ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">Tidak ada file baru dibuat.</p>
                    )}
                  </div>

                  {/* Files to Modify */}
                  <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <FileEdit className="h-3.5 w-3.5" />
                        Files to Modify:
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {selectedTask.ai_context?.files_to_modify?.length || 0} file
                      </span>
                    </div>
                    {selectedTask.ai_context?.files_to_modify?.length ? (
                      <div className="space-y-1 font-mono text-[10px] text-amber-300">
                        {selectedTask.ai_context.files_to_modify.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-1.5 rounded bg-zinc-900 border border-zinc-800/60"
                          >
                            <span className="truncate">{f}</span>
                            <button
                              onClick={() => handleCopy(f, `f-mod-${i}`)}
                              className="text-zinc-500 hover:text-zinc-300 p-0.5"
                            >
                              {copiedSection === `f-mod-${i}` ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">Tidak ada file yang dimodifikasi.</p>
                    )}
                  </div>
                </div>

                {/* 4. Test Criteria Box */}
                {selectedTask.ai_context?.test_criteria && (
                  <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-950/10 space-y-1">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <TestTube2 className="h-3.5 w-3.5 text-indigo-400" />
                      Kriteria Pengujian (Test Verification):
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-mono text-[11px]">
                      {selectedTask.ai_context.test_criteria}
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/projects/${projectId}/tasks`)}
                  className="gap-1.5 text-xs h-8 border-zinc-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali ke Kanban Board
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      handleMarkStatus('DONE');
                      if (selectedTaskIndex < tasks.length - 1) {
                        setSelectedTaskIndex(selectedTaskIndex + 1);
                      }
                    }}
                    className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tandai Task Selesai &amp; Lanjut Berikutnya
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-zinc-400 text-xs border border-dashed border-zinc-800 rounded-xl">
            Tidak ada task yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
}
