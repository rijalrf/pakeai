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
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wand2,
  Loader2,
  Lightbulb,
  Cpu,
  Layers,
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

  // Auto-generate AI Discovery jika pertanyaan belum ada
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

        // Pre-populate dengan arahan teknis dari AI agar pengguna bisa langsung melanjutkan
        const initialAnswers: Record<string, string> = {};
        data.questions.forEach((q: DiscoveryQuestionItem) => {
          if (q.hint) initialAnswers[q.id] = q.hint;
        });

        setAnswers(initialAnswers);
        saveDiscovery(projectId, data.questions, initialAnswers);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke gateway AI gagal');
      // Fallback jika API bermasalah
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
        <p className="text-zinc-400 text-sm">Memuat proyek...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Workflow Stepper */}
      <WorkflowStepper projectId={projectId} />

      {/* Overview Card: Ide & Stack */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Ide Proyek Baru
                </span>
                <h2 className="text-sm font-bold text-zinc-100">{project.name}</h2>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {project.projectType}
                </Badge>
              </div>
              <p className="text-xs text-zinc-300 italic">"{project.idea}"</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.stacks?.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400"
                  >
                    {s.category}: <span className="text-zinc-200">{s.technology}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* AI Status Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-indigo-500/30 text-xs font-mono text-indigo-300">
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                Analisis AI Otomatis
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Generating Animation Card */}
      {isGenerating && (
        <Card className="border-indigo-500/40 bg-indigo-950/20 p-6 text-center shadow-2xl animate-pulse">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600/30 border border-indigo-500/60 flex items-center justify-center text-indigo-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">
                AI Architect Sedang Menganalisis Ide "{project.name}"...
              </h3>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                Model <span className="font-mono text-indigo-300">ai-builder</span> sedang mendeteksi trade-off
                arsitektur, skalabilitas, dan merumuskan 5 pertanyaan kritis penentu MVP.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between">
          <span>Error Model AI: {errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)} className="h-6 text-[10px]">
            Tutup
          </Button>
        </div>
      )}

      {/* Main Focus: Discovery Question Card */}
      {!isGenerating && activeQuestion && (
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-lg">
          <CardHeader className="pb-3 border-b border-zinc-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white font-mono text-xs font-bold">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Pertanyaan {currentIndex + 1} dari {questions.length}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  {activeQuestion?.category?.replace('_', ' ') || 'Arsitektur'}
                </Badge>
              </div>

              <span className="text-xs font-mono text-emerald-400">
                {answeredCount}/{questions.length} Terisi
              </span>
            </div>

            <CardTitle className="text-base font-bold text-zinc-100 pt-2 leading-snug">
              {activeQuestion?.question}
            </CardTitle>

            {activeQuestion?.hint && (
              <CardDescription className="flex items-start gap-1.5 text-xs text-zinc-400 pt-1">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Rekomendasi AI: {activeQuestion.hint}</span>
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">
                Spesifikasi &amp; Jawaban Anda:
              </label>
              <button
                type="button"
                onClick={handleAutoFill}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
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
              placeholder="Tuliskan spesifikasi detail Anda di sini..."
              className="text-xs resize-none bg-zinc-950/70 border-zinc-800 focus-visible:ring-indigo-500"
            />
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-zinc-800/60 pt-4">
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
                  Pertanyaan Berikutnya
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleProceedToPRD}
                  disabled={!isAllAnswered}
                  className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  Selesai Discovery &amp; Buat PRD Otomatis
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Stepper Dots Navigation */}
      {questions.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-6 bg-indigo-500'
                  : answers[q.id]?.trim()
                  ? 'w-2 bg-emerald-500/80'
                  : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
