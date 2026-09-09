'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  Terminal,
  KeyRound,
  Plus,
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
        { label: 'Kanban Tasks', href: `/projects/${projectId}/tasks`, icon: Kanban },
        { label: 'Eksekusi Agent', href: `/projects/${projectId}/execute`, icon: Terminal },
        { label: 'Token & Pengaturan', href: `/projects/${projectId}/settings`, icon: KeyRound },
      ]
    : [];

  return (
    <aside className="w-52 shrink-0 border-r border-zinc-200 bg-white flex flex-col justify-between p-3">
      <div className="space-y-4">
        {/* Workspace */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
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
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                )}
              >
                <Icon className="h-3.5 w-3.5 text-zinc-500" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Project Navigation */}
        {projectId && (
          <div className="space-y-1 pt-2 border-t border-zinc-100">
            <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Menu Proyek
            </p>
            {projectNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-indigo-600' : 'text-zinc-500')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="pt-3 border-t border-zinc-100">
        <Link
          href="/projects/new"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Project Baru</span>
        </Link>
      </div>
    </aside>
  );
}
