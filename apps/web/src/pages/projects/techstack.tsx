// Tech Stack page: Rekomendasi AI informatif + Form pilihan manual
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Check,
  Loader2,
  ArrowRight,
  Plus,
  X,
  Layers,
  Cpu,
  Database,
  Globe,
  Server,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { api } from '@/lib/http';
import { cn } from '@/lib/utils';

// Preset kategori untuk form manual
const PRESET_CATEGORIES = [
  {
    id: 'frontend',
    title: 'Frontend Framework',
    icon: Globe,
    description: 'Antarmuka visual dan pengalaman interaksi pengguna',
    options: ['React v18+', 'Next.js 14', 'Vue.js v3', 'Svelte / SvelteKit', 'Angular', 'Remix'],
  },
  {
    id: 'styling',
    title: 'Styling & UI',
    icon: Layers,
    description: 'Sistem desain, styling CSS, dan komponen UI',
    options: ['Tailwind CSS v3', 'shadcn/ui', 'Chakra UI', 'Ant Design', 'CSS Modules'],
  },
  {
    id: 'backend',
    title: 'Backend & API',
    icon: Server,
    description: 'Server aplikasi, logika bisnis, dan penyedia endpoint API',
    options: ['Node.js + Express', 'TypeScript + Express', 'Python + FastAPI', 'Go Fiber', 'Laravel PHP', 'NestJS'],
  },
  {
    id: 'database',
    title: 'Database & ORM',
    icon: Database,
    description: 'Penyimpanan data relasional atau dokumen beserta ORM',
    options: ['SQLite (Zero-Config)', 'PostgreSQL 16', 'MySQL 8', 'MongoDB', 'Redis', 'Prisma ORM', 'Drizzle ORM'],
  },
  {
    id: 'deployment',
    title: 'Deployment & DevOps',
    icon: Cpu,
    description: 'Lingkungan hosting, kontainerisasi, dan otomatisasi deploy',
    options: ['Docker + Compose', 'Railway', 'Vercel', 'VPS Linux (Ubuntu)', 'DigitalOcean', 'AWS EC2'],
  },
];

export function TechStackPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<Array<{ label: string }>>([]);
  const [reasoning, setReasoning] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  // Load tech stack yang tersimpan di project
  useEffect(() => {
    if (!projectId) return;

    const loadTechStack = async () => {
      try {
        const json = await api<{ project?: { stacks?: Array<{ name: string }> } }>(
          `/api/projects/${projectId}`
        );
        const existing = json.project?.stacks || [];
        if (existing.length > 0) {
          setSelected(existing.map((s) => s.name));
        }
      } catch (err) {
        console.error('Gagal load tech stack:', err);
      }
    };

    loadTechStack();
  }, [projectId]);

  // Request rekomendasi AI dan langsung terapkan ke pilihan aktif (selected)
  const getRecommendation = async () => {
    setLoadingRec(true);
    try {
      const json = await api<{ techStack?: string[]; reasoning?: string }>(
        `/api/projects/${projectId}/techstack/recommend`,
        { method: 'POST' }
      );

      const recList = (json.techStack || []).map((t: string) => ({ label: t }));
      setRecommendations(recList);
      setReasoning(json.reasoning || '');

      // Otomatis pilih semua rekomendasi AI agar tombol Lanjut ke BRD langsung aktif
      const recLabels = recList.map((r) => r.label);
      setSelected((prev) => {
        const set = new Set([...prev, ...recLabels]);
        return Array.from(set);
      });
    } catch (err) {
      console.error('Gagal dapat rekomendasi AI:', err);
      alert('Gagal mendapatkan rekomendasi AI.');
    } finally {
      setLoadingRec(false);
    }
  };

  const toggleSelection = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const selectAllRecommendations = () => {
    const recLabels = recommendations.map((r) => r.label);
    setSelected((prev) => {
      const set = new Set([...prev, ...recLabels]);
      return Array.from(set);
    });
  };

  const handleAddCustom = (categoryId: string) => {
    const val = customInputs[categoryId]?.trim();
    if (!val) return;

    if (!selected.includes(val)) {
      setSelected((prev) => [...prev, val]);
    }
    setCustomInputs((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const handleKeyDownCustom = (e: React.KeyboardEvent<HTMLInputElement>, categoryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom(categoryId);
    }
  };

  const saveAndContinue = async () => {
    if (selected.length === 0) {
      alert('Pilih minimal 1 teknologi untuk melanjutkan.');
      return;
    }

    setSaving(true);
    try {
      await api(`/api/projects/${projectId}/techstack`, {
        method: 'PUT',
        body: JSON.stringify({ techStack: selected }),
      });

      navigate(`/projects/${projectId}/brd`);
    } catch (err) {
      console.error('Error saving tech stack:', err);
      alert('Terjadi kesalahan saat menyimpan tech stack.');
    } finally {
      setSaving(false);
    }
  };

  const isAllRecsSelected =
    recommendations.length > 0 &&
    recommendations.every((r) => selected.includes(r.label));

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Subheader status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <p className="text-xs text-muted-foreground">
          Gunakan rekomendasi analisis AI atau tentukan teknologi secara manual per kategori di bawah.
        </p>
        <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
          {selected.length} teknologi dipilih
        </span>
      </div>

      {/* Bagian Rekomendasi AI (Format Informatif) */}
      <Card className="border-primary/40 bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3 bg-primary/5 dark:bg-primary/10 border-b border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Rekomendasi Arsitektur AI
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Analisis otomatis berbasis tujuan aplikasi, aturan bisnis, dan skala pengguna
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={getRecommendation}
              disabled={loadingRec}
              className="gap-1.5 shrink-0 self-start sm:self-auto font-medium"
            >
              {loadingRec ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {recommendations.length > 0 ? 'Generate Ulang' : 'Generate Rekomendasi AI'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {reasoning ? (
            <>
              {/* Box Informatif: Analisis Arsitektur */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>ANALISIS KEBUTUHAN & ALASAN PEMILIHAN</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {reasoning}
                </p>
              </div>

              {/* Grid Kartu Layer Rekomendasi Informatif */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Teknologi yang Direkomendasikan
                  </span>
                  {!isAllRecsSelected ? (
                    <button
                      type="button"
                      onClick={selectAllRecommendations}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Pilih Semua Rekomendasi
                    </button>
                  ) : (
                    <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3" />
                      Semua rekomendasi telah terpilih
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {recommendations.map((rec, idx) => {
                    const hasColon = rec.label.includes(':');
                    const category = hasColon ? rec.label.split(':')[0].trim() : 'Teknologi';
                    const name = hasColon ? rec.label.split(':').slice(1).join(':').trim() : rec.label;
                    const isChecked = selected.includes(rec.label);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleSelection(rec.label)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all flex items-start gap-2.5',
                          isChecked
                            ? 'border-primary bg-primary/10 dark:bg-primary/20 ring-1 ring-primary shadow-xs'
                            : 'border-border bg-background hover:border-primary/40 hover:bg-accent/40'
                        )}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center border transition-colors',
                            isChecked
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/40 bg-background'
                          )}
                        >
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase font-semibold text-primary block tracking-wider">
                            {category}
                          </span>
                          <span className="text-xs font-medium text-foreground block truncate">
                            {name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-sm font-medium text-foreground">
                  Dapatkan Rekomendasi Tech Stack Otomatis
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI akan menganalisis kebutuhan aplikasi Anda dari hasil chat brainstorming dan interview, lalu menyusun kombinasi arsitektur yang paling optimal.
                </p>
              </div>
              <Button
                size="sm"
                onClick={getRecommendation}
                disabled={loadingRec}
                className="gap-2"
              >
                {loadingRec ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Sekarang
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bagian Form Pilihan Manual (Terstruktur per Kategori) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 bg-muted/20 border-b border-border">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Form Pilihan Manual
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Sesuaikan atau tambahkan teknologi spesifik pada setiap lapisan aplikasi sesuai preferensi Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          {PRESET_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const customValue = customInputs[cat.id] || '';

            return (
              <div key={cat.id} className="space-y-2 pb-4 border-b border-border/60 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    {cat.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    — {cat.description}
                  </span>
                </div>

                {/* Pilihan preset */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {cat.options.map((opt) => {
                    const isSelected = selected.some(
                      (s) => s.toLowerCase().includes(opt.toLowerCase()) || opt.toLowerCase().includes(s.toLowerCase())
                    );

                    return (
                      <Badge
                        key={opt}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => toggleSelection(opt)}
                        className={cn(
                          'cursor-pointer px-2.5 py-1 text-xs transition-all font-normal',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:border-primary/50 hover:bg-accent/50'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}
                        {opt}
                      </Badge>
                    );
                  })}
                </div>

                {/* Tambah kustom per kategori */}
                <div className="flex gap-2 max-w-sm pt-1">
                  <Input
                    placeholder={`Tambah ${cat.title.toLowerCase()} lain...`}
                    value={customValue}
                    onChange={(e) =>
                      setCustomInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    onKeyDown={(e) => handleKeyDownCustom(e, cat.id)}
                    className="h-8 text-xs bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddCustom(cat.id)}
                    disabled={!customValue.trim()}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Tambah
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Ringkasan Teknologi Terpilih */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Daftar Teknologi Terpilih ({selected.length})
          </span>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Kosongkan Pilihan
            </button>
          )}
        </div>

        {selected.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            Belum ada teknologi yang dipilih. Klik tombol "Generate Rekomendasi AI" di atas atau pilih langsung dari opsi form manual.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/30 text-xs font-medium"
              >
                <span className="truncate max-w-xs">{item}</span>
                <button
                  type="button"
                  onClick={() => toggleSelection(item)}
                  className="hover:text-destructive hover:bg-destructive/10 rounded p-0.5 transition-colors"
                  title="Hapus"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Aksi */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="text-xs">
          {selected.length === 0 ? (
            <span className="text-destructive font-medium">
              Pilih minimal 1 teknologi untuk melanjutkan ke penyusunan BRD
            </span>
          ) : (
            <span className="text-primary font-medium">
              {selected.length} teknologi terpilih. Siap melanjutkan ke penyusunan BRD.
            </span>
          )}
        </div>

        <Button
          size="lg"
          onClick={saveAndContinue}
          disabled={saving || selected.length === 0}
          className="w-full sm:w-auto gap-2 font-medium"
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
