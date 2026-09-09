'use client';

import React from 'react';
import type { TaskItemData } from '@/lib/ai/tasks';
import {
  Database,
  Server,
  Layout,
  Terminal,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
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
}: KanbanCardProps) {
  const getLayerMeta = (layer: TaskItemData['layer']) => {
    switch (layer) {
      case 'DATABASE':
        return { label: 'DB', icon: Database, badge: 'border-sky-200 text-sky-700 bg-sky-50' };
      case 'BACKEND':
        return { label: 'API', icon: Server, badge: 'border-emerald-200 text-emerald-700 bg-emerald-50' };
      case 'FRONTEND':
        return { label: 'UI', icon: Layout, badge: 'border-indigo-200 text-indigo-700 bg-indigo-50' };
      default:
        return { label: 'OPS', icon: Terminal, badge: 'border-amber-200 text-amber-700 bg-amber-50' };
    }
  };

  const getPriorityColor = (priority: TaskItemData['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-500';
      case 'high':
        return 'bg-amber-500';
      case 'medium':
        return 'bg-indigo-500';
      default:
        return 'bg-zinc-400';
    }
  };

  const uncompletedDependencies = (task.depends_on_task_ids || [])
    .map((depId) => allTasks.find((t) => t.id === depId))
    .filter((dep) => dep && dep.status !== 'DONE');

  const hasUncompletedDeps = uncompletedDependencies.length > 0;
  const meta = getLayerMeta(task.layer);
  const Icon = meta.icon;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onSelectTask(task)}
      className="group relative flex flex-col rounded-lg border border-zinc-200 bg-white p-3 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs cursor-grab active:cursor-grabbing"
    >
      {/* Top Meta Line */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-semibold text-zinc-500">
            #{task.id.toUpperCase()}
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${meta.badge}`}>
            <Icon className="h-2.5 w-2.5" />
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-zinc-400">
            {task.estimated_complexity}
          </span>
          <span
            title={`Priority: ${task.priority}`}
            className={`h-1.5 w-1.5 rounded-full ${getPriorityColor(task.priority)}`}
          />
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-zinc-900 leading-snug group-hover:text-indigo-600 transition-colors mb-1">
        {task.title}
      </h4>

      {/* Description */}
      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mb-2.5">
        {task.description}
      </p>

      {/* Dependency Warning */}
      {hasUncompletedDeps && (
        <div className="mb-2 flex items-center gap-1.5 rounded bg-rose-50 border border-rose-200 px-2 py-1 text-[10px] text-rose-700">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Tunggu: {uncompletedDependencies.map((d) => d?.title).join(', ')}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-100 text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-zinc-400" />
          <span>{task.acceptance_criteria.length} kriteria</span>
        </div>

        <div className="flex items-center gap-0.5 text-zinc-500 group-hover:text-indigo-600 transition-colors">
          <span>Detail</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
