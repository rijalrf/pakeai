'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { RecentProjects } from '@/components/dashboard/recent-projects';
import { useProjectStore } from '@/lib/stores/project-store';
import { Terminal, Copy, Check } from 'lucide-react';

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
        {/* Welcome & CLI Quick Command */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900">
              Selamat Datang, {userProfile.fullName || 'Developer'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Workspace orchestrator untuk AI coding agent.
            </p>
          </div>

          {/* Quick Command Box */}
          <div
            onClick={copyCLI}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 cursor-pointer hover:border-zinc-300 transition-colors shadow-xs"
            title="Klik untuk salin perintah"
          >
            <Terminal className="h-3.5 w-3.5 text-indigo-600" />
            <code className="font-mono text-xs text-zinc-800">npx project-ai login</code>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 ml-1" />
            ) : (
              <Copy className="h-3 w-3 text-zinc-400 hover:text-zinc-600 ml-1" />
            )}
          </div>
        </div>

        {/* Projects List */}
        <RecentProjects projects={projects} />
      </div>
    </AppLayout>
  );
}
