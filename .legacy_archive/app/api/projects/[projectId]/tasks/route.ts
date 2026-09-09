import { NextResponse } from 'next/server';
import { INITIAL_TASKS, type TaskItemData } from '@/lib/ai/tasks';
import { generateTasksFromRoadmap } from '@/lib/ai/tasks-generator';
import { reviewTasks, persistReview } from '@/lib/ai/reviewer';
import { executeWithTracking } from '@/lib/ai/ai-tracking';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth/session';

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

async function verifyProjectOwnership(projectId: string, userId: string): Promise<boolean> {
  if (!isValidUUID(projectId)) {
    // Project ID berbasis client store (misal proj-1788944058447 atau futsal-booking-01)
    return true;
  }
  const rows = await query<any>(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2 LIMIT 1',
    [projectId, userId]
  );
  return rows.length > 0;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { projectId } = await context.params;
    const hasAccess = await verifyProjectOwnership(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Proyek tidak ditemukan atau akses ditolak.' },
        { status: 404 }
      );
    }

    const isUuid = isValidUUID(projectId);

    if (isUuid) {
      const rows = await query<any>(
        'SELECT * FROM tasks WHERE project_id = $1 ORDER BY sequence ASC',
        [projectId]
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
          ai_context: typeof r.ai_context === 'string' ? JSON.parse(r.ai_context) : r.ai_context || {},
        }));

        return NextResponse.json({
          success: true,
          projectId,
          tasks: formattedTasks,
          source: 'postgres',
        });
      }
    }

    // Jika belum ada task di database untuk proyek demo
    if (projectId === '00000000-0000-0000-0000-000000000002' || projectId === 'futsal-booking-01') {
      return NextResponse.json({
        success: true,
        projectId,
        tasks: INITIAL_TASKS,
        source: 'initial',
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      tasks: [],
      source: isUuid ? 'postgres' : 'client_store',
    });
  } catch (error: any) {
    console.error('Error saat mengambil tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { projectId } = await context.params;
    const isUuid = isValidUUID(projectId);
    const hasAccess = await verifyProjectOwnership(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Proyek tidak ditemukan atau akses ditolak.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    let tasks: TaskItemData[] = [];
    let reviewResult = null;
    let autoFixed = false;

    if (body.generateWithAI && body.prd && body.roadmap) {
      // 1. Generate Tasks dengan tracking
      tasks = await executeWithTracking(
        {
          stage: 'tasks',
          projectId,
          userId: user.id,
        },
        async () => {
          return await generateTasksFromRoadmap({
            prd: body.prd,
            roadmap: body.roadmap,
          });
        }
      );

      // 2. Evaluasi via AI Reviewer Layer (Cek Bounded Context & Kriteria Uji)
      reviewResult = await reviewTasks(tasks, body.roadmap);

      // 3. Auto-fix 1x jika review mendeteksi isu kritis bounded context / skor < 70
      if (reviewResult.score < 70 || reviewResult.verdict === 'fail') {
        try {
          const issuesSummary = reviewResult.issues.map((i) => i.message).join('; ');
          const patchedRoadmap = {
            ...body.roadmap,
            phases: body.roadmap.phases.map((p: any) => ({
              ...p,
              description: `${p.description || ''}. CATATAN BOUNDED CONTEXT: Jangan sentuh file konfigurasi sensitif (.env, prisma, migrations), sertakan test_criteria terukur. Isu: ${issuesSummary}`,
            })),
          };

          tasks = await executeWithTracking(
            {
              stage: 'tasks-autofix',
              projectId,
              userId: user.id,
            },
            async () => {
              return await generateTasksFromRoadmap({
                prd: body.prd,
                roadmap: patchedRoadmap,
              });
            }
          );

          reviewResult = await reviewTasks(tasks, body.roadmap);
          autoFixed = true;
        } catch (fixErr) {
          console.warn('Gagal melakukan auto-fix Tasks, menggunakan hasil awal:', fixErr);
        }
      }

      // 4. Simpan review ke database jika UUID
      if (reviewResult && isUuid) {
        await persistReview(projectId, 'tasks', reviewResult, autoFixed);
      }

      // 5. Bersihkan tasks lama dan simpan tasks baru jika UUID
      if (isUuid) {
        await query('DELETE FROM tasks WHERE project_id = $1', [projectId]);

        for (const t of tasks) {
          await query(
            `INSERT INTO tasks (
              project_id, title, description, layer, status, priority, sequence,
              acceptance_criteria, estimated_complexity, ai_context
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              projectId,
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
      }
    } else if (body.tasks && Array.isArray(body.tasks)) {
      tasks = body.tasks;
    }

    return NextResponse.json({
      success: true,
      projectId,
      tasks,
      review: reviewResult,
      autoFixed,
    });
  } catch (error: any) {
    console.error('API Tasks Generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan Tasks dengan model AI' },
      { status: 500 }
    );
  }
}
