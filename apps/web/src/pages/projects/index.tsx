// Halaman daftar project (untuk user menu)
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type Project = { id: string; name: string; idea: string; status: string; updatedAt: string };

export function ProjectsPage() {
  const navigate = useNavigate();
  const projectsQ = useQuery({
    queryKey: ['projects'],
    queryFn: () => api<{ projects: Project[] }>('/api/projects'),
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Daftar Project</h1>
          <p className="text-muted-foreground text-sm">Project yang sudah Anda buat.</p>
        </div>
        <Button onClick={() => navigate('/')}>
          <Plus className="h-4 w-4" /> Buat Project Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectsQ.isLoading && (
          <Card className="col-span-full text-center py-8 text-muted-foreground">
            Memuat...
          </Card>
        )}
        {projectsQ.data?.projects.length === 0 && !projectsQ.isLoading && (
          <Card className="col-span-full text-center py-8 text-muted-foreground">
            Belum ada project. Klik "Buat Project Baru" untuk mulai.
          </Card>
        )}
        {projectsQ.data?.projects.map((p) => (
          <Card
            key={p.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/projects/${p.id}/interview`)}
          >
            <CardHeader>
              <CardTitle className="text-base">{p.name}</CardTitle>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.idea}</p>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">Status: {p.status}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
