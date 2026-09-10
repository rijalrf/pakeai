// StructuredForm: render form pertanyaan dari AI (radio/checkbox + "Lainnya")
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, PlusCircle } from 'lucide-react';

type Question = {
  id: string;
  label: string;
  type: 'radio' | 'checkbox';
  options: string[];
};

interface StructuredFormProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  disabled?: boolean;
}

export function StructuredForm({ questions, onSubmit, disabled }: StructuredFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [others, setOthers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleOptionChange = (questionId: string, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleOtherChange = (questionId: string, value: string) => {
    if (submitted) return;
    setOthers((prev) => ({ ...prev, [questionId]: value }));
  };

  const hasOtherSelected = (questionId: string) => {
    const answer = answers[questionId];
    return answer && answer.startsWith('other:');
  };

  const canSubmit = () => {
    if (submitted) return true;
    // All radio questions must have an answer
    for (const q of questions) {
      if (q.type === 'radio' && !answers[q.id]) return false;
      if (q.type === 'checkbox') {
        const selected = answers[q.id]?.split(',').filter(Boolean) || [];
        if (selected.length === 0) return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    // Combine regular answers with "Lainnya" values
    const finalAnswers: Record<string, string> = {};
    for (const q of questions) {
      if (hasOtherSelected(q.id)) {
        finalAnswers[q.id] = others[q.id] || '';
      } else {
        finalAnswers[q.id] = answers[q.id] || '';
      }
    }

    onSubmit(finalAnswers);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            Jawaban Tersimpan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="text-sm">
                <div className="font-medium">{q.label || (q as any).question}</div>
                <div className="text-muted-foreground mt-1">
                  {answers[q.id] || others[q.id] || '(tidak dijawab)'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konteks Aplikasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx}>
            <Label className="text-base font-medium">{q.label || (q as any).question}</Label>
            <RadioGroup
              onValueChange={(val) => handleOptionChange(q.id, val)}
              value={answers[q.id]}
              className="mt-2 space-y-2"
            >
              {q.options.map((option, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <RadioGroupItem value={option} id={`${q.id}-${optIdx}`} />
                  <Label htmlFor={`${q.id}-${optIdx}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
              {/* Opsi "Lainnya" */}
              <div className="flex items-center gap-2 mt-2">
                <RadioGroupItem
                  value={`other:${q.id}`}
                  id={`${q.id}-other`}
                />
                <Label
                  htmlFor={`${q.id}-other`}
                  className="font-normal cursor-pointer flex-1"
                  onClick={() => document.getElementById(`${q.id}-other-input`)?.focus()}
                >
                  Lainnya
                </Label>
                {hasOtherSelected(q.id) && (
                  <Input
                    id={`${q.id}-other-input`}
                    placeholder="Tulis jawaban Anda..."
                    value={others[q.id] || ''}
                    onChange={(e) => handleOtherChange(q.id, e.target.value)}
                    className="flex-1 max-w-sm ml-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </RadioGroup>
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Kirim Jawaban
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
