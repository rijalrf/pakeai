// Schema Zod untuk validasi output AI
import { z } from 'zod';

// ===============================================
// Chat Reply Schema — bentuk pesan AI dalam chat
// ===============================================

export const FormQuestionSchema = z.object({
  id: z.string().optional().default(() => Math.random().toString(36).substring(7)),
  label: z.string().optional(),
  question: z.string().optional(),
  type: z.enum(['radio', 'checkbox']).optional().default('radio'),
  options: z.array(z.string()).default([]),
  allowOther: z.boolean().optional().default(true),
}).transform((q) => ({
  id: q.id || Math.random().toString(36).substring(7),
  label: q.label || q.question || 'Pertanyaan',
  type: q.type,
  options: q.options,
  allowOther: q.allowOther ?? true,
}));

export const ChatFormPayloadSchema = z.object({
  formId: z.string().optional().default(() => 'form-' + Date.now()),
  questions: z.array(FormQuestionSchema).min(1),
});

export const ChatDonePayloadSchema = z.object({
  readyToFinalize: z.boolean().optional().default(true),
});

export const ChatMessageSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('text'),
    content: z.string(),
    payload: z.any().optional(),
  }),
  z.object({
    kind: z.literal('form'),
    content: z.string(),
    payload: ChatFormPayloadSchema,
  }),
  z.object({
    kind: z.literal('done'),
    content: z.string(),
    payload: ChatDonePayloadSchema.optional().default({ readyToFinalize: true }),
  }),
]);

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ===============================================
// Tree Data Schema — hierarki App → Fitur → Sub-fitur → Task → Sub-task
// ===============================================

const SubTaskSchema = z.object({
  label: z.string(),
});

const TreeTaskSchema = z.object({
  label: z.string(),
  subtasks: z.array(SubTaskSchema).default([]),
});

const SubFeatureSchema = z.object({
  label: z.string(),
  tasks: z.array(TreeTaskSchema).default([]),
});

const FeatureSchema = z.object({
  label: z.string(),
  subfeatures: z.array(SubFeatureSchema).default([]),
  tasks: z.array(TreeTaskSchema).default([]),
});

export const TreeDataSchema = z.object({
  appName: z.string(),
  features: z.array(FeatureSchema).min(1),
});

export type TreeData = z.infer<typeof TreeDataSchema>;

// ===============================================
// Interview & Tech Stack Recommendations
// ===============================================

export const InterviewAnswerSchema = z.object({
  question: z.string(),
  answer: z.string().default(''),
  context: z.string().optional(),
  skipped: z.boolean().optional().default(false),
  recommended: z.boolean().optional().default(false),
});

export const RecommendationResponseBase = z.object({
  reasoning: z.string(),
});

export const RecommendInterviewAnswerSchema = z.object({
  question: z.string().optional(),
  answer: z.string(),
  reasoning: z.string(),
});

export const RecommendTechStackSchema = RecommendationResponseBase.extend({
  techStack: z.array(z.string()),
});

export const GenerateInterviewSchema = z.object({
  questions: z.array(InterviewAnswerSchema).max(8),
});

// Export semua schema yang mungkin dipakai di berbagai tempat
export { FeatureSchema as Feature };
export { SubFeatureSchema as SubFeature };
export { TreeTaskSchema as Task };
export { SubTaskSchema as SubTask };
