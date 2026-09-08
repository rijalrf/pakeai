'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkflowStepper } from '@/components/project/workflow-stepper';
import { FALLBACK_PRD, type PRDDocument, type PRDFeature } from '@/lib/ai/prd';
import {
  FileText,
  ArrowRight,
  Sparkles,
  Layers,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Loader2,
  RefreshCw,
  Target,
} from 'lucide-react';

export default function PRDPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, updateProjectStatus, savePRD } = useProjectStore();

  const project = getProject(projectId);
  const [prd, setPrd] = useState<PRDDocument | null>(project?.prd || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  // Auto-generate AI PRD jika belum ada
  useEffect(() => {
    if (!project) return;

    if (!project.prd && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleGeneratePRDWithAI();
    } else if (project.prd && !prd) {
      setPrd(project.prd);
    }
  }, [project]);

  const handleGeneratePRDWithAI = async () => {
    if (!project) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const answers = project.discoveryAnswers || {};
      const res = await fetch(`/api/projects/${projectId}/prd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea || project.description || 'Aplikasi software',
          projectType: project.projectType || 'Web Application',
          stacks: project.stacks || [],
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyusun PRD dengan model AI');
      }

      if (data.prd) {
        setPrd(data.prd);
        savePRD(projectId, data.prd);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke model AI gagal');
      if (!prd) {
        setPrd(FALLBACK_PRD);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    if (prd) {
      savePRD(projectId, prd);
    }
    updateProjectStatus(projectId, 'roadmap');
    router.push(`/projects/${projectId}/roadmap`);
  };

  const getPriorityBadge = (priority: PRDFeature['priority']) => {
    switch (priority) {
      case 'must':
        return <Badge variant="rose" className="font-mono text-[10px] uppercase">Must Have</Badge>;
      case 'should':
        return <Badge variant="amber" className="font-mono text-[10px] uppercase">Should Have</Badge>;
      case 'could':
        return <Badge variant="indigo" className="font-mono text-[10px] uppercase">Could Have</Badge>;
      default:
        return <Badge variant="secondary" className="font-mono text-[10px] uppercase">Won't Have</Badge>;
    }
  };

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-zinc-400 text-sm">Memuat proyek...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Workflow Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
              02
            </span>
            <h1 className="text-base font-bold tracking-tight text-zinc-100">
              PRD Spesifikasi Teknis: {project.name}
            </h1>
            <Badge variant="emerald" className="text-[10px] font-mono">
              Otomatis via ai-builder
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dihasilkan langsung dari hasil wawancara Discovery untuk mencegah halusinasi arsitektural.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isGenerating || !prd}
            className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            Setujui PRD &amp; Buat Roadmap
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* AI Generating Animation Card */}
      {isGenerating && (
        <Card className="border-amber-500/40 bg-amber-950/20 p-6 text-center shadow-2xl animate-pulse">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-amber-600/30 border border-amber-500/60 flex items-center justify-center text-amber-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">
                AI Architect Sedang Menyusun PRD Spesifikasi untuk "{project.name}"...
              </h3>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                Model <span className="font-mono text-amber-300">ai-builder</span> sedang mengolah hasil discovery,
                mengklasifikasikan fitur ke prinsip MoSCoW, serta menentukan batas non-goals MVP.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between">
          <span>Error Model AI: {errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)} className="h-6 text-[10px]">
            Tutup
          </Button>
        </div>
      )}

      {!isGenerating && prd && (
        <>
          {/* Section 1: Problem Statement & Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Akar Masalah (Problem Statement)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-300 leading-relaxed">{prd.problem_statement}</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Proposisi Nilai (Value Proposition)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-300 leading-relaxed">{prd.value_proposition}</p>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Scope Boundaries (MVP vs Non-Goals) */}
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader className="pb-3 border-b border-zinc-800/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Batasan Ruang Lingkup (Scope Boundaries)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Target MVP Pertama:
                </span>
                <ul className="space-y-1.5">
                  {prd.mvp_scope.map((item, idx) => (
                    <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                      <span className="text-emerald-500 font-mono text-[10px]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Eksplisit Non-Goals (Anti-Scope Creep):
                </span>
                <ul className="space-y-1.5">
                  {prd.non_goals.map((item, idx) => (
                    <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                      <span className="text-zinc-600 font-mono text-[10px]">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: MoSCoW Feature Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Fitur Terstruktur MoSCoW ({prd.features.length} Fitur)
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                Tiap fitur memuat acceptance criteria teknis terisolasi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prd.features.map((feat) => (
                <Card key={feat.id} className="border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 transition-all">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{feat.category}</span>
                        <h4 className="text-xs font-bold text-zinc-100 truncate">{feat.title}</h4>
                      </div>
                      {getPriorityBadge(feat.priority)}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{feat.description}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="pt-2 border-t border-zinc-800/60 space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                        Acceptance Criteria:
                      </span>
                      {feat.acceptance_criteria.map((c, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                          <span className="text-indigo-400 font-mono text-[9px] mt-0.5">•</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Section 4: Technical Specifications */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-400" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Spesifikasi Arsitektur Teknis
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block mb-1">Frontend Layer</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{prd.technical_requirements.frontend}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">Backend Layer</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{prd.technical_requirements.backend}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block mb-1">Database Layer</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{prd.technical_requirements.database}</p>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Sticky Action Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl backdrop-blur-md">
            <div className="text-xs text-zinc-400 pl-2">
              Langkah 2 Selesai • PRD siap dikonversi ke dependensi graf
            </div>
            <Button size="sm" onClick={handleApprove} className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              Setujui PRD &amp; Buat Roadmap Arsitektur
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
