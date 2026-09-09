// Bootstrap Express untuk pakeai API (port 6655).
// - Mount Better Auth handler SEBELUM express.json() (raw body).
// - CORS dengan credentials agar cookie session dari web terbaca.
// - Endpoint agent diproteksi requireAgent (PAT) + isolasi per project.
import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { requireUser, type AuthedRequest } from './middleware/require-user.js';
import { requireAgent, type AgentRequest } from './middleware/require-agent.js';
import { prisma } from './lib/prisma.js';
import { toolsRegistry } from './tools/registry.js';
import { z } from 'zod';
import crypto from 'node:crypto';
import { generateDiscoveryQuestions, DEFAULT_DISCOVERY_QUESTIONS } from './lib/ai/discovery.js';
import { generateBRDFromDiscovery, BrdSchema } from './lib/ai/brd.js';
import { generateRoadmapFromBRD } from './lib/ai/roadmap.js';
import { generateTasksFromRoadmap } from './lib/ai/tasks.js';

const app = express();
const PORT = Number(process.env.PORT ?? 6655);
const FE_URL = process.env.FE_URL ?? 'http://localhost:3455';

// 1) CORS HARUS paling awal — agar preflight dari browser (OPTIONS) ke /api/auth/* pun kena.
app.use(
  cors({
    origin: FE_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.use(cookieParser());

// 2) Better Auth handler (raw body) — sebelum express.json().
app.all('/api/auth/*', toNodeHandler(auth));

// 3) JSON parser untuk route di bawah.
app.use(express.json({ limit: '1mb' }));

// ============================================================
// Health & meta
// ============================================================
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'pakeai-api', port: PORT, time: new Date().toISOString() });
});

app.get('/api/tools', (_req, res) => {
  res.json({ tools: toolsRegistry });
});

// ============================================================
// Project endpoints (user)
// ============================================================

const CreateProjectBody = z.object({
  name: z.string().min(1).max(120),
  idea: z.string().min(10).max(4000),
});

app.get('/api/projects', requireUser, async (req: AuthedRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, idea: true, status: true, createdAt: true, updatedAt: true },
  });
  res.json({ projects });
});

app.post('/api/projects', requireUser, async (req: AuthedRequest, res) => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Data tidak valid', detail: parsed.error.flatten() });
  }
  const project = await prisma.project.create({
    data: { userId: req.userId, name: parsed.data.name, idea: parsed.data.idea, status: 'ACTIVE' },
  });
  res.status(201).json({ project });
});

app.get('/api/projects/:id', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { stacks: true, brd: true, roadmap: { include: { features: { include: { tasks: true } } } } },
  });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });
  res.json({ project });
});

// ============================================================
// Agent Token (PAT) — user generates untuk project tertentu
// ============================================================

app.post('/api/projects/:id/agent-tokens', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });

  const token = 'pak_' + crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await prisma.agentToken.create({
    data: {
      userId: req.userId,
      projectId: project.id,
      name: (req.body?.name as string) || 'Token CLI',
      tokenHash,
    },
  });
  // Token plaintext HANYA dikembalikan SEKALI di sini. Server hanya simpan hash.
  res.status(201).json({
    id: record.id,
    name: record.name,
    projectId: record.projectId,
    token, // tampilkan 1x, user harus copy
    createdAt: record.createdAt,
  });
});

app.get('/api/projects/:id/agent-tokens', requireUser, async (req: AuthedRequest, res) => {
  const tokens = await prisma.agentToken.findMany({
    where: { projectId: req.params.id, userId: req.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, lastUsedAt: true, isRevoked: true, createdAt: true },
  });
  res.json({ tokens });
});

app.delete('/api/agent-tokens/:tokenId', requireUser, async (req: AuthedRequest, res) => {
  const token = await prisma.agentToken.findFirst({
    where: { id: req.params.tokenId, userId: req.userId },
  });
  if (!token) return res.status(404).json({ error: 'Token tidak ditemukan.' });
  await prisma.agentToken.update({ where: { id: token.id }, data: { isRevoked: true } });
  res.json({ ok: true });
});

// ============================================================
// Agent endpoints (CLI) — dilindungi PAT, terisolasi per project
// ============================================================

app.get('/api/agent/whoami', requireAgent, (req: AgentRequest, res) => {
  res.json({ project: { id: req.agent.projectId, name: req.agent.projectName } });
});

app.get('/api/agent/tasks/next', requireAgent, async (req: AgentRequest, res) => {
  const projectId = req.agent.projectId;

  // Prioritas: ada task IN_PROGRESS? lanjutkan. Kalau tidak, ambil TODO paling kecil order.
  const inProgress = await prisma.task.findFirst({
    where: { projectId, status: 'IN_PROGRESS' },
    orderBy: { order: 'asc' },
  });
  const task = inProgress ?? (await prisma.task.findFirst({
    where: { projectId, status: 'TODO' },
    orderBy: { order: 'asc' },
  }));
  if (!task) {
    return res.json({ hasTask: false, message: 'Tidak ada task TODO tersisa.' });
  }
  res.json({
    hasTask: true,
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      layer: task.layer,
      order: task.order,
      status: task.status,
    },
  });
});

app.post('/api/agent/tasks/:id/start', requireAgent, async (req: AgentRequest, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, projectId: req.agent.projectId },
  });
  if (!task) return res.status(404).json({ error: 'Task tidak ditemukan di project ini.' });
  if (task.status === 'DONE') return res.status(400).json({ error: 'Task sudah selesai.' });

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });
  res.json({ ok: true, taskId: updated.id, status: updated.status });
});

app.post('/api/agent/tasks/:id/complete', requireAgent, async (req: AgentRequest, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, projectId: req.agent.projectId },
  });
  if (!task) return res.status(404).json({ error: 'Task tidak ditemukan di project ini.' });

  // Default: langsung DONE agar loop otonom tidak macet. Kalau reviewFlow aktif -> REVIEW.
  const project = await prisma.project.findUnique({ where: { id: req.agent.projectId } });
  const nextStatus = project?.reviewFlow ? 'REVIEW' : 'DONE';

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: nextStatus, completedAt: nextStatus === 'DONE' ? new Date() : null },
  });

  // Cek apakah layer sudah habis -> buat checkpoint PENDING bila perlu.
  const remainingInLayer = await prisma.task.count({
    where: { projectId: req.agent.projectId, layer: updated.layer, status: { not: 'DONE' } },
  });
  let checkpointCreated = false;
  if (remainingInLayer === 0) {
    await prisma.checkpoint.create({
      data: {
        projectId: req.agent.projectId,
        type: 'LAYER_TRANSITION',
        layer: updated.layer,
        status: 'PENDING',
        message: `Layer ${updated.layer} selesai. Menunggu approval untuk lanjut ke layer berikutnya.`,
      },
    });
    checkpointCreated = true;
  }

  res.json({
    ok: true,
    taskId: updated.id,
    status: updated.status,
    layer: updated.layer,
    checkpointPending: checkpointCreated,
  });
});

app.get('/api/agent/tasks/:id/context', requireAgent, async (req: AgentRequest, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, projectId: req.agent.projectId },
    include: { project: { include: { brd: true } } },
  });
  if (!task) return res.status(404).json({ error: 'Task tidak ditemukan di project ini.' });

  const ctx = task.aiContext as { files_to_create?: string[]; files_to_modify?: string[]; forbidden?: string[] };
  const brd = task.project.brd?.content as Record<string, unknown> | undefined;

  const md = [
    `### [TASK ${task.order}] ${task.title}`,
    ``,
    `**Layer**: ${task.layer}  `,
    `**Project**: ${task.project.name}  `,
    `**Status**: ${task.status}`,
    ``,
    `#### Deskripsi`,
    task.description ?? '_(tidak ada deskripsi)_',
    ``,
    `#### Bounded Context`,
    `- File yang BOLEH dibuat: ${(ctx.files_to_create ?? []).join(', ') || '_tidak ada_'}`,
    `- File yang BOLEH dimodifikasi: ${(ctx.files_to_modify ?? []).join(', ') || '_tidak ada_'}`,
    `- File yang DILARANG: ${(ctx.forbidden ?? []).join(', ') || '_tidak ada_'}`,
    ``,
    `#### Kriteria Penerimaan`,
    ...(((task.acceptanceCriteria as string[]) ?? []).map((c) => `- [ ] ${c}`)),
    ``,
    brd
      ? `#### Ringkasan BRD\n${JSON.stringify(brd, null, 2).slice(0, 2000)}`
      : `#### Ringkasan BRD\n_(belum ada BRD — minta user membuatnya dulu)_`,
  ].join('\n');

  res.json({ ok: true, taskId: task.id, markdown: md });
});

// ============================================================
// Master prompt untuk user copy-paste
// ============================================================
app.get('/api/projects/:id/master-prompt', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { brd: true },
  });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });

  const md = `# Master Prompt — AI Agent Loop untuk "${project.name}"

Anda adalah AI Coding Agent otonom. Tugas Anda: mengeksekusi task task project ini secara berurutan menggunakan CLI \`pakeai\`.

## Identitas Project
- Nama: ${project.name}
- Ide: ${project.idea}
${project.brd ? `- BRD tersedia di project (lihat dashboard)` : `- BRD: BELUM dibuat — minta user membuatnya lewat tool BRD Generator`}

## Setup (jalankan 1x di awal)
1. Install CLI: sudah otomatis via \`npx pakeai\` (tidak perlu install global)
2. Login dengan token di bawah ini:
   \`\`\`
   npx pakeai login {{TOKEN}}
   \`\`\`

## Loop Eksekusi (ulangi sampai tidak ada task tersisa)
Untuk SETIAP task, kerjakan langkah ini PERSIS:

\`\`\`
npx pakeai next        # ambil task berikutnya
npx pakeai start       # tandai IN_PROGRESS
npx pakeai context     # baca Markdown bounded context task aktif
# >>> kerjakan task HANYA pada file yang BOLEH dibuat/dimodifikasi <<<
# >>> hormati file yang DILARANG <<<
npx pakeai done        # tandai selesai
\`\`\`

## Aturan Penting
- **Isolasi project**: agent HANYA boleh membaca task/BRD dari project ini (server menegakkan via token).
- **Bounded context**: hanya sentuh file di \`files_to_create\` / \`files_to_modify\`. DILARANG ubah file di \`forbidden\`.
- **Checkpoint gate**: jika setelah \`done\` ada pesan checkpoint, BERHENTI dan minta approval user sebelum lanjut.
- **Layer transition**: jika layer (DATABASE/BACKEND/FRONTEND) sudah selesai, minta approval user.
- **Jika gagal**: laporkan error apa adanya ke user. JANGAN diam-diam fallback.

## Token Anda
Tempel token di placeholder di bawah SEBELUM menyalin prompt ini.

{{TOKEN}}
`;

  res.json({ projectName: project.name, prompt: md });
});

// ============================================================
// Discovery -> BRD -> Roadmap -> Tasks (F2 & F3)
// ============================================================

// Step 1: user isi ide -> AI generate pertanyaan discovery.
// Bila AI gagal (key invalid / gateway down), fallback ke DEFAULT_DISCOVERY_QUESTIONS.
app.post('/api/projects/:id/discovery/generate', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });

  let questions: { question: string; context?: string }[];
  try {
    questions = await generateDiscoveryQuestions(project.idea);
  } catch (err) {
    console.warn('[discovery] AI gagal generate, fallback default:', (err as Error).message);
    questions = DEFAULT_DISCOVERY_QUESTIONS;
  }

  await prisma.discoveryQuestion.deleteMany({ where: { projectId: project.id } });
  const created = await Promise.all(
    questions.map((q, i) =>
      prisma.discoveryQuestion.create({
        data: { projectId: project.id, order: i + 1, question: q.question, context: q.context },
      }),
    ),
  );
  res.json({ questions: created, aiGenerated: questions !== DEFAULT_DISCOVERY_QUESTIONS });
});

app.get('/api/projects/:id/discovery', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });
  const questions = await prisma.discoveryQuestion.findMany({
    where: { projectId: project.id },
    orderBy: { order: 'asc' },
    include: { answers: true },
  });
  res.json({ questions });
});

app.post('/api/discovery/:qid/answer', requireUser, async (req: AuthedRequest, res) => {
  const schema = z.object({ answer: z.string().min(1).max(4000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Jawaban tidak valid.' });
  const q = await prisma.discoveryQuestion.findUnique({
    where: { id: req.params.qid },
    include: { project: true },
  });
  if (!q || q.project.userId !== req.userId) return res.status(404).json({ error: 'Pertanyaan tidak ditemukan.' });
  await prisma.discoveryAnswer.deleteMany({ where: { questionId: q.id } });
  const ans = await prisma.discoveryAnswer.create({
    data: { questionId: q.id, answer: parsed.data.answer },
  });
  res.status(201).json({ answer: ans });
});

// Step 2: generate BRD dari Q&A + ide.
app.post('/api/projects/:id/brd/generate', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { questions: { include: { answers: true } } },
  });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });
  const qa = project.questions
    .filter((q) => q.answers.length > 0)
    .map((q) => ({ question: q.question, answer: q.answers[0].answer }));
  if (qa.length === 0) {
    return res.status(400).json({ error: 'Jawab minimal 1 pertanyaan discovery dulu.' });
  }
  try {
    const brd = await generateBRDFromDiscovery({ idea: project.idea, questions: qa });
    const existing = await prisma.brd.findUnique({ where: { projectId: project.id } });
    if (existing) {
      const updated = await prisma.brd.update({
        where: { projectId: project.id },
        data: { content: brd, version: existing.version + 1 },
      });
      return res.json({ brd: updated });
    }
    const created = await prisma.brd.create({ data: { projectId: project.id, content: brd } });
    res.status(201).json({ brd: created });
  } catch (err) {
    res.status(502).json({ error: 'AI gagal menghasilkan BRD.', detail: (err as Error).message });
  }
});

app.get('/api/projects/:id/brd', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });
  const brd = await prisma.brd.findUnique({ where: { projectId: project.id } });
  res.json({ brd });
});

// Step 3: roadmap dari BRD.
app.post('/api/projects/:id/roadmap/generate', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { brd: true },
  });
  if (!project?.brd) return res.status(400).json({ error: 'BRD belum ada. Generate BRD dulu.' });
  try {
    const parsed = BrdSchema.parse(project.brd.content);
    const data = await generateRoadmapFromBRD(parsed);

    // Hapus roadmap lama (cascade akan hapus features + deps).
    await prisma.roadmapPhase.deleteMany({ where: { projectId: project.id } });

    const phaseMap = new Map<string, string>(); // tmpId -> realId
    for (const p of data.phases) {
      const created = await prisma.roadmapPhase.create({
        data: { projectId: project.id, order: p.order, title: p.title, description: p.description, layer: p.layer },
      });
      for (const f of p.features) {
        const fcreated = await prisma.roadmapFeature.create({
          data: { phaseId: created.id, title: f.title, description: f.description },
        });
        phaseMap.set(f.id, fcreated.id);
      }
    }
    for (const p of data.phases) {
      for (const f of p.features) {
        if (f.dependsOn.length === 0) continue;
        const fromId = phaseMap.get(f.id);
        if (!fromId) continue;
        for (const dep of f.dependsOn) {
          const toId = phaseMap.get(dep);
          if (!toId) continue;
          await prisma.roadmapDependency.create({ data: { featureId: fromId, dependsOnId: toId } });
        }
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'AI gagal menghasilkan roadmap.', detail: (err as Error).message });
  }
});

app.get('/api/projects/:id/roadmap', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      roadmap: {
        orderBy: { order: 'asc' },
        include: {
          features: {
            include: { dependencies: { include: { dependsOn: true } }, tasks: true },
          },
        },
      },
    },
  });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });
  res.json({ phases: project.roadmap });
});

// Step 4: generate atomic tasks dari roadmap.
app.post('/api/projects/:id/tasks/generate', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      roadmap: { include: { features: { include: { dependencies: true } } } },
    },
  });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });
  if (project.roadmap.length === 0) return res.status(400).json({ error: 'Roadmap belum ada.' });

  // Konversi Prisma ke shape yang dipahami AI generator.
  const featureIdMap = new Map<string, string>(); // dbId -> tmpId
  const featuresForAI: { id: string; title: string; description?: string; layer: string; dependsOn: string[] }[] = [];
  let tmpCounter = 1;
  for (const phase of project.roadmap) {
    for (const f of phase.features) {
      const tmpId = `f${tmpCounter++}`;
      featureIdMap.set(f.id, tmpId);
      featuresForAI.push({
        id: tmpId,
        title: f.title,
        description: f.description ?? undefined,
        layer: phase.layer,
        dependsOn: f.dependencies.map((d) => featureIdMap.get(d.dependsOnId) ?? '').filter(Boolean),
      });
    }
  }
  const phasesForAI = project.roadmap.map((p) => ({
    order: p.order,
    title: p.title,
    description: p.description ?? undefined,
    layer: p.layer as 'DATABASE' | 'BACKEND' | 'FRONTEND' | 'INTEGRATION',
    features: featuresForAI
      .filter((f) => project.roadmap.find((rp) => rp.features.find((rf) => featureIdMap.get(rf.id) === f.id))?.id === p.id)
      .map((f) => ({ id: f.id, title: f.title, description: f.description, dependsOn: f.dependsOn })),
  }));

  try {
    const generated = await generateTasksFromRoadmap({
      roadmap: { phases: phasesForAI },
      projectName: project.name,
    });

    // Hapus tasks lama, tulis ulang.
    await prisma.task.deleteMany({ where: { projectId: project.id } });

    let order = 1;
    for (const t of generated) {
      // Cari db feature yang punya tmpId = t.featureId
      let dbFeatureId: string | undefined;
      for (const [dbId, tmpId] of featureIdMap.entries()) {
        if (tmpId === t.featureId) {
          dbFeatureId = dbId;
          break;
        }
      }
      await prisma.task.create({
        data: {
          projectId: project.id,
          featureId: dbFeatureId,
          title: t.title,
          description: t.description,
          layer: t.layer,
          status: 'TODO',
          order: order++,
          aiContext: {
            files_to_create: t.files_to_create,
            files_to_modify: t.files_to_modify,
            forbidden: t.forbidden,
          },
          acceptanceCriteria: t.acceptanceCriteria,
        },
      });
    }
    res.json({ ok: true, count: generated.length });
  } catch (err) {
    res.status(502).json({ error: 'AI gagal menghasilkan tasks.', detail: (err as Error).message });
  }
});

// Kanban list + update status (user side; agent pakai endpoint agent).
app.get('/api/projects/:id/tasks', requireUser, async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Project tidak ditemukan.' });
  const tasks = await prisma.task.findMany({
    where: { projectId: project.id },
    orderBy: { order: 'asc' },
  });
  res.json({ tasks });
});

app.patch('/api/tasks/:taskId', requireUser, async (req: AuthedRequest, res) => {
  const schema = z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).optional(),
    blockedReason: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Data tidak valid.' });
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId }, include: { project: true } });
  if (!task || task.project.userId !== req.userId) return res.status(404).json({ error: 'Task tidak ditemukan.' });
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...parsed.data,
      completedAt: parsed.data.status === 'DONE' ? new Date() : task.completedAt,
    },
  });
  res.json({ task: updated });
});

// ============================================================
// Checkpoint (approval layer transition)
// ============================================================
app.get('/api/projects/:id/checkpoints', requireUser, async (req: AuthedRequest, res) => {
  const items = await prisma.checkpoint.findMany({
    where: { projectId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ checkpoints: items });
});

app.post('/api/checkpoints/:id/approve', requireUser, async (req: AuthedRequest, res) => {
  const cp = await prisma.checkpoint.findUnique({ where: { id: req.params.id }, include: { project: true } });
  if (!cp) return res.status(404).json({ error: 'Checkpoint tidak ditemukan.' });
  if (cp.project.userId !== req.userId) return res.status(403).json({ error: 'Bukan project Anda.' });
  const updated = await prisma.checkpoint.update({
    where: { id: cp.id },
    data: { status: 'APPROVED', resolvedAt: new Date() },
  });
  res.json({ ok: true, checkpoint: updated });
});

// ============================================================
// Start
// ============================================================
app.listen(PORT, () => {
  console.log(`[pakeai-api] listening on http://localhost:${PORT}`);
  console.log(`[pakeai-api] CORS origin: ${FE_URL}`);
  console.log(`[pakeai-api] Better Auth baseURL: ${process.env.BETTER_AUTH_URL}`);
});
