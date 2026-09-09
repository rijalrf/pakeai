// Kanban board: 5 kolom, polling setiap 3 detik.
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

type Task = { id: string; title: string; layer: string; status: string; order: number; acceptanceCriteria: string[]; aiContext: { files_to_create?: string[]; files_to_modify?: string[]; forbidden?: string[] } };

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
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`),
    refetchInterval: 3000,
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

  return (
    <AppShell back="/dashboard" title="Task Kanban">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Polling 3 detik. Update status akan terlihat di sini.</p>
        <Button variant="outline" size="sm" onClick={() => genMut.mutate()} disabled={genMut.isPending}>
          <RefreshCw className="h-4 w-4" /> Generate Ulang
        </Button>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((col) => (
          <Card key={col.key}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>{col.label}</span>
                <Badge variant="outline">{byCol[col.key].length}</Badge>
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
