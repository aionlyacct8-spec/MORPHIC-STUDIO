-- ============================================================
-- Morphic Studio — Migration 006: Remaining Phase 2 foundations
-- ============================================================
-- Additive-only tables for Phase 2B-2F. These tables reference shared
-- projects/assets/scenes/comic records instead of duplicating production assets.

CREATE TABLE IF NOT EXISTS character_asset_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id     UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  asset_id         UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_version_id UUID REFERENCES asset_versions(id) ON DELETE SET NULL,
  link_type        TEXT NOT NULL,
  label            TEXT,
  metadata         JSONB DEFAULT '{}',
  is_primary       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS character_rigs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id     UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  asset_id         UUID REFERENCES assets(id) ON DELETE SET NULL,
  asset_version_id UUID REFERENCES asset_versions(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  rig_type         TEXT DEFAULT 'humanoid_2d',
  rig_data         JSONB DEFAULT '{}',
  compatibility    JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS character_expressions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id     UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  asset_id         UUID REFERENCES assets(id) ON DELETE SET NULL,
  asset_version_id UUID REFERENCES asset_versions(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  emotion          TEXT,
  intensity        NUMERIC DEFAULT 1,
  expression_data  JSONB DEFAULT '{}',
  metadata         JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS character_poses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id     UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  rig_id           UUID REFERENCES character_rigs(id) ON DELETE SET NULL,
  asset_id         UUID REFERENCES assets(id) ON DELETE SET NULL,
  asset_version_id UUID REFERENCES asset_versions(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  pose_type        TEXT DEFAULT 'body',
  pose_data        JSONB DEFAULT '{}',
  metadata         JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS character_clothing_sets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id     UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  asset_id         UUID REFERENCES assets(id) ON DELETE SET NULL,
  asset_version_id UUID REFERENCES asset_versions(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  clothing_data    JSONB DEFAULT '{}',
  metadata         JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scene_asset_placements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id         UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  asset_id         UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_version_id UUID REFERENCES asset_versions(id) ON DELETE SET NULL,
  character_id     UUID REFERENCES characters(id) ON DELETE SET NULL,
  placement_type   TEXT NOT NULL,
  transform        JSONB DEFAULT '{}',
  layer_order      INTEGER DEFAULT 0,
  timing           JSONB DEFAULT '{}',
  metadata         JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS storyboard_asset_references (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storyboard_id    UUID REFERENCES storyboards(id) ON DELETE CASCADE,
  page_id          UUID REFERENCES comic_pages(id) ON DELETE CASCADE,
  panel_id         UUID REFERENCES comic_panels(id) ON DELETE CASCADE,
  scene_id         UUID REFERENCES scenes(id) ON DELETE SET NULL,
  asset_id         UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_version_id UUID REFERENCES asset_versions(id) ON DELETE SET NULL,
  reference_role   TEXT NOT NULL,
  camera_data      JSONB DEFAULT '{}',
  continuity_notes TEXT,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  CHECK (storyboard_id IS NOT NULL OR page_id IS NOT NULL OR panel_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS comic_speech_bubbles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_id          UUID REFERENCES comic_pages(id) ON DELETE CASCADE,
  panel_id         UUID REFERENCES comic_panels(id) ON DELETE CASCADE,
  character_id     UUID REFERENCES characters(id) ON DELETE SET NULL,
  bubble_type      TEXT DEFAULT 'speech',
  text_content     TEXT NOT NULL,
  reading_order    INTEGER DEFAULT 0,
  geometry         JSONB DEFAULT '{}',
  style            JSONB DEFAULT '{}',
  metadata         JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  CHECK (page_id IS NOT NULL OR panel_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS animation_timelines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id         UUID REFERENCES scenes(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  duration_seconds NUMERIC DEFAULT 0,
  frame_rate       NUMERIC DEFAULT 24,
  timeline_data    JSONB DEFAULT '{}',
  metadata         JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS animation_keyframes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  timeline_id      UUID NOT NULL REFERENCES animation_timelines(id) ON DELETE CASCADE,
  asset_id         UUID REFERENCES assets(id) ON DELETE SET NULL,
  character_id     UUID REFERENCES characters(id) ON DELETE SET NULL,
  rig_id           UUID REFERENCES character_rigs(id) ON DELETE SET NULL,
  track_type       TEXT NOT NULL,
  frame_number     INTEGER NOT NULL,
  time_seconds     NUMERIC DEFAULT 0,
  keyframe_data    JSONB DEFAULT '{}',
  interpolation    TEXT DEFAULT 'linear',
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_character_asset_links_character ON character_asset_links(project_id, character_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_character_asset_links_asset ON character_asset_links(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_character_rigs_character ON character_rigs(project_id, character_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_character_expressions_character ON character_expressions(project_id, character_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_character_poses_character ON character_poses(project_id, character_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_character_clothing_sets_character ON character_clothing_sets(project_id, character_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scene_asset_placements_scene ON scene_asset_placements(project_id, scene_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_storyboard_asset_references_panel ON storyboard_asset_references(project_id, panel_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comic_speech_bubbles_panel ON comic_speech_bubbles(project_id, panel_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_animation_timelines_scene ON animation_timelines(project_id, scene_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_animation_keyframes_timeline ON animation_keyframes(project_id, timeline_id, frame_number) WHERE deleted_at IS NULL;
