import { NextResponse } from 'next/server';
import { generatePRDFromDiscovery, FALLBACK_PRD } from '@/lib/ai/prd';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const prd = await generatePRDFromDiscovery({
      idea: body.idea || 'Software MVP',
      projectType: body.projectType || 'Web Application',
      stacks: body.stacks || [],
      answers: body.answers || {},
    });

    return NextResponse.json({
      success: true,
      projectId,
      prd,
    });
  } catch (error: any) {
    console.error('API PRD Generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyusun PRD dengan model AI' },
      { status: 500 }
    );
  }
}
