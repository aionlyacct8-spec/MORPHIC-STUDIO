-- ============================================================
-- Morphic Studio — Migration 005: Shared Asset System readiness
-- ============================================================
-- Additive-only Phase 2A foundation. Keeps legacy asset/source/job names
-- intact while strengthening reusable assets, non-destructive versions,
-- storage-object links, and asset-to-asset relationships.

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready';

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{}';

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS readiness JSONB DEFAULT '{}';

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS owner_subsystem TEXT DEFAULT 'asset_library';

ALTER TABLE asset_versions
  ADD COLUMN IF NOT EXISTS storage_object_id UUID REFERENCES storage_objects(id) ON DELETE SET NULL;

ALTER TABLE asset_versions
  ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{}';

ALTER TABLE asset_versions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready';

ALTER TABLE storage_objects
  ADD COLUMN IF NOT EXISTS asset_version_id UUID REFERENCES asset_versions(id) ON DELETE SET NULL;

ALTER TABLE storage_objects
  ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'local';

ALTER TABLE storage_objects
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'active';

CREATE TABLE IF NOT EXISTS asset_relationships (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_asset_id    UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  target_asset_id    UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  relationship_type  TEXT NOT NULL,
  metadata           JSONB DEFAULT '{}',
  created_by         TEXT DEFAULT 'user',
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,
  CHECK (source_asset_id <> target_asset_id)
);

CREATE INDEX IF NOT EXISTS idx_assets_project_status ON assets(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_project_source ON assets(project_id, source) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_asset_versions_storage_object ON asset_versions(storage_object_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_asset_version ON storage_objects(asset_version_id);
CREATE INDEX IF NOT EXISTS idx_asset_relationships_project ON asset_relationships(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_asset_relationships_source ON asset_relationships(source_asset_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_asset_relationships_target ON asset_relationships(target_asset_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_relationships_unique_active
  ON asset_relationships(project_id, source_asset_id, target_asset_id, relationship_type)
  WHERE deleted_at IS NULL;
