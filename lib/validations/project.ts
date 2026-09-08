import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Nama project minimal 2 karakter').max(100),
  description: z.string().optional(),
  idea: z.string().min(10, 'Deskripsikan ide awal Anda minimal 10 karakter'),
  projectType: z.string().default('New Project'),
  stacks: z.array(z.object({
    category: z.string(),
    technology: z.string(),
  })).default([]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
