---
name: Morphic Studio Database & Infrastructure
description: Database schema, storage strategy, auth model, security, deployment pipeline, and observability
---

# Morphic Studio Database & Infrastructure

## Current Database Schema (live in repo)
```sql
-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  appearance TEXT,
  personality TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storyboards table
CREATE TABLE IF NOT EXISTS storyboards (
  id SERIAL PRIMARY KEY,
  script_id INTEGER REFERENCES scripts(id),
  panel_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
Note: `characters` table in server.js uses `description` column (JSON blob), but setup.js creates `appearance` + `personality` columns — minor schema mismatch to reconcile.

## Planned Full Schema (from Database Architecture spec)
Key planned tables beyond current:
- `users` — auth, profile, subscription tier
- `projects` — top-level project container with Project DNA
- `project_brain` — per-project AI memory (JSONB)
- `story_bible` — characters, locations, lore entries (linked to projects)
- `assets` — unified asset registry with type, URL, version, metadata
- `asset_versions` — version history per asset
- `scenes` / `panels` — structured scene/panel data linked to scripts
- `characters` (expanded) — full Character DNA, expression library refs, voice profile
- `locations` — World Builder entries
- `animation_timelines` — keyframe data per animation project
- `workflow_jobs` — async job queue records
- `ai_usage_log` — audit log of every AI call (provider, model, tokens, cost)
- `sessions` — user session management
- `teams` / `team_members` / `team_roles` — collaboration
- `exports` — export job records with download URLs

## Storage Strategy
- **Philosophy:** Files are managed creative assets with metadata, relationships, and history — not raw blobs
- **Permanent until intentional removal; reuse over regeneration**
- **Storage Buckets by Category:**
  - Project Assets (Scripts, Bible entries)
  - Character (Portraits, Expression sheets, Pose refs)
  - Environment (Location images, Maps)
  - Props
  - Comic (Generated panel images, page PDFs)
  - Animation (Rigs, frame sequences)
  - Audio (Voice clips, Music, SFX)
  - Export (Final PDFs, MP4s, delivery packages)
- **Version Control:** Every significant modification creates a new version (author + timestamp + summary)
- **Deduplication:** Hash-based detection prevents storing identical files twice
- **On Replit:** Use Replit Object Storage or external bucket (S3-compatible) for file storage

## Authentication & Identity
- **Phase 1 (current plan):** Email/Password + Google OAuth
- **Future phases:** GitHub OAuth, Apple Sign-In, Passkeys, Enterprise SSO
- **Flow:** Registration → Email verification → Onboarding → Personal Workspace creation
- **Sessions:** Session ID + User ID + Device/IP tracking + revocation support + idle timeouts
- **JWT:** Access tokens (short-lived) + Refresh tokens (longer-lived)
- **Required env var:** `SESSION_SECRET` (already configured in Replit secrets)

## Security Model
- **Principles:** Zero Trust, Least Privilege, Security by Default, Privacy First, Defense in Depth
- **Authorization:** Role-Based Access Control (RBAC)
- **Roles:** Owner, Administrator, Project Manager, Writer, Artist, Animator, Voice Director, Reviewer, Viewer
- **Data Protection:** TLS 1.3 in transit; DB + object storage encrypted at rest; bcrypt password hashing
- **Secret Management:** All credentials via environment variables — never in code
- **AI Security:** Gateway enforces prompt validation, context filtering, usage quotas, provider isolation
- **Privacy:** User creative data NOT used for AI training without explicit consent; data export/deletion supported
- **Currently configured secrets:** SESSION_SECRET ✓ | DATABASE_URL ✗ | OPENROUTER_API_KEY ✗

## Deployment & Infrastructure
- **Platform:** Replit (primary — development + production)
- **Pipeline:** Dev → Testing → Staging (future) → Production
- **Git flow:** Feature branch → Dev → Code review → Merge → Deploy
- **Configuration:** All config via environment variables (no secrets in code)
- **Architecture:** Cloud-first, modular layers:
  Frontend Browser → Backend API → Workflow Engine → AI Services → Storage/DB → Export Pipeline
- **Scalability:** Build Small / Design Big — monolith first, interfaces designed for future service extraction

## Observability & Monitoring
- **Philosophy:** "Observe Everything," Correlation over isolation, Actionable metrics
- **Telemetry:** Frontend + Backend structured logs, API latency metrics, AI token consumption metrics, queue depth
- **Distributed Tracing:** Globally unique Trace IDs correlating frontend → backend → AI provider
- **Health Monitoring:** Application availability, API responsiveness, AI provider status checks
- **AI Analytics:** Model latency, response quality scores, token efficiency, cost per capability, execution success rates
- **Alerting:** Anomaly detection on error rates, latency spikes, cost overruns

## Testing Framework
- **Layers:** Unit, Integration, E2E, Regression, Performance, Security
- **AI-specific validation:** Prompt construction correctness, asset consistency checks, creative integrity verification
- **CI:** Automated test runs on every PR before merge
