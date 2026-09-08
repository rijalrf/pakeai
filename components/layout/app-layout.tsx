'use client';

import React from 'react';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  projectName?: string;
  projectId?: string;
  projectStatus?: string;
  hideSidebar?: boolean;
}

export function AppLayout({
  children,
  projectName,
  projectId,
  projectStatus,
  hideSidebar = false,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <AppHeader
        projectName={projectName}
        projectId={projectId}
        projectStatus={projectStatus}
      />
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && <AppSidebar projectId={projectId} />}
        <main className="flex-1 overflow-y-auto p-6 bg-dot-grid">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
