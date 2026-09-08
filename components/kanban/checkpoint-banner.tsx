'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TaskLayer } from '@/lib/db/database.types';

interface CheckpointBannerProps {
  layer: TaskLayer;
  completedCount: number;
  totalCount: number;
  isApproved: boolean;
  onApprove: () => void;
}

export function CheckpointBanner({
  layer,
  completedCount,
  totalCount,
  isApproved,
  onApprove,
}: CheckpointBannerProps) {
  const isReadyForCheckpoint = completedCount === totalCount && totalCount > 0;

  if (!isReadyForCheckpoint) return null;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        isApproved
          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
          : 'border-amber-500/40 bg-amber-950/20 text-amber-200 shadow-lg shadow-amber-950/20 animate-in fade-in slide-in-from-top-2'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isApproved ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <ShieldAlert className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Human-in-the-loop Gate
              </span>
              <Badge
                variant={isApproved ? 'emerald' : 'amber'}
                className="text-[10px] font-mono uppercase"
              >
                {isApproved ? 'Approved' : 'Review Required'}
              </Badge>
            </div>
            <h4 className="text-sm font-semibold text-zinc-100 mt-0.5">
              Layer {layer} Selesai ({completedCount}/{totalCount} Task)
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
              {isApproved
                ? `Checkpoint layer ${layer} telah disetujui. AI Coding Agent diizinkan melanjutkan ke layer berikutnya.`
                : `Seluruh task di layer ${layer} telah selesai dikerjakan. Lakukan audit arsitektur sebelum AI Coding Agent memulai task di layer berikutnya untuk mencegah halusinasi dependensi.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isApproved ? (
            <Button
              size="sm"
              variant="amber"
              onClick={onApprove}
              className="text-xs font-semibold gap-1.5 shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              Setujui Checkpoint {layer}
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="h-4 w-4" />
              <span>Gate Passed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
