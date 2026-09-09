'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { TaskItemData } from '@/lib/ai/tasks';
import type { TaskLayer, TaskStatus } from '@/lib/db/database.types';
import { KanbanColumn } from './kanban-column';
import { TaskDetailDrawer } from './task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FALLBACK_PRD } from '@/lib/ai/prd';
import { FALLBACK_ROADMAP } from '@/lib/ai/roadmap';
import {
  Layers,
  Sparkles,
  Database,
  Server,
  Layout,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface KanbanBoardProps {
  initialTasks?: TaskItemData[];
  projectName: string;
  projectDesc: string;
  projectId?: string;
  prd?: any;
  roadmap?: any;
  onSaveTasks?: (tasks: TaskItemData[]) => void;
}

export function KanbanBoard({
  initialTasks = [],
  projectName,
  projectDesc,
  projectId,
  prd,
  roadmap,
  onSaveTasks,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskItemData[]>(initialTasks);
  const [selectedLayer, setSelectedLayer] = useState<string>('ALL');
  const [activeTask, setActiveTask] = useState<TaskItemData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isPollingRef = useRef(false);

  // Sync tasks from server via polling
  const fetchTasksFromServer = useCallback(async () => {
    if (!projectId || isGenerating || isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
        setTasks(data.tasks);
        if (onSaveTasks) onSaveTasks(data.tasks);
      }
    } catch {
      // Silent error on background poll
    } finally {
      isPollingRef.current = false;
    }
  }, [projectId, isGenerating, onSaveTasks]);

  // Polling interval: 15 detik
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(fetchTasksFromServer, 15000);
    return () => clearInterval(interval);
  }, [projectId, fetchTasksFromServer]);

  // Generate Tasks from Roadmap using AI
  const handleGenerateTasksWithAI = async () => {
    if (!projectId) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const prdToUse = prd || FALLBACK_PRD;
      const roadmapToUse = roadmap || FALLBACK_ROADMAP;

      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd: prdToUse, roadmap: roadmapToUse }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan tasks dari AI');
      }

      if (data.tasks && data.tasks.length > 0) {
        setTasks(data.tasks);
        if (onSaveTasks) onSaveTasks(data.tasks);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  // Update Status Task
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
      if (onSaveTasks) onSaveTasks(updated);
      return updated;
    });

    if (activeTask && activeTask.id === taskId) {
      setActiveTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    if (!projectId) return;

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Silent rollback fallback
    }
  };

  // Filter Tasks by Layer
  const filteredTasks = useMemo(() => {
    if (selectedLayer === 'ALL') return tasks;
    return tasks.filter((t) => t.layer === (selectedLayer as TaskLayer));
  }, [tasks, selectedLayer]);

  const columns: { status: TaskStatus; title: string }[] = [
    { status: 'TODO', title: 'To Do' },
    { status: 'IN_PROGRESS', title: 'In Progress' },
    { status: 'REVIEW', title: 'Review' },
    { status: 'DONE', title: 'Done' },
    { status: 'BLOCKED', title: 'Blocked' },
  ];

  return (
    <div className="space-y-4">
      {/* Action Bar: Layer Filters & Generate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        {/* Layer Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Semua', icon: Layers },
            { id: 'DATABASE', label: 'Database', icon: Database },
            { id: 'BACKEND', label: 'Backend', icon: Server },
            { id: 'FRONTEND', label: 'Frontend', icon: Layout },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedLayer === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedLayer(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Generate Tasks button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTasksWithAI}
            disabled={isGenerating}
            className="gap-1.5 h-8 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Generate Tasks dari AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)} className="h-6 text-[10px]">
            Tutup
          </Button>
        </div>
      )}

      {/* Kanban Board Columns Container */}
      <div className="flex gap-3 overflow-x-auto pb-6">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);
          return (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              tasks={colTasks}
              allTasks={tasks}
              onSelectTask={setActiveTask}
              onStatusChange={handleUpdateStatus}
            />
          );
        })}
      </div>

      {/* Slide-over Task Detail Drawer */}
      <TaskDetailDrawer
        task={activeTask}
        projectName={projectName}
        projectDesc={projectDesc}
        onClose={() => setActiveTask(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
