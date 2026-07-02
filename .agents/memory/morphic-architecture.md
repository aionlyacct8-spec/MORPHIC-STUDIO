---
name: Morphic Studio Architecture
description: Layered architecture, backend/frontend/DB/AI service boundaries — current state after audit
---

# Morphic Studio Architecture

## Stack
- **Backend**: Node.js ESM + Express, port 5000
- **Frontend**: Standalone HTML pages (Tailwind CDN, no build step)
- **DB**: PostgreSQL via `pg` pool (`database/schema.sql` + migrations)
- **AI**: Provider-agnostic gateway → OpenAI / OpenRouter / Gemini

## File Structure
```
backend/
  server.js              — entry point, all routes mounted here
  agents/
    gateway.js           — callAI() with 3-provider chain + cost logging
    orchestrator.js      — dispatch() routes tasks to agents, tracks jobs
    storyAgent.js        — analyzeScript, generateOutline, expandScene
    characterAgent.js    — generateDNA (NOT generateCharacterDNA!), evolveCharacter
    worldAgent.js        — generateWorldBible, generateLocation, buildTimeline
    storyboardAgent.js   — generatePanels, refinePanels
  controllers/           — HTTP handlers
  services/
    db.js                — pg pool: query(), getTransaction()
    brainService.js      — brain CRUD, locking, versioning, context compression
    eventBus.js          — 30+ typed events, singleton MorphicEventBus
    knowledgeGraphService.js — upsertNode/Edge, getFullGraph, getNeighbors
    generationJobService.js  — listJobs, getJob, cancelJob, getJobStats
  routes/                — Router files
  middleware/
    errorHandler.js      — errorHandler, asyncWrap, createError
    rateLimiter.js       — in-memory rate limiting, namespaced by windowMs:max
  utils/logger.js        — Winston logger, logger.child(name)

database/
  schema.sql             — 9 original tables
  migrations/001_*.sql   — art_direction + asset_versions
  migrations/002_*.sql   — 13 new tables (scenes, episodes, KG, jobs, etc.)
  migrate.js             — idempotent migration runner
  setup.js               — init + seed
```

## Route Map
| Prefix | Router |
|---|---|
| `/api/projects` | projectsRouter |
| `/api/projects/:id/brain` | brainRouter |
| `/api/projects/:id/characters` | charactersRouter |
| `/api/projects/:id/worlds` | worldsRouter |
| `/api/projects/:id/assets` | assetsRouter |
| `/api/projects/:id/stories` | storiesRouter |
| `/api/projects/:id/graph` | knowledgeGraphRouter |
| `/api/projects/:id/jobs` | generationJobsRouter |
| `/api/projects/:id` | scenesRouter (/scenes + /episodes) |

## Key Design Rules
- **All AI calls** go through `callAI()` in gateway.js — never raw fetch to LLM APIs
- **Orchestrator dispatch** is the preferred entry point for AI tasks from controllers
- **characterAgent exports `generateDNA`** (not `generateCharacterDNA`) — orchestrator METHOD_MAP handles this
- **Soft delete everywhere** — `deleted_at IS NULL` guard on all queries after migration 002
- **Rate limiter instances** must use unique (windowMs, max) pairs — keys are namespaced to prevent counter collision
- **Brain context** is capped at 4000 chars before injection into AI calls
- **Knowledge graph sync** happens automatically on character/world/location create (non-blocking, catches silently until migration 002 is applied)

## Critical: Migration 002 Required
Until `node database/migrate.js` is run (needs DATABASE_URL), the following tables do not exist:
scenes, episodes, relationships, knowledge_graph_nodes, knowledge_graph_edges,
timeline_events, continuity_rules, style_guides, generation_jobs, exports, brain_versions, users

The server starts without them but KG sync calls are wrapped in `.catch(() => {})` so they fail silently.

## What Does NOT Exist Yet
- Authentication (JWT/sessions) — users table exists but no auth middleware
- File storage (no Replit Object Storage / S3 connected)
- Vector/semantic search (embedding column on KG nodes is a placeholder)
- Dialogue, Comic, Animation, Voice, Music, Export agents
