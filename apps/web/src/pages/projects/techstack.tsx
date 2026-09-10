// Tech Stack page dengan rekomendasi AI
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, Loader2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TechStackPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Array<{ label: string; recommended?: boolean }>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reasoning, setReasoning] = useState('');

  // Load project untuk lihat tech stack yang sudah ada (dari Project table interviewAnswers? No — pakai Stack table)
  useEffect(() => {
    if (!projectId) return;

    const loadTechStack = async () => {
      try {
        const res = await fetch(`http://localhost:6655/api/projects/${projectId}`, {
          credentials: 'include',
        });
        const json = await res.json();
        const existing = json.project?.stacks || [];
        setSelected(existing.map((s: any) => s.name));
      } catch (err) {
        console.error('Gagal load tech stack:', err);
      }
    };

    loadTechStack();
  }, [projectId]);

  // Default recommendations jika belum ada
  useEffect(() => {
    if (recommendations.length === 0 && selected.length === 0) {
      setRecommendations([
        { label: 'Frontend: React v18+ (TypeScript)', recommended: true },
        { label: 'Backend: Node.js + Express (TypeScript)', recommended: true },
        { label: 'Database: PostgreSQL', recommended: true },
        { label: 'Deployment: Docker + VPS/Railway', recommended: true },
      ]);
    }
  }, [recommendations.length, selected.length]);

  const getRecommendation = async () => {
    setLoadingRec(true);
    try {
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/techstack/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const json = await res.json();
      setRecommendations(json.techStack?.map((t: string) => ({ label: t })) || []);
      setReasoning(json.reasoning || '');
    } catch (err) {
      console.error('Gagal dapat rekomendasi:', err);
    } finally {
      setLoadingRec(false);
    }
  };

  const toggleSelection = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const saveAndContinue = async () => {
    if (selected.length === 0) {
      alert('Pilih minimal 1 tech stack.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/techstack`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ techStack: selected }),
      });

      if (res.ok) {
        navigate(`/projects/${projectId}/brd`);
      } else {
        const err = await res.json();
        console.error('Gagal simpan tech stack:', err);
        alert('Terjadi kesalahan saat menyimpan tech stack.');
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Terjadi kesalahan saat menyimpan tech stack.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-2xl font-semibold">Pilih Tech Stack</h1>
        <p className="text-muted-foreground mt-1">
          Pilih teknologi untuk membangun aplikasi ini. Anda bisa pilih manual atau gunakan rekomendasi AI.
        </p>
      </div>

      {/* Rekomendasi AI */}
      <Card className="mb-6 max-w-3xl mx-auto border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Rekomendasi AI
            </CardTitle>
            <Button size="sm" onClick={getRecommendation} disabled={loadingRec}>
              {loadingRec ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reasoning && (
            <p className="text-sm text-muted-foreground mb-4">{reasoning}</p>
          )}
          {recommendations.length > 0 ? (
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <Badge
                  key={idx}
                  variant={selected.includes(rec.label) ? 'default' : 'outline'}
                  className={`cursor-pointer px-3 py-2 ${
                    selected.includes(rec.label) ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={() => toggleSelection(rec.label)}
                >
                  {selected.includes(rec.label) && <Check className="h-3 w-3 mr-2" />}
                  {rec.label}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Klik "Generate" untuk dapatkan rekomendasi.</p>
          )}
        </CardContent>
      </Card>

      {/* Manual pilih */}
      <Card className="mb-6 max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-base">Tambah Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['React v18+', 'Vue.js v3', 'Angular', 'Svelte', 'Next.js', 'Remix'].map((frontend) => (
              <Badge
                key={frontend}
                variant={selected.includes(frontend) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleSelection(frontend)}
              >
                {frontend}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Node.js + Express', 'Python + FastAPI', 'Go Fiber', 'Laravel PHP'].map((backend) => (
              <Badge
                key={backend}
                variant={selected.includes(backend) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleSelection(backend)}
              >
                {backend}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {['PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'MySQL'].map((db) => (
              <Badge
                key={db}
                variant={selected.includes(db) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleSelection(db)}
              >
                {db}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Docker', 'Railway', 'Vercel', 'AWS', 'DigitalOcean'].map((deploy) => (
              <Badge
                key={deploy}
                variant={selected.includes(deploy) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleSelection(deploy)}
              >
                {deploy}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tombol Lanjut */}
      <div className="max-w-3xl mx-auto flex justify-end">
        <Button
          size="lg"
          onClick={saveAndContinue}
          disabled={saving || selected.length === 0}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Lanjut ke BRD
        </Button>
      </div>
    </div>
  );
}
