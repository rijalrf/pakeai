// Fungsi AI untuk chat session: replyChat, generateInterviewFromChat, recommendAnswer, dll
import { generateJson, generateText } from './ai-service';
import { ChatMessageSchema, TreeDataSchema, type TreeData, GenerateInterviewSchema, RecommendTechStackSchema } from './schemas';
import z from 'zod';
import crypto from 'node:crypto';
import {
  CHAT_PERSONA_PROMPT,
  GENERATE_INTERVIEW_FROM_CHAT_PROMPT,
  RECOMMEND_INTERVIEW_ANSWER_PROMPT,
  RECOMMEND_TECH_STACK_PROMPT,
  GENERATE_TREE_PROMPT,
} from './prompts';
import { prisma } from '../prisma';

// ===============================================
// REPLY CHAT — AI membalas pesan user
// ===============================================

type AiMessage = { role: 'user' | 'assistant'; content: string };

export async function replyChat(sessionId: string): Promise<{ kind: string; content: string; payload?: unknown }> {
  // Ambil riwayat messages dari DB
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  // Convert ke format OpenAI-compatible (exclude system prompt)
  const aiMessages: AiMessage[] = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // System + history
  const userPrompt = aiMessages.length > 0 ? `Riwayat chat:\n${aiMessages.map(m => `${m.role}: ${m.content}`).join('\n')}` : '';

  try {
    const result = await generateJson({
      system: CHAT_PERSONA_PROMPT,
      user: userPrompt,
      schema: ChatMessageSchema,
      maxRetries: 2,
    });
    return result;
  } catch (err) {
    console.error('Error generateJson chat:', err);
    // Fallback jika JSON parse/retry gagal: kirim teks biasa minta coba lagi
    const fallbackMsg = {
      kind: 'text',
      content: "Maaf, saya mengalami kesalahan. Silakan coba kirim ulang jawaban Anda atau klik tombol 'Coba Lagi'.",
    };
    return fallbackMsg;
  }
}

// ===============================================
// FINALIZE PROJECT DARI CHAT SESSION
// ===============================================

export async function finalizeChatSession(sessionId: string, userId: string): Promise<{ projectId: string }> {
  // 1. Ringkaskan chat -> nama project + summary
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    select: { content: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  const chatText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const finalization = await generateJson({
    system: `Anda adalah Principal Product Architect AI.
Input: Riwayat percakapan chat brainstorming ide aplikasi user.
Tugas:
1. Hasilkan nama project yang menarik, ringkas, dan relevan ("name").
2. Buat ringkasan komprehensif 1-2 paragraf padat ("summary") yang merangkum:
   - Masalah spesifik yang ingin dipecahkan
   - Target pengguna utama
   - Fitur-fitur inti aplikasi (MVP)
   - Entitas/data utama yang dikelola
   - Alur kerja utama aplikasi dari sudut pandang pengguna
Output JSON WAJIB:
{
  "name": "Nama Project",
  "summary": "Ringkasan komprehensif mencakup masalah, pengguna, fitur utama, entitas data, dan alur aplikasi."
}`,
    user: chatText,
    schema: z.object({ name: z.string(), summary: z.string() }),
    maxRetries: 2,
  });

  // 2. Buat project baru (wizardStep = interview karena langkah selanjutnya interview)
  const project = await prisma.project.create({
    data: {
      userId,
      name: finalization.name,
      idea: finalization.summary,
      description: finalization.summary,
      wizardStep: 'interview',
    },
  });

  // 3. Update chatSession jadi finalized & link projectId
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: 'finalized',
      summary: finalization.summary,
      projectId: project.id,
    },
  });

  return { projectId: project.id };
}

// ===============================================
// GENERATE INTERVIEW FROM CHAT
// ===============================================

export async function generateInterviewFromChat(projectId: string): Promise<
  {
    question: string;
    context?: string;
    answer: string;
    options?: string[];
    required?: boolean;
    type?: 'radio' | 'checkbox';
    skipped?: boolean;
  }[]
> {
  const session = await prisma.chatSession.findFirst({
    where: { projectId, status: 'finalized' },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!session) {
    throw new Error('Chat session tidak ditemukan');
  }

  const summary = session.summary || '';
  const messages = session.messages.map(m => `${m.role}: ${m.content}`).join('\n');

  const result = await generateJson({
    system: GENERATE_INTERVIEW_FROM_CHAT_PROMPT,
    user: `Ringkasan ide: ${summary}\n\nRiwayat chat:\n${messages}`,
    schema: GenerateInterviewSchema,
    maxRetries: 2,
  });

  return result.questions;
}

// ===============================================
// RECOMMEND INTERVIEW ANSWER
// ===============================================

export async function recommendInterviewAnswer(projectId: string, question: string): Promise<{ answer: string; reasoning: string }> {
  const session = await prisma.chatSession.findFirst({
    where: { projectId, status: 'finalized' },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  const chatContext = session
    ? session.messages.map((m) => `${m.role}: ${m.content}`).join('\n')
    : '';

  const result = await generateJson({
    system: RECOMMEND_INTERVIEW_ANSWER_PROMPT,
    user: `Pertanyaan: "${question}"\nKonteks chat:\n${chatContext}`,
    schema: z.object({
      question: z.string().optional(),
      answer: z.string(),
      reasoning: z.string(),
    }),
    maxRetries: 2,
  });

  return { answer: result.answer, reasoning: result.reasoning };
}

// ===============================================
// TECH STACK RECOMMENDATION
// ===============================================

export async function recommendTechStack(projectId: string): Promise<{ techStack: string[]; reasoning: string }> {
  const [project, brd] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.brd.findUnique({ where: { projectId } }),
  ]);

  if (!project) throw new Error('Project tidak ditemukan');

  const brdContent = brd?.content ? JSON.stringify(brd.content) : project.idea;

  const result = await generateJson({
    system: RECOMMEND_TECH_STACK_PROMPT,
    user: `Nama aplikasi: ${project.name}\nIde & fitur: ${brdContent}`,
    schema: RecommendTechStackSchema,
    maxRetries: 2,
  });

  return result;
}

// ===============================================
// TREE GENERATION
// ===============================================

export async function generateTreeFromBrd(projectId: string): Promise<{ id: string; parentId: string | null; label: string; kind: string; order: number }[]> {
  const [project, brd] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.brd.findUnique({ where: { projectId } }),
  ]);

  if (!project || !brd) throw new Error('Project atau BRD tidak ditemukan');

  const brdContent = typeof brd.content === 'string' ? brd.content : JSON.stringify(brd.content);

  const treeData = await generateJson({
    system: GENERATE_TREE_PROMPT,
    user: `Nama aplikasi: ${project.name}\nBRD / deskripsi lengkap: ${brdContent}`,
    schema: TreeDataSchema,
    maxRetries: 2,
  });

  // Flatten ke TreeNode dalam satu transaksi
  const flatNodes = flattenTree(treeData, projectId);

  // Hapus node lama dulu (idempotent)
  await prisma.treeNode.deleteMany({ where: { projectId } });

  // Insert semua node baru
  await prisma.treeNode.createMany({
    data: flatNodes,
  });

  return flatNodes;
}

// Helper: recursive flatten dari TreeDataSchema
function flattenTree(data: TreeData, projectId: string) {
  const nodes: Array<{ id: string; projectId: string; parentId: string | null; label: string; kind: string; order: number; createdAt: Date }> = [];
  let orderCounter = 0;

  // App root
  const appNodeId = crypto.randomUUID();
  const appNode = {
    id: appNodeId,
    projectId,
    parentId: null,
    label: data.appName,
    kind: 'app',
    order: orderCounter++,
    createdAt: new Date(),
  };
  nodes.push(appNode);

  function traverseFeatures(features: typeof data.features, parentId: string | null) {
    features.forEach((feature) => {
      const featId = crypto.randomUUID();
      const featureNode = {
        id: featId,
        projectId,
        parentId,
        label: feature.label,
        kind: 'feature',
        order: orderCounter++,
        createdAt: new Date(),
      };
      nodes.push(featureNode);

      if (feature.subfeatures && feature.subfeatures.length > 0) {
        traverseSubFeatures(feature.subfeatures, featId);
      }

      if (feature.tasks && feature.tasks.length > 0) {
        traverseTasks(feature.tasks, featId);
      }
    });
  }

  function traverseSubFeatures(subfeatures: Array<{ label: string; tasks?: Array<{ label: string; subtasks?: Array<{ label: string }> }> }>, parentId: string) {
    subfeatures.forEach((sf) => {
      const sfId = crypto.randomUUID();
      const sfNode = {
        id: sfId,
        projectId,
        parentId,
        label: sf.label,
        kind: 'subfeature',
        order: orderCounter++,
        createdAt: new Date(),
      };
      nodes.push(sfNode);

      if (sf.tasks && sf.tasks.length > 0) {
        traverseTasks(sf.tasks, sfId);
      }
    });
  }

  function traverseTasks(tasks: Array<{ label: string; subtasks?: Array<{ label: string }> }>, parentId: string) {
    tasks.forEach((task) => {
      const taskId = crypto.randomUUID();
      const taskNode = {
        id: taskId,
        projectId,
        parentId,
        label: task.label,
        kind: 'task',
        order: orderCounter++,
        createdAt: new Date(),
      };
      nodes.push(taskNode);

      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((st) => {
          const stId = crypto.randomUUID();
          const stNode = {
            id: stId,
            projectId,
            parentId: taskId,
            label: st.label,
            kind: 'subtask',
            order: orderCounter++,
            createdAt: new Date(),
          };
          nodes.push(stNode);
        });
      }
    });
  }

  traverseFeatures(data.features, appNode.id);
  return nodes;
}
