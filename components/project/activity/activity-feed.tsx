'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  GitCommit,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  FileText,
  GitBranch,
  Sparkles,
  Clock,
  Key,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'discovery' | 'prd' | 'roadmap' | 'task' | 'agent' | 'checkpoint';
  title: string;
  description: string;
  timestamp: string;
  actor: {
    name: string;
    role: string;
    isAi?: boolean;
  };
  metadata?: {
    layer?: string;
    taskId?: string;
    tokensUsed?: number;
    duration?: string;
  };
}

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-7',
    type: 'agent',
    title: 'CLI Agent Memulai Task #TASK-BE-1',
    description: 'AI Coding Agent mengambil context bounded untuk implementasi hold engine concurrency lock.',
    timestamp: 'Baru saja',
    actor: {
      name: 'project-ai CLI (Terminal)',
      role: 'Agent Runtime',
      isAi: true,
    },
    metadata: {
      layer: 'BACKEND',
      taskId: 'task-be-1',
    },
  },
  {
    id: 'act-6',
    type: 'checkpoint',
    title: 'Checkpoint Layer DATABASE Disetujui',
    description: 'Lead Developer mengesahkan skema tabel profiles, venues, dan constraints sebelum beralih ke layer backend.',
    timestamp: '15 menit yang lalu',
    actor: {
      name: 'Rijal (You)',
      role: 'Lead Developer',
    },
    metadata: {
      layer: 'DATABASE',
    },
  },
  {
    id: 'act-5',
    type: 'task',
    title: 'Task #TASK-DB-2 Selesai',
    description: 'Tabel venues, courts, dan slot waktu per jam berhasil di-generate dan di-migrasi ke PostgreSQL.',
    timestamp: '45 menit yang lalu',
    actor: {
      name: 'AI Coding Agent (Claude 3.5)',
      role: 'Coding Assistant',
      isAi: true,
    },
    metadata: {
      layer: 'DATABASE',
      taskId: 'task-db-2',
      duration: '42s',
    },
  },
  {
    id: 'act-4',
    type: 'roadmap',
    title: 'Roadmap Arsitektural 4-Layer Disetujui',
    description: 'Graf dependensi React Flow diverifikasi: Database -> Backend -> Frontend -> Operator.',
    timestamp: '1 jam yang lalu',
    actor: {
      name: 'Rijal (You)',
      role: 'Product Owner',
    },
  },
  {
    id: 'act-3',
    type: 'prd',
    title: 'PRD JSON v1 Disetujui',
    description: 'Dokumen kebutuhan produk untuk Aplikasi Booking Lapangan Futsal disahkan dengan 8 fitur MoSCoW.',
    timestamp: '2 jam yang lalu',
    actor: {
      name: 'Rijal (You)',
      role: 'Product Owner',
    },
    metadata: {
      tokensUsed: 1420,
    },
  },
  {
    id: 'act-2',
    type: 'discovery',
    title: 'AI Product Discovery Selesai',
    description: '5 pertanyaan arsitektural telah dijawab untuk menyempurnakan spesifikasi teknis dan batas lingkup.',
    timestamp: '3 jam yang lalu',
    actor: {
      name: 'Claude 3.5 Sonnet',
      role: 'Solutions Architect',
      isAi: true,
    },
    metadata: {
      tokensUsed: 980,
    },
  },
  {
    id: 'act-1',
    type: 'agent',
    title: 'Project Initialized',
    description: 'Workspace project dibuat dengan stack Next.js, Supabase, Tailwind, dan TypeScript.',
    timestamp: '4 jam yang lalu',
    actor: {
      name: 'Rijal (You)',
      role: 'Owner',
    },
  },
];

export function ActivityFeed({ activities = INITIAL_ACTIVITIES }: { activities?: ActivityItem[] }) {
  const getTypeMeta = (type: ActivityItem['type']) => {
    switch (type) {
      case 'agent':
        return { icon: Terminal, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30' };
      case 'checkpoint':
        return { icon: ShieldCheck, color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' };
      case 'task':
        return { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' };
      case 'roadmap':
        return { icon: GitBranch, color: 'text-sky-400 bg-sky-950/40 border-sky-500/30' };
      case 'prd':
        return { icon: FileText, color: 'text-purple-400 bg-purple-950/40 border-purple-500/30' };
      case 'discovery':
        return { icon: Sparkles, color: 'text-amber-300 bg-amber-950/40 border-amber-500/30' };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-zinc-800">
      {activities.map((item) => {
        const meta = getTypeMeta(item.type);
        const Icon = meta.icon;

        return (
          <div key={item.id} className="relative group">
            {/* Timeline Dot Icon */}
            <div
              className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border bg-zinc-950 shadow-sm transition-transform group-hover:scale-110 ${meta.color}`}
            >
              <Icon className="h-3 w-3" />
            </div>

            {/* Content Card */}
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-3.5 backdrop-blur-xs transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h4 className="text-xs font-semibold text-zinc-100">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                  <Clock className="h-3 w-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {item.description}
              </p>

              {/* Actor & Metadata Footer */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/40 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-zinc-500">By:</span>
                  <span className="text-zinc-300 font-medium">{item.actor.name}</span>
                  {item.actor.isAi && (
                    <span className="rounded bg-indigo-500/10 text-indigo-400 px-1 py-0.2 border border-indigo-500/20 text-[9px]">
                      AI AGENT
                    </span>
                  )}
                </div>

                {item.metadata && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    {item.metadata.layer && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {item.metadata.layer}
                      </span>
                    )}
                    {item.metadata.taskId && (
                      <span className="text-zinc-400">
                        #{item.metadata.taskId.toUpperCase()}
                      </span>
                    )}
                    {item.metadata.tokensUsed && (
                      <span>{item.metadata.tokensUsed} tokens</span>
                    )}
                    {item.metadata.duration && (
                      <span>{item.metadata.duration}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
