// BRD page: View atau auto-generate BRD dari interview + tech stack
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/http';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';

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

  // Load BRD on mount
  useEffect(() => {
    if (!projectId) return;

    const loadBrd = async () => {
      try {
        const json = await api<{ brd?: { content: unknown } }>(`/api/projects/${projectId}/brd`);
        if (json.brd?.content) {
          setBrd(json.brd.content as BrdContent);
        } else {
          // Auto generate jika belum ada
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
    if (!projectId) return;
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
      <div className="space-y-6">
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
    <div className="space-y-6">
      {/* Tombol aksi atas bila belum ada BRD */}
      {!brd && !generating && (
        <div className="flex justify-end">
          <Button onClick={generateBRD} size="sm" className="gap-2">
            Generate BRD
          </Button>
        </div>
      )}

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

        {/* Tombol Lanjut */}
        <div className="flex justify-end pt-4">
          <Button size="lg" onClick={() => navigate(`/projects/${projectId}/tree`)} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Lihat Struktur Fitur
          </Button>
        </div>
      </div>
    </div>
  );
}
