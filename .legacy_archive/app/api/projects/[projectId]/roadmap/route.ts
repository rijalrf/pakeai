import { NextResponse } from 'next/server';
import { generateRoadmapFromPRD, FALLBACK_ROADMAP } from '@/lib/ai/roadmap';
import { FALLBACK_PRD } from '@/lib/ai/prd';
import { reviewRoadmap, persistReview } from '@/lib/ai/reviewer';
import { executeWithTracking } from '@/lib/ai/ai-tracking';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { projectId } = await params;
    const body = await request.json();

    const prd = body.prd || FALLBACK_PRD;

    // 1. Generate Roadmap dengan tracking token
    let roadmap = await executeWithTracking(
      {
        stage: 'roadmap',
        projectId,
        userId: user?.id,
      },
      async () => {
        return await generateRoadmapFromPRD(prd);
      }
    );

    // 2. Evaluasi via AI Reviewer Layer (Cek siklus DAG, urutan layer, kelengkapan)
    let reviewResult = await reviewRoadmap(roadmap, prd);
    let autoFixed = false;

    // 3. Auto-fix 1x jika skor di bawah 70 atau ada isu sirkular/kritis
    if (reviewResult.score < 70 || reviewResult.verdict === 'fail') {
      try {
        const issuesSummary = reviewResult.issues.map((i) => i.message).join('; ');
        const patchedPrd = {
          ...prd,
          problem_statement: `${prd.problem_statement}. CATATAN PERBAIKAN GRAF DEPENDENSI: Pastikan tidak ada circular dependency dan urutan layer mutlak: DATABASE -> BACKEND -> FRONTEND. Isu sebelumnya: ${issuesSummary}`,
        };

        roadmap = await executeWithTracking(
          {
            stage: 'roadmap-autofix',
            projectId,
            userId: user?.id,
          },
          async () => {
            return await generateRoadmapFromPRD(patchedPrd);
          }
        );

        reviewResult = await reviewRoadmap(roadmap, prd);
        autoFixed = true;
      } catch (fixErr) {
        console.warn('Gagal melakukan auto-fix Roadmap, melanjutkan dengan versi awal:', fixErr);
      }
    }

    // 4. Simpan hasil review ke database
    await persistReview(projectId, 'roadmap', reviewResult, autoFixed);

    return NextResponse.json({
      success: true,
      projectId,
      roadmap,
      review: reviewResult,
      autoFixed,
    });
  } catch (error: any) {
    console.error('API Roadmap Generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan Roadmap dengan model AI' },
      { status: 500 }
    );
  }
}
