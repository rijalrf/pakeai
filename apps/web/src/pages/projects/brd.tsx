// BRD page: View atau auto-generate BRD dari chat history + tech stack
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/http';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Lock } from 'lucide-react';
import { isStageLocked } from '@/lib/constants';

type BrdContent = {
  overview?: string;
  goals?: string[];
  features?: Array<{ name: string; description?: string }>;
  functionalRequirements?: Array<{
    id: string;
    title: string;
    description: string;
    priority?: 'MUST' | 'SHOULD' | 'COULD';
    actor?: string;
  }>;
  businessRules?: Array<{
    id: string;
    description: string;
  }>;
  techRequirements?: string[];
  nonFunctional?: string[];
  outOfScope?: string[];
};

export function BrdPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [brd, setBrd] = useState<BrdContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Load BRD on mount
  useEffect(() => {
    if (!projectId) return;

    const loadBrd = async () => {
      try {
        const projectRes = await api<{ project?: { wizardStep?: string } }>(`/api/projects/${projectId}`);
        const currentStep = projectRes.project?.wizardStep || 'brd';
        const locked = isStageLocked(currentStep, 'brd');
        setIsLocked(locked);

        const json = await api<{ brd?: { content: unknown } }>(`/api/projects/${projectId}/brd`);
        if (json.brd?.content) {
          setBrd(json.brd.content as BrdContent);
        } else if (!locked) {
          // Auto generate jika belum ada dan belum terkunci
          await generateBRD();
        }
      } catch (err) {
        console.error('Gagal load BRD:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBrd();
  }, [projectId]);

  const generateBRD = async () => {
    if (!projectId || isLocked) return;
    setGenerating(true);

    try {
      await api(`/api/projects/${projectId}/brd/generate`, {
        method: 'POST',
      });
      const refreshJson = await api<{ brd?: { content: unknown } }>(`/api/projects/${projectId}/brd`);
      setBrd(refreshJson.brd?.content as BrdContent);
    } catch (err) {
      console.error('Error generating BRD:', err);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  if (loading || generating) {
    return (
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Skeleton dokumen */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted w-2/3 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-4 bg-muted w-1/4 rounded mb-2 animate-pulse" />
                <div className="h-4 bg-muted w-full rounded animate-pulse" />
                <div className="h-4 bg-muted w-5/6 rounded animate-pulse mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Banner terkunci jika sudah lewat BRD */}
      {isLocked && (
        <div className="flex items-center gap-2.5 p-3.5 bg-muted/70 border border-border rounded-xl text-xs text-muted-foreground shadow-xs">
          <Lock className="h-4 w-4 text-primary shrink-0" />
          <span>
            Tahap Dokumen BRD telah selesai dan terkunci (Read-Only). Spesifikasi kebutuhan fungsional dan aturan bisnis tersimpan permanen.
          </span>
        </div>
      )}

      {/* Header Bar dengan Tombol Aksi di Atas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dokumen Kebutuhan Bisnis (BRD)</h2>
          <p className="text-xs text-muted-foreground">
            Spesifikasi kebutuhan fitur, functional requirements, dan aturan bisnis aplikasi.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {!brd && !generating && !isLocked && (
            <Button onClick={generateBRD} size="sm" variant="outline" className="gap-2">
              Generate BRD
            </Button>
          )}
          <Button size="sm" onClick={() => navigate(`/projects/${projectId}/tree`)} className="gap-2">
            <span>Lihat Struktur Fitur</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* BRD Content */}
      <div className="space-y-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            {brd?.overview ? (
              <p className="whitespace-pre-wrap">{brd.overview}</p>
            ) : (
              <p className="text-muted-foreground italic">Belum ada ringkasan.</p>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        {brd?.goals && brd.goals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tujuan</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {brd.goals.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {brd?.features && brd.features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fitur Utama</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {brd.features.map((f, i) => (
                  <Badge key={i} variant="outline" className="p-3 text-left">
                    {f.name}
                    {f.description && (
                      <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Functional Requirements (FR-xxx) */}
        {brd?.functionalRequirements && brd.functionalRequirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kebutuhan Fungsional (Source of Truth)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {brd.functionalRequirements.map((r) => (
                  <div key={r.id} className="p-3 rounded-md border border-border bg-card/50 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="font-mono text-xs">
                        {r.id}
                      </Badge>
                      <span className="font-semibold text-sm">{r.title}</span>
                      {r.priority && (
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          {r.priority}
                        </Badge>
                      )}
                      {r.actor && (
                        <Badge variant="outline" className="text-[10px]">
                          {r.actor}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Rules (BR-xxx) */}
        {brd?.businessRules && brd.businessRules.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aturan Bisnis (Business Rules)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {brd.businessRules.map((b) => (
                  <div key={b.id} className="flex items-start gap-2.5 p-2.5 rounded-md border border-border/70 text-xs">
                    <Badge variant="outline" className="font-mono shrink-0">
                      {b.id}
                    </Badge>
                    <span className="pt-0.5">{b.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tech Requirements */}
        {brd?.techRequirements && brd.techRequirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tech Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {brd.techRequirements.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Non-Functional */}
        {brd?.nonFunctional && brd.nonFunctional.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Non-Functional Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {brd.nonFunctional.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Out of Scope */}
        {brd?.outOfScope && brd.outOfScope.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Out of Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {brd.outOfScope.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
