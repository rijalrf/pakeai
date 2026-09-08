-- 00005_tasks_schema.sql
-- Setup tasks and task_dependencies tables

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES roadmap_phases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  layer TEXT NOT NULL CHECK (layer IN ('DATABASE', 'BACKEND', 'FRONTEND', 'DEVOPS', 'TESTING')),
  category TEXT,
  status TEXT DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  sequence INTEGER NOT NULL,
  acceptance_criteria JSONB DEFAULT '[]',
  estimated_complexity TEXT CHECK (estimated_complexity IN ('trivial', 'low', 'medium', 'high')),
  ai_context JSONB DEFAULT '{}',
  blocked_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_layer ON tasks(layer);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
