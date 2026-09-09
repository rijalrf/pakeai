import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const projects = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('Gagal mengambil daftar proyek:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, idea, projectType, stacks } = body || {};

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Nama proyek wajib diisi.' }, { status: 400 });
    }

    // Insert project ke PostgreSQL terikat ke user.id
    const res = await query<any>(
      `INSERT INTO projects (user_id, name, description, idea, project_type, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user.id,
        name.trim(),
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
    console.error('Gagal menyimpan project baru ke PostgreSQL:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
