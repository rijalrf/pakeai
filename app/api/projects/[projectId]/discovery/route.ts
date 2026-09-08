import { NextResponse } from 'next/server';
import { generateDiscoveryQuestions } from '@/lib/ai/discovery';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const questions = await generateDiscoveryQuestions({
      idea: body.idea || 'Aplikasi software',
      projectType: body.projectType || 'Web Application',
      stacks: body.stacks || [],
      skillLevel: body.skillLevel || 'intermediate',
    });

    return NextResponse.json({
      success: true,
      projectId,
      questions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal generate pertanyaan discovery' },
      { status: 500 }
    );
  }
}
