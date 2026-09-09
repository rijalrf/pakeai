'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ProjectItem } from '@/lib/stores/project-store';

interface ProjectCardProps {
  project: ProjectItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'discovery':
        return <Badge variant="indigo">Discovery</Badge>;
      case 'prd':
        return <Badge variant="amber">PRD Review</Badge>;
      case 'roadmap':
        return <Badge variant="secondary">Roadmap</Badge>;
      case 'tasks':
      case 'in_progress':
        return <Badge variant="emerald">Tasks Aktif</Badge>;
      case 'completed':
        return <Badge variant="default">Selesai</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="flex flex-col justify-between border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all group">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between">
          {getStatusBadge(project.status)}
          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(project.updatedAt)}
          </span>
        </div>
        <CardTitle className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {project.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-zinc-500 text-xs">
          {project.description || project.idea}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {project.stacks.slice(0, 4).map((stack, idx) => (
            <span
              key={idx}
              className="rounded bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-mono text-zinc-600"
            >
              {stack.technology}
            </span>
          ))}
          {project.stacks.length > 4 && (
            <span className="rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
              +{project.stacks.length - 4}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-zinc-100 flex items-center justify-between mt-auto">
        <span className="text-[10px] font-mono text-zinc-400 uppercase">
          {project.projectType || 'App'}
        </span>
        <Link href={`/projects/${project.id}/tasks`}>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-zinc-700 hover:text-indigo-600">
            Buka Tasks
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
