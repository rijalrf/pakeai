-- 00007_checkpoints_and_logs.sql
-- Setup project_checkpoints and ai_generations tracking

CREATE TABLE IF NOT EXISTS project_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prd_approval', 'roadmap_approval', 'tasks_review', 'layer_transition', 'phase_transition')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  metadata JSONB DEFAULT '{}',
  message TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  total_tokens INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_checkpoints_project_id ON project_checkpoints(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_project_id ON ai_generations(project_id);
