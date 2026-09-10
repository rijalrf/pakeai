// Settings project: pengaturan token dipindahkan ke halaman profil.
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, KeyRound } from 'lucide-react';

export function SettingsPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/board`)} className="gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Board
        </Button>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-primary" />
            Token Akses Agen (PAT)
          </CardTitle>
          <CardDescription>
            Token CLI untuk project ini dan project lainnya dibuat, dilihat, dan dicabut dari satu tempat
            di halaman profil agar mudah dikelola.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/profile')}>Buka Profil & Token</Button>
        </CardContent>
      </Card>
    </div>
  );
}
