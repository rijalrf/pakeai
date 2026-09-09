// Halaman Execute: salin Master Prompt, panduan CLI.
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Terminal } from 'lucide-react';

export function ExecutePage() {
  const { projectId = '' } = useParams();
  const [token, setToken] = useState('');
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
              <CardDescription>Tempel token CLI Anda (dibuat di Settings), lalu salin prompt ini ke AI agent pilihan Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Token CLI (PAT)</label>
                <input
                  className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm font-mono"
                  placeholder="pak_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Token tidak pernah dikirim ke server. Hanya replace placeholder di prompt.
                </p>
              </div>
              <Textarea rows={20} readOnly value={finalPrompt ?? 'Memuat...'} className="text-xs" />
              <Button onClick={copy} disabled={!finalPrompt}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
