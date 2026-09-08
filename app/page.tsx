import Link from 'next/link';
import { ArrowRight, Terminal, Layers, GitBranch, Kanban, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 px-6 py-3.5 flex items-center justify-between backdrop-blur-md sticky top-0 z-50 bg-zinc-950/80">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight uppercase font-mono text-zinc-200">
            Project AI Planner
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Masuk</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Mulai Gratis</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center bg-dot-grid">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 mb-6 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px]">Next-Gen AI Project Execution Engine</span>
        </div>

        <h1 className="max-w-3xl text-3xl sm:text-5xl font-bold tracking-tight text-zinc-100 leading-[1.15]">
          Ubah Ide Menjadi PRD, Roadmap, &amp; Task Siap Eksekusi AI Coding Agent
        </h1>

        <p className="mt-5 max-w-xl text-sm text-zinc-400 leading-relaxed">
          Jangan biarkan AI coding agent halusinasi arsitektur. Rancang produk secara presisi dengan human-in-the-loop: dari Discovery, PRD terstruktur, dependency graph, hingga instruksi CLI task-by-task.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button size="lg" className="h-10 px-5 gap-2">
              Buka Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg" className="h-10 px-5 font-mono text-xs">
              npx project-ai
            </Button>
          </Link>
        </div>

        {/* 5-Step Workflow Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-3 max-w-5xl text-left">
          {[
            { step: '01', title: 'AI Discovery', desc: 'Q&A mendalam untuk menggali scope, user persona, & stack.' },
            { step: '02', title: 'Structured PRD', desc: 'Dokumen requirement JSON dengan prioritas MoSCoW.' },
            { step: '03', title: 'Visual Roadmap', desc: 'Dependency graph fase Database, Backend, & Frontend.' },
            { step: '04', title: 'Kanban Tasks', desc: 'Atomic task breakdown dengan kriteria acceptance ketat.' },
            { step: '05', title: 'CLI Agent Loop', desc: 'Eksekusi 1 task terisolasi via npx project-ai.' },
          ].map((item) => (
            <div key={item.step} className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
              <span className="text-zinc-500 font-mono text-[11px] block mb-1">{item.step}</span>
              <h3 className="text-xs font-semibold text-zinc-200 mb-1">{item.title}</h3>
              <p className="text-[11px] text-zinc-400 leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-4 px-6 text-center text-[11px] text-zinc-500 font-mono">
        Project AI Planner • Built with Next.js, Supabase, Tailwind &amp; Anthropic / OpenAI / Google AI
      </footer>
    </div>
  );
}
