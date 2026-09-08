import http from 'node:http';
import { parse as parseUrl } from 'node:url';
import crypto from 'node:crypto';
import { INITIAL_TASKS } from '../lib/ai/tasks';
import { buildAgentTaskContext, formatAgentMarkdownPrompt } from '../lib/ai/context';
import { INITIAL_CHECKPOINTS } from '../lib/agent/checkpoints';

const PORT = parseInt(process.env.BE_PORT || '6655', 10);

// In-memory runtime state for backend API
let tasks = [...INITIAL_TASKS];
let checkpoints = [...INITIAL_CHECKPOINTS];

function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function authenticateToken(req: http.IncomingMessage): { authenticated: boolean; error?: string } {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Authorization header Bearer pak_... wajib disertakan.' };
  }
  const token = auth.replace('Bearer ', '').trim();
  if (!token.startsWith('pak_')) {
    return { authenticated: false, error: 'Token harus berawalan "pak_".' };
  }
  return { authenticated: true };
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

  // 1. Health & Root Check
  if (pathname === '/' || pathname === '/health' || pathname === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'Project AI Planner — Dedicated Backend Engine',
      port: PORT,
      frontendUrl: 'http://localhost:3455',
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Agent Auth Endpoint
  if (pathname === '/api/agent/auth' && method === 'POST') {
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }
    return sendJson(res, 200, {
      success: true,
      message: 'Autentikasi PAT Berhasil pada Backend Port 6655.',
      user: { id: 'dev-user-001' },
      activeProject: {
        id: 'demo-futsal-project',
        name: 'Aplikasi Booking Lapangan Futsal',
        description: 'Platform reservasi lapangan olahraga real-time dengan hold slot 15 menit dan QRIS.',
      },
    });
  }

  // 3. Agent Tasks: Next Available Task
  if (pathname === '/api/agent/tasks/next' && method === 'GET') {
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    // Cek task IN_PROGRESS terlebih dahulu
    const inProgress = tasks.find((t) => t.status === 'IN_PROGRESS');
    if (inProgress) {
      const context = buildAgentTaskContext(
        inProgress,
        'Aplikasi Booking Lapangan Futsal',
        'Platform reservasi lapangan olahraga real-time.'
      );
      return sendJson(res, 200, {
        success: true,
        hasTask: true,
        status: 'IN_PROGRESS',
        task: inProgress,
        context,
        markdownPrompt: formatAgentMarkdownPrompt(context),
        message: 'Melanjutkan task yang sedang berjalan.',
      });
    }

    // Ambil task TODO berikutnya yang dependensinya selesai
    const nextTask = tasks.find((t) => {
      if (t.status !== 'TODO') return false;
      if (!t.depends_on_task_ids || t.depends_on_task_ids.length === 0) return true;
      return t.depends_on_task_ids.every((depId) => {
        const dep = tasks.find((item) => item.id === depId);
        return dep && dep.status === 'DONE';
      });
    });

    if (!nextTask) {
      return sendJson(res, 200, {
        success: true,
        hasTask: false,
        message: 'Semua task dalam roadmap saat ini telah selesai.',
      });
    }

    const context = buildAgentTaskContext(
      nextTask,
      'Aplikasi Booking Lapangan Futsal',
      'Platform reservasi lapangan olahraga real-time.'
    );

    return sendJson(res, 200, {
      success: true,
      hasTask: true,
      status: 'TODO',
      task: nextTask,
      context,
      markdownPrompt: formatAgentMarkdownPrompt(context),
    });
  }

  // 4. Agent Task: Start
  const startMatch = pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/start$/);
  if (startMatch && method === 'POST') {
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    const taskId = startMatch[1];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      return sendJson(res, 404, { success: false, error: `Task ${taskId} tidak ditemukan.` });
    }

    task.status = 'IN_PROGRESS';
    return sendJson(res, 200, {
      success: true,
      taskId,
      status: 'IN_PROGRESS',
      message: `Task #${taskId} berstatus IN_PROGRESS di backend port 6655.`,
    });
  }

  // 5. Agent Task: Complete
  const completeMatch = pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/complete$/);
  if (completeMatch && method === 'POST') {
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    const taskId = completeMatch[1];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      return sendJson(res, 404, { success: false, error: `Task ${taskId} tidak ditemukan.` });
    }

    task.status = 'DONE';

    const layerTasks = tasks.filter((t) => t.layer === task.layer);
    const allLayerDone = layerTasks.every((t) => t.status === 'DONE');

    return sendJson(res, 200, {
      success: true,
      taskId,
      status: 'DONE',
      layer: task.layer,
      layerCompleted: allLayerDone,
      checkpointNotice: allLayerDone
        ? `Seluruh task layer ${task.layer} telah selesai. Human Checkpoint Gate aktif di UI (http://localhost:3455).`
        : null,
    });
  }

  // 6. Agent Task: Context
  const contextMatch = pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/context$/);
  if (contextMatch && method === 'GET') {
    const auth = authenticateToken(req);
    if (!auth.authenticated) {
      return sendJson(res, 401, { success: false, error: auth.error });
    }

    const taskId = contextMatch[1];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      return sendJson(res, 404, { success: false, error: `Task ${taskId} tidak ditemukan.` });
    }

    const context = buildAgentTaskContext(
      task,
      'Aplikasi Booking Lapangan Futsal',
      'Platform reservasi lapangan olahraga real-time dengan hold slot 15 menit dan QRIS.'
    );

    return sendJson(res, 200, {
      success: true,
      taskId,
      context,
      markdownPrompt: formatAgentMarkdownPrompt(context),
    });
  }

  // 7. Tasks list for web frontend
  if (pathname.startsWith('/api/projects/') && pathname.endsWith('/tasks') && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      tasks,
    });
  }

  // 8. Checkpoints list
  if (pathname === '/api/checkpoints' && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      checkpoints,
    });
  }

  // Default 404
  return sendJson(res, 404, {
    error: `Endpoint ${method} ${pathname} tidak ditemukan di Backend Port 6655.`,
  });
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 Project AI Planner — Backend API Server`);
  console.log(`   Backend URL : http://localhost:${PORT}`);
  console.log(`   Frontend URL: http://localhost:3455`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`=============================================================\n`);
});
