'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Terminal, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  projectName?: string;
  projectId?: string;
  projectStatus?: string;
}

export function AppHeader({ projectName, projectId, projectStatus }: AppHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-xs">
      {/* Brand & Project Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-zinc-900">
            Project AI Planner
          </span>
        </Link>

        {projectName && (
          <>
            <span className="text-zinc-300">/</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-700">{projectName}</span>
              {projectStatus && (
                <Badge variant="secondary" className="uppercase font-mono text-[10px] tracking-wider">
                  {projectStatus}
                </Badge>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-600 font-mono">
          <Terminal className="h-3 w-3 text-indigo-600" />
          <span>npx project-ai</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex h-7 items-center gap-1.5 rounded-md border border-zinc-200 px-2 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Keluar"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
