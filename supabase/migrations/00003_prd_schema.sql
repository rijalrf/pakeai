-- 00003_prd_schema.sql
-- Setup structured PRD table

CREATE TABLE IF NOT EXISTS prds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'revision')),
  project_overview JSONB NOT NULL DEFAULT '{}',
  goals JSONB NOT NULL DEFAULT '[]',
  features JSONB NOT NULL DEFAULT '[]',
  tech_requirements JSONB NOT NULL DEFAULT '{}',
  non_functional_requirements JSONB NOT NULL DEFAULT '[]',
  constraints JSONB NOT NULL DEFAULT '[]',
  out_of_scope JSONB NOT NULL DEFAULT '[]',
  user_modifications JSONB DEFAULT '{}',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prds_project_id ON prds(project_id);
CREATE INDEX IF NOT EXISTS idx_prds_status ON prds(status);
