import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function OnboardingPage() {
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ project: { id: string } }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, idea }),
      });
      navigate(`/projects/${res.project.id}/brd`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal membuat project.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Mulai dari Ide</CardTitle>
          <CardDescription>Ceritakan aplikasi yang ingin Anda buat. Nanti AI akan menggali detail lewat pertanyaan discovery.</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Project</label>
              <Input className="mt-1" placeholder="mis. Aplikasi Catatan Pribadi" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Ide / Deskripsi</label>
              <Textarea
                className="mt-1"
                rows={5}
                placeholder="Jelaskan aplikasi yang ingin Anda buat, masalah yang ingin dipecahkan, dan pengguna targetnya."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                required
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
          </CardContent>
          <div className="px-6 pb-6">
            <Button type="submit" disabled={loading}>{loading ? 'Membuat...' : 'Buat & Lanjut ke Interview'}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
