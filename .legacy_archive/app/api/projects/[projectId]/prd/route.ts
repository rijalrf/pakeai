import { NextResponse } from 'next/server';
import { generatePRDFromDiscovery } from '@/lib/ai/prd';
import { reviewPRD, persistReview } from '@/lib/ai/reviewer';
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

    const idea = body.idea || 'Software MVP';
    const projectType = body.projectType || 'Web Application';
    const stacks = body.stacks || [];
    const answers = body.answers || {};

    // 1. Generate PRD dengan tracking konsumsi token
    let prd = await executeWithTracking(
      {
        stage: 'prd',
        projectId,
        userId: user?.id,
      },
      async () => {
        return await generatePRDFromDiscovery({
          idea,
          projectType,
          stacks,
          answers,
        });
      }
    );

    // 2. Evaluasi via AI Reviewer Layer
    let reviewResult = await reviewPRD(prd, { idea, projectType, stacks });
    let autoFixed = false;

    // 3. Auto-fix 1x jika skor di bawah 70 atau berstatus fail
    if (reviewResult.score < 70 || reviewResult.verdict === 'fail') {
      try {
        const fixPrompt = `Perbaiki dokumen PRD berikut untuk mengatasi isu-isu teridentifikasi: ${reviewResult.issues
          .map((i) => i.message)
          .join('; ')}`;

        prd = await executeWithTracking(
          {
            stage: 'prd-autofix',
            projectId,
            userId: user?.id,
          },
          async () => {
            return await generatePRDFromDiscovery({
              idea: `${idea}. CATATAN PERBAIKAN: ${fixPrompt}`,
              projectType,
              stacks,
              answers,
            });
          }
        );

        reviewResult = await reviewPRD(prd, { idea, projectType, stacks });
        autoFixed = true;
      } catch (fixErr) {
        console.warn('Gagal melakukan auto-fix PRD, melanjutkan dengan versi awal:', fixErr);
      }
    }

    // 4. Simpan hasil review ke database
    await persistReview(projectId, 'prd', reviewResult, autoFixed);

    return NextResponse.json({
      success: true,
      projectId,
      prd,
      review: reviewResult,
      autoFixed,
    });
  } catch (error: any) {
    console.error('API PRD Generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyusun PRD dengan model AI' },
      { status: 500 }
    );
  }
}
