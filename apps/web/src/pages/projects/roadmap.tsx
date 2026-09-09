// Roadmap DAG dengan @xyflow/react + dagre layout.
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RefreshCw } from 'lucide-react';

type Feature = { id: string; title: string; description?: string; dependencies: { dependsOnId: string; dependsOn: { id: string; title: string } }[]; tasks: { id: string; status: string }[] };
type Phase = { id: string; order: number; title: string; description?: string; layer: string; features: Feature[] };

const LAYER_COLORS: Record<string, string> = {
  DATABASE: '#94a3b8',
  BACKEND: '#3b82f6',
  FRONTEND: '#10b981',
  INTEGRATION: '#f59e0b',
};

function layout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 80 });
  nodes.forEach((n) => g.setNode(n.id, { width: 200, height: 60 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - 100, y: pos.y - 30 } };
  });
}

export function RoadmapPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['roadmap', projectId],
    queryFn: () => api<{ phases: Phase[] }>(`/api/projects/${projectId}/roadmap`),
  });

  const regen = useMutation({
    mutationFn: () => api(`/api/projects/${projectId}/roadmap/generate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap', projectId] }),
  });

  const genTasks = useMutation({
    mutationFn: () => api(`/api/projects/${projectId}/tasks/generate`, { method: 'POST' }),
    onSuccess: () => navigate(`/projects/${projectId}/tasks`),
  });

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const phases = q.data?.phases ?? [];
    for (const phase of phases) {
      for (const f of phase.features) {
        const totalTasks = f.tasks.length;
        const done = f.tasks.filter((t) => t.status === 'DONE').length;
        nodes.push({
          id: f.id,
          data: { label: `${f.title}\n${done}/${totalTasks} tasks` },
          position: { x: 0, y: 0 },
          style: {
            background: LAYER_COLORS[phase.layer] ?? '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: 8,
            width: 200,
            fontSize: 12,
            whiteSpace: 'pre-wrap',
          },
        });
        for (const dep of f.dependencies) {
          edges.push({ id: `${dep.dependsOnId}->${f.id}`, source: dep.dependsOnId, target: f.id, animated: true });
        }
      }
    }
    return { nodes: layout(nodes, edges), edges };
  }, [q.data]);

  if (!q.data || q.data.phases.length === 0) {
    return (
      <AppShell back="/dashboard" title="Roadmap">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Roadmap belum dibuat. Generate dari BRD dulu.
            <div className="mt-4">
              <Button onClick={() => regen.mutate()} disabled={regen.isPending}>
                <RefreshCw className="h-4 w-4" /> Generate Roadmap
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell back="/dashboard" title="Roadmap Visual">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {Object.entries(LAYER_COLORS).map(([k, c]) => (
            <Badge key={k} style={{ background: c, color: 'white' }}>{k}</Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => regen.mutate()} disabled={regen.isPending}>
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
          <Button size="sm" onClick={() => genTasks.mutate()} disabled={genTasks.isPending}>
            Generate Atomic Tasks <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Diagram Fase & Fitur</CardTitle>
          <CardDescription>Panah = dependensi (fitur tujuan butuh fitur sumber selesai dulu).</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: 500 }} className="border rounded">
            <ReactFlow nodes={nodes} edges={edges} fitView>
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
