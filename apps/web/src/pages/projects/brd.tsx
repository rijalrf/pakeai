// BRD viewer.
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RefreshCw } from 'lucide-react';

type Brd = { id: string; version: number; content: { overview?: string; goals?: string[]; features?: { id: string; name: string; description?: string }[]; techRequirements?: string[]; nonFunctional?: string[]; outOfScope?: string[] } };

export function BrdPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const brdQ = useQuery({
    queryKey: ['brd', projectId],
    queryFn: () => api<{ brd: Brd | null }>(`/api/projects/${projectId}/brd`),
  });

  const regen = useMutation({
    mutationFn: () => api(`/api/projects/${projectId}/brd/generate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brd', projectId] }),
  });

  const genRoadmap = useMutation({
    mutationFn: () => api(`/api/projects/${projectId}/roadmap/generate`, { method: 'POST' }),
    onSuccess: () => navigate(`/projects/${projectId}/roadmap`),
  });

  if (!brdQ.data?.brd) {
    return (
      <AppShell back={`/projects/${projectId}/brd`} title="BRD">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            BRD belum dibuat. Silakan jawab pertanyaan discovery dulu.
            <div className="mt-4">
              <Button onClick={() => navigate(`/projects/${projectId}/brd`)}>Kembali ke Interview</Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const brd = brdQ.data.brd;

  return (
    <AppShell back="/dashboard" title="BRD Viewer">
      <div className="flex items-center justify-between mb-4">
        <Badge>v{brd.version}</Badge>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => regen.mutate()} disabled={regen.isPending}>
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
          <Button size="sm" onClick={() => genRoadmap.mutate()} disabled={genRoadmap.isPending}>
            Generate Roadmap <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{brd.content.overview ?? '_(tidak ada)_'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tujuan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 list-disc pl-4">
              {brd.content.goals?.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tech Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 list-disc pl-4">
              {brd.content.techRequirements?.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Out of Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 list-disc pl-4">
              {brd.content.outOfScope?.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Fitur</CardTitle>
            <CardDescription>Daftar fitur yang akan dibangun.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {brd.content.features?.map((f) => (
                <div key={f.id} className="border rounded-md p-3">
                  <p className="font-medium text-sm">{f.name}</p>
                  {f.description && <p className="text-xs text-muted-foreground mt-1">{f.description}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
