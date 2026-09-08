import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { INITIAL_TASKS } from '@/lib/ai/tasks';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const newStatus = body.status;

    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: 'Properti "status" wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Update in-memory INITIAL_TASKS
    const memTask = INITIAL_TASKS.find(
      (t) => t.id === taskId || t.sequence.toString() === taskId
    );
    if (memTask) {
      memTask.status = newStatus;
    }

    // 2. Persist to PostgreSQL if available
    try {
      await query(
        `UPDATE tasks
         SET status = $1,
             updated_at = NOW(),
             started_at = CASE WHEN $1 = 'IN_PROGRESS' AND started_at IS NULL THEN NOW() ELSE started_at END,
             completed_at = CASE WHEN $1 = 'DONE' THEN NOW() ELSE completed_at END
         WHERE id::text = $2 OR sequence::text = $2 OR title ILIKE '%' || $2 || '%'`,
        [newStatus, taskId]
      );
    } catch (dbErr) {
      // Fallback silent: in-memory state updated
    }

    return NextResponse.json({
      success: true,
      taskId,
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
