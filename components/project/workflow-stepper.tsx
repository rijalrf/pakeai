'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, CheckCircle2, ArrowRight, Layers, FileText, GitBranch, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WorkflowStepperProps {
  projectId: string;
}

const STEPS = [
  {
    id: 'discovery',
    name: '1. Discovery',
    description: 'Tanya Jawab Arsitektur',
    pathSuffix: '/discovery',
    icon: Sparkles,
  },
  {
    id: 'prd',
    name: '2. PRD Spesifikasi',
    description: 'Scope & Fitur MoSCoW',
    pathSuffix: '/prd',
    icon: FileText,
  },
  {
    id: 'roadmap',
    name: '3. Roadmap Graf',
    description: 'Dependensi Layer DB-BE-FE',
    pathSuffix: '/roadmap',
    icon: GitBranch,
  },
  {
    id: 'tasks',
    name: '4. Tasks & CLI Agent',
    description: 'Kanban & Bounded Context',
    pathSuffix: '/tasks',
    icon: CheckSquare,
  },
];

export function WorkflowStepper({ projectId }: WorkflowStepperProps) {
  const pathname = usePathname();

  const getCurrentStepIndex = () => {
    if (pathname.includes('/discovery')) return 0;
    if (pathname.includes('/prd')) return 1;
    if (pathname.includes('/roadmap')) return 2;
    if (pathname.includes('/tasks')) return 3;
    return 0;
  };

  const currentIdx = getCurrentStepIndex();

  return (
    <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 backdrop-blur-md shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Stepper Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {STEPS.map((step, idx) => {
            const isActive = idx === currentIdx;
            const isCompleted = idx < currentIdx;
            const Icon = step.icon;

            return (
              <Link
                key={step.id}
                href={`/projects/${projectId}${step.pathSuffix}`}
                className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-all border ${
                  isActive
                    ? 'bg-zinc-800/90 border-indigo-500/50 text-zinc-100 shadow-sm'
                    : isCompleted
                    ? 'bg-zinc-900/40 border-zinc-800/60 text-zinc-300 hover:bg-zinc-800/50'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate leading-none">{step.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate mt-1 leading-none">{step.description}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* AI Engine Status Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-zinc-800 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Otak AI: ai-builder @ port 20128
          </div>
        </div>
      </div>
    </div>
  );
}
