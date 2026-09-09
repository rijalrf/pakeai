-- Migration 00008: Optimasi Phase 1 (Auth Mandiri, Isolation, Log AI & Review)
-- Dibuat untuk Project AI Planner SaaS

-- 1. Tabel auth_users (kredensial mandiri)
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk membuat baris di profiles jika belum ada
CREATE OR REPLACE FUNCTION sync_auth_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, created_at, updated_at)
  VALUES (NEW.id, NEW.full_name, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_auth_user_to_profile ON auth_users;
CREATE TRIGGER trg_sync_auth_user_to_profile
AFTER INSERT OR UPDATE ON auth_users
FOR EACH ROW
EXECUTE FUNCTION sync_auth_user_to_profile();

-- Buat akun demo default jika belum ada
INSERT INTO auth_users (id, email, password_hash, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@projectai.local',
  '$2b$10$iOn85KCenq17wcBlDcBa3OodQrMHSVtaPLcSombw9LVE2MLWp9rUm',
  'Rijal'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash;

-- 2. Tabel auth_sessions (session cookie httpOnly opaque)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);

-- 3. Perkuat relasi projects dan agent_tokens
DO $$
BEGIN
  -- Foreign key projects.user_id -> profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'projects_user_id_fkey' AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Kolom project_id di agent_tokens
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_tokens' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE agent_tokens
    ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Hubungkan token existing ke project pertama
UPDATE agent_tokens
SET project_id = (SELECT id FROM projects ORDER BY created_at ASC LIMIT 1)
WHERE project_id IS NULL;

-- Index performa pencarian
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_project_id ON agent_tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_user_id ON agent_tokens(user_id);

-- 4. Konsolidasi tabel ai_generations (menghapus duplikasi 00002 & 00007)
DROP TABLE IF EXISTS ai_generations CASCADE;
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_project_id ON ai_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);

-- 5. Tabel ai_reviews (evaluasi hasil generator oleh AI Reviewer)
CREATE TABLE IF NOT EXISTS ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- 'prd' | 'roadmap' | 'tasks'
  score INT NOT NULL,
  verdict TEXT NOT NULL, -- 'pass' | 'warning' | 'fail'
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  auto_fixed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reviews_project_id ON ai_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_created_at ON ai_reviews(created_at DESC);
