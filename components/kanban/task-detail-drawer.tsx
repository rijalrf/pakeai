'use client';

import React, { useState } from 'react';
import type { TaskItemData } from '@/lib/ai/tasks';
import { formatAgentMarkdownPrompt, buildAgentTaskContext } from '@/lib/ai/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Copy,
  Check,
  Terminal,
  FileCode,
  FilePlus,
  CheckSquare,
  Square,
  AlertTriangle,
  Play,
  CheckCircle2,
  Database,
  Server,
  Layout,
  ExternalLink,
} from 'lucide-react';

interface TaskDetailDrawerProps {
  task: TaskItemData | null;
  projectName: string;
  projectDesc: string;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskItemData['status']) => void;
}

export function TaskDetailDrawer({
  task,
  projectName,
  projectDesc,
  onClose,
  onUpdateStatus,
}: TaskDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [checkedCriteria, setCheckedCriteria] = useState<Record<number, boolean>>({});

  if (!task) return null;

  const executionContext = buildAgentTaskContext(task, projectName, projectDesc);
  const markdownPrompt = formatAgentMarkdownPrompt(executionContext);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCriterion = (index: number) => {
    setCheckedCriteria((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getLayerMeta = (layer: TaskItemData['layer']) => {
    switch (layer) {
      case 'DATABASE':
        return { label: 'Database Layer', icon: Database, color: 'text-sky-400 bg-sky-950/40 border-sky-500/30' };
      case 'BACKEND':
        return { label: 'Backend API Layer', icon: Server, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' };
      case 'FRONTEND':
        return { label: 'Frontend UI Layer', icon: Layout, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30' };
      default:
        return { label: 'DevOps Layer', icon: Terminal, color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' };
    }
  };

  const meta = getLayerMeta(task.layer);
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="h-full w-full max-w-xl border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${meta.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <span className="font-mono text-xs text-zinc-500">
                Task #{task.id.toUpperCase()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Title & Status Controls */}
          <div>
            <h2 className="text-lg font-bold text-zinc-100 leading-snug">
              {task.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Status Switcher Bar */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-2.5 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Ubah Status:</span>
            <div className="flex items-center gap-1.5">
              {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateStatus(task.id, st)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                    task.status === st
                      ? 'bg-zinc-100 text-zinc-950 font-bold shadow-xs'
                      : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Target Files (Bounded Context) */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-indigo-400" />
              Target Files (Bounded Context)
            </h4>

            {task.ai_context.files_to_create.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">
                  File Baru yang Harus Dibuat:
                </span>
                <div className="space-y-1">
                  {task.ai_context.files_to_create.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
                      <FilePlus className="h-3 w-3 text-emerald-400" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.ai_context.files_to_modify.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] font-mono uppercase text-amber-400 block mb-1">
                  File yang Boleh Dimodifikasi:
                </span>
                <div className="space-y-1">
                  {task.ai_context.files_to_modify.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
                      <FileCode className="h-3 w-3 text-amber-400" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Acceptance Criteria Checklist */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5 space-y-2.5">
            <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
              Kriteria Penerimaan (Checklist)
            </h4>
            <div className="space-y-2">
              {task.acceptance_criteria.map((criterion, idx) => {
                const isChecked = checkedCriteria[idx] || task.status === 'DONE';
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCriterion(idx)}
                    className="flex items-start gap-2.5 text-xs cursor-pointer select-none text-zinc-300 hover:text-zinc-100"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                    )}
                    <span className={isChecked ? 'line-through text-zinc-500' : ''}>
                      {criterion}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Criteria */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Instruksi Pengujian (Test Criteria):
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed font-mono bg-zinc-950/60 p-2.5 rounded border border-zinc-800/50">
              {task.ai_context.test_criteria}
            </p>
          </div>

          {/* Raw AI Agent Context Preview */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-sky-400" />
                AI Agent Context Payload
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-7 text-[11px] gap-1 px-2 border-zinc-700"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Salin Prompt Agent
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-48 overflow-y-auto rounded bg-zinc-950 p-2.5 font-mono text-[10px] text-zinc-400 leading-relaxed border border-zinc-800/60">
              {markdownPrompt}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-zinc-800 flex items-center justify-between gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
          <div className="flex items-center gap-2">
            {task.status !== 'DONE' ? (
              <Button
                size="sm"
                variant="emerald"
                onClick={() => onUpdateStatus(task.id, 'DONE')}
                className="text-xs gap-1.5 font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tandai Selesai
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
                className="text-xs gap-1.5"
              >
                Kembalikan ke Progress
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
