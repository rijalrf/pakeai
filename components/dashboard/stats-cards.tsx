'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderGit2, Kanban, ShieldAlert, Cpu } from 'lucide-react';

interface StatsCardsProps {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingCheckpoints: number;
}

export function StatsCards({
  totalProjects,
  totalTasks,
  completedTasks,
  pendingCheckpoints,
}: StatsCardsProps) {
  const stats = [
    {
      title: 'Total Project',
      value: totalProjects,
      desc: 'Workspace aktif',
      icon: FolderGit2,
      badge: `${totalProjects} aktif`,
      variant: 'default' as const,
    },
    {
      title: 'Eksekusi Task',
      value: `${completedTasks}/${totalTasks}`,
      desc: 'Task selesai oleh AI agent',
      icon: Kanban,
      badge: 'Kanban synced',
      variant: 'emerald' as const,
    },
    {
      title: 'Human Checkpoint',
      value: pendingCheckpoints,
      desc: 'Persetujuan gate yang tertunda',
      icon: ShieldAlert,
      badge: pendingCheckpoints > 0 ? 'Perlu Review' : 'Semua Clear',
      variant: pendingCheckpoints > 0 ? 'amber' as const : 'secondary' as const,
    },
    {
      title: 'AI Provider Engine',
      value: 'Claude / GPT / Gemini',
      desc: 'Structured JSON Driver',
      icon: Cpu,
      badge: 'Ready',
      variant: 'indigo' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="p-4 bg-zinc-900/60 border-zinc-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-zinc-400">{item.title}</span>
              <Icon className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-zinc-100">{item.value}</span>
              <Badge variant={item.variant}>{item.badge}</Badge>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5">{item.desc}</p>
          </Card>
        );
      })}
    </div>
  );
}
