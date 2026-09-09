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
          dotColor: 'bg-zinc-400',
          badgeClass: 'bg-zinc-100 text-zinc-600',
        };
      case 'IN_PROGRESS':
        return {
          icon: Clock,
          dotColor: 'bg-amber-500',
          badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
        };
      case 'REVIEW':
        return {
          icon: HelpCircle,
          dotColor: 'bg-indigo-500',
          badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        };
      case 'DONE':
        return {
          icon: CheckCircle2,
          dotColor: 'bg-emerald-500',
          badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        };
      case 'BLOCKED':
        return {
          icon: AlertOctagon,
          dotColor: 'bg-rose-500',
          badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
        };
    }
  };

  const meta = getColumnMeta(status);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId && onStatusChange) {
          onStatusChange(taskId, status);
        }
      }}
      className="flex flex-col min-w-[260px] w-full max-w-[320px] rounded-lg border border-zinc-200 bg-zinc-50/60 p-2.5 shadow-2xs flex-1 transition-colors hover:border-zinc-300"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${meta.dotColor}`} />
          <h3 className="text-xs font-semibold tracking-tight text-zinc-800 uppercase font-mono">
            {title}
          </h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${meta.badgeClass}`}>
          {tasks.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-2 min-h-[420px] overflow-y-auto pr-0.5">
        {tasks.length === 0 ? (
          <div className="flex h-28 flex-col items-center justify-center rounded border border-dashed border-zinc-200 text-center">
            <span className="text-[11px] font-mono text-zinc-400">Tidak ada task</span>
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
