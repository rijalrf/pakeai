import { z } from 'zod';

export const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert'], {
    message: 'Pilih salah satu level keahlian',
  }),
  goals: z.array(z.string()).min(1, 'Pilih minimal satu tujuan pengembangan'),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
