import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProjectStatus, SkillLevel } from '@/lib/db/database.types';
import type { DiscoveryQuestionItem } from '@/lib/ai/discovery';
import type { PRDDocument } from '@/lib/ai/prd';
import type { RoadmapDocument } from '@/lib/ai/roadmap';
import type { TaskItemData } from '@/lib/ai/tasks';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  idea: string;
  projectType: string;
  status: ProjectStatus;
  stacks: { category: string; technology: string }[];
  createdAt: string;
  updatedAt: string;
  // Dynamic AI Artifacts
  discoveryQuestions?: DiscoveryQuestionItem[];
  discoveryAnswers?: Record<string, string>;
  prd?: PRDDocument;
  roadmap?: RoadmapDocument;
  tasks?: TaskItemData[];
}

interface ProjectState {
  projects: ProjectItem[];
  activeProjectId: string | null;
  userProfile: {
    fullName: string;
    skillLevel: SkillLevel;
    goals: string[];
    onboardingCompleted: boolean;
  };
  setProfile: (profile: Partial<ProjectState['userProfile']>) => void;
  setActiveProject: (id: string) => void;
  addProject: (project: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>) => ProjectItem;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  saveDiscovery: (projectId: string, questions: DiscoveryQuestionItem[], answers: Record<string, string>) => void;
  savePRD: (projectId: string, prd: PRDDocument) => void;
  saveRoadmap: (projectId: string, roadmap: RoadmapDocument) => void;
  saveTasks: (projectId: string, tasks: TaskItemData[]) => void;
  getProject: (id: string) => ProjectItem | undefined;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'futsal-booking-01',
    name: 'Aplikasi Booking Lapangan Futsal',
    description: 'SaaS pemesanan jadwal lapangan olahraga real-time dan manajemen pengelola venue.',
    idea: 'Saya ingin membuat aplikasi booking lapangan futsal online untuk memudahkan pemain mengecek slot jadwal lapangan kosong, melakukan pembayaran otomatis, serta memberikan dashboard pengelolaan jadwal bagi pemilik venue.',
    projectType: 'Web Application / SaaS',
    status: 'discovery',
    stacks: [
      { category: 'Frontend', technology: 'Next.js' },
      { category: 'Backend', technology: 'Next.js Server Actions' },
      { category: 'Database', technology: 'PostgreSQL / Supabase' },
      { category: 'DevOps', technology: 'Docker' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS,
      activeProjectId: 'futsal-booking-01',
      userProfile: {
        fullName: 'Rijal Developer',
        skillLevel: 'intermediate',
        goals: ['Build SaaS', 'Learn AI Engineering'],
        onboardingCompleted: true,
      },
      setProfile: (profile) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile },
        })),
      setActiveProject: (id) => set({ activeProjectId: id }),
      addProject: (data) => {
        const newProject: ProjectItem = {
          ...data,
          id: `proj-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          projects: [newProject, ...state.projects],
          activeProjectId: newProject.id,
        }));
        return newProject;
      },
      updateProjectStatus: (id, status) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
          ),
        })),
      saveDiscovery: (projectId, questions, answers) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, discoveryQuestions: questions, discoveryAnswers: answers, updatedAt: new Date().toISOString() } : p
          ),
        })),
      savePRD: (projectId, prd) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, prd, updatedAt: new Date().toISOString() } : p
          ),
        })),
      saveRoadmap: (projectId, roadmap) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, roadmap, updatedAt: new Date().toISOString() } : p
          ),
        })),
      saveTasks: (projectId, tasks) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, tasks, updatedAt: new Date().toISOString() } : p
          ),
        })),
      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    {
      name: 'project_ai_planner_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
