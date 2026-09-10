// Interview page: Pertanyaan terstruktur discovery dengan 4 opsi pilihan & validasi mandatory/optional
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, ArrowRight, Check, CheckCircle2, HelpCircle } from 'lucide-react';
import { api } from '@/lib/http';
import { cn } from '@/lib/utils';

type InterviewQuestion = {
  id: string;
  order: number;
  question: string;
  context?: string;
  options: string[];
  required: boolean;
  type?: 'radio' | 'checkbox';
  answers?: { answer: string }[];
};

export function InterviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [others, setOthers] = useState<Record<string, string>>({});
  const [recommendedIds, setRecommendedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recommendingIndex, setRecommendingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const loadInterview = async () => {
      try {
        let discoveryRes = await api<{ questions?: any[] }>(`/api/projects/${projectId}/discovery`);
        let qList = discoveryRes.questions || [];

        // Jika belum ada pertanyaan sama sekali, generate baru
        if (qList.length === 0) {
          await api(`/api/projects/${projectId}/interview/generate`, { method: 'POST' });
          discoveryRes = await api<{ questions?: any[] }>(`/api/projects/${projectId}/discovery`);
          qList = discoveryRes.questions || [];
        }

        setQuestions(qList);

        // Inisialisasi jawaban yang mungkin sudah tersimpan sebelumnya
        const initialAnswers: Record<string, string[]> = {};
        const initialOthers: Record<string, string> = {};

        for (const q of qList) {
          const savedAns = q.answers?.[0]?.answer;
          if (savedAns && savedAns !== 'Dilewati') {
            const availableOptions: string[] = q.options || [];
            const matched = availableOptions.find((opt) => opt.toLowerCase() === savedAns.toLowerCase());
            if (matched) {
              initialAnswers[q.id] = [matched];
            } else {
              initialAnswers[q.id] = [`other:${q.id}`];
              initialOthers[q.id] = savedAns;
            }
          }
        }

        setAnswers(initialAnswers);
        setOthers(initialOthers);
      } catch (err) {
        console.error('Gagal memuat pertanyaan interview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [projectId]);

  const handleToggleOption = (q: InterviewQuestion, option: string) => {
    if (saving) return;
    const isMultiple = q.type === 'checkbox';

    setAnswers((prev) => {
      const current = prev[q.id] || [];
      if (isMultiple) {
        const exists = current.includes(option);
        return {
          ...prev,
          [q.id]: exists ? current.filter((x) => x !== option) : [...current, option],
        };
      } else {
        const isSame = current.includes(option);
        return {
          ...prev,
          [q.id]: isSame ? [] : [option],
        };
      }
    });
  };

  const handleToggleOther = (q: InterviewQuestion) => {
    if (saving) return;
    const otherKey = `other:${q.id}`;
    const isMultiple = q.type === 'checkbox';

    setAnswers((prev) => {
      const current = prev[q.id] || [];
      if (isMultiple) {
        const exists = current.includes(otherKey);
        return {
          ...prev,
          [q.id]: exists ? current.filter((x) => x !== otherKey) : [...current, otherKey],
        };
      } else {
        const isSame = current.includes(otherKey);
        return {
          ...prev,
          [q.id]: isSame ? [] : [otherKey],
        };
      }
    });
  };

  const handleOtherTextChange = (questionId: string, value: string) => {
    if (saving) return;
    setOthers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getRecommendation = async (index: number) => {
    const q = questions[index];
    if (!q) return;

    setRecommendingIndex(index);
    try {
      const res = await api<{ recommendation?: string }>(`/api/projects/${projectId}/interview/recommend`, {
        method: 'POST',
        body: JSON.stringify({ questionIndex: index }),
      });

      const recText = res.recommendation?.trim() || '';
      if (!recText) return;

      // Cek apakah rekomendasi mendekati salah satu dari opsi yang tersedia
      const matched = q.options.find(
        (opt) => opt.toLowerCase().includes(recText.toLowerCase()) || recText.toLowerCase().includes(opt.toLowerCase())
      );

      if (matched) {
        setAnswers((prev) => ({
          ...prev,
          [q.id]: [matched],
        }));
      } else {
        setAnswers((prev) => ({
          ...prev,
          [q.id]: [`other:${q.id}`],
        }));
        setOthers((prev) => ({
          ...prev,
          [q.id]: recText,
        }));
      }

      setRecommendedIds((prev) => ({ ...prev, [q.id]: true }));
    } catch (err) {
      console.error('Gagal mendapatkan rekomendasi:', err);
      alert('Gagal mendapatkan rekomendasi AI.');
    } finally {
      setRecommendingIndex(null);
    }
  };

  // Helper validasi pertanyaan
  const isQuestionAnswered = (q: InterviewQuestion) => {
    const selected = answers[q.id] || [];
    if (selected.length === 0) return false;
    const hasOther = selected.includes(`other:${q.id}`);
    if (hasOther && !others[q.id]?.trim() && selected.length === 1) {
      return false;
    }
    return true;
  };

  const mandatoryQuestions = questions.filter((q) => q.required);
  const mandatoryAnsweredCount = mandatoryQuestions.filter((q) => isQuestionAnswered(q)).length;
  const isMandatoryComplete = mandatoryAnsweredCount >= mandatoryQuestions.length;
  const answeredCount = questions.filter((q) => isQuestionAnswered(q)).length;

  const canSubmit = () => {
    return isMandatoryComplete;
  };

  const saveAndContinue = async () => {
    if (!canSubmit() || saving) return;
    setSaving(true);

    try {
      const answersToSend = questions.map((q) => {
        const selected = answers[q.id] || [];
        if (selected.length === 0) {
          return {
            questionId: q.id,
            answer: 'Dilewati',
            skipped: true,
          };
        }

        const formatted = selected
          .map((val) => {
            if (val === `other:${q.id}`) {
              return others[q.id]?.trim() || '';
            }
            return val;
          })
          .filter(Boolean);

        return {
          questionId: q.id,
          answer: formatted.join(', ') || 'Dilewati',
          skipped: formatted.length === 0,
        };
      });

      await api(`/api/projects/${projectId}/interview`, {
        method: 'PUT',
        body: JSON.stringify({ answers: answersToSend }),
      });

      navigate(`/projects/${projectId}/techstack`);
    } catch (err) {
      console.error('Error menyimpan jawaban interview:', err);
      alert('Terjadi kesalahan saat menyimpan jawaban.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto w-full space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <div className="h-5 bg-muted w-3/4 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="h-10 bg-muted/60 rounded-lg animate-pulse" />
              <div className="h-10 bg-muted/60 rounded-lg animate-pulse" />
              <div className="h-10 bg-muted/60 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Subheader status & progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <p className="text-xs text-muted-foreground">
          Pertanyaan bertanda (<span className="text-destructive font-bold">*</span>) wajib dijawab. Pertanyaan yang tidak dipilih otomatis dilewati.
        </p>
        <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
          {answeredCount} dari {questions.length} dijawab
        </span>
      </div>

      {/* Daftar Pertanyaan */}
      <div className="space-y-4 pb-8">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada pertanyaan interview. Silakan muat ulang halaman.
            </CardContent>
          </Card>
        ) : (
          questions.map((q, idx) => {
            const selected = answers[q.id] || [];
            const hasOther = selected.includes(`other:${q.id}`);
            const isMultiple = q.type === 'checkbox';
            const isRecommended = recommendedIds[q.id];

            return (
              <Card key={q.id || idx} className="border-border shadow-xs overflow-hidden">
                <CardHeader className="pb-3 bg-muted/20 border-b border-border/70">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                          {idx + 1}
                        </span>
                        <CardTitle className="text-base font-semibold text-foreground leading-snug flex items-center flex-wrap gap-1.5">
                          <span>{q.question}</span>
                          {q.required ? (
                            <span className="text-destructive font-bold text-base leading-none" title="Pertanyaan Wajib">
                              *
                            </span>
                          ) : null}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-2 pl-7 text-[11px] text-muted-foreground">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full font-medium',
                            q.required
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {q.required ? 'Wajib' : 'Opsional'}
                        </span>
                        <span className="bg-muted px-2 py-0.5 rounded-full">
                          {isMultiple ? 'Boleh pilih lebih dari 1' : 'Pilih 1 opsi'}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => getRecommendation(idx)}
                      disabled={recommendingIndex === idx || saving}
                      className="gap-1.5 shrink-0 self-start text-xs border-border/80"
                    >
                      {recommendingIndex === idx ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      )}
                      Rekomendasi AI
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Pilihan 1, 2, 3 (Opsi Relevan) */}
                  <div className="grid gap-2">
                    {q.options
                      .filter((opt) => !/^lainnya/i.test(opt.trim()) && !/^other/i.test(opt.trim()))
                      .slice(0, 3)
                      .map((option, optIdx) => {
                        const isSelected = selected.includes(option);

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={saving}
                            onClick={() => handleToggleOption(q, option)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm',
                              isSelected
                                ? 'border-primary bg-primary/10 dark:bg-primary/20 text-foreground ring-1 ring-primary shadow-xs font-medium'
                                : 'border-border bg-card/60 hover:bg-accent/50 hover:border-primary/40 text-foreground/90'
                            )}
                          >
                            <div
                              className={cn(
                                'h-4 w-4 shrink-0 flex items-center justify-center transition-colors border',
                                isMultiple ? 'rounded-md' : 'rounded-full',
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground/40 bg-background'
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <span className="flex-1 leading-snug">{option}</span>
                          </button>
                        );
                      })}

                    {/* Opsi 4: "Lainnya" */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleToggleOther(q)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm',
                          hasOther
                            ? 'border-primary bg-primary/10 dark:bg-primary/20 text-foreground ring-1 ring-primary shadow-xs font-medium'
                            : 'border-border bg-card/60 hover:bg-accent/50 hover:border-primary/40 text-foreground/90'
                        )}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 shrink-0 flex items-center justify-center transition-colors border',
                            isMultiple ? 'rounded-md' : 'rounded-full',
                            hasOther
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40 bg-background'
                          )}
                        >
                          {hasOther && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="flex-1 leading-snug">Lainnya</span>
                      </button>

                      {hasOther && (
                        <div className="pl-7 pt-1">
                          <Input
                            placeholder="Ketik jawaban spesifik Anda di sini..."
                            value={others[q.id] || ''}
                            onChange={(e) => handleOtherTextChange(q.id, e.target.value)}
                            disabled={saving}
                            className="text-sm bg-background border-primary/50 focus-visible:ring-primary"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {isRecommended && (
                    <div className="flex items-center gap-1.5 text-xs text-primary pt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Rekomendasi AI telah dipilihkan untuk pertanyaan ini</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Footer Tombol Aksi */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {!isMandatoryComplete ? (
              <span className="text-destructive font-medium">
                Masih ada pertanyaan wajib (*) yang belum dijawab ({mandatoryAnsweredCount}/{mandatoryQuestions.length})
              </span>
            ) : (
              <span className="text-primary font-medium">
                Semua pertanyaan wajib telah dijawab. Siap lanjut ke Tech Stack.
              </span>
            )}
          </div>

          <Button
            size="lg"
            onClick={saveAndContinue}
            disabled={saving || !canSubmit()}
            className="w-full sm:w-auto gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Lanjut ke Tech Stack
          </Button>
        </div>
      </div>
    </div>
  );
}
