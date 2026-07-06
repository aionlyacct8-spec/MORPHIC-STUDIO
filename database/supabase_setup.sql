-- ============================================================
-- Morphic Studio — Supabase SQL Editor Setup Bundle
-- ============================================================
-- Use this file when you cannot run `npm run setup` from a terminal.
-- In Supabase: SQL Editor -> New query -> paste this full file -> Run.
-- It applies the base schema and marks bundled migrations as applied.
-- Safe to re-run because tables/columns/indexes use IF NOT EXISTS where needed.

-- ============================================================
-- Morphic Studio — Full Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  genre       TEXT,
  format      TEXT,   -- comic | animation | motion-comic | novel
  style       TEXT,   -- visual style preset
  status      TEXT DEFAULT 'active',  -- active | archived | published
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT BRAIN (one per project — the persistent memory)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_brain (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  -- Structured bibles
  story_bible       JSONB DEFAULT '{}',      -- premise, themes, tone, arc, acts
  character_bible   JSONB DEFAULT '{}',      -- master character index + relationships
  world_bible       JSONB DEFAULT '{}',      -- setting, rules, history, geography
  timeline          JSONB DEFAULT '[]',      -- ordered list of story events
  continuity_rules  JSONB DEFAULT '[]',      -- things AI must never contradict
  voice_profiles    JSONB DEFAULT '{}',      -- per-character voice/tone settings
  style_guide       JSONB DEFAULT '{}',      -- color palette, panel style, mood refs
  -- Compressed context for AI injection (auto-maintained)
  memory_context    TEXT DEFAULT '',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHARACTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS characters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  role           TEXT DEFAULT 'supporting',  -- protagonist | antagonist | supporting | minor
  visual_dna     JSONB DEFAULT '{}',   -- build, height, hair, eyes, skin, style, scars
  personality    JSONB DEFAULT '{}',   -- traits[], values[], fears[], motivations[], flaws[]
  voice_profile  JSONB DEFAULT '{}',   -- tone, pace, vocabulary, catchphrases[], accent
  relationships  JSONB DEFAULT '[]',   -- [{character_id, type, dynamic, history}]
  outfit_history JSONB DEFAULT '[]',   -- [{scene, description, timestamp}]
  arc_progress   INTEGER DEFAULT 0,    -- 0–100
  status         TEXT DEFAULT 'active',-- active | deceased | missing | transformed
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Character evolution log
CREATE TABLE IF NOT EXISTS character_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id     UUID REFERENCES characters(id) ON DELETE CASCADE,
  event_type       TEXT NOT NULL,   -- appearance_change | personality_shift | relationship_change | outfit_change | status_change
  description      TEXT,
  before_state     JSONB,
  after_state      JSONB,
  scene_reference  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORLDS & LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS worlds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  era          TEXT,
  type         TEXT DEFAULT 'fictional',  -- fictional | historical | sci-fi | fantasy | contemporary
  rules        JSONB DEFAULT '[]',         -- [{rule, category: physical|social|tech|magic}]
  atmosphere   JSONB DEFAULT '{}',         -- dominant mood, climate, sensory details
  history      JSONB DEFAULT '[]',         -- major historical events
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id       UUID REFERENCES worlds(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  type           TEXT,   -- city | district | building | room | exterior | vehicle | dimension
  description    TEXT,
  atmosphere     JSONB DEFAULT '{}',  -- lighting, sounds, smells, temperature
  visual_preset  JSONB DEFAULT '{}',  -- dominant colors, architectural style, props list
  connected_to   UUID[],              -- other location IDs for map graph
  scene_count    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ASSET LIBRARY (the central hub)
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,    -- character | background | prop | audio | panel | style | voice
  subtype      TEXT,             -- e.g. portrait | action | silhouette for character assets
  description  TEXT,
  file_url     TEXT,             -- storage URL when connected
  thumbnail    TEXT,
  metadata     JSONB DEFAULT '{}',  -- dimensions, duration, format, tags, ai_prompt
  tags         TEXT[] DEFAULT '{}',
  source       TEXT DEFAULT 'manual',  -- manual | ai_generated | imported
  linked_id    UUID,            -- optional: links to characters.id, locations.id etc.
  usage_count  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCRIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS scripts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  status     TEXT DEFAULT 'draft',  -- draft | reviewed | final
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STORYBOARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS storyboards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id     UUID REFERENCES scripts(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  panel_data    JSONB DEFAULT '[]',   -- [{panel_num, shot, visual, dialogue, action, mood}]
  agent_context JSONB DEFAULT '{}',  -- snapshot of brain context used during generation
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI MEMORY LOG (what agents remember per project)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_memory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  agent_type   TEXT NOT NULL,    -- story | character | world | storyboard | comic | animation
  memory_type  TEXT NOT NULL,    -- fact | decision | continuity_note | character_event | world_event
  content      TEXT NOT NULL,
  importance   INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  refs         JSONB DEFAULT '[]',   -- [{entity_type, entity_id, label}]
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_project_brain_project   ON project_brain(project_id);
CREATE INDEX IF NOT EXISTS idx_characters_project       ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_character_history_char   ON character_history(character_id);
CREATE INDEX IF NOT EXISTS idx_worlds_project           ON worlds(project_id);
CREATE INDEX IF NOT EXISTS idx_locations_world          ON locations(world_id);
CREATE INDEX IF NOT EXISTS idx_assets_project           ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_type              ON assets(type);
CREATE INDEX IF NOT EXISTS idx_scripts_project          ON scripts(project_id);
CREATE INDEX IF NOT EXISTS idx_storyboards_script       ON storyboards(script_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_project        ON ai_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_agent          ON ai_memory(agent_type);


-- Track migrations for the Node migration runner.
CREATE TABLE IF NOT EXISTS _migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 001_additions.sql
-- ============================================================
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


INSERT INTO _migrations (filename) VALUES ('001_additions.sql') ON CONFLICT (filename) DO NOTHING;


-- ============================================================
-- 002_extended_schema.sql
-- ============================================================
-- ============================================================
-- Morphic Studio — Migration 002: Extended Schema
-- Adds: users, scenes, episodes, relationships table,
--       knowledge graph, timeline events, generation jobs,
--       exports, soft delete, brain version history
-- ============================================================

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  role          TEXT DEFAULT 'creator',   -- creator | admin | viewer
  preferences   JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ             -- soft delete
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add created_by to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── Scenes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  script_id    UUID REFERENCES scripts(id) ON DELETE SET NULL,
  title        TEXT,
  scene_number INTEGER,
  location_id  UUID REFERENCES locations(id) ON DELETE SET NULL,
  description  TEXT,
  action       TEXT,
  characters   UUID[] DEFAULT '{}',   -- character IDs present in scene
  mood         TEXT,
  time_of_day  TEXT,
  weather      TEXT,
  duration_est INTEGER,               -- estimated screen seconds
  status       TEXT DEFAULT 'draft',  -- draft | storyboarded | animated | final
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scenes_project  ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_script   ON scenes(script_id);

-- ── Episodes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS episodes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  episode_num  INTEGER,
  season_num   INTEGER DEFAULT 1,
  synopsis     TEXT,
  scenes       UUID[] DEFAULT '{}',   -- ordered scene IDs
  status       TEXT DEFAULT 'draft',  -- draft | in_production | complete | published
  air_date     DATE,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_episodes_project ON episodes(project_id);

-- ── Relationships (explicit graph, supplements JSONB in characters) ───────
CREATE TABLE IF NOT EXISTS relationships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_entity_id  UUID NOT NULL,
  from_entity_type TEXT NOT NULL,    -- character | location | organization | world
  to_entity_id    UUID NOT NULL,
  to_entity_type  TEXT NOT NULL,
  relation_type   TEXT NOT NULL,     -- knows | lives_in | owns | appears_in | belongs_to | enemy_of | allied_with | created_by
  strength        INTEGER DEFAULT 5 CHECK (strength BETWEEN 1 AND 10),
  description     TEXT,
  since_scene     TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_project ON relationships(project_id);
CREATE INDEX IF NOT EXISTS idx_relationships_from    ON relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to      ON relationships(to_entity_id);

-- ── Knowledge Graph ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_id    UUID NOT NULL,          -- ID in its native table
  entity_type  TEXT NOT NULL,          -- character | world | location | prop | episode | scene | organization | event | weapon | vehicle
  label        TEXT NOT NULL,
  properties   JSONB DEFAULT '{}',     -- extra queryable properties
  embedding    TEXT,                   -- future: vector embedding for semantic search
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_nodes_entity ON knowledge_graph_nodes(project_id, entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_project ON knowledge_graph_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_type    ON knowledge_graph_nodes(entity_type);

CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_node_id   UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  to_node_id     UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  relation       TEXT NOT NULL,         -- lives_in | owns | appears_in | belongs_to | uses | wears | knows | enemy_of
  weight         NUMERIC DEFAULT 1.0,   -- relationship strength (for graph algorithms)
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_edges_from    ON knowledge_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to      ON knowledge_graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_project ON knowledge_graph_edges(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_edges_unique ON knowledge_graph_edges(from_node_id, to_node_id, relation);

-- ── Timeline Events (explicit, supplements JSONB timeline in brain) ────────
CREATE TABLE IF NOT EXISTS timeline_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  event_type   TEXT DEFAULT 'story',    -- story | character | world | historical | hidden
  sequence_num INTEGER,                 -- ordering within story
  time_label   TEXT,                    -- "Day 1", "Year 3042", "Act I"
  entities     JSONB DEFAULT '[]',      -- [{type, id, label}] participants
  scene_id     UUID REFERENCES scenes(id) ON DELETE SET NULL,
  episode_id   UUID REFERENCES episodes(id) ON DELETE SET NULL,
  is_canon     BOOLEAN DEFAULT TRUE,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_project ON timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_seq     ON timeline_events(project_id, sequence_num);

-- ── Continuity Rules (explicit table, supplements JSONB in brain) ──────────
CREATE TABLE IF NOT EXISTS continuity_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rule         TEXT NOT NULL,
  category     TEXT DEFAULT 'general',  -- general | character | world | physics | magic | tech
  severity     TEXT DEFAULT 'must',     -- must | should | avoid
  source       TEXT,                    -- where this rule comes from
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_continuity_rules_project ON continuity_rules(project_id);

-- ── Style Guides (explicit table, supplements JSONB in brain) ─────────────
CREATE TABLE IF NOT EXISTS style_guides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  section      TEXT NOT NULL,  -- color | typography | panel | lighting | rendering | character | world
  rules        JSONB NOT NULL DEFAULT '{}',
  reference_urls TEXT[] DEFAULT '{}',
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_style_guides_project ON style_guides(project_id);

-- ── Generation Jobs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generation_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_type       TEXT NOT NULL,      -- storyboard | character_dna | world_bible | outline | comic | animation | voice | export
  status         TEXT DEFAULT 'queued',  -- queued | running | complete | failed | cancelled
  agent          TEXT,               -- which agent handled it
  provider       TEXT,               -- which AI provider was used
  model          TEXT,
  input          JSONB DEFAULT '{}', -- parameters passed to the agent
  output         JSONB,              -- result data (or partial on failure)
  error          TEXT,               -- error message if failed
  tokens_used    INTEGER DEFAULT 0,
  cost_usd       NUMERIC(10,6),      -- estimated cost
  duration_ms    INTEGER,            -- wall-clock time
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_jobs_project ON generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_status  ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_type    ON generation_jobs(job_type);

-- ── Exports ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  export_type  TEXT NOT NULL,         -- pdf | cbz | video | epub | json | zip
  status       TEXT DEFAULT 'pending',-- pending | processing | complete | failed
  file_url     TEXT,
  file_size    BIGINT,
  settings     JSONB DEFAULT '{}',    -- resolution, quality, format options
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exports_project ON exports(project_id);

-- ── Brain Version History ──────────────────────────────────
CREATE TABLE IF NOT EXISTS brain_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_num  INTEGER NOT NULL,
  snapshot     JSONB NOT NULL,         -- full brain state at this version
  changed_by   TEXT DEFAULT 'system',  -- user | system | agent
  change_note  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_versions_project ON brain_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_brain_versions_num     ON brain_versions(project_id, version_num);

-- ── Soft delete on assets ──────────────────────────────────
ALTER TABLE assets      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE characters  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE worlds      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE scripts     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── Brain: add lock flag and version counter ───────────────
ALTER TABLE project_brain ADD COLUMN IF NOT EXISTS is_locked        BOOLEAN DEFAULT FALSE;
ALTER TABLE project_brain ADD COLUMN IF NOT EXISTS lock_reason       TEXT;
ALTER TABLE project_brain ADD COLUMN IF NOT EXISTS current_version   INTEGER DEFAULT 1;
ALTER TABLE project_brain ADD COLUMN IF NOT EXISTS lore              JSONB DEFAULT '{}';
ALTER TABLE project_brain ADD COLUMN IF NOT EXISTS notes             JSONB DEFAULT '{}';
ALTER TABLE project_brain ADD COLUMN IF NOT EXISTS generation_history JSONB DEFAULT '[]';
ALTER TABLE project_brain ADD COLUMN IF NOT EXISTS relationships_map  JSONB DEFAULT '{}';

-- ── Additional indexes for performance ────────────────────
CREATE INDEX IF NOT EXISTS idx_assets_deleted       ON assets(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_characters_deleted   ON characters(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scenes_deleted       ON scenes(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_memory_importance ON ai_memory(project_id, importance DESC);


INSERT INTO _migrations (filename) VALUES ('002_extended_schema.sql') ON CONFLICT (filename) DO NOTHING;


-- ============================================================
-- 003_story_production_workflow.sql
-- ============================================================
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


INSERT INTO _migrations (filename) VALUES ('003_story_production_workflow.sql') ON CONFLICT (filename) DO NOTHING;


-- ============================================================
-- 004_foundation_readiness.sql
-- ============================================================
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


INSERT INTO _migrations (filename) VALUES ('004_foundation_readiness.sql') ON CONFLICT (filename) DO NOTHING;
