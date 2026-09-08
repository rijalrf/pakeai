'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Compass, FileText, GitBranch, Kanban, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject } = useProjectStore();

  const project = getProject(projectId);

  if (!project) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-sm font-semibold text-zinc-200">Project tidak ditemukan</h2>
        <Link href="/dashboard" className="mt-3 inline-block">
          <Button size="sm">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );
  }

  const pipelineStages = [
    {
      step: '1',
      title: 'AI Discovery Q&A',
      desc: 'Wawancara interaktif dengan AI untuk merinci target pengguna, fitur utama, dan batasan MVP.',
      href: `/projects/${projectId}/discovery`,
      icon: Compass,
      isDone: project.status !== 'discovery',
      isCurrent: project.status === 'discovery',
    },
    {
      step: '2',
      title: 'PRD Terstruktur',
      desc: 'Dokumen requirement JSON dengan problem statement, kriteria MoSCoW, dan spesifikasi arsitektur.',
      href: `/projects/${projectId}/prd`,
      icon: FileText,
      isDone: ['roadmap', 'tasks', 'in_progress', 'completed'].includes(project.status),
      isCurrent: project.status === 'prd',
    },
    {
      step: '3',
      title: 'Roadmap & Dependency Graph',
      desc: 'Visualisasi fase bertingkat (Database → Backend → Frontend → DevOps) via React Flow.',
      href: `/projects/${projectId}/roadmap`,
      icon: GitBranch,
      isDone: ['tasks', 'in_progress', 'completed'].includes(project.status),
      isCurrent: project.status === 'roadmap',
    },
    {
      step: '4',
      title: 'Kanban Tasks & CLI Agent',
      desc: 'Atomic tasks siap dieksekusi satu per satu oleh AI coding agent lokal melalui npx project-ai.',
      href: `/projects/${projectId}/tasks`,
      icon: Kanban,
      isDone: project.status === 'completed',
      isCurrent: ['tasks', 'in_progress'].includes(project.status),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Project Brief Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">{project.name}</h1>
              <Badge variant="emerald" className="uppercase font-mono text-[10px]">
                {project.status}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              {project.idea}
            </p>
          </div>

          <Link href={`/projects/${projectId}/discovery`}>
            <Button size="sm" className="gap-1.5 h-9 shrink-0">
              Lanjutkan Workflow
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Tech Stacks */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/60">
          <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1">Target Stack:</span>
          {project.stacks.map((s, idx) => (
            <span
              key={idx}
              className="rounded bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300"
            >
              <span className="text-zinc-500 mr-1">{s.category}:</span>
              {s.technology}
            </span>
          ))}
        </div>
      </div>

      {/* 4-Stage Pipeline Tracker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-400">
            Pipeline Pengembangan Terpandu (Killer Loop)
          </h2>
          <span className="text-xs text-zinc-500">Human Checkpoint Di Setiap Tahap</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Link key={stage.step} href={stage.href} className="group">
                <Card className={`h-full border transition-all ${
                  stage.isCurrent
                    ? 'border-zinc-400 bg-zinc-800/60 ring-1 ring-zinc-500'
                    : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70'
                }`}>
                  <CardHeader className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${
                          stage.isCurrent ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-100">
                          Tahap {stage.step}: {stage.title}
                        </span>
                      </div>

                      {stage.isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : stage.isCurrent ? (
                        <Badge variant="amber" className="text-[10px]">Aktif Sekarang</Badge>
                      ) : (
                        <Clock className="h-4 w-4 text-zinc-600" />
                      )}
                    </div>
                    <CardDescription className="text-[11px] text-zinc-400 leading-normal">
                      {stage.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
