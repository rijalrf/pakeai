// BRD page: View atau auto-generate BRD dari interview + tech stack
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';

type BrdContent = {
  overview?: string;
  goals?: string[];
  features?: Array<{ name: string; description?: string }>;
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
        const res = await fetch(`http://localhost:6655/api/projects/${projectId}/brd`, {
          credentials: 'include',
        });
        const json = await res.json();
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
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/brd/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const refreshRes = await fetch(`http://localhost:6655/api/projects/${projectId}/brd`, {
          credentials: 'include',
        });
        const refreshJson = await refreshRes.json();
        setBrd(refreshJson.brd?.content as BrdContent);
      } else {
        console.warn('Generate BRD gagal, tapi lanjutkan');
      }
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
