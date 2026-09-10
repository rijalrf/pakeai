// Guide Page: Panduan eksekusi task — opsi Manual CLI vs Otomatis lewat AI Agent
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/http';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Clipboard,
  Check,
  KeyRound,
  Terminal,
  Bot,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Play,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';

export function GuidePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [inputToken, setInputToken] = useState(() => {
    return localStorage.getItem('pakeai_active_pat') || '';
  });

  const generateTokenMut = useMutation<{ token: string }>({
    mutationFn: () =>
      api<{ token: string }>('/api/agent-tokens', {
        method: 'POST',
        body: JSON.stringify({ name: 'Token CLI Guide' }),
      }),
    onSuccess: (res) => {
      localStorage.setItem('pakeai_active_pat', res.token);
      setInputToken(res.token);
    },
  });

  const activeToken = inputToken.trim() || '<TOKEN_PAT_ANDA>';

  const apiUrl =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? window.location.origin
      : 'https://pakeai.mrijal.my.id';

  const installCommand = `npm install -g ${apiUrl}/api/download/pakeai.tgz`;
  const loginCommand = `pakeai login ${activeToken} --api-url ${apiUrl}`;

  const masterPromptText = `# Master Prompt — AI Agent Loop untuk Project "${projectId || 'pake.ai'}"

Anda adalah AI Coding Agent otonom. Tugas Anda: mengeksekusi task-task implementasi proyek secara berurutan sampai selesai menggunakan CLI \`pakeai\`.

## 0. Persiapan: Pasang CLI (Cukup Sekali)
Jika perintah \`pakeai\` belum terpasang di terminal lingkungan ini, jalankan instalasi:
\`${installCommand}\`

## 1. Identitas & Autentikasi
- Project ID: ${projectId}
- Login CLI: \`${loginCommand}\`
- Switch Project (jika diperlukan): \`pakeai switch ${projectId}\`

## 2. Loop Eksekusi Otomatis (Ulangi sampai semua task DONE)
Lakukan siklus berikut untuk setiap task:
1. Jalankan \`pakeai next\` untuk mengambil task aktif berikutnya. Jika sudah tidak ada task, hentikan loop.
2. Jalankan \`pakeai start\` untuk mengunci task menjadi status IN_PROGRESS.
3. Jalankan \`pakeai context\` untuk membaca Bounded Context (aturan file mana yang boleh dibuat, dimodifikasi, atau dilarang diubah).
4. Implementasikan kode sesuai kriteria penerimaan (acceptance criteria) dan batasan bounded context.
5. Verifikasi bahwa kode berjalan dengan baik dan tidak ada file terlarang yang tersentuh.
6. Jalankan \`pakeai done\` untuk menandai task selesai.

## 3. Batasan & Aturan Keamanan
- **Isolasi Project**: Hanya kerjakan tugas dalam lingkup project ini.
- **Bounded Context**: Jangan pernah membuat atau mengubah file yang terdaftar di bagian file dilarang (forbidden).
- **Checkpoint Gate**: Jika sistem meminta verifikasi checkpoint setelah \`done\`, berhenti dan minta konfirmasi user.
- **Kualitas Kode**: Pastikan kode bebas error sintaks sebelum menandai task selesai.`;

  const copyPromptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(masterPromptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (err) {
      console.error('Gagal salin prompt:', err);
    }
  };

  const copyLoginCommand = async () => {
    try {
      await navigator.clipboard.writeText(loginCommand);
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2500);
    } catch (err) {
      console.error('Gagal salin perintah login:', err);
    }
  };

  const copyInstallCommand = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopiedInstall(true);
      setTimeout(() => setCopiedInstall(false), 2500);
    } catch (err) {
      console.error('Gagal salin perintah instalasi:', err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Kartu Informasi PAT (Personal Access Token) */}
      <Card className="border-primary/30 bg-card shadow-xs">
        <CardHeader className="pb-3 bg-primary/5 dark:bg-primary/10 border-b border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <KeyRound className="h-4 w-4 text-primary" />
                <span>Personal Access Token (PAT) untuk Eksekusi Task</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Token otentikasi aman untuk menghubungkan terminal atau AI Agent Anda langsung ke task proyek ini
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/profile')}
              className="gap-1.5 shrink-0 self-start sm:self-auto text-xs font-medium"
            >
              <span>Buka Profil & Buat Token</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-border/70 p-3 bg-muted/20 space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Isolasi Proyek Aman</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Setiap token terikat pada scope proyek spesifik, sehingga agent tidak dapat mengubah tugas di luar proyek ini.
              </p>
            </div>

            <div className="rounded-lg border border-border/70 p-3 bg-muted/20 space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                <span>Tersimpan Satu Tempat</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Token dibuat dan dikelola terpusat di halaman profil. Token plaintext hanya tampil sekali demi keamanan.
              </p>
            </div>

            <div className="rounded-lg border border-border/70 p-3 bg-muted/20 space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span>Otomasi CLI pakeai</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Gunakan token untuk perintah <code>npx pakeai login</code> agar terminal terhubung otomatis ke API.
              </p>
            </div>
          </div>

          {/* Status / Input Token PAT */}
          {inputToken ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    Token PAT Terhubung dari Profil
                  </span>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Aktif
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('pakeai_active_pat');
                    setInputToken('');
                  }}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors text-left"
                >
                  Lepas / Ganti Token
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 font-mono text-xs bg-background p-2 rounded-md border border-border flex items-center justify-between min-w-0">
                  <span className="truncate">{inputToken}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={copyLoginCommand}
                  className="shrink-0 text-xs h-9 gap-1.5"
                >
                  {copiedLogin ? <Check className="h-3.5 w-3.5 text-primary" /> : <Clipboard className="h-3.5 w-3.5" />}
                  <span>{copiedLogin ? 'Tersalin!' : 'Salin Perintah Login'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground block">
                    Belum Ada Token PAT Terhubung di Browser
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Buat token di halaman profil, atau klik tombol di bawah untuk membuat token baru otomatis:
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => generateTokenMut.mutate()}
                  disabled={generateTokenMut.isPending}
                  className="gap-1.5 text-xs shrink-0 self-start sm:self-auto font-medium"
                >
                  {generateTokenMut.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Generate Token Otomatis</span>
                </Button>
              </div>

              <div className="pt-2 border-t border-border/60">
                <label className="text-[11px] text-muted-foreground block mb-1.5">
                  Atau tempel token yang sudah Anda miliki:
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    type="text"
                    placeholder="pak_..."
                    value={inputToken}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInputToken(val);
                      if (val.trim()) {
                        localStorage.setItem('pakeai_active_pat', val.trim());
                      }
                    }}
                    className="font-mono text-xs bg-background h-8 border-border focus-visible:ring-primary"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    className="h-8 text-xs shrink-0"
                  >
                    Buka Profil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2 Kolom: Pilihan Opsi Eksekusi (Manual vs Auto lewat AI Agent) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pilihan Metode Eksekusi
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* KOLOM 1: OPSI MANUAL (DEVELOPER CLI) */}
          <Card className="border-border shadow-xs h-full flex flex-col">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-xs font-normal">
                  Opsi 1: Manual
                </Badge>
                <span className="text-[11px] text-muted-foreground">Kendali Penuh Developer</span>
              </div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 pt-1 text-foreground">
                <Terminal className="h-4 w-4 text-primary" />
                <span>Eksekusi Manual via CLI</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Jalankan perintah step-by-step di terminal dan tulis kode implementasi sendiri
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Step 0 */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                        0
                      </span>
                      <span>Pasang CLI pakeai (Cukup Sekali)</span>
                    </div>
                    <button
                      type="button"
                      onClick={copyInstallCommand}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      {copiedInstall ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
                      <span>{copiedInstall ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <pre className="bg-muted p-2.5 rounded-md text-[11px] font-mono overflow-x-auto border border-border">
{installCommand}
                  </pre>
                  <p className="text-[11px] text-muted-foreground italic pl-7">
                    Perintah ini memasang CLI secara global. Setelah dipasang, perintah <code className="text-foreground font-mono">pakeai</code> dapat dipakai di seluruh proyek tanpa perlu install lagi.
                  </p>
                </div>

                {/* Step 1 */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                      1
                    </span>
                    <span>Login ke Akun Proyek</span>
                  </div>
                  <pre className="bg-muted p-2.5 rounded-md text-[11px] font-mono overflow-x-auto border border-border">
{loginCommand}
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                      2
                    </span>
                    <span>Ambil Task Berikutnya & Mulai</span>
                  </div>
                  <pre className="bg-muted p-2.5 rounded-md text-[11px] font-mono overflow-x-auto border border-border space-y-1">
<div>pakeai next     # Ambil task TODO berikutnya</div>
<div>pakeai start    # Ubah status jadi IN_PROGRESS</div>
                  </pre>
                </div>

                {/* Step 3 */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                      3
                    </span>
                    <span>Periksa Bounded Context</span>
                  </div>
                  <pre className="bg-muted p-2.5 rounded-md text-[11px] font-mono overflow-x-auto border border-border">
{`pakeai context  # Cek file yang boleh & dilarang diubah`}
                  </pre>
                  <p className="text-[11px] text-muted-foreground italic pl-7">
                    Penting: Hanya edit file yang terdaftar di Bounded Context agar tidak merusak modul lain.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                      4
                    </span>
                    <span>Tulis Kode & Selesaikan Task</span>
                  </div>
                  <pre className="bg-muted p-2.5 rounded-md text-[11px] font-mono overflow-x-auto border border-border">
{`pakeai done     # Tandai task selesai (DONE)`}
                  </pre>
                  <p className="text-[11px] text-muted-foreground pl-7">
                    Ulangi langkah 2 sampai 4 hingga seluruh task pada board berstatus DONE.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/80">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Sangat disarankan untuk debugging spesifik atau modifikasi manual.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KOLOM 2: OPSI AUTO (AI CODING AGENT) */}
          <Card className="border-primary/50 shadow-xs h-full flex flex-col ring-1 ring-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5 dark:bg-primary/10">
              <div className="flex items-center justify-between gap-2">
                <Badge className="bg-primary text-primary-foreground text-xs font-normal">
                  Opsi 2: Otomatis (Rekomendasi)
                </Badge>
                <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Agent Loop
                </span>
              </div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 pt-1 text-foreground">
                <Bot className="h-4 w-4 text-primary" />
                <span>Otomatis via AI Coding Agent</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Jalankan loop otonom menggunakan Claude Code, Cursor, Windsurf, atau GitHub Copilot
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cukup salin Master Prompt di bawah ke asisten AI coding Anda. AI agent akan membaca setiap task, menjalankan kode, menguji kriteria penerimaan, dan memperbarui status kanban secara otomatis.
                </p>

                {/* Master prompt block */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/60 px-3 py-2 border-b flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-medium text-foreground">
                      Master-Prompt-Loop.md
                    </span>
                    <Button
                      size="sm"
                      onClick={copyPromptToClipboard}
                      className="h-7 px-2.5 text-xs gap-1.5 font-medium"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-3.5 w-3.5" />
                          <span>Salin Master Prompt</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <pre className="p-3 bg-muted/30 text-[11px] font-mono max-h-72 overflow-y-auto overflow-x-auto text-foreground/90 leading-relaxed">
{masterPromptText}
                  </pre>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <Play className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Cara Menjalankan:</span>
                  </div>
                  <ol className="list-decimal list-inside pl-1 space-y-1 text-[11px]">
                    <li>Buka terminal workspace proyek Anda di komputer lokal.</li>
                    <li>Pastikan AI Coding Assistant (Claude Code / Cursor / dsb) aktif.</li>
                    <li>Tempelkan Master Prompt di atas ke sesi chat AI.</li>
                    <li>AI Agent akan mengeksekusi loop task hingga selesai.</li>
                  </ol>
                </div>
              </div>

              <div className="pt-3 border-t border-border/80">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>AI otomatis berhenti saat menemui checkpoint yang butuh persetujuan user.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Langkah Terakhir: Menjalankan Aplikasi di Lokal */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 bg-muted/20 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Verifikasi Akhir: Menjalankan Aplikasi Lokal</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Setelah semua task pada board selesai, jalankan server pengembangan di komputer Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-xs">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Buka terminal di root folder workspace proyek Anda.
            </li>
            <li>
              Jalankan perintah dev server sesuai framework:
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-muted border border-border">
                  <span className="text-primary font-semibold block mb-0.5">Vite / React</span>
                  <code>npm run dev</code>
                </div>
                <div className="p-2 rounded bg-muted border border-border">
                  <span className="text-primary font-semibold block mb-0.5">Next.js</span>
                  <code>npm run dev</code>
                </div>
                <div className="p-2 rounded bg-muted border border-border">
                  <span className="text-primary font-semibold block mb-0.5">Node / Express</span>
                  <code>npm start</code>
                </div>
              </div>
            </li>
            <li>
              Buka browser di alamat lokal yang ditampilkan terminal (biasanya <code className="text-foreground">http://localhost:3000</code> atau <code className="text-foreground">http://localhost:5173</code>).
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Navigasi Balik */}
      <div className="flex justify-between items-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/projects/${projectId}/board`)}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Board Task
        </Button>
      </div>
    </div>
  );
}
