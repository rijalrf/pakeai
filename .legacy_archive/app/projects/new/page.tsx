'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProjectStore } from '@/lib/stores/project-store';
import { ArrowRight, Wand2, Layers } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const { addProject } = useProjectStore();

  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<'New Project' | 'Existing Project'>('New Project');
  const [idea, setIdea] = useState('');
  const [letAIChoose, setLetAIChoose] = useState(false);

  // Stack selection
  const [frontend, setFrontend] = useState('Next.js');
  const [backend, setBackend] = useState('Next.js Server Actions');
  const [database, setDatabase] = useState('PostgreSQL / Supabase');
  const [devops, setDevops] = useState('Docker');

  const frontendOptions = ['Next.js', 'React (Vite)', 'Vue.js / Nuxt', 'SvelteKit'];
  const backendOptions = ['Next.js Server Actions', 'Node.js Express', 'NestJS', 'FastAPI (Python)', 'Go Gin'];
  const dbOptions = ['PostgreSQL / Supabase', 'PostgreSQL (Prisma)', 'MySQL', 'MongoDB', 'Redis'];
  const devopsOptions = ['Docker', 'Vercel', 'AWS ECS', 'Cloudflare Workers'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !idea.trim()) return;

    const stacks = letAIChoose
      ? [
          { category: 'Frontend', technology: 'Next.js (AI Recommended)' },
          { category: 'Backend', technology: 'Server Actions (AI Recommended)' },
          { category: 'Database', technology: 'Supabase PostgreSQL (AI Recommended)' },
          { category: 'DevOps', technology: 'Docker' },
        ]
      : [
          { category: 'Frontend', technology: frontend },
          { category: 'Backend', technology: backend },
          { category: 'Database', technology: database },
          { category: 'DevOps', technology: devops },
        ];

    const project = addProject({
      name,
      description: idea.slice(0, 140) + '...',
      idea,
      projectType,
      status: 'discovery',
      stacks,
    });

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: idea.slice(0, 140) + '...',
        idea,
        projectType,
        stacks,
      }),
    }).catch(() => {});

    router.push(`/projects/${project.id}/discovery`);
  };

  return (
    <AppLayout hideSidebar={true}>
      <div className="max-w-xl mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">
            Project Baru
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Mulai dari ide aplikasi, tentukan preferensi stack, lalu AI akan menyusun spesifikasi MVP.
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <Card className="border-zinc-200 bg-white shadow-2xs">
            <CardHeader className="space-y-1 pb-3 border-b border-zinc-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">
                Identitas Project
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                {(['New Project', 'Existing Project'] as const).map((t) => (
                  <div
                    key={t}
                    onClick={() => setProjectType(t)}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      projectType === t
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-900">{t}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {t === 'New Project' ? 'Mulai dari awal (greenfield)' : 'Refactor / tambah fitur'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Nama Project</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Booking Lapangan Futsal"
                  className="h-8 text-xs"
                />
              </div>

              {/* Idea Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Deskripsikan Ide Software</label>
                <Textarea
                  required
                  rows={4}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Ceritakan ide aplikasi Anda sejelas mungkin..."
                  className="text-xs resize-none"
                />
              </div>

              {/* Tech Stack Picker */}
              <div className="space-y-3 pt-3 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-800 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-zinc-500" />
                    Preferensi Stack
                  </span>

                  <button
                    type="button"
                    onClick={() => setLetAIChoose(!letAIChoose)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                      letAIChoose
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <Wand2 className="h-3 w-3" />
                    Biarkan AI Memilih
                  </button>
                </div>

                {!letAIChoose ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Frontend */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-500">Frontend</label>
                      <select
                        value={frontend}
                        onChange={(e) => setFrontend(e.target.value)}
                        className="w-full h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600"
                      >
                        {frontendOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Backend */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-500">Backend</label>
                      <select
                        value={backend}
                        onChange={(e) => setBackend(e.target.value)}
                        className="w-full h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600"
                      >
                        {backendOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Database */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-500">Database</label>
                      <select
                        value={database}
                        onChange={(e) => setDatabase(e.target.value)}
                        className="w-full h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600"
                      >
                        {dbOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* DevOps */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-500">Deployment</label>
                      <select
                        value={devops}
                        onChange={(e) => setDevops(e.target.value)}
                        className="w-full h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:border-indigo-600"
                      >
                        {devopsOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs text-indigo-800">
                    AI akan menganalisis kompleksitas ide Anda dan memilih stack terbaik saat sesi Discovery.
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-3 border-t border-zinc-100">
              <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                Mulai AI Discovery
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
