'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjectStore } from '@/lib/stores/project-store';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { WorkflowStepper } from '@/components/project/workflow-stepper';
import { ExecutionGuideModal } from '@/components/kanban/execution-guide-modal';
import { INITIAL_TASKS } from '@/lib/ai/tasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  ArrowRight,
  GitBranch,
  Key,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';

export default function TasksPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, saveTasks } = useProjectStore();

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const project = getProject(projectId);

  if (!project) return null;

  const projectTasks =
    project.tasks && project.tasks.length > 0
      ? project.tasks
      : project.id === 'futsal-booking-01'
      ? INITIAL_TASKS
      : [];

  return (
    <div className="space-y-5 pb-20 max-w-7xl mx-auto">
      {/* Workflow Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
              04
            </span>
            <h1 className="text-base font-bold tracking-tight text-zinc-100">
              Task Breakdown &amp; Bounded Context: {project.name}
            </h1>
            <Badge variant="emerald" className="text-[10px] font-mono">
              Otomatis via ai-builder
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Papan Kanban 5-kolom dengan isolasi konteks per task untuk mencegah halusinasi AI Coding Agent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Utama: Panduan Siap Copas */}
          <Button
            size="sm"
            onClick={() => setIsGuideOpen(true)}
            className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm animate-pulse"
          >
            <Sparkles className="h-3.5 w-3.5" />
            ⚡ Panduan Eksekusi (Siap Copas)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/execute`)}
            className="text-xs h-8 gap-1.5 border-zinc-700 text-zinc-300"
          >
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            Cockpit Layar Penuh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/settings`)}
            className="text-xs h-8 gap-1.5 border-zinc-700"
          >
            <Key className="h-3.5 w-3.5" />
            PAT Token
          </Button>
        </div>
      </div>

      {/* Quick Action Alert Banner */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-zinc-100">
              Bingung langkah berikutnya setelah task di-generate?
            </span>
            <span className="text-zinc-400 block mt-0.5">
              Tinggal copas 1 baris perintah terminal untuk menjalankan agen koding otomatis, atau copas prompt ke Claude Code/Cursor.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsGuideOpen(true)}
            className="text-xs h-7 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Sparkles className="h-3 w-3" />
            Buka Pop-up Siap Copas
          </Button>
          <Link href={`/projects/${projectId}/execute`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1 border-zinc-700 text-zinc-300 hover:text-zinc-100"
            >
              Halaman Penuh
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Kanban Board */}
      <KanbanBoard
        projectId={projectId}
        initialTasks={projectTasks}
        projectName={project.name}
        projectDesc={project.description || project.idea || ''}
        prd={project.prd}
        roadmap={project.roadmap}
        onSaveTasks={(newTasks) => saveTasks(projectId, newTasks)}
      />

      {/* Pop-up Info Modal (Siap Copas) */}
      <ExecutionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        projectId={projectId}
        projectName={project.name}
        tasks={projectTasks}
      />

      {/* Sticky Bottom Agent Terminal Helper Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/20 text-indigo-400 font-mono text-xs">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <div className="text-xs">
            <span className="text-zinc-400 font-mono">Perintah Terminal: </span>
            <code className="text-emerald-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              project-ai login pak_dev_terminal_agent &amp;&amp; project-ai next
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsGuideOpen(true)}
            className="text-xs gap-1.5 h-8 font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Buka Panduan Siap Copas
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}/execute`)}
            className="text-xs gap-1.5 h-8 font-mono border-zinc-700"
          >
            <ExternalLink className="h-3 w-3" />
            Cockpit Eksekusi
          </Button>
        </div>
      </div>
    </div>
  );
}
