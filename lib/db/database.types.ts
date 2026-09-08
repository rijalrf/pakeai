export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ProjectStatus = 'discovery' | 'prd' | 'roadmap' | 'tasks' | 'in_progress' | 'completed' | 'archived';
export type TaskLayer = 'DATABASE' | 'BACKEND' | 'FRONTEND' | 'DEVOPS' | 'TESTING';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskComplexity = 'trivial' | 'low' | 'medium' | 'high';
export type CheckpointType = 'prd_approval' | 'roadmap_approval' | 'tasks_review' | 'layer_transition' | 'phase_transition';
export type CheckpointStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          skill_level: SkillLevel | null;
          goals: string[] | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          skill_level?: SkillLevel | null;
          goals?: string[] | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          skill_level?: SkillLevel | null;
          goals?: string[] | null;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          idea: string | null;
          project_type: string | null;
          status: ProjectStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          idea?: string | null;
          project_type?: string | null;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          idea?: string | null;
          project_type?: string | null;
          status?: ProjectStatus;
          updated_at?: string;
        };
      };
      project_stacks: {
        Row: {
          id: string;
          project_id: string;
          category: string;
          technology: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          category: string;
          technology: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          category?: string;
          technology?: string;
        };
      };
      discovery_questions: {
        Row: {
          id: string;
          project_id: string;
          question: string;
          category: string;
          priority: number;
          is_answered: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          question: string;
          category: string;
          priority?: number;
          is_answered?: boolean;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          category?: string;
          priority?: number;
          is_answered?: boolean;
          order_index?: number;
        };
      };
      discovery_answers: {
        Row: {
          id: string;
          question_id: string;
          project_id: string;
          answer: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          project_id: string;
          answer: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          answer?: string;
        };
      };
      prds: {
        Row: {
          id: string;
          project_id: string;
          version: number;
          status: 'draft' | 'approved' | 'revision';
          project_overview: Json;
          goals: Json;
          features: Json;
          tech_requirements: Json;
          non_functional_requirements: Json;
          constraints: Json;
          out_of_scope: Json;
          user_modifications: Json;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version?: number;
          status?: 'draft' | 'approved' | 'revision';
          project_overview?: Json;
          goals?: Json;
          features?: Json;
          tech_requirements?: Json;
          non_functional_requirements?: Json;
          constraints?: Json;
          out_of_scope?: Json;
          user_modifications?: Json;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version?: number;
          status?: 'draft' | 'approved' | 'revision';
          project_overview?: Json;
          goals?: Json;
          features?: Json;
          tech_requirements?: Json;
          non_functional_requirements?: Json;
          constraints?: Json;
          out_of_scope?: Json;
          user_modifications?: Json;
          approved_at?: string | null;
          updated_at?: string;
        };
      };
      roadmap_phases: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          order_index: number;
          layer: string | null;
          status: 'pending' | 'in_progress' | 'completed';
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          order_index: number;
          layer?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          layer?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
        };
      };
      roadmap_features: {
        Row: {
          id: string;
          phase_id: string;
          project_id: string;
          title: string;
          priority: 'must' | 'should' | 'could' | 'wont' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phase_id: string;
          project_id: string;
          title: string;
          priority?: 'must' | 'should' | 'could' | 'wont' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          priority?: 'must' | 'should' | 'could' | 'wont' | null;
        };
      };
      roadmap_dependencies: {
        Row: {
          id: string;
          project_id: string;
          source_phase_id: string | null;
          target_phase_id: string | null;
          dependency_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_phase_id?: string | null;
          target_phase_id?: string | null;
          dependency_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_phase_id?: string | null;
          target_phase_id?: string | null;
          dependency_type?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          phase_id: string | null;
          title: string;
          description: string | null;
          layer: TaskLayer;
          category: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          sequence: number;
          acceptance_criteria: Json;
          estimated_complexity: TaskComplexity | null;
          ai_context: Json;
          blocked_reason: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          phase_id?: string | null;
          title: string;
          description?: string | null;
          layer: TaskLayer;
          category?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          sequence: number;
          acceptance_criteria?: Json;
          estimated_complexity?: TaskComplexity | null;
          ai_context?: Json;
          blocked_reason?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          layer?: TaskLayer;
          category?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          sequence?: number;
          acceptance_criteria?: Json;
          estimated_complexity?: TaskComplexity | null;
          ai_context?: Json;
          blocked_reason?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      task_dependencies: {
        Row: {
          id: string;
          task_id: string;
          depends_on_task_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          depends_on_task_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          depends_on_task_id?: string;
        };
      };
      agent_tokens: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          token_hash: string;
          token_prefix: string;
          last_used_at: string | null;
          is_revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          token_hash: string;
          token_prefix: string;
          last_used_at?: string | null;
          is_revoked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          last_used_at?: string | null;
          is_revoked?: boolean;
        };
      };
      agent_sessions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          token_id: string | null;
          task_id: string | null;
          status: 'active' | 'completed' | 'failed';
          logs: Json;
          summary: string | null;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          token_id?: string | null;
          task_id?: string | null;
          status?: 'active' | 'completed' | 'failed';
          logs?: Json;
          summary?: string | null;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          status?: 'active' | 'completed' | 'failed';
          logs?: Json;
          summary?: string | null;
          ended_at?: string | null;
        };
      };
      project_checkpoints: {
        Row: {
          id: string;
          project_id: string;
          type: CheckpointType;
          status: CheckpointStatus;
          metadata: Json;
          message: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          type: CheckpointType;
          status?: CheckpointStatus;
          metadata?: Json;
          message?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          status?: CheckpointStatus;
          metadata?: Json;
          message?: string | null;
          reviewed_at?: string | null;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectStack = Database['public']['Tables']['project_stacks']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type RoadmapPhaseRow = Database['public']['Tables']['roadmap_phases']['Row'];
export type ProjectCheckpoint = Database['public']['Tables']['project_checkpoints']['Row'];

