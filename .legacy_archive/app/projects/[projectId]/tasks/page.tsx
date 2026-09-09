'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { WorkflowStepper } from '@/components/project/workflow-stepper';
import { INITIAL_TASKS } from '@/lib/ai/tasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, ArrowRight } from 'lucide-react';

export default function TasksPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, saveTasks } = useProjectStore();

  const project = getProject(projectId);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-zinc-500 text-xs">Memuat proyek...</p>
      </div>
    );
  }

  const projectTasks =
    project.tasks && project.tasks.length > 0
      ? project.tasks
      : project.id === 'futsal-booking-01'
      ? INITIAL_TASKS
      : [];

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Workflow Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-zinc-900">
              Kanban Tasks: {project.name}
            </h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {projectTasks.length} Tasks
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Papan task terisolasi per layer. Drag task untuk ubah status atau buka detail untuk melihat konteks.
          </p>
        </div>

        {/* Single Primary Action: Buka Eksekusi Agent */}
        <Button
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/execute`)}
          className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
        >
          <Terminal className="h-3.5 w-3.5" />
          Eksekusi Agent
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Main Kanban Board */}
      <KanbanBoard
        projectId={projectId}
        initialTasks={projectTasks}
        projectName={project.name}
        projectDesc={project.description || project.idea || ''}
        prd={project.prd}
        roadmap={project.roadmap}
        onSaveTasks={(newTasks) => saveTasks(projectId, newTasks)}
      />
    </div>
  );
}
