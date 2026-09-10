// AppShell: header + container untuk halaman project.
import { Link, useNavigate, useParams } from 'react-router-dom';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';

export function AppShell({ children, title, back }: { children: React.ReactNode; title?: string; back?: string }) {
  const { data } = useSession();
  const navigate = useNavigate();
  const { projectId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {back && (
              <Button variant="ghost" size="icon" onClick={() => navigate(back)} aria-label="Kembali">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Link to="/" className="font-semibold">pakeai</Link>
            {title && <span className="text-muted-foreground">/ {title}</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{data?.user?.email}</span>
            {projectId && (
              <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/settings`)}>
                Settings
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
