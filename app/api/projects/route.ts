import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

export async function GET() {
  try {
    const projects = await query('SELECT * FROM projects ORDER BY created_at DESC');
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, idea, projectType, stacks } = body;

    // Ambil default user
    const users = await query('SELECT id FROM profiles LIMIT 1');
    const userId = users[0]?.id || '00000000-0000-0000-0000-000000000001';

    // Insert project ke PostgreSQL
    const res = await query(
      `INSERT INTO projects (user_id, name, description, idea, project_type, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        name,
        description || idea?.slice(0, 140) || 'Project Software',
        idea || '',
        projectType || 'Web Application',
        'discovery',
      ]
    );

    const newProject = res[0];

    // Simpan stacks jika ada
    if (stacks && Array.isArray(stacks)) {
      for (const s of stacks) {
        await query(
          'INSERT INTO project_stacks (project_id, category, technology) VALUES ($1, $2, $3)',
          [newProject.id, s.category || 'tech', s.technology || 'general']
        );
      }
    }

    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (error: any) {
    console.warn('Gagal menyimpan project baru ke PostgreSQL:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
