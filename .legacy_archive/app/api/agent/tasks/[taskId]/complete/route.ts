import { NextResponse } from 'next/server';
import { authenticateAgentRequest } from '@/lib/agent/auth';
import { INITIAL_TASKS } from '@/lib/ai/tasks';
import { query } from '@/lib/db/postgres';

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
  let layer = 'DATABASE';
  let allLayerDone = false;

  // 1. Update in-memory
  const memTask = INITIAL_TASKS.find(
    (t) => t.id === taskId || t.sequence.toString() === taskId
  );
  if (memTask) {
    memTask.status = 'DONE';
    layer = memTask.layer;
    const layerTasks = INITIAL_TASKS.filter((t) => t.layer === memTask.layer);
    allLayerDone = layerTasks.every((t) => t.status === 'DONE');
  }

  // 2. Update in PostgreSQL
  try {
    const updateRes = await query(
      `UPDATE tasks
       SET status = 'DONE', completed_at = NOW(), updated_at = NOW()
       WHERE id::text = $1 OR sequence::text = $1 OR title ILIKE '%' || $1 || '%'
       RETURNING layer`,
      [taskId]
    );

    if (updateRes && updateRes.length > 0) {
      layer = updateRes[0].layer || layer;

      const remainingRes = await query(
        `SELECT COUNT(*) as remaining FROM tasks WHERE layer = $1 AND status != 'DONE'`,
        [layer]
      );
      allLayerDone = parseInt(remainingRes[0]?.remaining || '0', 10) === 0;
    }
  } catch (err) {
    // Database query fallback
  }

  return NextResponse.json({
    success: true,
    taskId,
    status: 'DONE',
    completed_at: new Date().toISOString(),
    layer,
    layerCompleted: allLayerDone,
    checkpointNotice: allLayerDone
      ? `Seluruh task layer ${layer} telah selesai. Silakan lakukan audit arsitektur di Web UI (Human Checkpoint Gate).`
      : null,
  });
}
