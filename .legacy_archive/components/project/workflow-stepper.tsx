'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

interface WorkflowStepperProps {
  projectId: string;
}

const STEPS = [
  {
    id: 'discovery',
    name: '1. Discovery',
    description: 'Q&A Arsitektur',
    pathSuffix: '/discovery',
  },
  {
    id: 'prd',
    name: '2. PRD',
    description: 'Dokumen Scope',
    pathSuffix: '/prd',
  },
  {
    id: 'roadmap',
    name: '3. Roadmap',
    description: 'Alur Fase Layer',
    pathSuffix: '/roadmap',
  },
  {
    id: 'tasks',
    name: '4. Kanban',
    description: 'Eksekusi Tasks',
    pathSuffix: '/tasks',
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
    <div className="w-full bg-white border border-zinc-200 rounded-lg p-2 shadow-2xs mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIdx;
          const isCompleted = idx < currentIdx;

          return (
            <Link
              key={step.id}
              href={`/projects/${projectId}${step.pathSuffix}`}
              className={`flex items-center gap-2.5 p-2 rounded-md text-left transition-all border ${
                isActive
                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium'
                  : isCompleted
                  ? 'bg-zinc-50/50 border-zinc-200 text-zinc-700 hover:bg-zinc-100/60'
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-mono font-semibold ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate leading-tight">{step.name}</div>
                <div className="text-[10px] text-zinc-400 truncate leading-tight">{step.description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
