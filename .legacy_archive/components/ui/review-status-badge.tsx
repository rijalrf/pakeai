'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { ReviewResult } from '@/lib/ai/reviewer';

interface ReviewStatusBadgeProps {
  review?: ReviewResult | null;
  stageName?: string;
  autoFixed?: boolean;
}

export function ReviewStatusBadge({
  review,
  stageName = 'Rencana',
  autoFixed = false,
}: ReviewStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!review) return null;

  const score = review.score ?? 80;
  const verdict = review.verdict || (score >= 75 ? 'pass' : score >= 60 ? 'warning' : 'fail');
  const issues = review.issues || [];

  const isPass = verdict === 'pass';
  const isWarning = verdict === 'warning';

  const badgeColor = isPass
    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
    : isWarning
    ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
    : 'border-rose-500/40 bg-rose-950/30 text-rose-300';

  const Icon = isPass ? ShieldCheck : isWarning ? AlertTriangle : AlertCircle;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all hover:opacity-90 ${badgeColor}`}
      >
        <Icon className="h-4 w-4" />
        <span className="font-semibold">
          AI Reviewer: {score}/100 ({verdict.toUpperCase()})
        </span>
        {autoFixed && (
          <span className="flex items-center gap-1 text-[10px] bg-indigo-900/60 text-indigo-200 px-1.5 py-0.5 rounded">
            <Sparkles className="h-3 w-3" />
            Auto-Fixed
          </span>
        )}
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-zinc-300" />
              <span className="text-xs font-bold text-zinc-200">
                Hasil Evaluasi {stageName}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400">
              Skor: {score}/100
            </span>
          </div>

          <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
            {review.summary || 'Seluruh kriteria verifikasi teruji secara otomatis.'}
          </p>

          {issues.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[11px] font-semibold text-zinc-400">
                Catatan Temuan ({issues.length}):
              </span>
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2 text-[11px]"
                >
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        issue.severity === 'critical'
                          ? 'bg-rose-500'
                          : issue.severity === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="capitalize">{issue.category}</span>
                  </div>
                  <p className="text-zinc-400 mt-1">{issue.message}</p>
                  {issue.suggestion && (
                    <p className="text-zinc-500 mt-1 italic">Saran: {issue.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-zinc-900/50 p-2 text-center text-[11px] text-zinc-400">
              Tidak ada catatan kritis atau pelanggaran dependensi yang ditemukan.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
