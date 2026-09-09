import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth/session';

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { taskId } = await context.params;
    const body = await request.json();
    const newStatus = body?.status;

    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: 'Properti "status" wajib disertakan.' },
        { status: 400 }
      );
    }

    // Update hanya jika task milik proyek yang dimiliki user
    const updatedRows = await query<any>(
      `UPDATE tasks
       SET status = $1,
           updated_at = NOW(),
           started_at = CASE WHEN $1 = 'IN_PROGRESS' AND started_at IS NULL THEN NOW() ELSE started_at END,
           completed_at = CASE WHEN $1 = 'DONE' THEN NOW() ELSE completed_at END
       WHERE (id::text = $2 OR sequence::text = $2)
         AND project_id IN (SELECT id FROM projects WHERE user_id = $3)
       RETURNING id, project_id, status, sequence, title`,
      [newStatus, taskId, user.id]
    );

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task tidak ditemukan atau Anda tidak memiliki akses.' },
        { status: 404 }
      );
    }

    const updated = updatedRows[0];

    // Picu notifikasi realtime ke channel project
    try {
      const channel = `project_${updated.project_id.replace(/-/g, '_')}`;
      const payload = JSON.stringify({
        type: 'TASK_UPDATED',
        taskId: updated.id,
        sequence: updated.sequence,
        status: updated.status,
        title: updated.title,
      });
      await query(`SELECT pg_notify($1, $2)`, [channel, payload]);
    } catch (notifyErr) {
      console.error('Gagal mengirim pg_notify dari PATCH task:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      taskId: updated.id,
      status: updated.status,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error saat update task:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
