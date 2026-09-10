// Header baru untuk flow linear: logo kiri, user menu + dark mode kanan
import { useNavigate } from 'react-router-dom';
import { signOut, useSession } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, LogOut, FolderGit2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  const { data, isPending } = useSession();
  const navigate = useNavigate();
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const fetchProjects = async () => {
    if (projects.length > 0) return;
    setProjectsLoading(true);
    try {
      const res = await fetch('http://localhost:6655/api/projects', { credentials: 'include' });
      const json = await res.json();
      setProjects(json.projects || []);
    } catch (err) {
      console.error('Gagal load projects:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  return (
    <header className="sticky top-0 border-b bg-background z-50">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Kiri: Logo pakeai */}
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold text-xl">
            <span className="text-green-600 dark:text-green-400">pake</span>.ai
          </Link>

          {/* User Menu di Header (jika logged in) */}
          {data?.user ? (
            <DropdownMenu onOpenChange={() => fetchProjects()}>
              <DropdownMenuTrigger
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-sm"
                onClick={(e: any) => { e.stopPropagation(); fetchProjects(); }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {data.user.name?.charAt(0).toUpperCase() || data.user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-muted-foreground">{data.user.email}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 text-sm border-b">
                  <div className="font-medium">{data.user.name || data.user.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">{data.user.email}</div>
                </div>

                {/* Daftar Project (limit 5 terbaru) */}
                {projectsLoading ? (
                  <DropdownMenuItem disabled className="text-muted-foreground cursor-default">
                    Memuat...
                  </DropdownMenuItem>
                ) : projects.length > 0 ? (
                  <>
                    <DropdownMenuSeparator />
                    <div className="max-h-48 overflow-y-auto">
                      {projects.slice(0, 5).map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/projects/${project.id}/interview`)}
                        >
                          <FolderGit2 className="h-4 w-4 mr-2" />
                          {project.name}
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                ) : null}

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate('/projects')}
                >
                  <FolderGit2 className="h-4 w-4 mr-2" />
                  Daftar Project
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {/* Kanan: Dark Mode Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
