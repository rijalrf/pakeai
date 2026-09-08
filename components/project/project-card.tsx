'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Clock, Layers, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ProjectItem } from '@/lib/stores/project-store';

interface ProjectCardProps {
  project: ProjectItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'discovery':
        return <Badge variant="indigo">1. Discovery</Badge>;
      case 'prd':
        return <Badge variant="amber">2. PRD Review</Badge>;
      case 'roadmap':
        return <Badge variant="secondary">3. Roadmap</Badge>;
      case 'tasks':
      case 'in_progress':
        return <Badge variant="emerald">4. Tasks Active</Badge>;
      case 'completed':
        return <Badge variant="default">Selesai</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTargetRoute = (project: ProjectItem) => {
    switch (project.status) {
      case 'discovery':
        return `/projects/${project.id}/discovery`;
      case 'prd':
        return `/projects/${project.id}/prd`;
      case 'roadmap':
        return `/projects/${project.id}/roadmap`;
      case 'tasks':
      case 'in_progress':
        return `/projects/${project.id}/tasks`;
      default:
        return `/projects/${project.id}`;
    }
  };

  return (
    <Card className="flex flex-col justify-between border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700/80 hover:bg-zinc-900/70 transition-all group">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between">
          {getStatusBadge(project.status)}
          <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(project.updatedAt)}
          </span>
        </div>
        <CardTitle className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-1">
          {project.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-zinc-400">
          {project.description || project.idea}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Tech Stack Chips */}
        <div className="flex flex-wrap gap-1.5">
          {project.stacks.slice(0, 4).map((stack, idx) => (
            <span
              key={idx}
              className="rounded bg-zinc-950/80 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300"
            >
              {stack.technology}
            </span>
          ))}
          {project.stacks.length > 4 && (
            <span className="rounded bg-zinc-950/80 border border-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
              +{project.stacks.length - 4}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-zinc-800/60 flex items-center justify-between mt-auto">
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          {project.projectType || 'Software App'}
        </span>
        <Link href={getTargetRoute(project)}>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 group-hover:text-zinc-100">
            Buka Workflow
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
