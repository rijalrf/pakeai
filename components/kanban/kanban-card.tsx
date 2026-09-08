'use client';

import React from 'react';
import type { TaskItemData } from '@/lib/ai/tasks';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Server,
  Layout,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Link as LinkIcon,
  ChevronRight,
  Bot,
} from 'lucide-react';

interface KanbanCardProps {
  task: TaskItemData;
  allTasks: TaskItemData[];
  onSelectTask: (task: TaskItemData) => void;
  onStatusChange?: (taskId: string, newStatus: TaskItemData['status']) => void;
}

export function KanbanCard({
  task,
  allTasks,
  onSelectTask,
  onStatusChange,
}: KanbanCardProps) {
  // Layer styling
  const getLayerMeta = (layer: TaskItemData['layer']) => {
    switch (layer) {
      case 'DATABASE':
        return { label: 'DB', icon: Database, badge: 'border-sky-500/40 text-sky-400 bg-sky-950/20' };
      case 'BACKEND':
        return { label: 'API', icon: Server, badge: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' };
      case 'FRONTEND':
        return { label: 'UI', icon: Layout, badge: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20' };
      default:
        return { label: 'OPS', icon: Terminal, badge: 'border-amber-500/40 text-amber-400 bg-amber-950/20' };
    }
  };

  // Priority indicator
  const getPriorityColor = (priority: TaskItemData['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-500 shadow-rose-500/50';
      case 'high':
        return 'bg-amber-500 shadow-amber-500/50';
      case 'medium':
        return 'bg-sky-500 shadow-sky-500/50';
      default:
        return 'bg-zinc-500 shadow-zinc-500/50';
    }
  };

  // Check if dependencies are resolved
  const uncompletedDependencies = (task.depends_on_task_ids || [])
    .map((depId) => allTasks.find((t) => t.id === depId))
    .filter((dep) => dep && dep.status !== 'DONE');

  const hasUncompletedDeps = uncompletedDependencies.length > 0;
  const meta = getLayerMeta(task.layer);
  const Icon = meta.icon;

  return (
    <div
      onClick={() => onSelectTask(task)}
      className="group relative flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3.5 shadow-sm backdrop-blur-sm transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-md cursor-pointer"
    >
      {/* Top Meta Line: ID, Layer, Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
            #{task.id.toUpperCase()}
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${meta.badge}`}>
            <Icon className="h-2.5 w-2.5" />
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-zinc-500">
            {task.estimated_complexity}
          </span>
          <span
            title={`Priority: ${task.priority}`}
            className={`h-2 w-2 rounded-full shadow-sm ${getPriorityColor(task.priority)}`}
          />
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-zinc-100 leading-snug group-hover:text-white transition-colors mb-1.5">
        {task.title}
      </h4>

      {/* Short Description */}
      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
        {task.description}
      </p>

      {/* Dependency Warning */}
      {hasUncompletedDeps && (
        <div className="mb-2 flex items-center gap-1.5 rounded bg-rose-950/30 border border-rose-800/30 px-2 py-1 text-[10px] text-rose-300">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Menunggu: {uncompletedDependencies.map((d) => d?.title).join(', ')}
          </span>
        </div>
      )}

      {/* Card Footer: Criteria count & Quick Action */}
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-zinc-500" />
          <span>{task.acceptance_criteria.length} kriteria</span>
        </div>

        <div className="flex items-center gap-1 text-zinc-400 group-hover:text-zinc-200 transition-colors">
          <span>Detail</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
