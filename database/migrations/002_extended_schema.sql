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
