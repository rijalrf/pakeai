'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  FileText,
  GitBranch,
  Kanban,
  KeyRound,
  Settings,
  Activity,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  projectId?: string;
}

export function AppSidebar({ projectId }: AppSidebarProps) {
  const pathname = usePathname();

  const generalNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  const projectNav = projectId
    ? [
        { label: 'Overview', href: `/projects/${projectId}`, icon: Compass },
        { label: 'AI Discovery', href: `/projects/${projectId}/discovery`, icon: Compass },
        { label: 'PRD Document', href: `/projects/${projectId}/prd`, icon: FileText },
        { label: 'Roadmap Flow', href: `/projects/${projectId}/roadmap`, icon: GitBranch },
        { label: 'Kanban Tasks', href: `/projects/${projectId}/tasks`, icon: Kanban },
        { label: 'Activity & Logs', href: `/projects/${projectId}/activity`, icon: Activity },
        { label: 'PAT & Agent CLI', href: `/projects/${projectId}/settings`, icon: KeyRound },
        { label: 'Pengaturan', href: `/projects/${projectId}/settings`, icon: Settings },
      ]
    : [];

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col justify-between p-3">
      <div className="space-y-4">
        {/* Workspace Quick Link */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Workspace
          </p>
          {generalNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                )}
              >
                <Icon className="h-3.5 w-3.5 text-zinc-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Project Specific Navigation */}
        {projectId && (
          <div className="space-y-1 pt-2 border-t border-zinc-800/50">
            <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Project Workflow
            </p>
            {projectNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="pt-3 border-t border-zinc-800/50">
        <Link
          href="/projects/new"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-700/60 bg-zinc-900/30 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Project Baru</span>
        </Link>
      </div>
    </aside>
  );
}
