'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { WorkflowStepper } from '@/components/project/workflow-stepper';
import { FALLBACK_ROADMAP, type RoadmapPhase, type RoadmapDocument } from '@/lib/ai/roadmap';
import { FALLBACK_PRD } from '@/lib/ai/prd';
import {
  GitBranch,
  ArrowRight,
  Database,
  Server,
  Layout,
  Terminal,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';

function PhaseNode({ data }: { data: RoadmapPhase }) {
  const getLayerMeta = (layer: RoadmapPhase['layer']) => {
    switch (layer) {
      case 'DATABASE':
        return { color: 'border-sky-500/40 bg-sky-950/30 text-sky-400', icon: Database };
      case 'BACKEND':
        return { color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400', icon: Server };
      case 'FRONTEND':
        return { color: 'border-indigo-500/40 bg-indigo-950/30 text-indigo-400', icon: Layout };
      default:
        return { color: 'border-amber-500/40 bg-amber-950/30 text-amber-400', icon: Terminal };
    }
  };

  const meta = getLayerMeta(data.layer);
  const Icon = meta.icon;

  return (
    <div className={`w-80 rounded-xl border bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md transition-all ${meta.color}`}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-2 !h-2" />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-zinc-800 text-zinc-300">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-400">
            {data.layer}
          </span>
        </div>

        <Badge
          variant={
            data.status === 'completed'
              ? 'emerald'
              : data.status === 'in_progress'
              ? 'amber'
              : 'secondary'
          }
          className="text-[10px] font-mono capitalize"
        >
          {data.status.replace('_', ' ')}
        </Badge>
      </div>

      <h4 className="text-xs font-bold text-zinc-100 mb-1">{data.title}</h4>
      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
        {data.description}
      </p>

      <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
          Target Output:
        </span>
        {data.features.slice(0, 3).map((feat, idx) => (
          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
            <span className="text-zinc-600 font-mono text-[10px]">↳</span>
            <span className="truncate">{feat}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/40">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Est: {data.estimated_duration || '2-3 hari'}
        </span>
        <span>Order: #{data.order_index}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-500 !w-2 !h-2" />
    </div>
  );
}

function convertPhasesToGraph(phases: RoadmapPhase[]) {
  const nodes = phases.map((phase, index) => ({
    id: phase.id,
    type: 'phaseNode',
    position: { x: 250, y: index * 260 + 40 },
    data: phase,
  }));

  const edges: any[] = [];
  for (let i = 0; i < phases.length; i++) {
    const current = phases[i];
    if (current.depends_on_phase_ids && current.depends_on_phase_ids.length > 0) {
      current.depends_on_phase_ids.forEach((sourceId, idx) => {
        edges.push({
          id: `e-${sourceId}-${current.id}-${idx}`,
          source: sourceId,
          target: current.id,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        });
      });
    } else if (i > 0) {
      edges.push({
        id: `e-${phases[i - 1].id}-${current.id}`,
        source: phases[i - 1].id,
        target: current.id,
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
      });
    }
  }

  return { nodes, edges };
}

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, updateProjectStatus, saveRoadmap } = useProjectStore();

  const project = getProject(projectId);
  const initialPhases = project?.roadmap?.phases || (project?.id === 'futsal-booking-01' ? FALLBACK_ROADMAP.phases : []);
  const initialGraph = useMemo(() => convertPhasesToGraph(initialPhases), [initialPhases]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  const nodeTypes = useMemo(() => ({ phaseNode: PhaseNode }), []);

  // Auto-generate Roadmap jika belum ada
  useEffect(() => {
    if (!project) return;

    if (!project.roadmap && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleGenerateRoadmapWithAI();
    } else if (project.roadmap && nodes.length === 0) {
      const { nodes: loadedNodes, edges: loadedEdges } = convertPhasesToGraph(project.roadmap.phases);
      setNodes(loadedNodes);
      setEdges(loadedEdges);
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

      if (data.roadmap && data.roadmap.phases) {
        const { nodes: newNodes, edges: newEdges } = convertPhasesToGraph(data.roadmap.phases);
        setNodes(newNodes);
        setEdges(newEdges);
        saveRoadmap(projectId, data.roadmap);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke model AI gagal');
      if (nodes.length === 0) {
        const fallback = convertPhasesToGraph(FALLBACK_ROADMAP.phases);
        setNodes(fallback.nodes);
        setEdges(fallback.edges);
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
        <p className="text-zinc-400 text-sm">Memuat proyek...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-20">
      {/* Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold">
              03
            </span>
            <h1 className="text-base font-bold tracking-tight text-zinc-100">
              Visual Roadmap Arsitektur: {project.name}
            </h1>
            <Badge variant="emerald" className="text-[10px] font-mono">
              Otomatis via ai-builder
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Peta graf fase arsitektur berurutan (Database → Backend → Frontend → DevOps) tanpa circular dependency.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isGenerating || nodes.length === 0}
            className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            Setujui &amp; Buat Tasks Kanban
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* AI Generating Animation Card */}
      {isGenerating && (
        <Card className="border-indigo-500/40 bg-indigo-950/20 p-6 text-center shadow-2xl animate-pulse">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600/30 border border-indigo-500/60 flex items-center justify-center text-indigo-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">
                Enterprise Solutions Architect Sedang Memetakan Roadmap DAG untuk "{project.name}"...
              </h3>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                Model <span className="font-mono text-indigo-300">ai-builder</span> sedang mengonversi fitur PRD ke
                dalam Directed Acyclic Graph (DAG) bertingkat dari Database hingga deployment.
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

      {/* React Flow Interactive Canvas */}
      <div className="h-[560px] w-full rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-2xl relative overflow-hidden">
        {/* Ambient Canvas Legend */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 backdrop-blur-md text-[11px]">
          <span className="text-zinc-500 font-mono uppercase">Alur Layer:</span>
          <span className="text-sky-400 font-medium">1. Database</span>
          <span className="text-zinc-600">→</span>
          <span className="text-emerald-400 font-medium">2. Backend</span>
          <span className="text-zinc-600">→</span>
          <span className="text-indigo-400 font-medium">3. Frontend</span>
          <span className="text-zinc-600">→</span>
          <span className="text-amber-400 font-medium">4. DevOps</span>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.4}
          maxZoom={1.5}
        >
          <Background color="#27272a" gap={24} size={1} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-zinc-900 !border-zinc-800 !text-zinc-300" />
        </ReactFlow>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl backdrop-blur-md">
        <div className="text-xs text-zinc-400 pl-2">
          Langkah 3 Selesai • Roadmap siap dipecah menjadi atomic tasks per layer
        </div>
        <Button size="sm" onClick={handleApprove} className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
          Setujui Roadmap &amp; Generate Tasks untuk AI Agent
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
