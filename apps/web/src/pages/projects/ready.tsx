// Halaman "Siap Eksekusi" — BRD download + Master Prompt siap copas.
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppShell } from '@/components/layout/app-shell';
import { Copy, Check, Download, Terminal } from 'lucide-react';

export function ReadyPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!finalPrompt) return;
    await navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadBrd() {
    try {
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/brd/download`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Download gagal');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BRD_${projectId}.md`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download BRD gagal:', err);
      alert('Gagal download BRD. Pastikan Anda sudah login dan BRD sudah dibuat.');
    }
  }

  const finalPrompt = `# Master Prompt — AI Agent Loop untuk Project ${projectId}

Anda adalah AI Coding Agent otonom. Tugas Anda: mengeksekusi task-task project ini secara berurutan menggunakan CLI pakeai.

## Identitas Project
- Nama: Project ${projectId}

## Setup (jalankan 1x di awal)
1. Login dengan token di bawah ini:
   \`\`\`
   npx pakeai login {{TOKEN}}
   \`\`\`

## Fetch BRD (lakukan sekali, sebelum loop task)
- **Via CLI** (direkomendasikan):
  \`\`\`
  npx pakeai brd
  \`\`\`
- **Manual**: download BRD.md dari web UI → paste sebagai konteks

## Loop Eksekusi
Untuk SETIAP task, kerjakan langkah ini PERSIS:

\`\`\`
npx pakeai next       # ambil task berikutnya
npx pakeai start      # tandai IN_PROGRESS
npx pakeai context    # baca bounded context task aktif
# >>> kerjakan task HANYA pada file yang BOLEH dibuat/dimodifikasi <<<
npx pakeai done       # tandai selesai
\`\`\`

## Aturan Penting
- Isolasi project: agent HANYA boleh membaca task/BRD dari project ini.
- Bounded context: hanya sentuh file di files_to_create / files_to_modify. DILARANG ubah file di forbidden.
- Checkpoint gate: jika ada pesan checkpoint, BERHENTI dan minta approval user sebelum lanjut.

{{TOKEN}}
`;

  return (
    <AppShell back="/dashboard" title="Siap Eksekusi">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Download BRD */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Download BRD</CardTitle>
              <CardDescription>Dokumen kebutuhan bisnis untuk referensi manusia.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadBrd} variant="outline" className="w-full mb-2">
                <Download className="h-4 w-4 mr-2" /> Download BRD.md
              </Button>
              <p className="text-xs text-muted-foreground">
                File akan tersimpan di folder Download browser Anda.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Panduan Cepat</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ol className="space-y-2 list-decimal pl-4">
                <li>Buat token CLI di tab Settings.</li>
                <li>Tempel token di kolom di samping.</li>
                <li>Salin Master Prompt ke AI agent Anda.</li>
                <li>Jalankan perintah login di terminal.</li>
                <li>Biarkan AI agent menjalankan loop otomatis.</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Master Prompt */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Master Prompt</CardTitle>
              <CardDescription>Salin prompt ini ke AI agent Anda (Claude Code, Codex, Cursor, dll).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Token CLI (PAT)</label>
                <Input
                  placeholder="pak_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Token tidak pernah dikirim ke server. Hanya replace placeholder di prompt.
                </p>
              </div>

              <Textarea
                rows={16}
                readOnly
                value={finalPrompt.replace('{{TOKEN}}', token || '{{TOKEN}}')}
                className="text-xs bg-muted"
              />

              <Button onClick={copy} disabled={!token}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Tersalin' : 'Salin Prompt'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loop Agent yang Akan Dijalankan</CardTitle>
              <CardDescription>Komando-komando CLI yang akan dijalankan AI agent Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`npx pakeai login <token>
npx pakeai next
npx pakeai start
npx pakeai context
# ... kerjakan task sesuai bounded context ...
npx pakeai done
# ulang sampai semua task selesai`}
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
