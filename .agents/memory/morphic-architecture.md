---
name: Morphic Studio Architecture
description: Full backend architecture — layers, file structure, API shape, DB schema, AI gateway
---

## Stack
- Node.js 20 + Express (ESM modules — `"type": "module"` in package.json)
- PostgreSQL via `pg` pool
- OpenAI API (default) or OpenRouter — swappable via `AI_PROVIDER` env var
- Static frontend served from `frontend/` by Express

## Backend Structure (v2 — modular)
```
backend/
  server.js              ← mounts all routers, serves static, starts on PORT (default 5000)
  agents/
    gateway.js           ← callAI({systemPrompt, messages, model, maxTokens, provider})
    storyAgent.js        ← analyzeScript, generateOutline, expandScene
    characterAgent.js    ← generateDNA, evolveCharacter, suggestRelationships
    worldAgent.js        ← generateWorldBible, generateLocation, buildTimeline
    storyboardAgent.js   ← generatePanels, refinePanels
  services/
    db.js                ← pool singleton, query(), transaction()
    brainService.js      ← getBrain, updateSection, setBrainSection, appendMemory, buildContext
  controllers/
    brainController.js
    projectsController.js
    charactersController.js
    worldsController.js
    assetsController.js
    storiesController.js
  routes/
    projects.js
    brain.js             ← mergeParams: true (inherits :projectId)
    characters.js        ← mergeParams: true
    worlds.js            ← mergeParams: true
    assets.js            ← mergeParams: true
    stories.js           ← mergeParams: true
  middleware/
    errorHandler.js      ← asyncWrap(fn), createError(status, msg), errorHandler middleware
    validate.js          ← requireBody(...fields), requireParams(...params)
  utils/
    logger.js            ← logger.child('module') for namespaced logging
database/
  schema.sql             ← full schema, run once
  setup.js               ← applies schema + seeds default project
```

## API Shape
All endpoints are project-scoped:
```
/api/projects
/api/projects/:projectId/brain
/api/projects/:projectId/brain/sections/:section   PUT
/api/projects/:projectId/brain/memory              GET POST
/api/projects/:projectId/characters
/api/projects/:projectId/characters/:id/evolve     POST
/api/projects/:projectId/characters/relationships/suggest GET
/api/projects/:projectId/worlds
/api/projects/:projectId/worlds/:worldId/locations POST
/api/projects/:projectId/worlds/locations/all      GET
/api/projects/:projectId/assets
/api/projects/:projectId/assets/stats              GET
/api/projects/:projectId/stories/scripts
/api/projects/:projectId/stories/scripts/:id/analyze POST
/api/projects/:projectId/stories/outline           POST
```

## AI Gateway
- `callAI({ systemPrompt, messages, model, maxTokens, provider })` — unified interface
- `parseJSON(text)` — strips markdown fences, safe JSON extraction from AI output
- Provider config in `PROVIDERS` map — add new providers without touching agents
- Default provider: `process.env.AI_PROVIDER || 'openai'`
- OpenAI key: `OPENAI_API_KEY`; OpenRouter key: `OPENROUTER_API_KEY`

## Project Brain
- One `project_brain` row per project (auto-created on project creation)
- Sections: `story_bible`, `character_bible`, `world_bible`, `timeline`, `continuity_rules`, `voice_profiles`, `style_guide`
- `memory_context` TEXT — compressed context string injected into every AI agent call
- `brainService.buildContext(projectId)` — call before any agent invocation
- `brainService.appendMemory(projectId, {...})` — agents log facts here after acting

## Database Schema (key tables)
- `projects` — UUID PK, title, genre, format, style, status
- `project_brain` — UNIQUE(project_id), all bible sections as JSONB, memory_context TEXT
- `characters` — UUID, visual_dna JSONB, personality JSONB, voice_profile JSONB, relationships JSONB, outfit_history JSONB, arc_progress INT
- `character_history` — evolution log with before/after JSONB snapshots
- `worlds` — UUID, rules JSONB[], atmosphere JSONB, history JSONB[]
- `locations` — nested under worlds, visual_preset JSONB for artist reference
- `assets` — central library: type (character|background|prop|audio|panel|style|voice), linked_id, usage_count
- `ai_memory` — per-project agent memory log, importance 1–10
- `storyboards` — panel_data JSONB[], agent_context JSONB snapshot

## Key Decisions
**Why mergeParams: true on all sub-routers:** Routes are nested under `/api/projects/:projectId/*`. Without mergeParams, controllers can't see `:projectId` from the parent router.

**Why asyncWrap:** Express 4 doesn't catch async errors automatically. Every async route handler must be wrapped.

**Why brain context is injected into every agent call:** Agents are stateless functions. The brain is the persistent memory. Calling `buildContext()` before each agent call ensures continuity without agents needing DB access directly.

**Why assets have `linked_id`:** Assets can optionally link to the entity they represent (character portrait → characters.id, background → locations.id) for cross-referencing in the UI.
