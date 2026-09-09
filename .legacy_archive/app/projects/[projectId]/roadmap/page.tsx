'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { WorkflowStepper } from '@/components/project/workflow-stepper';
import { FALLBACK_ROADMAP, type RoadmapPhase } from '@/lib/ai/roadmap';
import { FALLBACK_PRD } from '@/lib/ai/prd';
import { ReviewStatusBadge } from '@/components/ui/review-status-badge';
import type { ReviewResult } from '@/lib/ai/reviewer';
import {
  ArrowRight,
  Database,
  Server,
  Layout,
  Terminal,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';

function getLayerIcon(layer: RoadmapPhase['layer']) {
  switch (layer) {
    case 'DATABASE':
      return Database;
    case 'BACKEND':
      return Server;
    case 'FRONTEND':
      return Layout;
    default:
      return Terminal;
  }
}

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, updateProjectStatus, saveRoadmap } = useProjectStore();

  const project = getProject(projectId);
  const initialPhases =
    project?.roadmap?.phases ||
    (project?.id === 'futsal-booking-01' ? FALLBACK_ROADMAP.phases : []);

  const [phases, setPhases] = useState<RoadmapPhase[]>(initialPhases);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [autoFixed, setAutoFixed] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    if (!project) return;

    if (!project.roadmap && phases.length === 0 && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleGenerateRoadmapWithAI();
    } else if (project.roadmap && phases.length === 0) {
      setPhases(project.roadmap.phases);
    }
  }, [project]);

  const handleGenerateRoadmapWithAI = async () => {
    if (!project) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const prdToUse = project.prd || FALLBACK_PRD;
      const res = await fetch(`/api/projects/${projectId}/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd: prdToUse }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan Roadmap dengan model AI');
      }

      if (data.roadmap?.phases) {
        setPhases(data.roadmap.phases);
        saveRoadmap(projectId, data.roadmap);
      }
      if (data.review) {
        setReview(data.review);
        setAutoFixed(!!data.autoFixed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke model AI gagal');
      if (phases.length === 0) {
        setPhases(FALLBACK_ROADMAP.phases);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    updateProjectStatus(projectId, 'tasks');
    router.push(`/projects/${projectId}/tasks`);
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
      {/* Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-zinc-900">
              Roadmap Arsitektur: {project.name}
            </h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Fase Bertahap
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Urutan eksekusi layer terstruktur: Database → Backend → Frontend → DevOps.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {review && (
            <ReviewStatusBadge review={review} stageName="Roadmap" autoFixed={autoFixed} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateRoadmapWithAI}
            disabled={isGenerating}
            className="gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isGenerating || phases.length === 0}
            className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            Setujui &amp; Buat Tasks
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Generating Loader */}
      {isGenerating && (
        <Card className="p-5 border-indigo-200 bg-indigo-50/50 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <p className="text-xs font-medium text-zinc-800">
              AI sedang menyusun tahapan arsitektur dari PRD...
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

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200">
        {phases.map((phase, index) => {
          const Icon = getLayerIcon(phase.layer);
          return (
            <div key={phase.id || index} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-6 top-4 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-indigo-600 shadow-xs" />

              <Card className="p-4 border-zinc-200 bg-white hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-zinc-100 text-zinc-700">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                      {phase.layer}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900">
                      {phase.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {phase.estimated_duration || '1-2 hari'}
                    </span>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {phase.status || 'pending'}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                  {phase.description}
                </p>

                {phase.features && phase.features.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-zinc-100">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                      Target Fitur:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {phase.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-zinc-700">
                          <span className="h-1 w-1 rounded-full bg-indigo-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
