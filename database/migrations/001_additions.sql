-- ============================================================
-- Morphic Studio — Migration 001: Art Direction + Asset Versions
-- ============================================================

-- 1. Add art_direction section to project_brain
--    Stores: art style, color palette, line style, rendering rules
ALTER TABLE project_brain
  ADD COLUMN IF NOT EXISTS art_direction JSONB DEFAULT '{}';

-- 2. Expand assets: add version_number and current_version_id
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS current_version_id UUID;

-- 3. Asset Versions table — tracks every saved version of an asset
--    Allows "Chapter 3 used Kael v2, Chapter 7 used Kael v4"
CREATE TABLE IF NOT EXISTS asset_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id       UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url       TEXT,
  thumbnail      TEXT,
  metadata       JSONB DEFAULT '{}',   -- prompt used, model, dimensions, etc.
  notes          TEXT,                 -- what changed in this version
  created_by     TEXT DEFAULT 'user',  -- user | ai_agent
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_versions_asset     ON asset_versions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_versions_project   ON asset_versions(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_versions_unique ON asset_versions(asset_id, version_number);
