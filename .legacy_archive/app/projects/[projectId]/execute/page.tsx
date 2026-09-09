'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { INITIAL_TASKS, type TaskItemData } from '@/lib/ai/tasks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAgentMarkdownPrompt, buildAgentTaskContext } from '@/lib/ai/context';
import {
  Terminal,
  Copy,
  Check,
  FileCode,
  FilePlus,
  CheckCircle2,
  ArrowLeft,
  Key,
} from 'lucide-react';

export default function ProjectExecutePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, saveTasks } = useProjectStore();

  const project = getProject(projectId);
  const [token, setToken] = useState<string>('pak_dev_demo_token_1234567890abcdef');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    async function loadToken() {
      try {
        const res = await fetch(`/api/projects/${projectId}/tokens`);
        if (res.ok) {
          const data = await res.json();
          const active = data.tokens?.find((t: any) => !t.isRevoked);
          if (active?.rawToken) {
            setToken(active.rawToken);
          }
        }
      } catch {}
    }
    loadToken();
  }, [projectId]);

  const tasks: TaskItemData[] =
    project?.tasks && project.tasks.length > 0
      ? project.tasks
      : project?.id === 'futsal-booking-01'
      ? INITIAL_TASKS
      : [];

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    tasks[0]?.id || ''
  );

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleStatusChange = (newStatus: TaskItemData['status']) => {
    if (!selectedTask || !project) return;
    const updated = tasks.map((t) => (t.id === selectedTask.id ? { ...t, status: newStatus } : t));
    saveTasks(projectId, updated);
  };

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-zinc-500 text-xs">Memuat proyek...</p>
      </div>
    );
  }

  const agentPrompt = selectedTask
    ? formatAgentMarkdownPrompt(
        buildAgentTaskContext(selectedTask, project.name, project.description || project.idea || '')
      )
    : '';

  const cliLoginCmd = `npx project-ai login ${token}`;
  const cliNextCmd = `npx project-ai next`;
  const cliStartCmd = `npx project-ai start`;
  const cliDoneCmd = `npx project-ai done`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-zinc-900">
              Eksekusi Agent: {project.name}
            </h1>
            <Badge variant="secondary" className="font-mono text-[10px]">
              CLI &amp; Cursor / Claude Code
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pilih task untuk menyalin prompt bounded context atau jalankan CLI agent di terminal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/tasks`)}
            className="gap-1.5 h-8 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Kanban
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/settings`)}
            className="gap-1.5 h-8 text-xs"
          >
            <Key className="h-3.5 w-3.5 text-zinc-500" />
            Kelola Token
          </Button>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task Picker */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-zinc-500">
              Daftar Tasks ({tasks.length})
            </h2>
          </div>

          <div className="space-y-1.5 max-h-[700px] overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <p className="text-xs text-zinc-400 p-4 border border-dashed rounded-lg text-center">
                Belum ada task. Buka Kanban untuk generate.
              </p>
            ) : (
              tasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-semibold text-zinc-500">
                        #{task.id.toUpperCase()}
                      </span>
                      <Badge
                        variant={task.status === 'DONE' ? 'emerald' : task.status === 'IN_PROGRESS' ? 'amber' : 'secondary'}
                        className="text-[9px] uppercase font-mono"
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <h3 className="text-xs font-medium text-zinc-900 line-clamp-1">
                      {task.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Execution Workspace */}
        <div className="lg:col-span-8 space-y-5">
          {selectedTask ? (
            <>
              {/* Task Details Card */}
              <Card className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo" className="font-mono text-[10px]">
                        {selectedTask.layer}
                      </Badge>
                      <span className="text-xs font-mono text-zinc-400">
                        #{selectedTask.id.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-zinc-900 mt-1">
                      {selectedTask.title}
                    </h2>
                  </div>

                  {/* Quick status toggle */}
                  <div className="flex items-center gap-1">
                    {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                          selectedTask.status === st
                            ? 'bg-zinc-900 text-white font-medium shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                  {selectedTask.description}
                </p>

                {/* Target Files (Bounded Context) */}
                <div className="space-y-2 pt-3 border-t border-zinc-100 text-xs">
                  <span className="font-mono text-[10px] uppercase font-semibold text-zinc-500 block">
                    Target Bounded Context Files:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTask.ai_context.files_to_create.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px]">
                        <FilePlus className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                    {selectedTask.ai_context.files_to_modify.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[11px]">
                        <FileCode className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Terminal CLI Commands Card */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-semibold text-zinc-900 uppercase font-mono">
                      Opsi 1: Eksekusi Otomatis via Terminal CLI
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: '1. Login CLI', cmd: cliLoginCmd, key: 'login' },
                    { label: '2. Ambil Task', cmd: cliNextCmd, key: 'next' },
                    { label: '3. Mulai Task', cmd: cliStartCmd, key: 'start' },
                    { label: '4. Selesaikan Task', cmd: cliDoneCmd, key: 'done' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleCopy(item.cmd, item.key)}
                      className="p-2.5 rounded-md border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                        <span className="font-medium">{item.label}</span>
                        {copiedSection === item.key ? (
                          <span className="text-emerald-600 font-mono text-[10px] flex items-center gap-0.5">
                            <Check className="h-3 w-3" /> Tersalin
                          </span>
                        ) : (
                          <Copy className="h-3 w-3 text-zinc-400 group-hover:text-zinc-600" />
                        )}
                      </div>
                      <code className="font-mono text-[11px] text-zinc-800 truncate">
                        {item.cmd}
                      </code>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Master Prompt Copy Box */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-semibold text-zinc-900 uppercase font-mono">
                      Opsi 2: Salin Bounded Context Prompt (Claude Code / Cursor)
                    </h3>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCopy(agentPrompt, 'agent-prompt')}
                    className="h-7 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {copiedSection === 'agent-prompt' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Salin Prompt
                      </>
                    )}
                  </Button>
                </div>

                <pre className="max-h-72 overflow-y-auto rounded-md bg-zinc-900 text-zinc-100 p-3 font-mono text-[11px] leading-relaxed border border-zinc-800">
                  {agentPrompt}
                </pre>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-zinc-400">
              Pilih task di sebelah kiri untuk melihat panduan eksekusi.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
