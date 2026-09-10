// Interview page: pertanyaan dari hasil chat + tombol Rekomendasi AI per pertanyaan
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Sparkles, Loader2, ArrowRight } from 'lucide-react';

type InterviewQuestion = {
  id?: string;
  questionId?: string;
  question: string;
  context?: string;
  answer: string;
  skipped?: boolean;
  recommended?: boolean;
};

export function InterviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recommendingIndex, setRecommendingIndex] = useState<number | null>(null);

  // Load atau generate questions
  useEffect(() => {
    if (!projectId) return;

    const loadInterview = async () => {
      try {
        const res = await fetch(`http://localhost:6655/api/projects/${projectId}/brd`, {
          credentials: 'include',
        });
        const json = await res.json();

        // Jika belum ada BRD atau tidak ada questions, generate dulu
        if (!json.brd || !json.project?.brd) {
          await fetch(`http://localhost:6655/api/projects/${projectId}/interview/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          // Fetch again after generation
          const finalRes = await fetch(`http://localhost:6655/api/projects/${projectId}/discovery`, {
            credentials: 'include',
          });
          const finalJson = await finalRes.json();
          const mapped = (finalJson.questions || []).map((q: any) => ({
            id: q.id,
            questionId: q.id,
            question: q.question,
            context: q.context,
            answer: q.answers?.[0]?.answer || '',
            skipped: false,
            recommended: false,
          }));
          setQuestions(mapped);
        } else {
          const discoveryRes = await fetch(`http://localhost:6655/api/projects/${projectId}/discovery`, {
            credentials: 'include',
          });
          const discoveryJson = await discoveryRes.json();
          const mapped = (discoveryJson.questions || []).map((q: any) => ({
            id: q.id,
            questionId: q.id,
            question: q.question,
            context: q.context,
            answer: q.answers?.[0]?.answer || '',
            skipped: false,
            recommended: false,
          }));
          setQuestions(mapped);
        }
      } catch (err) {
        console.error('Gagal load interview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [projectId]);

  const getRecommendation = async (index: number) => {
    setRecommendingIndex(index);
    try {
      const q = questions[index];
      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/interview/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionIndex: index }),
      });
      const json = await res.json();

      // Update jawaban rekomendasi
      setQuestions((prev) => prev.map((qItem, idx) => {
        if (idx === index) {
          return { ...qItem, answer: json.recommendation || 'Isi jawaban yang paling sesuai...', recommended: true };
        }
        return qItem;
      }));
    } catch (err) {
      console.error('Gagal dapat rekomendasi:', err);
      alert('Gagal mendapatkan rekomendasi AI.');
    } finally {
      setRecommendingIndex(null);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, answer: value, recommended: false } : q)));
  };

  const handleSkip = (index: number) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, skipped: true, answer: q.answer } : q)));
  };

  const saveAndContinue = async () => {
    setSaving(true);

    // Kirim semua answers ke backend
    try {
      const answersToSend = questions.map((q) => ({
        questionId: q.questionId || q.id,
        answer: q.skipped ? 'Dilewati' : (q.answer || 'Tidak ada jawaban'),
        skipped: q.skipped || false,
      }));

      const res = await fetch(`http://localhost:6655/api/projects/${projectId}/interview`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers: answersToSend }),
      });

      if (res.ok) {
        navigate(`/projects/${projectId}/techstack`);
      } else {
        const err = await res.json();
        console.error('Gagal simpan interview:', err);
        alert('Terjadi kesalahan saat menyimpan jawaban.');
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Terjadi kesalahan saat menyimpan jawaban.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted w-3/4 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-2xl font-semibold">Interview Kebutuhan Aplikasi</h1>
        <p className="text-muted-foreground mt-1">Jawab beberapa pertanyaan untuk memperjelas requirements aplikasi.</p>
      </div>

      {/* Pertanyaan list */}
      <div className="max-w-3xl mx-auto space-y-4 pb-8">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada pertanyaan. Silakan refresh halaman.
            </CardContent>
          </Card>
        ) : (
          questions.map((q, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{idx + 1}. {q.question}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => getRecommendation(idx)}
                  disabled={recommendingIndex === idx}
                  className="gap-2"
                >
                  {recommendingIndex === idx ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Rekomendasi AI
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Tulis jawaban Anda..."
                  value={q.answer}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                {q.recommended && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Direkomendasikan oleh AI</span>
                  </div>
                )}
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSkip(idx)}
                    disabled={saving}
                  >
                    Lewati
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Tombol Lanjut */}
        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            onClick={saveAndContinue}
            disabled={saving || questions.some(q => !q.answer && !q.skipped)}
            className="gap-2"
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
