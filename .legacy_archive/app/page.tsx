import Link from 'next/link';
import { ArrowRight, Terminal, Layers, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200/80 px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight font-mono text-zinc-900 uppercase">
            Project AI Planner
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-600 hover:text-zinc-900">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs">
              Mulai Gratis
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 mb-6 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="font-mono text-[11px]">SaaS Orchestrator untuk AI Coding Agent</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.15] max-w-2xl">
          Rancang Spesifikasi &amp; Eksekusi Software dengan AI Agent
        </h1>

        <p className="mt-4 max-w-lg text-sm text-zinc-600 leading-relaxed">
          Cegah halusinasi coding agent. Susun Discovery terarah, dokumen PRD teknis, urutan roadmap dependensi, dan eksekusi atomic task dengan bounded context via CLI.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button size="sm" className="h-9 px-4 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs font-medium text-xs">
              Mulai Buat Project
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-mono text-zinc-700 border-zinc-200 bg-white hover:bg-zinc-50">
              Buka Dashboard
            </Button>
          </Link>
        </div>

        {/* 3 Core Feature Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-2xs">
            <div className="h-7 w-7 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900 mb-1.5 font-mono uppercase tracking-wide">
              1. Discovery &amp; PRD
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Q&amp;A arsitektural 5 dimensi yang menghasilkan spesifikasi teknis MVP terstruktur dengan prioritas MoSCoW.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-2xs">
            <div className="h-7 w-7 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900 mb-1.5 font-mono uppercase tracking-wide">
              2. Dependency Roadmap
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Urutan eksekusi fase per layer (Database → Backend → Frontend) untuk mencegah error dependensi saat koding.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-2xs">
            <div className="h-7 w-7 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
              <Terminal className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900 mb-1.5 font-mono uppercase tracking-wide">
              3. Bounded Context CLI
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              AI coding agent hanya menyentuh file yang diizinkan per task melalui CLI lokal <code>npx project-ai</code>.
            </p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 py-4 px-6 text-center text-[11px] text-zinc-500 font-mono bg-white">
        Project AI Planner • Minimalist SaaS Orchestrator
      </footer>
    </div>
  );
}
