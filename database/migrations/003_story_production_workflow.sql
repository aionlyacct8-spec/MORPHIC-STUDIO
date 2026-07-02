-- ============================================================
-- Morphic Studio — Migration 003: Story Production Workflow
-- Adds reusable comic, motion-comic, voice, and animation planning tables.
-- Core rule: generate once, save permanently, reuse forever.
-- ============================================================

-- ── Chapters ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  episode_id     UUID REFERENCES episodes(id) ON DELETE SET NULL,
  script_id      UUID REFERENCES scripts(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  chapter_number INTEGER,
  synopsis       TEXT,
  status         TEXT DEFAULT 'draft', -- draft | planned | in_production | complete | published
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order   ON chapters(project_id, chapter_number);

-- ── Comic Pages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comic_pages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id     UUID REFERENCES chapters(id) ON DELETE CASCADE,
  page_number    INTEGER NOT NULL,
  layout         TEXT DEFAULT 'grid', -- grid | manga | webtoon | splash | custom
  title          TEXT,
  summary        TEXT,
  background_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  status         TEXT DEFAULT 'draft', -- draft | storyboarded | inked | colored | final
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comic_pages_project ON comic_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_comic_pages_chapter ON comic_pages(chapter_id, page_number);

-- ── Comic Panels ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comic_panels (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id     UUID REFERENCES chapters(id) ON DELETE CASCADE,
  page_id        UUID REFERENCES comic_pages(id) ON DELETE CASCADE,
  scene_id       UUID REFERENCES scenes(id) ON DELETE SET NULL,
  panel_number   INTEGER NOT NULL,
  shot_type      TEXT,
  camera_angle   TEXT,
  description    TEXT,
  dialogue       JSONB DEFAULT '[]', -- [{character_id, character_name, text, voice_profile_id}]
  characters     UUID[] DEFAULT '{}',
  assets         UUID[] DEFAULT '{}', -- reusable assets used in this panel
  location_id    UUID REFERENCES locations(id) ON DELETE SET NULL,
  image_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  effects        JSONB DEFAULT '[]', -- speed lines, impact text, SFX letters, overlays
  continuity_notes TEXT,
  status         TEXT DEFAULT 'draft', -- draft | generated | edited | approved
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comic_panels_project ON comic_panels(project_id);
CREATE INDEX IF NOT EXISTS idx_comic_panels_page    ON comic_panels(page_id, panel_number);
CREATE INDEX IF NOT EXISTS idx_comic_panels_scene   ON comic_panels(scene_id);

-- ── Voice Profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id   UUID REFERENCES characters(id) ON DELETE CASCADE,
  asset_id       UUID REFERENCES assets(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  provider       TEXT, -- coqui | elevenlabs | openai | manual | other
  voice_ref      TEXT,
  tone           TEXT,
  pace           TEXT,
  accent         TEXT,
  sample_text    TEXT,
  settings       JSONB DEFAULT '{}',
  is_default     BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_voice_profiles_project   ON voice_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_character ON voice_profiles(character_id);

-- ── Motion Comic Sequences ─────────────────────────────────
CREATE TABLE IF NOT EXISTS motion_comic_sequences (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id     UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  playback_mode  TEXT DEFAULT 'slideshow', -- slideshow | scroll | guided_pan | hybrid
  transition     TEXT DEFAULT 'fade',      -- fade | slide | zoom | cut | pan
  duration_sec   INTEGER,
  page_ids       UUID[] DEFAULT '{}',
  audio_asset_ids UUID[] DEFAULT '{}',
  settings       JSONB DEFAULT '{}',
  status         TEXT DEFAULT 'draft',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_motion_sequences_project ON motion_comic_sequences(project_id);
CREATE INDEX IF NOT EXISTS idx_motion_sequences_chapter ON motion_comic_sequences(chapter_id);

-- ── Motion Comic Cues ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS motion_comic_cues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sequence_id    UUID NOT NULL REFERENCES motion_comic_sequences(id) ON DELETE CASCADE,
  page_id        UUID REFERENCES comic_pages(id) ON DELETE CASCADE,
  panel_id       UUID REFERENCES comic_panels(id) ON DELETE CASCADE,
  cue_order      INTEGER NOT NULL,
  start_time_ms  INTEGER DEFAULT 0,
  duration_ms    INTEGER DEFAULT 3000,
  transition     TEXT DEFAULT 'fade',
  camera_motion  JSONB DEFAULT '{}', -- pan/zoom/hold settings
  audio_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL,
  caption        TEXT,
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_motion_cues_sequence ON motion_comic_cues(sequence_id, cue_order);
CREATE INDEX IF NOT EXISTS idx_motion_cues_project  ON motion_comic_cues(project_id);

-- ── Animation Assets / Rigging Plan ────────────────────────
CREATE TABLE IF NOT EXISTS animation_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id   UUID REFERENCES characters(id) ON DELETE CASCADE,
  asset_id       UUID REFERENCES assets(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  asset_kind     TEXT NOT NULL, -- rig | body_part | pose | walk_cycle | run_cycle | expression | lip_sync | camera_preset
  part_name      TEXT,          -- arm | leg | head | mouth | eye | full_body | camera
  file_url       TEXT,
  thumbnail      TEXT,
  rig_data       JSONB DEFAULT '{}',
  compatible_with UUID[] DEFAULT '{}', -- other animation_assets ids
  status         TEXT DEFAULT 'draft',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_animation_assets_project   ON animation_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_animation_assets_character ON animation_assets(character_id);
CREATE INDEX IF NOT EXISTS idx_animation_assets_kind      ON animation_assets(asset_kind);
