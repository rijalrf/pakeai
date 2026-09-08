'use client';

import React, { useState } from 'react';
import type { CheckpointRecord } from '@/lib/agent/checkpoints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  CheckSquare,
  Square,
  Clock,
  User,
  Layers,
} from 'lucide-react';

interface CheckpointDialogProps {
  checkpoint: CheckpointRecord | null;
  onClose: () => void;
  onApprove: (checkpointId: string, feedback?: string) => void;
}

export function CheckpointDialog({
  checkpoint,
  onClose,
  onApprove,
}: CheckpointDialogProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState('');

  if (!checkpoint) return null;

  const isApproved = checkpoint.status === 'approved';
  const allChecked =
    checkpoint.reviewChecklist.length > 0 &&
    checkpoint.reviewChecklist.every((_, i) => checkedItems[i] || isApproved);

  const toggleCheck = (idx: number) => {
    if (isApproved) return;
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleApprove = () => {
    onApprove(checkpoint.id, feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`p-2.5 rounded-xl ${
              isApproved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isApproved ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
                Human-in-the-loop Gate
              </span>
              <Badge
                variant={isApproved ? 'emerald' : 'amber'}
                className="text-[10px] font-mono uppercase"
              >
                {checkpoint.status}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-zinc-100 mt-1">
              {checkpoint.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
          {checkpoint.description}
        </p>

        {/* Checklist */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2.5 mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
            Audit Checklist (Wajib Diverifikasi Sebelum Lanjut):
          </span>
          <div className="space-y-2">
            {checkpoint.reviewChecklist.map((item, idx) => {
              const isChecked = checkedItems[idx] || isApproved;
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`flex items-start gap-2.5 text-xs transition-colors ${
                    isApproved ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  )}
                  <span className={isChecked ? 'text-zinc-200 font-medium' : 'text-zinc-400'}>
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Notes / Metadata if already approved */}
        {isApproved ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-300 space-y-1 mb-4">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Disetujui pada:{' '}
                {checkpoint.reviewedAt
                  ? new Date(checkpoint.reviewedAt).toLocaleString('id-ID')
                  : 'Baru saja'}
              </span>
            </div>
            {checkpoint.reviewedBy && (
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                <User className="h-3.5 w-3.5 text-zinc-400" />
                <span>Reviewer: {checkpoint.reviewedBy}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 mb-4">
            <label className="text-xs text-zinc-400 font-medium block">
              Catatan Arsitektur / Feedback Tambahan (Opsional):
            </label>
            <Textarea
              placeholder="Contoh: Skema foreign key sudah divalidasi, index booking slot teruji unik."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="text-xs h-16 bg-zinc-900 border-zinc-800"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>

          {!isApproved && (
            <Button
              size="sm"
              variant="emerald"
              disabled={!allChecked}
              onClick={handleApprove}
              className="text-xs gap-1.5 font-semibold"
            >
              <CheckCircle2 className="h-4 w-4" />
              Setujui Checkpoint &amp; Buka Akses Agent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
