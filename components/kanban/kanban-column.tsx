'use client';

import React from 'react';
import type { TaskItemData } from '@/lib/ai/tasks';
import { KanbanCard } from './kanban-card';
import { Circle, Clock, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskItemData['status'];
  title: string;
  tasks: TaskItemData[];
  allTasks: TaskItemData[];
  onSelectTask: (task: TaskItemData) => void;
  onStatusChange?: (taskId: string, newStatus: TaskItemData['status']) => void;
}

export function KanbanColumn({
  status,
  title,
  tasks,
  allTasks,
  onSelectTask,
  onStatusChange,
}: KanbanColumnProps) {
  const getColumnMeta = (st: TaskItemData['status']) => {
    switch (st) {
      case 'TODO':
        return {
          icon: Circle,
          dotColor: 'bg-zinc-500',
          badgeClass: 'bg-zinc-800 text-zinc-400',
        };
      case 'IN_PROGRESS':
        return {
          icon: Clock,
          dotColor: 'bg-amber-400',
          badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        };
      case 'REVIEW':
        return {
          icon: HelpCircle,
          dotColor: 'bg-indigo-400',
          badgeClass: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
        };
      case 'DONE':
        return {
          icon: CheckCircle2,
          dotColor: 'bg-emerald-400',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        };
      case 'BLOCKED':
        return {
          icon: AlertOctagon,
          dotColor: 'bg-rose-400',
          badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        };
    }
  };

  const meta = getColumnMeta(status);
  const Icon = meta.icon;

  return (
    <div className="flex flex-col min-w-[280px] w-full max-w-[340px] rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 shadow-sm backdrop-blur-xs flex-1">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${meta.dotColor}`} />
          <h3 className="text-xs font-bold tracking-tight text-zinc-200 uppercase font-mono">
            {title}
          </h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${meta.badgeClass}`}>
          {tasks.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-2.5 min-h-[450px] overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800/80 text-center">
            <span className="text-[11px] font-mono text-zinc-600">Tidak ada task</span>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              allTasks={allTasks}
              onSelectTask={onSelectTask}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
