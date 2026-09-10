// Settings: generate & revoke PAT.
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Trash2, ArrowLeft } from 'lucide-react';

type Token = { id: string; name: string; lastUsedAt: string | null; isRevoked: boolean; createdAt: string };

export function SettingsPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState('Token CLI');
  const [newToken, setNewToken] = useState<string | null>(() => {
    return localStorage.getItem(`pakeai_pat_${projectId}`) || null;
  });
  const [copied, setCopied] = useState(false);

  const tokensQ = useQuery({
    queryKey: ['tokens', projectId],
    queryFn: () => api<{ tokens: Token[] }>(`/api/projects/${projectId}/agent-tokens`),
  });

  const createMut = useMutation<{ token: string }>({
    mutationFn: () => api<{ token: string }>(`/api/projects/${projectId}/agent-tokens`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
    onSuccess: (res) => {
      setNewToken(res.token);
      localStorage.setItem(`pakeai_pat_${projectId}`, res.token);
      qc.invalidateQueries({ queryKey: ['tokens', projectId] });
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => api(`/api/agent-tokens/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tokens', projectId] });
    },
  });

  async function copy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const backUrl = `/projects/${projectId}/board`;

  return (
    <AppShell back={backUrl} title="Settings">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/projects/${projectId}/board`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Board
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Generate Token CLI</CardTitle>
            <CardDescription>Token dipakai AI agent untuk menjalankan `npx pakeai`. Hanya ditampilkan SEKALI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Nama token" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? 'Memproses...' : 'Generate Token Baru'}
            </Button>
            {newToken && (
              <div className="mt-3 border rounded-md p-3 bg-muted space-y-3">
                <p className="text-xs text-muted-foreground mb-1">Token tersimpan (read-only):</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs break-all flex-1 font-mono">{newToken}</code>
                  <Button size="sm" variant="outline" onClick={copy}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/projects/${projectId}/board`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Board
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {tokensQ.data?.tokens.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada token.</p>
            )}
            <div className="space-y-2">
              {tokensQ.data?.tokens.map((t) => (
                <div key={t.id} className="border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.isRevoked ? 'Dicabut' : t.lastUsedAt ? `Terakhir: ${new Date(t.lastUsedAt).toLocaleString('id-ID')}` : 'Belum pernah dipakai'}
                    </p>
                  </div>
                  {!t.isRevoked && (
                    <Button size="sm" variant="ghost" onClick={() => revokeMut.mutate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
