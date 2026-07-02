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
