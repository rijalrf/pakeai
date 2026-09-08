import { NextResponse } from 'next/server';
import { authenticateAgentRequest } from '@/lib/agent/auth';
import { INITIAL_TASKS } from '@/lib/ai/tasks';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await authenticateAgentRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Autentikasi gagal.' },
      { status: 401 }
    );
  }

  const { taskId } = await params;
  const task = INITIAL_TASKS.find((t) => t.id === taskId);

  if (!task) {
    return NextResponse.json(
      { success: false, error: `Task dengan ID ${taskId} tidak ditemukan.` },
      { status: 404 }
    );
  }

  task.status = 'DONE';

  // Cek apakah seluruh task dalam layer ini sudah selesai
  const layerTasks = INITIAL_TASKS.filter((t) => t.layer === task.layer);
  const allLayerDone = layerTasks.every((t) => t.status === 'DONE');

  return NextResponse.json({
    success: true,
    taskId,
    status: 'DONE',
    completed_at: new Date().toISOString(),
    layer: task.layer,
    layerCompleted: allLayerDone,
    checkpointNotice: allLayerDone
      ? `Seluruh task layer ${task.layer} telah selesai. Silakan lakukan audit arsitektur di Web UI (Human Checkpoint Gate).`
      : null,
  });
}
