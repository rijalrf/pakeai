'use client';

import React from 'react';
import Link from 'next/link';
import { ProjectCard } from '@/components/project/project-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FolderGit2 } from 'lucide-react';
import type { ProjectItem } from '@/lib/stores/project-store';

interface RecentProjectsProps {
  projects: ProjectItem[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
            Workspace Projects
          </h2>
          <p className="text-xs text-zinc-400">
            Daftar software yang sedang dalam siklus discovery, PRD, roadmap, atau eksekusi agent.
          </p>
        </div>

        <Link href="/projects/new">
          <Button size="sm" className="gap-1.5 h-8">
            <PlusCircle className="h-3.5 w-3.5" />
            Project Baru
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <FolderGit2 className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
          <h3 className="text-xs font-semibold text-zinc-200">Belum ada project</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Mulai ubah ide aplikasi Anda menjadi PRD arsitektural dan biarkan AI coding agent mengeksekusinya.
          </p>
          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" />
              Mulai Project Pertama
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
