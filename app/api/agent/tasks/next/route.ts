import { NextResponse } from 'next/server';
import { authenticateAgentRequest } from '@/lib/agent/auth';
import { INITIAL_TASKS, type TaskItemData } from '@/lib/ai/tasks';
import { buildAgentTaskContext, formatAgentMarkdownPrompt } from '@/lib/ai/context';
import { query } from '@/lib/db/postgres';

export async function GET(request: Request) {
  const auth = await authenticateAgentRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Autentikasi gagal.' },
      { status: 401 }
    );
  }

  // 1. Coba ambil dari PostgreSQL terlebih dahulu
  try {
    const inProgressRows = await query(
      `SELECT * FROM tasks WHERE status = 'IN_PROGRESS' ORDER BY sequence ASC LIMIT 1`
    );

    if (inProgressRows && inProgressRows.length > 0) {
      const row = inProgressRows[0];
      const task: TaskItemData = {
        id: row.id,
        sequence: row.sequence || 1,
        title: row.title,
        description: row.description || '',
        layer: row.layer || 'DATABASE',
        priority: row.priority || 'high',
        status: 'IN_PROGRESS',
        acceptance_criteria: Array.isArray(row.acceptance_criteria)
          ? row.acceptance_criteria
          : typeof row.acceptance_criteria === 'string'
          ? JSON.parse(row.acceptance_criteria)
          : [],
        estimated_complexity: row.estimated_complexity || 'medium',
        ai_context: typeof row.ai_context === 'string' ? JSON.parse(row.ai_context) : (row.ai_context || {}),
      };

      const context = buildAgentTaskContext(
        task,
        'Aplikasi SaaS AI Planner',
        'Platform manajemen dan eksekusi task terisolasi.'
      );

      return NextResponse.json({
        success: true,
        hasTask: true,
        status: 'IN_PROGRESS',
        task,
        context,
        markdownPrompt: formatAgentMarkdownPrompt(context),
        message: 'Melanjutkan task yang sedang berjalan.',
      });
    }

    const nextRows = await query(
      `SELECT * FROM tasks WHERE status = 'TODO' ORDER BY sequence ASC LIMIT 1`
    );

    if (nextRows && nextRows.length > 0) {
      const row = nextRows[0];
      const task: TaskItemData = {
        id: row.id,
        sequence: row.sequence || 1,
        title: row.title,
        description: row.description || '',
        layer: row.layer || 'DATABASE',
        priority: row.priority || 'high',
        status: 'TODO',
        acceptance_criteria: Array.isArray(row.acceptance_criteria)
          ? row.acceptance_criteria
          : typeof row.acceptance_criteria === 'string'
          ? JSON.parse(row.acceptance_criteria)
          : [],
        estimated_complexity: row.estimated_complexity || 'medium',
        ai_context: typeof row.ai_context === 'string' ? JSON.parse(row.ai_context) : (row.ai_context || {}),
      };

      const context = buildAgentTaskContext(
        task,
        'Aplikasi SaaS AI Planner',
        'Platform manajemen dan eksekusi task terisolasi.'
      );

      return NextResponse.json({
        success: true,
        hasTask: true,
        status: 'TODO',
        task,
        context,
        markdownPrompt: formatAgentMarkdownPrompt(context),
      });
    }
  } catch (err) {
    // Database query fallback ke in-memory
  }

  // 2. In-Memory Fallback
  const inProgressTask = INITIAL_TASKS.find((t) => t.status === 'IN_PROGRESS');
  if (inProgressTask) {
    const context = buildAgentTaskContext(
      inProgressTask,
      'Aplikasi SaaS AI Planner',
      'Platform manajemen dan eksekusi task terisolasi.'
    );
    return NextResponse.json({
      success: true,
      hasTask: true,
      status: 'IN_PROGRESS',
      task: inProgressTask,
      context,
      markdownPrompt: formatAgentMarkdownPrompt(context),
      message: 'Melanjutkan task yang sedang berjalan.',
    });
  }

  const nextTask = INITIAL_TASKS.find((t) => {
    if (t.status !== 'TODO') return false;
    if (!t.depends_on_task_ids || t.depends_on_task_ids.length === 0) return true;
    return t.depends_on_task_ids.every((depId) => {
      const dep = INITIAL_TASKS.find((item) => item.id === depId);
      return dep && dep.status === 'DONE';
    });
  });

  if (!nextTask) {
    return NextResponse.json({
      success: true,
      hasTask: false,
      message: 'Semua task dalam roadmap saat ini telah selesai atau belum tersedia.',
    });
  }

  const context = buildAgentTaskContext(
    nextTask,
    'Aplikasi SaaS AI Planner',
    'Platform manajemen dan eksekusi task terisolasi.'
  );

  return NextResponse.json({
    success: true,
    hasTask: true,
    status: 'TODO',
    task: nextTask,
    context,
    markdownPrompt: formatAgentMarkdownPrompt(context),
  });
}
