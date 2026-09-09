'use client';

import React, { useState } from 'react';
import type { TaskItemData } from '@/lib/ai/tasks';
import { formatAgentMarkdownPrompt, buildAgentTaskContext } from '@/lib/ai/context';
import { Button } from '@/components/ui/button';
import {
  X,
  Copy,
  Check,
  Terminal,
  FileCode,
  FilePlus,
  CheckSquare,
  Square,
  CheckCircle2,
  Database,
  Server,
  Layout,
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
        return { label: 'Database Layer', icon: Database, color: 'text-sky-700 bg-sky-50 border-sky-200' };
      case 'BACKEND':
        return { label: 'Backend API Layer', icon: Server, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'FRONTEND':
        return { label: 'Frontend UI Layer', icon: Layout, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      default:
        return { label: 'DevOps Layer', icon: Terminal, color: 'text-amber-800 bg-amber-50 border-amber-200' };
    }
  };

  const meta = getLayerMeta(task.layer);
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-200">
      <div
        className="h-full w-full max-w-xl border-l border-zinc-200 bg-white p-6 shadow-xl overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border ${meta.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <span className="font-mono text-xs text-zinc-500">
                Task #{task.id.toUpperCase()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div>
            <h2 className="text-base font-bold text-zinc-900 leading-snug">
              {task.title}
            </h2>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Status Switcher Bar */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 flex items-center justify-between">
            <span className="text-xs text-zinc-600 font-mono">Ubah Status:</span>
            <div className="flex items-center gap-1">
              {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateStatus(task.id, st)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                    task.status === st
                      ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                      : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Target Files (Bounded Context) */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-indigo-600" />
              Target Files (Bounded Context)
            </h4>

            {task.ai_context.files_to_create.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-700 block mb-1">
                  File Baru:
                </span>
                <div className="space-y-1">
                  {task.ai_context.files_to_create.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-mono text-zinc-800 bg-white px-2 py-1 rounded border border-zinc-200">
                      <FilePlus className="h-3 w-3 text-emerald-600" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.ai_context.files_to_modify.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] font-mono uppercase text-amber-800 block mb-1">
                  File Modifikasi:
                </span>
                <div className="space-y-1">
                  {task.ai_context.files_to_modify.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-mono text-zinc-800 bg-white px-2 py-1 rounded border border-zinc-200">
                      <FileCode className="h-3 w-3 text-amber-600" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Acceptance Criteria Checklist */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
              Kriteria Penerimaan
            </h4>
            <div className="space-y-1.5">
              {task.acceptance_criteria.map((criterion, idx) => {
                const isChecked = checkedCriteria[idx] || task.status === 'DONE';
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCriterion(idx)}
                    className="flex items-start gap-2 text-xs cursor-pointer select-none text-zinc-700 hover:text-zinc-900"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    )}
                    <span className={isChecked ? 'line-through text-zinc-400' : ''}>
                      {criterion}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Criteria */}
          {task.ai_context.test_criteria && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                Instruksi Pengujian:
              </span>
              <p className="text-xs text-zinc-700 font-mono bg-white p-2 rounded border border-zinc-200">
                {task.ai_context.test_criteria}
              </p>
            </div>
          )}

          {/* Raw Prompt Preview */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-indigo-600" />
                Prompt Bounded Context
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-7 text-[11px] gap-1 px-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Salin Prompt
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-36 overflow-y-auto rounded bg-white p-2 font-mono text-[10px] text-zinc-600 leading-relaxed border border-zinc-200">
              {markdownPrompt}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
          <div>
            {task.status !== 'DONE' ? (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(task.id, 'DONE')}
                className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
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
                Kembalikan ke In Progress
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
