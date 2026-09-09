'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { WorkflowStepper } from '@/components/project/workflow-stepper';
import { FALLBACK_QUESTIONS, type DiscoveryQuestionItem } from '@/lib/ai/discovery';
import {
  ArrowRight,
  ArrowLeft,
  Wand2,
  Loader2,
  Lightbulb,
} from 'lucide-react';

export default function DiscoveryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject, updateProjectStatus, saveDiscovery } = useProjectStore();

  const project = getProject(projectId);
  const [questions, setQuestions] = useState<DiscoveryQuestionItem[]>(
    project?.discoveryQuestions && project.discoveryQuestions.length > 0
      ? project.discoveryQuestions
      : []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    project?.discoveryAnswers || {}
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    if (!project) return;

    if ((!project.discoveryQuestions || project.discoveryQuestions.length === 0) && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      handleGenerateQuestionsWithAI();
    } else if (project.discoveryQuestions && project.discoveryQuestions.length > 0 && questions.length === 0) {
      setQuestions(project.discoveryQuestions);
      if (project.discoveryAnswers) {
        setAnswers(project.discoveryAnswers);
      }
    }
  }, [project]);

  const handleGenerateQuestionsWithAI = async () => {
    if (!project) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea || project.description || 'Aplikasi software',
          projectType: project.projectType || 'Web Application',
          stacks: project.stacks || [],
          skillLevel: 'intermediate',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memanggil model AI');
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);

        const initialAnswers: Record<string, string> = {};
        data.questions.forEach((q: DiscoveryQuestionItem) => {
          if (q.hint) initialAnswers[q.id] = q.hint;
        });

        setAnswers(initialAnswers);
        saveDiscovery(projectId, data.questions, initialAnswers);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke gateway AI gagal');
      if (questions.length === 0) {
        setQuestions(FALLBACK_QUESTIONS);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const activeQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim().length > 0).length;
  const isAllAnswered = questions.length > 0 && answeredCount >= questions.length;

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAutoFill = () => {
    if (activeQuestion) {
      const recommendation =
        activeQuestion.hint ||
        `Spesifikasi MVP untuk ${project?.name || 'aplikasi'} dengan fokus performa dan keandalan data.`;
      const updated = {
        ...answers,
        [activeQuestion.id]: recommendation,
      };
      setAnswers(updated);
      saveDiscovery(projectId, questions, updated);
    }
  };

  const handleProceedToPRD = () => {
    saveDiscovery(projectId, questions, answers);
    updateProjectStatus(projectId, 'prd');
    router.push(`/projects/${projectId}/prd`);
  };

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-zinc-500 text-xs">Memuat proyek...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Workflow Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Project Brief Info */}
      <div className="border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold tracking-tight text-zinc-900">
            Discovery Q&amp;A: {project.name}
          </h1>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {project.projectType || 'App'}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Jawab pertanyaan arsitektur untuk menyusun spesifikasi PRD yang akurat.
        </p>
      </div>

      {/* AI Generating Alert */}
      {isGenerating && (
        <Card className="border-indigo-200 bg-indigo-50/50 p-6 text-center shadow-xs">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <p className="text-xs font-medium text-zinc-800">
              AI sedang merumuskan 5 pertanyaan arsitektur untuk proyek ini...
            </p>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)} className="h-6 text-[10px]">
            Tutup
          </Button>
        </div>
      )}

      {/* Active Question Card */}
      {!isGenerating && activeQuestion && (
        <Card className="border-zinc-200 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white font-mono text-xs font-bold">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Pertanyaan {currentIndex + 1} dari {questions.length}
                </span>
              </div>

              <span className="text-xs font-mono text-indigo-600 font-medium">
                {answeredCount}/{questions.length} Terisi
              </span>
            </div>

            <CardTitle className="text-sm font-semibold text-zinc-900 pt-2 leading-snug">
              {activeQuestion?.question}
            </CardTitle>

            {activeQuestion?.hint && (
              <CardDescription className="flex items-start gap-1.5 text-xs text-zinc-500 pt-1">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Rekomendasi AI: {activeQuestion.hint}</span>
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700">
                Jawaban Anda:
              </label>
              <button
                type="button"
                onClick={handleAutoFill}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Wand2 className="h-3 w-3" />
                Gunakan Rekomendasi AI
              </button>
            </div>

            <Textarea
              rows={4}
              value={answers[activeQuestion?.id] || ''}
              onChange={(e) => {
                const updated = {
                  ...answers,
                  [activeQuestion.id]: e.target.value,
                };
                setAnswers(updated);
                saveDiscovery(projectId, questions, updated);
              }}
              placeholder="Tuliskan jawaban atau kustomisasi rekomendasi di atas..."
              className="text-xs resize-none"
            />
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-zinc-100 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="gap-1.5 h-8 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex < questions.length - 1 ? (
                <Button size="sm" onClick={handleNext} className="gap-1.5 h-8 text-xs">
                  Selanjutnya
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleProceedToPRD}
                  disabled={!isAllAnswered}
                  className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                >
                  Setujui &amp; Buat PRD
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Progress Dots */}
      {questions.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'w-5 bg-indigo-600'
                  : answers[q.id]?.trim()
                  ? 'w-1.5 bg-emerald-500'
                  : 'w-1.5 bg-zinc-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
