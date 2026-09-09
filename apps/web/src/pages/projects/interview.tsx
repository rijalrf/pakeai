// Halaman discovery interview: generate pertanyaan, jawab, lalu generate BRD.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ArrowRight } from 'lucide-react';

type Question = { id: string; question: string; answers: { id: string; answer: string }[] };

export function InterviewPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const questionsQ = useQuery({
    queryKey: ['discovery', projectId],
    queryFn: () => api<{ questions: Question[] }>(`/api/projects/${projectId}/discovery`),
  });

  const generateMut = useMutation({
    mutationFn: () => api(`/api/projects/${projectId}/discovery/generate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discovery', projectId] }),
  });

  const [draft, setDraft] = useState<Record<string, string>>({});

  const answerMut = useMutation({
    mutationFn: ({ qid, answer }: { qid: string; answer: string }) =>
      api(`/api/discovery/${qid}/answer`, { method: 'POST', body: JSON.stringify({ answer }) }),
    onSuccess: (_, vars) => {
      setDraft((d) => ({ ...d, [vars.qid]: '' }));
      qc.invalidateQueries({ queryKey: ['discovery', projectId] });
    },
  });

  const brdMut = useMutation({
    mutationFn: () => api(`/api/projects/${projectId}/brd/generate`, { method: 'POST' }),
    onSuccess: () => navigate(`/projects/${projectId}/brd/view`),
  });

  const answered = questionsQ.data?.questions.filter((q) => q.answers.length > 0).length ?? 0;
  const total = questionsQ.data?.questions.length ?? 0;

  return (
    <AppShell back="/dashboard" title="BRD Generator">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interview Discovery</CardTitle>
              <CardDescription>Jawab pertanyaan berikut. AI akan mengubah jawaban Anda menjadi BRD yang terstruktur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionsQ.isLoading && <p className="text-muted-foreground">Memuat pertanyaan...</p>}
              {questionsQ.data?.questions.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">Belum ada pertanyaan.</p>
                  <Button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}>
                    <Sparkles className="h-4 w-4" /> Generate Pertanyaan
                  </Button>
                </div>
              )}
              {questionsQ.data?.questions.map((q, idx) => {
                const existing = q.answers[0]?.answer;
                const value = draft[q.id] ?? existing ?? '';
                return (
                  <div key={q.id} className="border rounded-md p-3">
                    <p className="font-medium text-sm mb-2">{idx + 1}. {q.question}</p>
                    <Textarea
                      rows={3}
                      value={value}
                      onChange={(e) => setDraft((d) => ({ ...d, [q.id]: e.target.value }))}
                      placeholder="Ketik jawaban Anda..."
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        disabled={answerMut.isPending || !value.trim()}
                        onClick={() => answerMut.mutate({ qid: q.id, answer: value })}
                      >
                        {existing ? 'Update Jawaban' : 'Kirim Jawaban'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">Terjawab</p>
              <p className="text-2xl font-semibold">{answered} / {total}</p>
              <Button
                className="mt-4 w-full"
                disabled={answered === 0 || brdMut.isPending}
                onClick={() => brdMut.mutate()}
              >
                <Sparkles className="h-4 w-4" /> {brdMut.isPending ? 'Generating...' : 'Generate BRD'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {brdMut.isError && (
                <p className="text-xs text-destructive mt-2">
                  Gagal generate BRD. Coba lagi, atau periksa apakah AI gateway aktif.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
