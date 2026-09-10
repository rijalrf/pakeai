// Halaman Execute: salin Master Prompt, panduan CLI.
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Terminal, Key } from 'lucide-react';

export function ExecutePage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const [token] = useState(() => {
    return localStorage.getItem(`pakeai_pat_${projectId}`) || '';
  });
  const [copied, setCopied] = useState(false);

  const q = useQuery({
    queryKey: ['master-prompt', projectId],
    queryFn: () => api<{ projectName: string; prompt: string }>(`/api/projects/${projectId}/master-prompt`),
  });

  const finalPrompt = q.data?.prompt.replace('{{TOKEN}}', token || 'PASTE_TOKEN_ANDA_DISINI');

  async function copy() {
    if (!finalPrompt) return;
    await navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell back="/dashboard" title="Eksekusi via CLI">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Master Prompt</CardTitle>
              <CardDescription>Token CLI otomatis terpasang (read-only). Salin prompt ini ke AI agent pilihan Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {token ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Token CLI (PAT)</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => navigate(`/projects/${projectId}/settings?from=ready`)}
                    >
                      Ganti / Generate Token Baru
                    </Button>
                  </div>
                  <Input
                    value={token}
                    readOnly
                    className="font-mono bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Token CLI aktif (read-only). Otomatis terpasang ke Master Prompt di bawah.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Token CLI (PAT)</label>
                  <div className="border border-dashed border-amber-300 bg-amber-50 rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-amber-900">Belum ada token CLI</p>
                      <p className="text-xs text-amber-700">
                        Buat token CLI baru untuk project ini agar AI agent bisa mengakses task.
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate(`/projects/${projectId}/settings?from=ready`)}
                      className="shrink-0"
                    >
                      <Key className="h-4 w-4 mr-2" /> Generate Key
                    </Button>
                  </div>
                </div>
              )}
              <Textarea rows={20} readOnly value={finalPrompt ?? 'Memuat...'} className="text-xs" />
              <Button onClick={copy} disabled={!finalPrompt || !token}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Tersalin' : 'Salin Prompt'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cara Pakai</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <ol className="space-y-2 list-decimal pl-4">
                <li>Buka tab <strong>Settings</strong> dan buat token CLI baru.</li>
                <li>Tempel token di kolom di samping.</li>
                <li>Klik <strong>Salin Prompt</strong>.</li>
                <li>Buka AI agent Anda (Claude Code, Cursor, dsb) dan paste prompt.</li>
                <li>Agent akan otomatis menjalankan <code className="bg-muted px-1 rounded">npx pakeai</code> loop.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loop Agent</CardTitle>
              <CardDescription>Yang akan dijalankan AI agent Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`npx pakeai login <token>
npx pakeai next
npx pakeai start
npx pakeai context
# ... kerjakan task ...
npx pakeai done
# ulang sampai selesai atau checkpoint`}
              </pre>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Terminal className="h-3 w-3" /> CLI membaca bounded context, agent hanya boleh edit file yang diizinkan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
