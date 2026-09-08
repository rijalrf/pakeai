-- 00004_roadmap_schema.sql
-- Setup roadmap_phases, roadmap_features, roadmap_dependencies

CREATE TABLE IF NOT EXISTS roadmap_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  layer TEXT CHECK (layer IN ('DATABASE', 'BACKEND', 'FRONTEND', 'DEVOPS', 'MIXED')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES roadmap_phases(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('must', 'should', 'could', 'wont')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_phase_id UUID REFERENCES roadmap_phases(id) ON DELETE CASCADE,
  target_phase_id UUID REFERENCES roadmap_phases(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_phases_project_id ON roadmap_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_dependencies_project_id ON roadmap_dependencies(project_id);
