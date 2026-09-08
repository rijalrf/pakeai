import { NextResponse } from 'next/server';
import { generateRoadmapFromPRD, FALLBACK_ROADMAP } from '@/lib/ai/roadmap';
import { FALLBACK_PRD } from '@/lib/ai/prd';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const prd = body.prd || FALLBACK_PRD;
    const roadmap = await generateRoadmapFromPRD(prd);

    return NextResponse.json({
      success: true,
      projectId,
      roadmap,
    });
  } catch (error: any) {
    console.error('API Roadmap Generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan Roadmap dengan model AI' },
      { status: 500 }
    );
  }
}
