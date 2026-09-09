'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkflowStepper } from '@/components/project/workflow-stepper';
import { FALLBACK_PRD, type PRDDocument } from '@/lib/ai/prd';
import { ReviewStatusBadge } from '@/components/ui/review-status-badge';
import type { ReviewResult } from '@/lib/ai/reviewer';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Target,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function PRDPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, updateProjectStatus, savePRD } = useProjectStore();

  const project = getProject(projectId);
  const [prd, setPrd] = useState<PRDDocument | null>(
    project?.prd || (project?.id === 'futsal-booking-01' ? FALLBACK_PRD : null)
  );
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [autoFixed, setAutoFixed] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    if (!project) return;

    if (!project.prd && !prd && !autoTriggeredRef.current) {
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
      const res = await fetch(`/api/projects/${projectId}/prd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea || project.description || 'Aplikasi software',
          projectType: project.projectType || 'Web Application',
          stacks: project.stacks || [],
          discoveryAnswers: project.discoveryAnswers || {},
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan PRD dengan model AI');
      }

      if (data.prd) {
        setPrd(data.prd);
        savePRD(projectId, data.prd);
      }
      if (data.review) {
        setReview(data.review);
        setAutoFixed(!!data.autoFixed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke gateway AI gagal');
      if (!prd) {
        setPrd(FALLBACK_PRD);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    updateProjectStatus(projectId, 'roadmap');
    router.push(`/projects/${projectId}/roadmap`);
  };

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-zinc-500 text-xs">Memuat proyek...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Workflow Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-zinc-900">
              PRD Spesifikasi Teknis: {project.name}
            </h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Scope MVP
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Spesifikasi kebutuhan aplikasi hasil analisis Discovery Q&amp;A.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {review && (
            <ReviewStatusBadge review={review} stageName="PRD" autoFixed={autoFixed} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePRDWithAI}
            disabled={isGenerating}
            className="gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isGenerating || !prd}
            className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
          >
            Setujui PRD &amp; Lanjut
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* AI Generating Loader */}
      {isGenerating && (
        <Card className="border-indigo-200 bg-indigo-50/50 p-6 text-center shadow-xs">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <p className="text-xs font-medium text-zinc-800">
              AI sedang merumuskan PRD dan membagi fitur MoSCoW...
            </p>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)} className="h-6 text-[10px]">
            Tutup
          </Button>
        </div>
      )}

      {!isGenerating && prd && (
        <div className="space-y-4">
          {/* Section 1: Problem Statement & Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-zinc-200 bg-white shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 font-mono">
                  Akar Masalah (Problem Statement)
                </h2>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">{prd.problem_statement}</p>
            </Card>

            <Card className="p-4 border-zinc-200 bg-white shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 font-mono">
                  Proposisi Nilai (Value Proposition)
                </h2>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">{prd.value_proposition}</p>
            </Card>
          </div>

          {/* Section 2: Scope Boundaries */}
          <Card className="border-zinc-200 bg-white shadow-2xs">
            <CardHeader className="pb-2 border-b border-zinc-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">
                Batasan Ruang Lingkup
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-[11px] font-mono font-semibold text-emerald-700 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Target MVP:
                </span>
                <ul className="space-y-1.5">
                  {prd.mvp_scope.map((item, idx) => (
                    <li key={idx} className="text-xs text-zinc-700 flex items-start gap-2">
                      <span className="text-emerald-600 font-mono text-[10px]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-mono font-semibold text-zinc-500 flex items-center gap-1.5 mb-2">
                  <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                  Non-Goals (Di Luar Scope MVP):
                </span>
                <ul className="space-y-1.5">
                  {prd.non_goals.map((item, idx) => (
                    <li key={idx} className="text-xs text-zinc-500 flex items-start gap-2">
                      <span className="text-zinc-400 font-mono text-[10px]">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: MoSCoW Features */}
          <Card className="border-zinc-200 bg-white shadow-2xs">
            <CardHeader className="pb-2 border-b border-zinc-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">
                Prioritas Fitur (MoSCoW)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 p-3 rounded-md bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">Must Have</span>
                <ul className="space-y-1">
                  {prd.features
                    .filter((f) => f.priority === 'must')
                    .map((f) => (
                      <li key={f.id} className="text-xs text-zinc-700">• {f.title}</li>
                    ))}
                </ul>
              </div>

              <div className="space-y-1.5 p-3 rounded-md bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] font-mono uppercase text-indigo-800 font-bold block">Should Have</span>
                <ul className="space-y-1">
                  {prd.features
                    .filter((f) => f.priority === 'should')
                    .map((f) => (
                      <li key={f.id} className="text-xs text-zinc-700">• {f.title}</li>
                    ))}
                </ul>
              </div>

              <div className="space-y-1.5 p-3 rounded-md bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] font-mono uppercase text-zinc-600 font-bold block">Could Have</span>
                <ul className="space-y-1">
                  {prd.features
                    .filter((f) => f.priority === 'could')
                    .map((f) => (
                      <li key={f.id} className="text-xs text-zinc-600">• {f.title}</li>
                    ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Technical Specs per Layer */}
          <Card className="border-zinc-200 bg-white shadow-2xs">
            <CardHeader className="pb-2 border-b border-zinc-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">
                Kebutuhan Teknis per Layer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] font-mono uppercase text-sky-700 font-bold block mb-1">Database</span>
                <p className="text-zinc-600 text-xs leading-relaxed">{prd.technical_requirements.database}</p>
              </div>
              <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block mb-1">Backend</span>
                <p className="text-zinc-600 text-xs leading-relaxed">{prd.technical_requirements.backend}</p>
              </div>
              <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] font-mono uppercase text-indigo-700 font-bold block mb-1">Frontend</span>
                <p className="text-zinc-600 text-xs leading-relaxed">{prd.technical_requirements.frontend}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
