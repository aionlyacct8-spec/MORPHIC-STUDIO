-- ============================================================
-- Morphic Studio — Migration 004: Foundation Readiness
-- Adds missing Phase 0 tables and indexes for settings, voice models,
-- style presets, storage metadata, and workflow stage tracking.
-- ============================================================

CREATE TABLE IF NOT EXISTS project_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  settings    JSONB DEFAULT '{}',
  feature_flags JSONB DEFAULT '{}',
  storage_config JSONB DEFAULT '{}',
  ai_provider_config JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_settings_project ON project_settings(project_id);

CREATE TABLE IF NOT EXISTS voice_models (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  provider    TEXT DEFAULT 'manual',
  model_ref   TEXT,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  asset_id    UUID REFERENCES assets(id) ON DELETE SET NULL,
  settings    JSONB DEFAULT '{}',
  metadata    JSONB DEFAULT '{}',
  status      TEXT DEFAULT 'draft',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_voice_models_project ON voice_models(project_id);
CREATE INDEX IF NOT EXISTS idx_voice_models_character ON voice_models(character_id);

CREATE TABLE IF NOT EXISTS style_presets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'visual',
  prompt_parts JSONB DEFAULT '{}',
  palette     JSONB DEFAULT '[]',
  negative_prompt TEXT,
  settings    JSONB DEFAULT '{}',
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_style_presets_project ON style_presets(project_id);
CREATE INDEX IF NOT EXISTS idx_style_presets_category ON style_presets(category);

CREATE TABLE IF NOT EXISTS storage_objects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  asset_id    UUID REFERENCES assets(id) ON DELETE SET NULL,
  bucket      TEXT DEFAULT 'local',
  object_key  TEXT NOT NULL,
  file_path   TEXT,
  file_url    TEXT,
  mime_type   TEXT,
  byte_size   BIGINT DEFAULT 0,
  checksum    TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_project ON storage_objects(project_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_asset ON storage_objects(asset_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_objects_key ON storage_objects(bucket, object_key) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS workflow_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id  UUID REFERENCES chapters(id) ON DELETE CASCADE,
  stage_key   TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',
  input_refs  JSONB DEFAULT '[]',
  output_refs JSONB DEFAULT '[]',
  metadata    JSONB DEFAULT '{}',
  started_at  TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_stages_project ON workflow_stages(project_id, stage_key);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_chapter ON workflow_stages(chapter_id, stage_key);
