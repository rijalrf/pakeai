// Board page: Reuses tasks.tsx lama dengan KanbanBoard + token onboarding
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, LayoutGrid, UserCircle, KeyRound, Plus, Copy, Check } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
  layer: string;
};

export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tokens, setTokens] = useState<Array<{ id: string; name: string; lastUsedAt?: string }>>([]);
  const [showTokenSection, setShowTokenSection] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Load tasks
  useEffect(() => {
    if (!projectId) return;

    const loadTasks = async () => {
      try {
        const res = await fetch(`http://localhost:6655/api/projects/${projectId}/tasks`, {
          credentials: 'include',
        });
        const json = await res.json();
        if (json.tasks && json.tasks.length > 0) {
          setTasks(json.tasks);
        } else {
          await generateTasks();
        }
      } catch (err) {
        console.error('Gagal load tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [projectId]);

  const generateTasks = async () => {
    if (!projectId) return;
    setGenerating(true);

    try {
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/tasks/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const refreshRes = await fetch(`http://localhost:6655/api/projects/${projectId}/tasks`, {
          credentials: 'include',
        });
        const refreshJson = await refreshRes.json();
        setTasks(refreshJson.tasks || []);
      } else {
        console.warn('Generate tasks gagal');
      }
    } catch (err) {
      console.error('Error generating tasks:', err);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  // Load saved token from localStorage
  useEffect(() => {
    if (!projectId) return;
    const saved = localStorage.getItem(`pakeai_token_${projectId}`);
    if (saved) {
      setNewToken(saved);
    }
  }, [projectId]);

  // Load tokens
  useEffect(() => {
    if (!projectId || !showTokenSection) return;

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
  }, [projectId, showTokenSection]);

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
        setNewToken(json.token);
        localStorage.setItem(`pakeai_token_${projectId}`, json.token);
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

  const copyToken = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (err) {
      console.error('Gagal salin token:', err);
    }
  };

  const columns: Array<{ status: string; label: string }> = [
    { status: 'TODO', label: 'To Do' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'REVIEW', label: 'Review' },
    { status: 'DONE', label: 'Done' },
    { status: 'BLOCKED', label: 'Blocked' },
  ];

  if (loading || generating) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Skeleton header */}
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-2 flex-1">
              <div className="h-7 bg-muted w-1/4 rounded animate-pulse" />
              <div className="h-4 bg-muted w-1/3 rounded animate-pulse" />
            </div>
          </div>

          {/* Skeleton kanban columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {columns.map((col) => (
              <Card key={col.status}>
                <CardHeader>
                  <div className="h-5 bg-muted w-1/2 rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
              Board Task
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola tugas implementasi aplikasi
            </p>
          </div>
          {!tasks.length && !generating && (
            <Button onClick={generateTasks} size="sm" className="gap-2">
              Generate Tasks
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {columns.map((col) => (
            <Card key={col.status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{col.label}</CardTitle>
                <Badge variant="outline" className="mt-1">
                  {tasks.filter((t) => t.status === col.status).length} task
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.filter((t) => t.status === col.status).map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <Badge variant="outline" className="mt-2 text-xs">
                        {task.layer}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                {tasks.filter((t) => t.status === col.status).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 italic">
                    Kosong
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Token Section (untuk CLI agent) */}
      {tasks.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => setShowTokenSection(!showTokenSection)}
            disabled={generating}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {showTokenSection ? 'Sembunyikan' : 'Lihat Token CLI'}
          </Button>

          {showTokenSection && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Setup CLI Agent (pakeai)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Untuk menjalankan eksekusi kode secara otomatis oleh AI agent, gunakan CLI <code>pakeai</code>.
                </p>

                {/* Tampilkan token yang baru digenerate */}
                {newToken && (
                  <div className="p-4 border border-green-500/50 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                        Token Baru Berhasil Dibuat
                      </p>
                      <Badge variant="outline" className="border-green-600 text-green-700 dark:text-green-300">
                        Tampil Sekali
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Salin dan simpan token ini sekarang. Demi keamanan, token tidak akan ditampilkan lagi setelah Anda meninggalkan halaman ini.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 bg-background p-2.5 rounded border font-mono text-sm break-all select-all">
                        {newToken}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => copyToken(newToken)}
                        className="gap-1.5 shrink-0"
                      >
                        {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedToken ? 'Tersalin' : 'Salin'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tombol Buat Token */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h3 className="text-sm font-medium">Token Akses CLI</h3>
                    <p className="text-xs text-muted-foreground">
                      Token digunakan untuk autentikasi CLI pakeai di terminal Anda.
                    </p>
                  </div>
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
                    Buat Token Baru
                  </Button>
                </div>

                {tokens.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <div className="border rounded-md divide-y text-xs">
                      {tokens.map((t) => (
                        <div key={t.id} className="p-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">{t.name}</div>
                            <div className="text-muted-foreground text-[11px]">
                              Dibuat: {new Date((t as any).createdAt || Date.now()).toLocaleDateString('id-ID')}
                              {t.lastUsedAt && ` • Dipakai: ${new Date(t.lastUsedAt).toLocaleDateString('id-ID')}`}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">Aktif</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                        <span>Cara menggunakan di terminal:</span>
                      </div>
                      <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
{`npx pakeai login ${newToken || '<TOKEN_ANDA>'}
npx pakeai next     # ambil task berikutnya
npx pakeai start    # tandai task IN_PROGRESS
npx pakeai context  # baca bounded context task aktif
# ... jalankan AI coding agent pada file terkait ...
npx pakeai done     # tandai task selesai`}
                      </pre>
                    </div>
                  </div>
                ) : (
                  !newToken && (
                    <div className="text-center py-6 border rounded-lg bg-muted/20">
                      <KeyRound className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">Belum ada token untuk project ini</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                        Buat token agar AI coding agent Anda dapat mengeksekusi task dari terminal menggunakan CLI pakeai.
                      </p>
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
                        Buat Token Sekarang
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tombol Lanjut */}
      <div className="max-w-6xl mx-auto flex justify-end pt-6">
        <Button size="lg" onClick={() => navigate(`/projects/${projectId}/guide`)} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          Panduan Eksekusi
        </Button>
      </div>
    </div>
  );
}
