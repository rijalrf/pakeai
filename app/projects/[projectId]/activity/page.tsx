'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { ActivityFeed } from '@/components/project/activity/activity-feed';
import { CheckpointDialog } from '@/components/project/checkpoints/checkpoint-dialog';
import { INITIAL_CHECKPOINTS, type CheckpointRecord } from '@/lib/agent/checkpoints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Filter,
  CheckCircle2,
  Terminal,
  ArrowRight,
} from 'lucide-react';

export default function ActivityPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject } = useProjectStore();

  const [checkpoints, setCheckpoints] = useState<CheckpointRecord[]>(INITIAL_CHECKPOINTS);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointRecord | null>(null);

  const project = getProject(projectId);
  if (!project) return null;

  const handleApproveCheckpoint = (id: string, feedback?: string) => {
    setCheckpoints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'approved',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Rijal (You)',
              feedback,
            }
          : c
      )
    );
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold">
              05
            </span>
            <h1 className="text-base font-bold tracking-tight text-zinc-100">
              Audit Trail &amp; Human Checkpoint Gates
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Riwayat lengkap interaksi AI agent, transisi layer arsitektur, dan persetujuan human-in-the-loop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/tasks`)}
            className="text-xs h-8"
          >
            Papan Kanban
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/settings`)}
            className="text-xs h-8 gap-1.5"
          >
            <Terminal className="h-3.5 w-3.5" />
            CLI PAT Settings
          </Button>
        </div>
      </div>

      {/* Human Checkpoints Status Summary Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
          Human-in-the-loop Architecture Gates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checkpoints.map((chk) => {
            const isApproved = chk.status === 'approved';
            return (
              <div
                key={chk.id}
                onClick={() => setSelectedCheckpoint(chk)}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  isApproved
                    ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    : 'border-amber-500/40 bg-amber-950/20 shadow-lg shadow-amber-950/10 hover:border-amber-500/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                      {chk.type.replace('_', ' ')}
                    </span>
                    <Badge
                      variant={isApproved ? 'emerald' : 'amber'}
                      className="text-[10px] font-mono capitalize"
                    >
                      {chk.status}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-100 mb-1">
                    {chk.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">
                    {chk.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1 text-zinc-500">
                    {isApproved ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Gate Passed</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3 w-3 text-amber-400" />
                        <span className="text-amber-400">Review Required</span>
                      </>
                    )}
                  </div>
                  <span className="text-zinc-400 underline">Buka Review</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline Feed */}
      <div className="space-y-3 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            Aktivitas Eksekusi &amp; Event Log
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">Real-time sync</span>
        </div>

        <ActivityFeed />
      </div>

      {/* Checkpoint Detail / Approval Dialog Modal */}
      {selectedCheckpoint && (
        <CheckpointDialog
          checkpoint={selectedCheckpoint}
          onClose={() => setSelectedCheckpoint(null)}
          onApprove={handleApproveCheckpoint}
        />
      )}
    </div>
  );
}
