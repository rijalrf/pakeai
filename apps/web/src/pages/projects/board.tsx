// Board page: papan Kanban task implementasi project.
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/http';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Activity, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { useWizardNav } from '@/components/layout/wizard-nav';
import { ExecutionDialog } from '@/components/execution/execution-dialog';

type AiMetricsSummary = {
  totalCalls: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  avgLatencyMs: number;
  successRate: number;
};

type Task = {
  id: string;
  order?: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
  layer: string;
  aiContext?: {
    taskId?: string;
    requirement_ids?: string[];
    depends_on?: string[];
  };
  dependsOn?: Array<{
    dependsOn: {
      id: string;
      title: string;
      status: string;
      order: number;
    };
  }>;
};

export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<AiMetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!projectId) return;
    api<{ project?: { name?: string } }>(`/api/projects/${projectId}`)
      .then((res) => {
        if (res.project?.name) setProjectName(res.project.name);
      })
      .catch(() => {});
  }, [projectId]);

  const handleBackToTree = async () => {
    if (!projectId) return;
    try {
      await api(`/api/projects/${projectId}/wizard-step`, {
        method: 'POST',
        body: JSON.stringify({ step: 'tree' }),
      });
      navigate(`/projects/${projectId}/tree`);
    } catch {
      navigate(`/projects/${projectId}/tree`);
    }
  };

  useWizardNav({
    back: {
      label: 'Kembali ke Diagram Struktur',
      onClick: handleBackToTree,
    },
    next: {
      label: 'Panduan Eksekusi',
      onClick: () => setExecutionDialogOpen(true),
    },
  });

  const loadMetrics = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api<{ summary: AiMetricsSummary }>(`/api/projects/${projectId}/ai-metrics`);
      if (res.summary) setMetrics(res.summary);
    } catch {}
  }, [projectId]);

  const loadTasks = useCallback(
    async (mode: 'initial' | 'manual' | 'silent' = 'initial') => {
      if (!projectId) return;
      if (mode === 'manual') setRefreshing(true);

      try {
        const json = await api<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`);
        if (json.tasks && json.tasks.length > 0) {
          setTasks(json.tasks);
        } else if (mode === 'initial') {
          await generateTasks();
        }
        loadMetrics();
      } catch (err) {
        console.error('Gagal load tasks:', err);
      } finally {
        if (mode === 'initial') setLoading(false);
        if (mode === 'manual') setRefreshing(false);
      }
    },
    [projectId, loadMetrics]
  );

  // Load tasks on mount
  useEffect(() => {
    loadTasks('initial');
  }, [loadTasks]);

  // Polling saat auto refresh aktif (tiap 5 detik)
  useEffect(() => {
    if (!autoRefresh || !projectId) return;
    const timer = setInterval(() => {
      loadTasks('silent');
    }, 5000);
    return () => clearInterval(timer);
  }, [autoRefresh, projectId, loadTasks]);

  const generateTasks = async () => {
    if (!projectId) return;
    setGenerating(true);

    try {
      await api(`/api/projects/${projectId}/tasks/generate`, {
        method: 'POST',
      });
      const refreshJson = await api<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`);
      setTasks(refreshJson.tasks || []);
    } catch (err) {
      console.error('Error generating tasks:', err);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const columns: Array<{ status: string; label: string }> = [
    { status: 'TODO', label: 'To Do' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'REVIEW', label: 'Review' },
    { status: 'DONE', label: 'Done' },
    { status: 'BLOCKED', label: 'Blocked' },
  ];

  if (loading || generating) {
    return (
      <div className="space-y-6">
        {/* Skeleton kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {columns.map((col) => (
            <Card key={col.status}>
              <CardHeader>
                <div className="h-5 bg-muted w-1/2 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar Atas */}
      <div className="flex items-center justify-between gap-3">
        {!tasks.length && !generating ? (
          <Button onClick={generateTasks} size="sm" className="gap-2">
            Generate Tasks
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh((prev) => !prev)}
            className="gap-1.5 font-medium"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            <span>Auto Refresh: {autoRefresh ? 'Aktif (5s)' : 'Mati'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => loadTasks('manual')}
            disabled={refreshing || loading}
            className="gap-1.5 font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Memuat...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Widget Observabilitas AI (Bab 39) */}
      {metrics && metrics.totalCalls > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Panggilan AI</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold mt-1 font-mono">{metrics.totalCalls}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Token</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold mt-1 font-mono">{metrics.totalTokens.toLocaleString('id-ID')}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rata-rata Latensi</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold mt-1 font-mono">{(metrics.avgLatencyMs / 1000).toFixed(1)}s</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tingkat Keberhasilan</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold mt-1 font-mono">{metrics.successRate}%</div>
          </Card>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {columns.map((col) => (
            <Card key={col.status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{col.label}</CardTitle>
                <Badge variant="outline" className="mt-1">
                  {tasks.filter((t) => t.status === col.status).length} task
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.filter((t) => t.status === col.status).map((task) => {
                  const pendingDeps = (task.dependsOn ?? []).filter((d) => d.dependsOn.status !== 'DONE');
                  const isBlocked = pendingDeps.length > 0;
                  const taskIdLabel = task.aiContext?.taskId || (task.order ? `#${task.order}` : undefined);

                  return (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-1.5 pt-3 px-3">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          {taskIdLabel && (
                            <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                              {taskIdLabel}
                            </span>
                          )}
                          {task.aiContext?.requirement_ids && task.aiContext.requirement_ids.length > 0 && (
                            <span className="font-mono text-[10px] text-primary">
                              {task.aiContext.requirement_ids.join(', ')}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xs font-semibold leading-snug">{task.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {task.layer}
                          </Badge>
                          {col.status === 'TODO' && isBlocked && (
                            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                              Tunggu #{pendingDeps.map((d) => d.dependsOn.order).join(', ')}
                            </Badge>
                          )}
                          {col.status === 'TODO' && !isBlocked && (task.dependsOn ?? []).length > 0 && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0">
                              Siap
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {tasks.filter((t) => t.status === col.status).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 italic">
                    Kosong
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ExecutionDialog
        projectId={projectId!}
        projectName={projectName}
        isOpen={executionDialogOpen}
        onClose={() => setExecutionDialogOpen(false)}
      />
    </div>
  );
}
