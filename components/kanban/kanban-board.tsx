'use client';

import React, { useState, useMemo } from 'react';
import type { TaskItemData } from '@/lib/ai/tasks';
import type { TaskLayer, TaskStatus } from '@/lib/db/database.types';
import { KanbanColumn } from './kanban-column';
import { TaskDetailDrawer } from './task-detail-drawer';
import { CheckpointBanner } from './checkpoint-banner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FALLBACK_PRD } from '@/lib/ai/prd';
import { FALLBACK_ROADMAP } from '@/lib/ai/roadmap';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Sparkles,
  Terminal,
  Database,
  Server,
  Layout,
  Loader2,
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
  projectId = 'demo-project',
  prd,
  roadmap,
  onSaveTasks,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskItemData[]>(initialTasks);
  const [selectedLayer, setSelectedLayer] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTask, setActiveTask] = useState<TaskItemData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const autoTriggeredRef = React.useRef(false);
  const [approvedLayers, setApprovedLayers] = useState<Record<string, boolean>>({
    DATABASE: true, // Layer database sudah di-approve
  });

  // Auto-generate tasks via AI jika belum ada
  React.useEffect(() => {
    if (tasks.length === 0 && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleGenerateTasksWithAI();
    }
  }, [tasks]);

  const handleGenerateTasksWithAI = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const prdToUse = prd || FALLBACK_PRD;
      const roadmapToUse = roadmap || FALLBACK_ROADMAP;

      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generateWithAI: true,
          prd: prdToUse,
          roadmap: roadmapToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal generate task via AI');
      }

      if (data.tasks && data.tasks.length > 0) {
        setTasks(data.tasks);
        if (onSaveTasks) {
          onSaveTasks(data.tasks);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke model AI gagal');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter tasks based on Layer and Search Query
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchLayer = selectedLayer === 'ALL' || task.layer === selectedLayer;
      const matchSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLayer && matchSearch;
    });
  }, [tasks, selectedLayer, searchQuery]);

  // Group filtered tasks by status
  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, TaskItemData[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
      BLOCKED: [],
    };
    filteredTasks.forEach((task) => {
      map[task.status]?.push(task);
    });
    return map;
  }, [filteredTasks]);

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter((t) => t.status === 'BLOCKED').length;
    const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, blocked, progressPercent };
  }, [tasks]);

  // Layer transition checkpoint check
  // E.g. Check Database tasks
  const dbTasks = tasks.filter((t) => t.layer === 'DATABASE');
  const dbDoneCount = dbTasks.filter((t) => t.status === 'DONE').length;
  const isDbReady = dbDoneCount === dbTasks.length && dbTasks.length > 0;

  // Backend tasks
  const beTasks = tasks.filter((t) => t.layer === 'BACKEND');
  const beDoneCount = beTasks.filter((t) => t.status === 'DONE').length;

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (activeTask && activeTask.id === taskId) {
      setActiveTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleApproveLayer = (layer: string) => {
    setApprovedLayers((prev) => ({ ...prev, [layer]: true }));
  };

  return (
    <div className="space-y-4">
      {/* Checkpoint Banner (Human-in-the-loop Guard) */}
      {isDbReady && (
        <CheckpointBanner
          layer="DATABASE"
          completedCount={dbDoneCount}
          totalCount={dbTasks.length}
          isApproved={!!approvedLayers['DATABASE']}
          onApprove={() => handleApproveLayer('DATABASE')}
        />
      )}

      {/* Action Bar: Layer Filters, Search & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        {/* Layer Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'Semua Layer', icon: Layers },
            { id: 'DATABASE', label: 'Database', icon: Database },
            { id: 'BACKEND', label: 'Backend API', icon: Server },
            { id: 'FRONTEND', label: 'Frontend UI', icon: Layout },
          ].map((item) => {
            const Icon = item.icon;
            const count =
              item.id === 'ALL'
                ? tasks.length
                : tasks.filter((t) => t.layer === item.id).length;

            const isSelected = selectedLayer === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedLayer(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, AI Trigger & Quick Stats */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTasksWithAI}
            disabled={isGenerating}
            className="gap-1.5 h-8 text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/30 font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                AI Memecah Tasks...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Generate Tasks via AI (ai-builder)
              </>
            )}
          </Button>

          <div className="relative w-48 hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Cari task / #ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-zinc-900/80 border-zinc-800"
            />
          </div>

          {/* Quick Mini Metrics */}
          <div className="hidden lg:flex items-center gap-2 border-l border-zinc-800 pl-3 text-xs font-mono">
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{metrics.done}/{metrics.total}</span>
            </div>
            <div className="text-zinc-600">|</div>
            <div className="text-zinc-400">
              {metrics.progressPercent}% Selesai
            </div>
          </div>
        </div>
      </div>

      {/* AI Generating Animation Card */}
      {isGenerating && (
        <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-6 text-center shadow-2xl animate-pulse">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600/30 border border-indigo-500/60 flex items-center justify-center text-indigo-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">
                Autonomous Agent Coordinator Sedang Menghitung Bounded Context Tasks untuk "{projectName}"...
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl mx-auto">
                Model <span className="font-mono text-indigo-300">ai-builder</span> sedang mengisolasi target files
                (files_to_create, files_to_modify) dan kriteria pengujian per task untuk eksekusi CLI Agent.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5-Column Kanban Board Layout */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
        <KanbanColumn
          status="TODO"
          title="To Do"
          tasks={tasksByStatus.TODO}
          allTasks={tasks}
          onSelectTask={setActiveTask}
          onStatusChange={handleUpdateStatus}
        />
        <KanbanColumn
          status="IN_PROGRESS"
          title="In Progress"
          tasks={tasksByStatus.IN_PROGRESS}
          allTasks={tasks}
          onSelectTask={setActiveTask}
          onStatusChange={handleUpdateStatus}
        />
        <KanbanColumn
          status="REVIEW"
          title="Review"
          tasks={tasksByStatus.REVIEW}
          allTasks={tasks}
          onSelectTask={setActiveTask}
          onStatusChange={handleUpdateStatus}
        />
        <KanbanColumn
          status="DONE"
          title="Done"
          tasks={tasksByStatus.DONE}
          allTasks={tasks}
          onSelectTask={setActiveTask}
          onStatusChange={handleUpdateStatus}
        />
        <KanbanColumn
          status="BLOCKED"
          title="Blocked"
          tasks={tasksByStatus.BLOCKED}
          allTasks={tasks}
          onSelectTask={setActiveTask}
          onStatusChange={handleUpdateStatus}
        />
      </div>

      {/* Detail Drawer Modal */}
      {activeTask && (
        <TaskDetailDrawer
          task={activeTask}
          projectName={projectName}
          projectDesc={projectDesc}
          onClose={() => setActiveTask(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
