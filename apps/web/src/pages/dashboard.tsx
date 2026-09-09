import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, GitBranch, Trello, Terminal, Settings } from 'lucide-react';

type Project = { id: string; name: string; idea: string; status: string; updatedAt: string };
type Tool = { id: string; name: string; description: string; icon: string; status: string };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, GitBranch, Trello, Terminal, Settings,
};

export function DashboardPage() {
  const navigate = useNavigate();
  const projectsQ = useQuery({
    queryKey: ['projects'],
    queryFn: () => api<{ projects: Project[] }>('/api/projects'),
  });
  const toolsQ = useQuery({
    queryKey: ['tools'],
    queryFn: () => api<{ tools: Tool[] }>('/api/tools'),
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Project Anda dan tools yang tersedia.</p>
        </div>
        <Button onClick={() => navigate('/onboarding')}>
          <Plus className="h-4 w-4" /> Buat Project
        </Button>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Project</h2>
        {projectsQ.isLoading && <p className="text-muted-foreground">Memuat...</p>}
        {projectsQ.data?.projects.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada project. Klik "Buat Project" untuk mulai dari ide.
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsQ.data?.projects.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/projects/${p.id}/brd`)}>
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription className="line-clamp-2">{p.idea}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">Status: {p.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Tools</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Pilih tool untuk setiap project. Tool baru = tambah di registry API.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolsQ.data?.tools.map((t) => {
            const Icon = ICONS[t.icon] ?? FileText;
            return (
              <Card key={t.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <CardDescription>{t.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
