// Kanban board: 5 kolom, polling setiap 3 detik.
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';

type Task = { id: string; title: string; layer: string; status: string; order: number; acceptanceCriteria: string[]; aiContext: { files_to_create?: string[]; files_to_modify?: string[]; forbidden?: string[] } };
type Checkpoint = { id: string; type: string; status: string; message: string };

const COLUMNS = [
  { key: 'TODO', label: 'TODO' },
  { key: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { key: 'REVIEW', label: 'REVIEW' },
  { key: 'DONE', label: 'DONE' },
  { key: 'BLOCKED', label: 'BLOCKED' },
] as const;

const LAYER_COLORS: Record<string, string> = {
  DATABASE: '#94a3b8',
  BACKEND: '#3b82f6',
  FRONTEND: '#10b981',
  INTEGRATION: '#f59e0b',
};

export function TasksPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`),
    refetchInterval: 3000,
  });

  const checkpointsQ = useQuery({
    queryKey: ['checkpoints', projectId],
    queryFn: () => api<{ checkpoints: Checkpoint[] }>(`/api/projects/${projectId}/checkpoints`),
    enabled: !!projectId && (q.data?.tasks?.length ?? 0) > 0,
  });

  const genMut = useMutation({
    mutationFn: () => api(`/api/projects/${projectId}/tasks/generate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const byCol: Record<string, Task[]> = {};
  for (const c of COLUMNS) byCol[c.key] = [];
  for (const t of q.data?.tasks ?? []) {
    (byCol[t.status] ?? byCol.TODO).push(t);
  }

  // Cek apakah semua DATABASE + BACKEND + FRONTEND sudah DONE
  const allFrontendDone = (() => {
    if (!q.data?.tasks.length) return false;
    const layers = ['DATABASE', 'BACKEND', 'FRONTEND'] as const;
    for (const layer of layers) {
      const hasNotDone = q.data.tasks.some((t) => t.layer === layer && t.status !== 'DONE');
      if (hasNotDone) return false;
    }
    return true;
  })();

  // Cek apakah ada APPS_READY_FOR_USE checkpoint pending
  const appsReadyPending = checkpointsQ.data?.checkpoints.some(
    (cp) => cp.type === 'APPS_READY_FOR_USE' && cp.status === 'PENDING'
  );

  return (
    <AppShell back="/dashboard" title="Task Kanban">
      {allFrontendDone && appsReadyPending && (
        <Card className="mb-4 border-yellow-500 bg-yellow-50">
          <CardContent className="py-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-700 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-1">Semua Fitur Selesai!</h4>
              <p className="text-sm text-yellow-800">
                Aplikasi siap diverifikasi. Buka tab <strong>Siap Eksekusi</strong> untuk instruksi cara run lokal di <code>http://localhost:9999</code>.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${projectId}/ready`)}>
              Lihat Instruksi
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Polling 3 detik. Update status akan terlihat di sini.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => genMut.mutate()} disabled={genMut.isPending}>
            <RefreshCw className="h-4 w-4 mr-2" /> Generate Ulang
          </Button>
          {q.data?.tasks && q.data.tasks.length > 0 && (
            <Button size="sm" onClick={() => navigate(`/projects/${projectId}/ready`)}>
              Lanjut ke Eksekusi <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((col) => (
          <Card key={col.key}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>{col.label}</span>
                <Badge className="border">{byCol[col.key].length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byCol[col.key].map((t) => (
                <div key={t.id} className="border rounded-md p-2 bg-background">
                  <div className="flex items-center justify-between mb-1">
                    <Badge style={{ background: LAYER_COLORS[t.layer], color: 'white' }} className="border-0">{t.layer}</Badge>
                    <span className="text-xs text-muted-foreground">#{t.order}</span>
                  </div>
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.aiContext?.files_to_create && t.aiContext.files_to_create.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      + {t.aiContext.files_to_create.join(', ')}
                    </p>
                  )}
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {COLUMNS.filter((c) => c.key !== t.status).map((c) => (
                      <button
                        key={c.key}
                        onClick={() => updateMut.mutate({ id: t.id, status: c.key })}
                        className="text-[10px] px-1.5 py-0.5 border rounded hover:bg-muted"
                      >
                        {c.key}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
