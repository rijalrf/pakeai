// Guide Page: Panduan eksekusi oleh AI agent (CLI pakeai)
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clipboard, CheckCircle2, KeyRound, Plus, Loader2, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export function GuidePage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [copied, setCopied] = useState(false);
  const [tokens, setTokens] = useState<Array<{ id: string; name: string }>>([]);
  const [token, setToken] = useState<string | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    // Baca token dari localStorage (dari Board atau generate sebelumnya)
    const saved = localStorage.getItem(`pakeai_token_${projectId}`) || localStorage.getItem('pakeai_last_token');
    if (saved) {
      setToken(saved);
      setInputToken(saved);
    }

    const loadTokens = async () => {
      try {
        const res = await fetch(`http://localhost:6655/api/projects/${projectId}/agent-tokens`, {
          credentials: 'include',
        });
        const json = await res.json();
        setTokens(json.tokens || []);
      } catch (err) {
        console.error('Gagal load tokens:', err);
      }
    };

    loadTokens();
  }, [projectId]);

  const generateToken = async () => {
    if (!projectId) return;
    setGeneratingToken(true);
    try {
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/agent-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: `CLI Token ${new Date().toLocaleDateString('id-ID')}` }),
      });
      const json = await res.json();
      if (json.token) {
        setToken(json.token);
        setInputToken(json.token);
        localStorage.setItem(`pakeai_token_${projectId}`, json.token);
        localStorage.setItem('pakeai_last_token', json.token);
        const refreshRes = await fetch(`http://localhost:6655/api/projects/${projectId}/agent-tokens`, {
          credentials: 'include',
        });
        const refreshJson = await refreshRes.json();
        setTokens(refreshJson.tokens || []);
      }
    } catch (err) {
      console.error('Gagal generate token:', err);
      alert('Gagal membuat token baru.');
    } finally {
      setGeneratingToken(false);
    }
  };

  const applyCustomToken = (val: string) => {
    const trimmed = val.trim();
    setToken(trimmed || null);
    setInputToken(trimmed);
    if (projectId && trimmed) {
      localStorage.setItem(`pakeai_token_${projectId}`, trimmed);
      localStorage.setItem('pakeai_last_token', trimmed);
    }
  };

  const copyToken = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (err) {
      console.error('Gagal salin token:', err);
    }
  };

  const copyToClipboard = async () => {
    const activeToken = token || '{{TOKEN}}';
    const text = `# Master Prompt — AI Agent Loop untuk "${projectId || 'Project'}"

Anda adalah AI Coding Agent otonom. Tugas Anda: mengeksekusi task-task project ini secara berurutan menggunakan CLI \`pakeai\`.

## Identitas Project
- Project ID: ${projectId}

## Loop Eksekusi (ulangi sampai tidak ada task tersisa)
\`\`\`
npx pakeai login ${activeToken}      # step 1: login dengan token
npx pakeai next                 # ambil task berikutnya
npx pakeai start                # tandai IN_PROGRESS
npx pakeai context              # baca bounded context task aktif
# >>> kerjakan task HANYA pada file yang BOLEH dibuat/dimodifikasi <<<
# >>> hormati file yang DILARANG <<<
npx pakeai done                 # tandai selesai
\`\`\`

## Aturan Penting
- **Isolasi project**: agent HANYA boleh membaca task dari project ini (server menegakkan via token PAT).
- **Bounded context**: hanya sentuh file di \`files_to_create\` / \`files_to_modify\`. DILARANG ubah file di \`forbidden\`.
- **Checkpoint gate**: jika setelah \`done\` ada pesan checkpoint, BERHENTI dan minta approval user sebelum lanjut.
- **Layer transition**: jika layer (DATABASE/BACKEND/FRONTEND) sudah selesai, minta approval user.
- **Testing**: sebelum panggil \`pakeai done\`, pastikan kode jalan lancar lokal dan test acceptance criteria terpenuhi.
- **Jika gagal**: laporkan error apa adanya ke user. JANGAN diam-diam fallback.`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Gagal salin:', err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          Panduan Eksekusi AI Agent
        </h1>
        <p className="text-muted-foreground mt-1">
          Ikuti langkah-langkah di bawah untuk menjalankan eksekusi otomatis oleh AI agent coding.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Token Card */}
        <Card className="border-primary/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-5 w-5 text-primary" />
                Token Autentikasi CLI
              </CardTitle>
              <Button
                size="sm"
                onClick={generateToken}
                disabled={generatingToken}
                className="gap-2"
              >
                {generatingToken ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {tokens.length === 0 ? 'Buat Token CLI' : 'Buat Token Baru'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {token ? (
              <div className="p-3.5 border border-green-500/50 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-800 dark:text-green-300">
                    Token Aktif (Otomatis disisipkan ke Master Prompt & Perintah di bawah):
                  </span>
                  <Badge variant="outline" className="text-[10px] border-green-600 text-green-700 dark:text-green-300">
                    Aktif
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background p-2 rounded border font-mono text-xs break-all select-all">
                    {token}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToken(token)}
                    className="gap-1.5 shrink-0"
                  >
                    {copiedToken ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedToken ? 'Tersalin' : 'Salin'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {tokens.length > 0
                    ? `Ada ${tokens.length} token aktif di project ini. Jika Anda sudah menyalin token pak_..., tempelkan di bawah agar otomatis masuk ke Master Prompt:`
                    : 'Belum ada token. Klik "Buat Token CLI" di atas atau tempelkan token yang sudah Anda miliki:'}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Tempel token pak_... di sini"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={() => applyCustomToken(inputToken)}
                    disabled={!inputToken.trim()}
                  >
                    Gunakan
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 1: Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm">1</span>
              Instalasi & Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Pastikan Node.js sudah terinstall versi 18+ atau lebih baru.
              </li>
              <li>
                Jalankan CLI pakeai untuk pertama kali:
                <pre className="bg-muted p-3 rounded-md mt-2 overflow-x-auto font-mono">
{`npx pakeai@latest`}
                </pre>
              </li>
              <li>
                Login dengan token:
                <pre className="bg-muted p-3 rounded-md mt-2 overflow-x-auto font-mono">
{`npx pakeai login ${token || '<TOKEN_ANDA>'}`}
                </pre>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 2: Understand Task Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm">2</span>
              Alur Kerja Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Setiap task akan dieksekusi dalam urutan berikut:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <code>pakeai next</code> — Ambil task TODO atau IN_PROGRESS berikutnya. Jika sudah tidak ada task tersisa, loop selesai.
              </li>
              <li>
                <code>pakeai start</code> — Tandai task sebagai IN_PROGRESS (agar tidak dikerjakan agent lain).
              </li>
              <li>
                <code>pakeai context</code> — Baca bounded context (file mana yang boleh dibuat/modifikasi, mana yang dilarang). Ini penting agar tidak melanggar scope project!
              </li>
              <li>
                Kerjakan task sesuai instruksi bounded context dan acceptance criteria. Pastikan:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Kode mengikuti best practice.</li>
                  <li>Acceptance criteria terpenuhi.</li>
                  <li>Tidak mengubah file yang dilarang.</li>
                </ul>
              </li>
              <li>
                <code>pakeai done</code> — Tandai task sebagai DONE. System akan auto-create checkpoint jika perlu.
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Step 3: Copy Master Prompt */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Paste ke AI Coding Assistant Anda</CardTitle>
            <Button size="sm" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4 mr-2" />
                  Salin Prompt
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Salin master prompt di bawah dan paste ke AI Coding Assistant Anda (misalnya Claude Desktop, GitHub Copilot Workspace, atau AI tool lainnya) saat mengerjakan task.
            </p>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto max-h-96 overflow-y-auto font-mono">
{`# Master Prompt — AI Agent Loop untuk "pake.ai Project"

Anda adalah AI Coding Agent otonom. Tugas Anda: mengeksekusi task-task project ini secara berurutan menggunakan CLI \`pakeai\`.

## Identitas Project
- Project ID: ${projectId}

## Loop Eksekusi (ulangi sampai tidak ada task tersisa)
\`\`\`
npx pakeai login ${token || '{{TOKEN}}'}
npx pakeai next     # ambil task berikutnya
npx pakeai start    # tandai IN_PROGRESS
npx pakeai context  # baca bounded context task aktif
# >>> kerjakan task HANYA pada file yang BOLEH dibuat/dimodifikasi <<<
# >>> hormati file yang DILARANG <<<
npx pakeai done     # tandai selesai
\`\`\`

## Aturan Penting
- **Isolasi project**: agent HANYA boleh membaca task dari project ini (server menegakkan via token PAT).
- **Bounded context**: hanya sentuh file di \`files_to_create\` / \`files_to_modify\`. DILARANG ubah file di \`forbidden\`.
- **Checkpoint gate**: jika setelah \`done\` ada pesan checkpoint, BERHENTI dan minta approval user sebelum lanjut.
- **Layer transition**: jika layer (DATABASE/BACKEND/FRONTEND) sudah selesai, minta approval user.
- **Testing**: sebelum panggil \`pakeai done\`, pastikan kode jalan lancar lokal dan test acceptance criteria terpenuhi.
- **Jika gagal**: laporkan error apa adanya ke user. JANGAN diam-diam fallback.`}
            </pre>
          </CardContent>
        </Card>

        {/* Step 4: Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm">4</span>
              Setelah Semua Task Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              Setelah semua task DONE, aplikasi siap dijalankan di komputer lokal:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Buka terminal di folder workspace proyek.
              </li>
              <li>
                Jalankan perintah sesuai stack:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li><strong>Vite/React:</strong> <code>npm run dev --port 9999</code> atau <code>vite --port 9999</code></li>
                  <li><strong>Next.js:</strong> <code>npm run dev -- -p 9999</code></li>
                  <li><strong>CRA:</strong> <code>PORT=9999 npm start</code></li>
                </ul>
              </li>
              <li>
                Akses aplikasi di browser: <strong>http://localhost:9999</strong>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-start pt-4">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}
