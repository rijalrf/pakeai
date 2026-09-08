import { NextResponse } from 'next/server';
import { generateTasksFromRoadmap, INITIAL_TASKS, type TaskItemData } from '@/lib/ai/tasks';
import { query } from '@/lib/db/postgres';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Coba ambil dari PostgreSQL terlebih dahulu
    try {
      const rows = await query<any>(
        'SELECT * FROM tasks ORDER BY sequence ASC'
      );

      if (rows && rows.length > 0) {
        const formattedTasks: TaskItemData[] = rows.map((r) => ({
          id: r.id,
          sequence: r.sequence || 1,
          title: r.title,
          description: r.description || '',
          layer: r.layer,
          status: r.status,
          priority: r.priority || 'medium',
          estimated_complexity: r.estimated_complexity || 'medium',
          acceptance_criteria: Array.isArray(r.acceptance_criteria)
            ? r.acceptance_criteria
            : typeof r.acceptance_criteria === 'string'
            ? JSON.parse(r.acceptance_criteria)
            : [],
          ai_context: typeof r.ai_context === 'string' ? JSON.parse(r.ai_context) : (r.ai_context || {}),
        }));

        return NextResponse.json({
          success: true,
          projectId,
          tasks: formattedTasks,
          source: 'postgres',
        });
      }
    } catch (dbErr) {
      console.warn('Gagal membaca task dari PostgreSQL, fallback ke memory:', dbErr);
    }

    return NextResponse.json({
      success: true,
      projectId,
      tasks: INITIAL_TASKS,
      source: 'initial',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    let tasks: TaskItemData[] = [];

    if (body.generateWithAI && body.prd && body.roadmap) {
      // Panggil AI Model (ai-builder) secara live
      tasks = await generateTasksFromRoadmap({
        prd: body.prd,
        roadmap: body.roadmap,
      });

      // Simpan ke PostgreSQL jika koneksi aktif
      try {
        // Cek apakah projectId adalah UUID valid dan terdaftar di database
        let dbProjectId = projectId;
        const checkProj = await query<{ id: string }>('SELECT id FROM projects WHERE id = $1', [projectId]).catch(() => []);
        if (!checkProj || checkProj.length === 0) {
          const firstProj = await query<{ id: string }>('SELECT id FROM projects ORDER BY created_at DESC LIMIT 1');
          dbProjectId = firstProj[0]?.id || '00000000-0000-0000-0000-000000000001';
        }

        // Bersihkan tasks lama untuk project ini
        await query('DELETE FROM tasks WHERE project_id = $1', [dbProjectId]);

        for (const t of tasks) {
          await query(
            `INSERT INTO tasks (
              project_id, title, description, layer, status, priority, sequence,
              acceptance_criteria, estimated_complexity, ai_context
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              dbProjectId,
              t.title,
              t.description,
              t.layer,
              t.status || 'TODO',
              t.priority || 'medium',
              t.sequence || 1,
              JSON.stringify(t.acceptance_criteria || []),
              t.estimated_complexity || 'medium',
              JSON.stringify(t.ai_context || {}),
            ]
          );
        }
      } catch (dbErr: any) {
        console.warn('Gagal menyimpan task hasil AI ke PostgreSQL:', dbErr.message);
      }
    } else {
      tasks = body.tasks || INITIAL_TASKS;
    }

    return NextResponse.json({
      success: true,
      projectId,
      tasks,
    });
  } catch (error: any) {
    console.error('API Tasks Generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan Tasks dengan model AI' },
      { status: 500 }
    );
  }
}
