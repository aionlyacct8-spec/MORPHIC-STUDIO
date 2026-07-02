# Morphic Studio — Architecture Audit & Implementation Report
*Phase 15 Final Report — Generated 2026-07-02*

---

## What Already Existed (Pre-Audit)

| Component | Status |
|---|---|
| Express server (ESM, port 5000) | ✅ Working |
| 9-table PostgreSQL schema | ✅ Working |
| AI Gateway (OpenAI + OpenRouter, retry, fallback) | ✅ Working |
| Story, Character, World, Storyboard agents | ✅ Working |
| Project Brain (getBrain, updateSection, rebuildContext, appendMemory) | ✅ Partial |
| 6 route groups (projects, brain, characters, worlds, assets, stories) | ✅ Working |
| Event Bus (basic EventEmitter) | ✅ Partial |
| Asset versioning (asset_versions table + controller) | ✅ Working |
| Migration runner (database/migrate.js) | ✅ Working |
| Winston structured logger | ✅ Working |
| Error handler middleware | ✅ Working |

---

## What Was Missing

### Database
- No `users` table (no auth at all)
- No `scenes` or `episodes` tables
- No explicit `relationships` table (was JSONB only)
- No `knowledge_graph_nodes` / `knowledge_graph_edges` tables
- No `timeline_events` table (was JSONB in brain)
- No `continuity_rules` table (was JSONB in brain)
- No `style_guides` table (was JSONB in brain)
- No `generation_jobs` table (AI jobs untracked)
- No `exports` table
- No `brain_versions` table (no history)
- No soft delete columns on any table
- No brain locking columns

### Brain Service
- No context compression (emitted full raw data)
- No version history
- No brain locking to prevent concurrent writes
- No memory search
- No memory expiration / pruning

### AI Layer
- No orchestrator (agents called directly from controllers)
- No job tracking (AI calls invisible, no cost data)
- No response caching
- No Gemini provider
- No provider health tracking
- No cost estimation

### API Layer
- No pagination on any list endpoint
- No rate limiting
- No `deleted_at` soft delete on any entity
- Unknown `/api/*` paths returned HTML 200 (now returns JSON 404)
- Missing `DELETE` on worlds and scripts

### Infrastructure
- No rate limiting
- Port documented as 3000 in replit.md (was actually 5000)

---

## What Was Created

### `database/migrations/002_extended_schema.sql`
13 new tables with UUID PKs, timestamps, indexes, and cascade rules:
- `users` (with soft delete)
- `scenes` (with soft delete)
- `episodes` (with soft delete)
- `relationships` (explicit graph edges)
- `knowledge_graph_nodes`
- `knowledge_graph_edges`
- `timeline_events`
- `continuity_rules`
- `style_guides`
- `generation_jobs`
- `exports`
- `brain_versions`
- Soft delete columns on `assets`, `characters`, `worlds`, `scripts`, `projects`
- Brain locking columns (`is_locked`, `lock_reason`, `current_version`)
- New brain sections (`lore`, `notes`, `generation_history`, `relationships_map`)

### `backend/agents/orchestrator.js`
Full multi-agent coordinator:
- Routes tasks to the correct specialist agent by task type
- Automatically injects Project Brain context into every request
- Creates + updates `generation_jobs` records (started/complete/failed)
- 5-minute in-memory response cache (keyed by agent + project + input hash)
- Parallel dispatch via `dispatchParallel()`
- Cost estimation per model
- Auto-appends agent-flagged facts to memory
- Emits `ai:completed` / `ai:failed` events

### `backend/services/knowledgeGraphService.js`
Full knowledge graph CRUD:
- `upsertNode` / `getNode` / `listNodes` / `deleteNode`
- `upsertEdge` (auto-creates nodes if missing)
- `listEdges` / `getNeighbors` / `getFullGraph`
- `syncEntityToGraph` convenience method (called on character/world/location create)
- UNIQUE constraints prevent duplicate edges

### `backend/services/generationJobService.js`
Job tracking service (list, get, cancel, stats).

### `backend/middleware/rateLimiter.js`
In-memory rate limiting (no Redis needed):
- `generalLimiter`: 200 req / 15 min (all API routes)
- `aiLimiter`: 20 req / 1 min (AI-heavy endpoints)
- `strictLimiter`: 5 req / 1 min (reserved for sensitive actions)
- Namespaced keys prevent counter collisions between limiter instances
- Returns `X-RateLimit-*` headers on every response

### New Controllers
- `backend/controllers/knowledgeGraphController.js`
- `backend/controllers/generationJobsController.js`
- `backend/controllers/scenesController.js` (also handles episodes)

### New Routes
- `backend/routes/knowledgeGraph.js` — mounted at `/api/projects/:id/graph`
- `backend/routes/generationJobs.js` — mounted at `/api/projects/:id/jobs`
- `backend/routes/scenes.js` — `/scenes` + `/episodes` under project

### `GET /api/health`
New endpoint returning: status, uptime, memory usage, AI provider health, DB status.

---

## What Was Improved

### `backend/services/brainService.js`
- **Context compression**: capped at 4000 chars, prioritizes key facts over raw dumps
- **Top-importance memories** now injected into every AI context (importance ≥ 7)
- **Brain locking**: `lockBrain()` / `unlockBrain()` / `assertUnlocked()` prevent concurrent AI writes
- **Version history**: every section update snapshots the full brain to `brain_versions`
- **Version restore**: `restoreBrainVersion(projectId, num)` rolls back to any snapshot
- **Memory search**: `searchMemory(projectId, term)` keyword search over `ai_memory`
- **Memory expiration**: `expireMemory()` prunes low-importance old entries
- `VALID_SECTIONS` expanded to include `lore`, `notes`, `generation_history`, `relationships_map`

### `backend/agents/gateway.js`
- **Gemini provider** added (REST API, system instruction support, token count mapping)
- **Fallback chain** now: primary → secondary → Gemini (3-provider chain)
- **Provider health tracking**: marks unhealthy after 3 failures, skips in chain
- **Cost estimation** per model (USD per 1K tokens logged on every call)
- `getProviderHealth()` exported for `/api/health`

### `backend/services/eventBus.js`
- **30+ typed events** (up from 10) covering all entity lifecycle events
- Dev-mode warning for unknown event names
- `onceEvent()` returns a Promise
- Auto-wiring: `knowledge_graph:node_upserted` → `knowledge_graph:updated`
- Full event contract documented as JSDoc

### All List Controllers (projects, characters, worlds, assets, scripts)
- **Pagination**: `?limit=` + `?offset=` on every list endpoint, returns `total` count
- **Filtering**: `?status=`, `?role=`, `?type=`, `?search=` where appropriate
- **Soft delete**: `deleted_at IS NULL` guard on all queries; DELETE now sets `deleted_at`

### `backend/controllers/brainController.js`
New handlers: `setBrainSectionHandler`, `searchMemoryHandler`, `expireMemoryHandler`, `getBrainVersionsHandler`, `restoreBrainVersionHandler`, `lockBrainHandler`, `unlockBrainHandler`

### `backend/routes/brain.js`
New routes: `PUT /sections/:section/set`, `GET /memory/search`, `DELETE /memory/expire`, `GET /versions`, `POST /versions/:num/restore`, `POST /lock`, `POST /unlock`

### Characters + Worlds Controllers
Now call `syncEntityToGraph()` on create to keep the Knowledge Graph in sync automatically.

### `backend/routes/stories.js` + `backend/routes/worlds.js`
`DELETE` endpoints added for scripts and worlds.

### `backend/server.js`
- Rate limiting applied globally to `/api`
- `aiLimiter` applied to AI endpoints
- All 3 new route groups mounted
- `/api/health` endpoint added

---

## What Was Intentionally Left Unchanged

| Item | Reason |
|---|---|
| `database/schema.sql` | Backward compatible — all additions in migration 002 |
| `database/setup.js` | Seeding logic unchanged |
| Frontend HTML files | Out of scope for this phase |
| `backend/agents/storyAgent.js` | Already functional |
| `backend/agents/characterAgent.js` | Already functional (export name `generateDNA` preserved) |
| `backend/agents/worldAgent.js` | Already functional |
| `backend/agents/storyboardAgent.js` | Already functional |
| Authentication / sessions | No user auth flow exists yet — requires `users` table first |

---

## Remaining Technical Debt

| Priority | Item |
|---|---|
| 🔴 High | **Authentication**: No login/signup flow. `users` table exists but no JWT/session auth middleware. All endpoints are effectively public. |
| 🔴 High | **Database schema initialization**: `002_extended_schema.sql` must be run via `node database/migrate.js` after provisioning a PostgreSQL database. Until then, all new tables (KG, scenes, jobs, etc.) do not exist. |
| 🟡 Medium | **IDOR / ownership validation**: No user ID attached to requests, so one project's data can be read/modified by any caller. Requires auth first. |
| 🟡 Medium | **AI streaming**: `callAI` currently buffers full responses. Long-form generation (scripts, world bibles) would benefit from SSE streaming. |
| 🟡 Medium | **File storage**: `file_url` and `thumbnail` fields exist but no storage provider is connected (Replit object storage / S3). |
| 🟢 Low | **RAG / vector search**: `embedding` column placeholder exists on KG nodes but not populated. Semantic memory search requires a vector store (pgvector or external). |
| 🟢 Low | **Redis / distributed rate limiting**: Current rate limiter is in-memory per-process. Would need Redis for horizontal scaling. |
| 🟢 Low | **Dialogue, Comic, Animation, Voice, Music, Export agents**: Spec mentions these; only stub types exist in the event bus contract. |
| 🟢 Low | **Frontend API integration**: All HTML pages make direct calls only if wired; most still use placeholder/mock data. Requires per-page audit. |

---

## Future Recommendations

1. **Add Replit PostgreSQL** → run `node database/migrate.js` → all 22 tables become live
2. **Implement JWT auth** using the `users` table — add `Authorization: Bearer <token>` middleware before ownership checks
3. **Connect Replit Object Storage** for actual asset file uploads
4. **Enable AI providers** via Secrets: `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
5. **Add pgvector** for semantic memory search across the knowledge graph
6. **Build the remaining specialist agents** (Dialogue, Comic, Animation, Voice)
7. **Wire frontend pages** to call real API endpoints instead of mock data
