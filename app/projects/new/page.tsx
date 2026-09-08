'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/lib/stores/project-store';
import { Sparkles, ArrowRight, Wand2, Layers, Check } from 'lucide-react';

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

    // Sinkronisasi ke PostgreSQL secara asinkron
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
    }).catch((err) => console.warn('Sync project to DB warning:', err));

    // Langsung arahkan ke AI Discovery
    router.push(`/projects/${project.id}/discovery`);
  };

  return (
    <AppLayout hideSidebar={true}>
      <div className="max-w-2xl mx-auto py-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">
            Inisialisasi Project Baru
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Mulai dari ide awal, tentukan stack, lalu biarkan AI melakukan discovery terarah sebelum PRD digenerate.
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-sm font-semibold">1. Tipe &amp; Identitas Project</CardTitle>
              <CardDescription>Beri nama dan pilih status awal project Anda.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                {(['New Project', 'Existing Project'] as const).map((t) => (
                  <div
                    key={t}
                    onClick={() => setProjectType(t)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      projectType === t
                        ? 'border-zinc-300 bg-zinc-800/80'
                        : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-zinc-200">{t}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {t === 'New Project' ? 'Mulai dari scratch (greenfield)' : 'Refactor / tambah fitur baru'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Nama Project</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Futsal Booking App"
                  className="h-9 text-xs"
                />
              </div>

              {/* Idea Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Deskripsikan Ide Software Anda</label>
                  <span className="text-[10px] text-zinc-500 font-mono">Bahasa Indonesia / English</span>
                </div>
                <Textarea
                  required
                  rows={4}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Ceritakan ide aplikasi Anda sejelas mungkin. Contoh: Saya ingin membuat aplikasi booking lapangan futsal online dengan fitur cek slot kosong, pembayaran otomatis, dan dashboard pemilik venue..."
                  className="text-xs leading-relaxed"
                />
              </div>

              {/* Tech Stack Picker */}
              <div className="space-y-3 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-zinc-400" />
                    Tech Stack Preferences
                  </span>

                  <button
                    type="button"
                    onClick={() => setLetAIChoose(!letAIChoose)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                      letAIChoose
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'border border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Wand2 className="h-3 w-3" />
                    Biarkan AI Menentukan Stack
                  </button>
                </div>

                {!letAIChoose ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Frontend */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-400">Frontend</label>
                      <select
                        value={frontend}
                        onChange={(e) => setFrontend(e.target.value)}
                        className="w-full h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        {frontendOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Backend */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-400">Backend</label>
                      <select
                        value={backend}
                        onChange={(e) => setBackend(e.target.value)}
                        className="w-full h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        {backendOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Database */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-400">Database</label>
                      <select
                        value={database}
                        onChange={(e) => setDatabase(e.target.value)}
                        className="w-full h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        {dbOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* DevOps */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-400">Deployment / Container</label>
                      <select
                        value={devops}
                        onChange={(e) => setDevops(e.target.value)}
                        className="w-full h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        {devopsOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">
                    ✓ AI akan menganalisis kompleksitas ide Anda dan merekomendasikan arsitektur stack paling optimal saat Discovery.
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-4 border-t border-zinc-800/80">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" className="gap-1.5">
                Buat Project &amp; Mulai AI Discovery
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
