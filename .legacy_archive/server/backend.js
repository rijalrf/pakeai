const http = require('http');
const { parse: parseUrl } = require('url');
const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Muat .env.local jika ada
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    }
  }
} catch (e) {}

const PORT = parseInt(process.env.BE_PORT || '6655', 10);
const FE_PORT = parseInt(process.env.FE_PORT || '3455', 10);
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/project_ai_planner';
const AI_MODEL = process.env.OPENAI_MODEL || 'ai-builder';
const AI_BASE_URL = process.env.OPENAI_BASE_URL || 'http://localhost:20128/v1';
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || `http://localhost:${FE_PORT}`;

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL unexpected pool error:', err);
});

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function notifyProjectChange(projectId, payload) {
  if (!projectId) return;
  const channel = `project_${projectId.replace(/-/g, '_')}`;
  try {
    await pool.query('SELECT pg_notify($1, $2)', [channel, JSON.stringify(payload)]);
  } catch (err) {
    console.error('Gagal mengirim pg_notify:', err.message);
  }
}

async function authenticateToken(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Authorization header Bearer pak_... wajib disertakan.' };
  }
  const token = auth.replace('Bearer ', '').trim();
  if (!token.startsWith('pak_')) {
    return { authenticated: false, error: 'Token harus berawalan "pak_".' };
  }

  try {
    const hashed = hashToken(token);
    const result = await pool.query(
      'SELECT id, user_id, project_id, is_revoked FROM agent_tokens WHERE token_hash = $1 LIMIT 1',
      [hashed]
    );

    if (result.rows.length === 0) {
      return { authenticated: false, error: 'Token tidak terdaftar dalam database PostgreSQL.' };
    }

    const row = result.rows[0];
    if (row.is_revoked) {
      return { authenticated: false, error: 'Token telah dicabut (revoked).' };
    }

    // Update last_used_at async
    pool.query('UPDATE agent_tokens SET last_used_at = NOW() WHERE id = $1', [row.id]).catch(() => {});

    return {
      authenticated: true,
      userId: row.user_id,
      projectId: row.project_id,
      tokenId: row.id,
    };
  } catch (err) {
    console.error('Error saat autentikasi token:', err);
    return { authenticated: false, error: 'Terjadi kesalahan sistem saat verifikasi token.' };
  }
}

function formatPrompt(task) {
  const criteria = Array.isArray(task.acceptance_criteria)
    ? task.acceptance_criteria
    : typeof task.acceptance_criteria === 'string'
    ? JSON.parse(task.acceptance_criteria)
    : [];
  const aiCtx = typeof task.ai_context === 'string' ? JSON.parse(task.ai_context) : (task.ai_context || {});
  const filesCreate = aiCtx.files_to_create || [];
  const filesModify = aiCtx.files_to_modify || [];

  return `### [TASK ${task.id ? task.id.toString().toUpperCase() : 'NEXT'}] ${task.title}
**Layer**: \`${task.layer}\` | **Priority**: \`${(task.priority || 'medium').toUpperCase()}\` | **Sequence**: #${task.sequence || 1}

#### 📋 Deskripsi & Instruksi Eksekusi
${aiCtx.instructions || task.description}

#### 🎯 Target Files
- **Buat Baru**: ${filesCreate.length > 0 ? filesCreate.map((f) => `\`${f}\``).join(', ') : 'None'}
- **Modifikasi**: ${filesModify.length > 0 ? filesModify.map((f) => `\`${f}\``).join(', ') : 'None'}

#### ✅ Kriteria Penerimaan (Acceptance Criteria)
${criteria.map((c, i) => `${i + 1}. [ ] ${c}`).join('\n')}

#### 🧪 Kriteria Pengujian
> ${aiCtx.test_criteria || 'Uji unit test dan compile TypeScript'}

#### 🛡️ Bounded Context Rules
- Hanya kerjakan file yang tercantum dalam targetFiles.
- Jangan memodifikasi skema atau API di luar lingkup layer task ini.`;
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = parseUrl(req.url || '', true);
  const pathname = parsed.pathname || '';
  const method = req.method || 'GET';

  // 1. Health & Database Check
  if (pathname === '/' || pathname === '/health' || pathname === '/api/health') {
    let dbStatus = 'disconnected';
    try {
      const dbRes = await pool.query('SELECT current_database() as db, current_user as usr');
      dbStatus = `connected (db: ${dbRes.rows[0].db}, user: ${dbRes.rows[0].usr})`;
    } catch (e) {
      dbStatus = `error: ${e.message}`;
    }

    return sendJson(res, 200, {
      status: 'ok',
      service: 'Project AI Planner — Dedicated Backend API (Port 6655)',
      port: PORT,
      frontendUrl: `http://localhost:${FE_PORT}`,
      database: dbStatus,
      aiBrain: {
        model: AI_MODEL,
        baseUrl: AI_BASE_URL,
        status: 'active',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Agent Auth Endpoint
  if (pathname === '/api/agent/auth' && method === 'POST') {
    const auth = await authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    // Ambil project yang terikat dengan token ini
    let activeProject = null;
    if (auth.projectId) {
      const projRes = await pool.query(
        'SELECT id, name, description FROM projects WHERE id = $1 LIMIT 1',
        [auth.projectId]
      );
      activeProject = projRes.rows[0];
    }

    if (!activeProject) {
      const projRes = await pool.query(
        'SELECT id, name, description FROM projects WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [auth.userId]
      );
      activeProject = projRes.rows[0] || {
        id: 'default-project',
        name: 'Workspace Project',
        description: 'Proyek pengembangan sistem.',
      };
    }

    return sendJson(res, 200, {
      success: true,
      message: `Autentikasi PAT Berhasil via PostgreSQL (Port ${PORT}).`,
      user: { id: auth.userId },
      activeProject,
    });
  }

  // 3. Agent Tasks: Next Available Task from PostgreSQL (Filtered by Project)
  if (pathname === '/api/agent/tasks/next' && method === 'GET') {
    const auth = await authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    const projectId = auth.projectId;
    if (!projectId) {
      return sendJson(res, 400, {
        success: false,
        error: 'Token agent belum terikat ke proyek spesifik. Buat token baru di menu Pengaturan Proyek.',
      });
    }

    // Cek task IN_PROGRESS pada project ini
    const inProgressRes = await pool.query(
      `SELECT * FROM tasks WHERE project_id = $1 AND status = 'IN_PROGRESS' ORDER BY sequence ASC LIMIT 1`,
      [projectId]
    );

    if (inProgressRes.rows.length > 0) {
      const inProgress = inProgressRes.rows[0];
      return sendJson(res, 200, {
        success: true,
        hasTask: true,
        status: 'IN_PROGRESS',
        task: inProgress,
        markdownPrompt: formatPrompt(inProgress),
        message: 'Melanjutkan task yang sedang berjalan.',
      });
    }

    // Ambil task TODO berikutnya pada project ini
    const nextRes = await pool.query(
      `SELECT * FROM tasks WHERE project_id = $1 AND status = 'TODO' ORDER BY sequence ASC LIMIT 1`,
      [projectId]
    );

    if (nextRes.rows.length === 0) {
      return sendJson(res, 200, {
        success: true,
        hasTask: false,
        message: 'Semua task dalam proyek ini telah selesai dikerjakan.',
      });
    }

    const nextTask = nextRes.rows[0];
    return sendJson(res, 200, {
      success: true,
      hasTask: true,
      status: 'TODO',
      task: nextTask,
      markdownPrompt: formatPrompt(nextTask),
    });
  }

  // 4. Start Task
  const startMatch = pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/start$/);
  if (startMatch && method === 'POST') {
    const auth = await authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    const taskId = startMatch[1];
    const projectId = auth.projectId;

    const updateRes = await pool.query(
      `UPDATE tasks
       SET status = 'IN_PROGRESS',
           started_at = NOW(),
           updated_at = NOW()
       WHERE (id::text = $1 OR sequence::text = $1)
         ${projectId ? 'AND project_id = $2' : ''}
       RETURNING id, sequence, title, layer, status, project_id`,
      projectId ? [taskId, projectId] : [taskId]
    );

    if (updateRes.rows.length === 0) {
      return sendJson(res, 404, { success: false, error: 'Task tidak ditemukan dalam proyek Anda.' });
    }

    const task = updateRes.rows[0];

    // Kirim notifikasi realtime via PostgreSQL
    await notifyProjectChange(task.project_id, {
      type: 'TASK_UPDATED',
      taskId: task.id,
      sequence: task.sequence,
      status: 'IN_PROGRESS',
      title: task.title,
    });

    return sendJson(res, 200, {
      success: true,
      taskId: task.id,
      status: 'IN_PROGRESS',
      message: `Task #${task.sequence} berstatus IN_PROGRESS di PostgreSQL (Backend 6655).`,
    });
  }

  // 5. Complete Task
  const completeMatch = pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/complete$/);
  if (completeMatch && method === 'POST') {
    const auth = await authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    const taskId = completeMatch[1];
    const projectId = auth.projectId;

    const updateRes = await pool.query(
      `UPDATE tasks
       SET status = 'DONE',
           completed_at = NOW(),
           updated_at = NOW()
       WHERE (id::text = $1 OR sequence::text = $1)
         ${projectId ? 'AND project_id = $2' : ''}
       RETURNING id, sequence, title, layer, status, project_id`,
      projectId ? [taskId, projectId] : [taskId]
    );

    if (updateRes.rows.length === 0) {
      return sendJson(res, 404, { success: false, error: 'Task tidak ditemukan dalam proyek Anda.' });
    }

    const task = updateRes.rows[0];
    const layer = task.layer || 'BACKEND';

    // Kirim notifikasi realtime via PostgreSQL
    await notifyProjectChange(task.project_id, {
      type: 'TASK_UPDATED',
      taskId: task.id,
      sequence: task.sequence,
      status: 'DONE',
      title: task.title,
    });

    // Cek apakah seluruh task dalam layer ini pada project terkait sudah selesai
    const remainingRes = await pool.query(
      `SELECT COUNT(*) as remaining FROM tasks WHERE project_id = $1 AND layer = $2 AND status != 'DONE'`,
      [task.project_id, layer]
    );
    const allDone = parseInt(remainingRes.rows[0]?.remaining || '0', 10) === 0;

    return sendJson(res, 200, {
      success: true,
      taskId: task.id,
      status: 'DONE',
      layer,
      layerCompleted: allDone,
      checkpointNotice: allDone
        ? `Seluruh task layer ${layer} telah selesai di PostgreSQL. Human Checkpoint Gate aktif di Web UI (http://localhost:${FE_PORT}).`
        : null,
    });
  }

  // 6. Context
  const contextMatch = pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/context$/);
  if (contextMatch && method === 'GET') {
    const auth = await authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    const taskId = contextMatch[1];
    const projectId = auth.projectId;

    const taskRes = await pool.query(
      `SELECT * FROM tasks
       WHERE (id::text = $1 OR sequence::text = $1)
         ${projectId ? 'AND project_id = $2' : ''}
       LIMIT 1`,
      projectId ? [taskId, projectId] : [taskId]
    );

    if (taskRes.rows.length === 0) {
      return sendJson(res, 404, { success: false, error: 'Task tidak ditemukan dalam proyek Anda.' });
    }

    const task = taskRes.rows[0];

    return sendJson(res, 200, {
      success: true,
      taskId: task.id,
      markdownPrompt: formatPrompt(task),
    });
  }

  // 404
  return sendJson(res, 404, {
    error: `Endpoint ${method} ${pathname} tidak ditemukan di Backend Port ${PORT}.`,
  });
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`Project AI Planner — Dedicated Backend Server`);
  console.log(`   Backend API : http://localhost:${PORT}`);
  console.log(`   Frontend Web: http://localhost:${FE_PORT}`);
  console.log(`   Database    : ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  console.log(`   AI Brain    : ${AI_MODEL} @ ${AI_BASE_URL}`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`=============================================================\n`);
});
