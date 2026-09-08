'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentProjects } from '@/components/dashboard/recent-projects';
import { useProjectStore } from '@/lib/stores/project-store';
import { Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const { projects, userProfile } = useProjectStore();
  const [copied, setCopied] = useState(false);

  const copyCLI = () => {
    navigator.clipboard.writeText('npx project-ai login');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout hideSidebar={false}>
      <div className="space-y-6">
        {/* Top Developer Welcome & CLI Quick Command */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Selamat Datang, {userProfile.fullName || 'Developer'} 👋
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Level: <span className="text-zinc-200 capitalize font-medium">{userProfile.skillLevel}</span> •
              Target: <span className="text-zinc-200 font-medium">{userProfile.goals.join(', ')}</span>
            </p>
          </div>

          {/* Quick Command Box */}
          <div
            onClick={copyCLI}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 cursor-pointer hover:border-zinc-700 transition-colors group"
            title="Klik untuk salin command"
          >
            <Terminal className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
            <code className="font-mono text-xs text-zinc-300">npx project-ai login</code>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 ml-1" />
            ) : (
              <Copy className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 ml-1" />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <StatsCards
          totalProjects={projects.length}
          totalTasks={14}
          completedTasks={4}
          pendingCheckpoints={0}
        />

        {/* Projects Section */}
        <RecentProjects projects={projects} />
      </div>
    </AppLayout>
  );
}
