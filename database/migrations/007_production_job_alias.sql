-- ============================================================
-- Morphic Studio — Migration 007: Production Job Compatibility
-- Adds a production-oriented read alias over legacy generation_jobs.
--
-- The physical table remains generation_jobs for backward compatibility
-- with existing services, orchestrator writes, and API consumers. New
-- architecture-facing validation can read production_jobs so future work can
-- move toward production automation terminology without a destructive rename.
-- ============================================================

CREATE OR REPLACE VIEW production_jobs AS
SELECT
  id,
  project_id,
  job_type AS task_type,
  job_type AS legacy_job_type,
  status,
  agent,
  provider,
  model,
  input,
  output,
  error,
  tokens_used,
  cost_usd,
  duration_ms,
  started_at,
  completed_at,
  created_at
FROM generation_jobs;

COMMENT ON VIEW production_jobs IS
  'Read compatibility alias for generation_jobs using production automation terminology. Writes remain on generation_jobs until service migration is approved.';
