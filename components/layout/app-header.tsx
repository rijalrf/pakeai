'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Terminal, Sparkles, User, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AppHeaderProps {
  projectName?: string;
  projectId?: string;
  projectStatus?: string;
}

export function AppHeader({ projectName, projectId, projectStatus }: AppHeaderProps) {
  const pathname = usePathname();

  const steps = [
    { label: 'Discovery', href: projectId ? `/projects/${projectId}/discovery` : '#' },
    { label: 'PRD', href: projectId ? `/projects/${projectId}/prd` : '#' },
    { label: 'Roadmap', href: projectId ? `/projects/${projectId}/roadmap` : '#' },
    { label: 'Tasks', href: projectId ? `/projects/${projectId}/tasks` : '#' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-13 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/85 px-4 backdrop-blur-md">
      {/* Left: Project Brand & Active Project Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-950 font-bold text-xs shadow-sm transition-transform group-hover:scale-105">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-zinc-200">
            Project AI Planner
          </span>
        </Link>

        {projectName && (
          <>
            <span className="text-zinc-600">/</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-100">{projectName}</span>
              {projectStatus && (
                <Badge variant="emerald" className="uppercase font-mono text-[10px] tracking-wider">
                  {projectStatus}
                </Badge>
              )}
            </div>
          </>
        )}
      </div>

      {/* Center: Stage Progress Tracker (if within project) */}
      {projectId && (
        <nav className="hidden md:flex items-center gap-1 rounded-md border border-zinc-800/80 bg-zinc-900/40 p-1">
          {steps.map((step, idx) => {
            const isActive = pathname.includes(step.href);
            return (
              <Link
                key={step.label}
                href={step.href}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span className="font-mono text-[10px] text-zinc-500">{idx + 1}</span>
                {step.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Right: Quick actions & CLI Agent indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-[11px] text-zinc-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>CLI: npx project-ai</span>
        </div>

        <Link
          href={projectId ? `/projects/${projectId}/settings` : '/dashboard'}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          title="Profile & Settings"
        >
          <User className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
