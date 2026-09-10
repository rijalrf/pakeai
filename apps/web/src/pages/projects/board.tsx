// Board page: papan Kanban task implementasi project.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';

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

  // Load tasks
  useEffect(() => {
    if (!projectId) return;

    const loadTasks = async () => {
      try {
        const res = await fetch(`http://localhost:6655/api/projects/${projectId}/tasks`, {
          credentials: 'include',
        });
        const json = await res.json();
        if (json.tasks && json.tasks.length > 0) {
          setTasks(json.tasks);
        } else {
          await generateTasks();
        }
      } catch (err) {
        console.error('Gagal load tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [projectId]);

  const generateTasks = async () => {
    if (!projectId) return;
    setGenerating(true);

    try {
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/tasks/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const refreshRes = await fetch(`http://localhost:6655/api/projects/${projectId}/tasks`, {
          credentials: 'include',
        });
        const refreshJson = await refreshRes.json();
        setTasks(refreshJson.tasks || []);
      } else {
        console.warn('Generate tasks gagal');
      }
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

        <Button
          size="sm"
          onClick={() => navigate(`/projects/${projectId}/guide`)}
          className="gap-1.5 font-medium ml-auto"
        >
          <ArrowRight className="h-4 w-4" />
          Panduan Eksekusi
        </Button>
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
