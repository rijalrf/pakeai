// UI Spec page: View atau generate UI & UX Design Brief dari BRD
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/http';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Layout, Palette, ShieldCheck, RefreshCw } from 'lucide-react';

type PageSpec = {
  name: string;
  path?: string;
  purpose: string;
  layout: {
    mobile: string;
    desktop: string;
  };
  components: string[];
  states: string[];
  interactiveStates?: string[];
};

type UiSpecData = {
  pages?: PageSpec[];
  designTokens?: {
    spacing?: string;
    borderRadius?: string;
    colorPalette?: string[];
    typography?: string;
  };
  accessibility?: string[];
};

export function UiSpecPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [uiSpec, setUiSpec] = useState<UiSpecData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const loadUiSpec = async () => {
      try {
        const json = await api<{ uiSpec?: UiSpecData }>(`/api/projects/${projectId}/ui-spec`);
        if (json.uiSpec) {
          setUiSpec(json.uiSpec);
        }
      } catch (err) {
        console.error('Gagal load UI Spec:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUiSpec();
  }, [projectId]);

  const generateSpec = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await api<{ ok: boolean; uiSpec: UiSpecData }>(
        `/api/projects/${projectId}/ui-spec/generate`,
        { method: 'POST' }
      );
      if (res.uiSpec) {
        setUiSpec(res.uiSpec);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menghasilkan UI Spec.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || generating) {
    return (
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted w-2/3 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted w-1/4 rounded animate-pulse" />
                <div className="h-16 bg-muted w-full rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">UI &amp; UX Design Brief (UI Spec)</h2>
          <p className="text-xs text-muted-foreground">
            Spesifikasi layout antarmuka, daftar komponen, design tokens, dan panduan aksesibilitas.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            onClick={generateSpec}
            size="sm"
            variant="outline"
            disabled={generating}
            className="gap-2"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>{uiSpec ? 'Generate Ulang' : 'Generate UI Spec'}</span>
          </Button>
          <Button size="sm" onClick={() => navigate(`/projects/${projectId}/board`)} className="gap-2">
            <span>Lanjut ke Board Task</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
          {error}
        </div>
      )}

      {!uiSpec && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Layout className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">UI Spec Belum Dibuat</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Spesifikasi antarmuka belum tersedia untuk proyek ini. Klik tombol di bawah untuk membuat rancangan UI secara otomatis dari BRD.
              </p>
            </div>
            <Button onClick={generateSpec} size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Generate UI Spec Sekarang</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {uiSpec && (
        <div className="space-y-6 pb-8">
          {/* Design Tokens & Tokens Visual */}
          {uiSpec.designTokens && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Design Tokens &amp; Gaya Visual</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 p-3 rounded-md border border-border/70 bg-card/40">
                  <span className="font-semibold text-foreground">Tipografi:</span>
                  <p className="text-muted-foreground">{uiSpec.designTokens.typography}</p>
                </div>
                <div className="space-y-1 p-3 rounded-md border border-border/70 bg-card/40">
                  <span className="font-semibold text-foreground">Skala Spacing:</span>
                  <p className="text-muted-foreground">{uiSpec.designTokens.spacing}</p>
                </div>
                <div className="space-y-1 p-3 rounded-md border border-border/70 bg-card/40">
                  <span className="font-semibold text-foreground">Radius Sudut:</span>
                  <p className="text-muted-foreground">{uiSpec.designTokens.borderRadius}</p>
                </div>
                <div className="space-y-1 p-3 rounded-md border border-border/70 bg-card/40">
                  <span className="font-semibold text-foreground">Palet Warna Utama:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(uiSpec.designTokens.colorPalette ?? []).map((col, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Screen Inventory / Pages */}
          {uiSpec.pages && uiSpec.pages.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Inventaris Halaman &amp; Tata Letak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uiSpec.pages.map((p, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-border bg-card/50 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{p.name}</span>
                      {p.path && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {p.path}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{p.purpose}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded bg-muted/40 text-[11px]">
                        <span className="font-semibold text-foreground">Tata Letak Mobile:</span>
                        <p className="text-muted-foreground mt-0.5">{p.layout?.mobile || 'Satu kolom vertikal'}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/40 text-[11px]">
                        <span className="font-semibold text-foreground">Tata Letak Desktop:</span>
                        <p className="text-muted-foreground mt-0.5">{p.layout?.desktop || 'Multi kolom responsif'}</p>
                      </div>
                    </div>

                    {p.components && p.components.length > 0 && (
                      <div className="pt-1">
                        <span className="font-semibold text-[11px] text-foreground">Komponen Reusable:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.components.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.states && p.states.length > 0 && (
                      <div className="pt-1">
                        <span className="font-semibold text-[11px] text-foreground">State Interaktif Wajib:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.states.map((st, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] capitalize">
                              {st}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Accessibility Guidelines */}
          {uiSpec.accessibility && uiSpec.accessibility.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Panduan Aksesibilitas (WCAG &amp; UX Standards)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground">
                  {uiSpec.accessibility.map((a, idx) => (
                    <li key={idx}>
                      <span className="text-foreground">{a}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
