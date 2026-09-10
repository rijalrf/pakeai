// Board page: papan Kanban task implementasi project.
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/http';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, RefreshCw } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
  layer: string;
};

export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

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
      } catch (err) {
        console.error('Gagal load tasks:', err);
      } finally {
        if (mode === 'initial') setLoading(false);
        if (mode === 'manual') setRefreshing(false);
      }
    },
    [projectId]
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

          <Button
            size="sm"
            onClick={() => navigate(`/projects/${projectId}/guide`)}
            className="gap-1.5 font-medium"
          >
            <ArrowRight className="h-4 w-4" />
            Panduan Eksekusi
          </Button>
        </div>
      </div>

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
                {tasks.filter((t) => t.status === col.status).map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <Badge variant="outline" className="mt-2 text-xs">
                        {task.layer}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
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
    </div>
  );
}
