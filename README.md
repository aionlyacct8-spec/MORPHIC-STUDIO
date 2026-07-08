# Morphic Studio

**Create Once. Evolve Forever.**

Morphic Studio is an AI-assisted animation and comic production platform. It is not a one-click AI video generator; it is a production-automation workspace where creators direct the work, reusable assets carry continuity forward, and AI assists with repetitive production tasks. This repository currently contains a Node/Express API, PostgreSQL schema/migrations, and a static HTML frontend served by the API process.

## Current Stack

- **Backend:** Node.js 20, Express 4, ESM modules
- **Database:** PostgreSQL via `pg`
- **Frontend:** Static HTML pages with Tailwind CSS CDN and inline browser JavaScript
- **AI:** Provider gateway for OpenAI, OpenRouter, and Gemini-compatible assistants that support production planning, asset organization, and workflow automation
- **Deployment:** Platform-neutral Node web process via `npm start` / `Procfile`; configurable with `HOST` and `PORT`

## Getting Started

```bash
npm install
cp .env.example .env
# Edit DATABASE_URL and any AI provider keys you need.
npm run setup
npm start
```

The app listens on `PORT` or `5000` by default and binds to `HOST` or `0.0.0.0`.


## Local Preview

If Chrome shows `localhost refused to connect` or `127.0.0.1 refused to connect`, the Node server is not running. Start the preview server first and keep that terminal open:

```bash
npm install
npm run preview
```

Then open:

```text
http://localhost:5000/preview.html
```

The app can render in lightweight preview mode without a database, but real projects, saved story brain data, characters, worlds, assets, and production records need PostgreSQL. To connect Supabase:

1. Create a Supabase project.
2. In Supabase, open **Project Settings → Database** and copy the pooled PostgreSQL connection string.
3. Copy `.env.example` to `.env`.
4. Replace `DATABASE_URL` in `.env` with the Supabase connection string. Use the URL-encoded password Supabase provides.
5. Run `npm run setup` once to create tables and run migrations.
6. Run `npm run preview` and open `http://localhost:5000/preview.html`.



### Supabase SQL Editor setup without terminal access

If you cannot run `npm run setup`, open Supabase **SQL Editor**, create a new query, paste `database/supabase_setup.sql`, and run it. That SQL bundle applies the same base schema and migrations used by the Node setup script.

## Sharing a Preview With Other People

`localhost` only works in the browser that is running on the same machine or cloud workspace as the Node server. It is not a shareable internet URL. If someone else needs to view the site, deploy the app or use your cloud IDE's forwarded port / preview URL for port `5000`. The shared URL will look like an HTTPS workspace/deployment URL, not `localhost`.

For deployment, keep the same web process:

```bash
npm start
```

The included `Procfile` also declares the production web process as `web: npm start`, so Node hosts that understand Procfiles can expose the app publicly after installing dependencies and setting environment variables.

## Scripts

| Script | Purpose |
|---|---|
| `npm start` | Run the API/static frontend server. |
| `npm run dev` | Run the server with `nodemon`. |
| `npm run setup` | Apply base schema and run migrations. It does not seed demo projects by default. |
| `npm run migrate` | Run pending SQL migrations only. |
| `npm run check` | Syntax-check backend and database JavaScript files. |

## Environment Variables

See `.env.example` for the full template.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes for DB-backed endpoints | PostgreSQL connection string. |
| `PORT` | No | Server port; defaults to `5000`. |
| `HOST` | No | Server bind address; defaults to `0.0.0.0`. |
| `AI_PROVIDER` | No | `openai`, `openrouter`, or `gemini`; defaults to `openai`. |
| `OPENAI_API_KEY` | Provider-dependent | Required when using OpenAI. |
| `OPENROUTER_API_KEY` | Provider-dependent | Required when using OpenRouter. |
| `GEMINI_API_KEY` | Provider-dependent | Required when using Gemini. |
| `APP_URL` | Recommended | Public app URL used in AI provider metadata; defaults locally to `http://localhost:5000` when unset. |
| `CORS_ORIGIN` | No | Comma-separated allowed origins. If unset, CORS remains permissive for local/prototype use. |
| `REQUIRE_API_KEY` / `API_KEY` | No | Optional API-key guard for hardened deployments. |

## Repository Layout

```text
backend/      Express server, routes, controllers, services, middleware, AI agents
database/     PostgreSQL base schema, migrations, setup, migration runner
frontend/     Static HTML studio pages
.agents/      Agent memory/architecture notes
attached_assets/  Product/specification assets used during earlier planning
```

## Deployment Guide

See [Deployment Guide](./DEPLOYMENT.md) for platform-neutral runtime, environment, database, and process setup instructions.

## Planning Documents

- [Production Automation Architecture](./docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md) defines the current product direction: AI-assisted animation and comic production automation, not AI video generation.
- [Comic Production Automation Architecture](./docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md) defines the comic-specific production system: story intelligence, panel planning, camera/composition assistance, dialogue placement, reading flow, comic timeline, export, and reuse-first asset retrieval.
- [Architecture Compatibility Report](./docs/ARCHITECTURE_COMPATIBILITY_REPORT.md) reviews existing systems against the updated architecture and identifies compatible, partial, conflicting, deferred, and technical-debt areas.
- [Core Data Model](./docs/CORE_DATA_MODEL.md) is the canonical implementation reference for entities, relationships, output-record contracts, and additive data-model work.
- [Open Source Integration Plan](./OPEN_SOURCE_INTEGRATION_PLAN.md) defines evaluation rules for external components, and [Open Source Registry](./docs/OPEN_SOURCE_REGISTRY.md) records adopted/planned components, licenses, integration status, adapter status, ownership, and notes.
- [AI Session Protocol](./docs/AI_SESSION_PROTOCOL.md) and root [AGENTS.md](./AGENTS.md) define the required workflow for every future AI coding session.
- [Root Roadmap](./ROADMAP.md) and [Living Roadmap](./docs/LIVING_ROADMAP.md) are the current state trackers for milestones, active work, blockers, deferred items, decisions, integrations, and known issues.
- [AI Handoff Guide](./docs/AI_HANDOFF.md) and [Session Handoff](./SESSION_HANDOFF.md) help future AI coding agents resume work quickly.
- [Development Log](./DEVELOPMENT_LOG.md) records completed architecture and implementation sessions.
- [Morphic Studio Master Roadmap](./MORPHIC_STUDIO_MASTER_ROADMAP.md) tracks the cleanup tasks, character consistency/asset-library next step, and phased build plan for the comic and animation production pipeline.

## Phase 1 Workflow

The first production workflow is **Story Intake → Saved Production Plan**:

1. Paste a script into the dashboard Phase 1 Story Intake panel.
2. The backend creates or updates a script record.
3. The planner breaks the text into scenes, a chapter, comic pages, reusable comic panels, and continuity rules.
4. The plan is stored in PostgreSQL so later comic, storyboard, voice, rigging, timeline, and animation tools reuse the same records instead of recreating assets from scratch.
5. This deterministic planner works without an AI key; OpenRouter can be added next to improve analysis quality.

## Story Production Foundation

The core product direction is now represented in the backend data model:

1. **Shared Asset Library** stores reusable characters, outfits, backgrounds, voices, props, panels, poses, and animation-related files.
2. **Project Brain** stores story/world/continuity memory so AI-assisted production work stays consistent.
3. **Production Workflow APIs** organize reusable assets into chapters, comic pages, comic panels, motion-comic slideshow sequences, voice profiles, and animation rig/preset assets.
4. **Comic and animation paths share the same project assets** so characters, locations, props, voices, rigs, timelines, and rules are not recreated from scratch every chapter.

## API Overview

All active product APIs are project-scoped unless noted.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api` | API discovery/status. |
| `GET` | `/api/health` | Runtime, provider, and database configuration health. |
| `GET/POST` | `/api/projects` | List or create projects. |
| `GET/PATCH/DELETE` | `/api/projects/:id` | Read, update, or soft-delete a project. |
| `GET` | `/api/projects/:projectId/brain` | Read Project Brain. |
| `PUT/PATCH` | `/api/projects/:projectId/brain/sections/:section` | Merge a Project Brain section. |
| `GET/POST` | `/api/projects/:projectId/brain/memory` | Read or append AI memory. |
| `GET` | `/api/projects/:projectId/characters` | List characters. |
| `POST` | `/api/projects/:projectId/characters` | Create a character. |
| `GET/POST` | `/api/projects/:projectId/worlds` | List or create worlds. |
| `GET/POST` | `/api/projects/:projectId/assets` | List or create assets. |
| `GET/POST` | `/api/projects/:projectId/assets/:assetId/versions` | List or create non-destructive asset versions. |
| `GET` | `/api/projects/:projectId/assets/:assetId/storage` | List storage objects linked to an asset. |
| `GET/POST` | `/api/projects/:projectId/assets/:assetId/relationships` | List or create reusable asset relationships. |
| `GET/POST` | `/api/projects/:projectId/stories/scripts` | List or create scripts. |
| `GET/POST` | `/api/projects/:projectId/graph/nodes` | Read or upsert knowledge graph nodes. |
| `POST` | `/api/projects/:projectId/jobs/dispatch` | Dispatch an AI orchestration job. |
| `GET/POST` | `/api/projects/:projectId/scenes` | List or create scenes. |
| `GET/POST` | `/api/projects/:projectId/episodes` | List or create episodes. |
| `POST` | `/api/projects/:projectId/production/intake/plan` | Phase 1 script intake: save script, chapter, scenes, pages, panels, and continuity rules. |
| `GET/POST` | `/api/projects/:projectId/production/chapters` | List or create story/comic chapters. |
| `GET/POST` | `/api/projects/:projectId/production/comic/pages` | List or create comic pages. |
| `GET/POST` | `/api/projects/:projectId/production/characters/:characterId/rigs` | List or create reusable character rigs linked to shared assets. |
| `GET/POST` | `/api/projects/:projectId/production/characters/:characterId/expressions` | List or create reusable character expressions. |
| `GET/POST` | `/api/projects/:projectId/production/characters/:characterId/poses` | List or create reusable character poses. |
| `GET/POST` | `/api/projects/:projectId/production/characters/:characterId/clothing-sets` | List or create reusable character clothing sets. |
| `GET/POST` | `/api/projects/:projectId/production/scenes/:sceneId/placements` | List or create scene placements referencing shared assets. |
| `GET/POST` | `/api/projects/:projectId/production/storyboards/asset-references` | List or create storyboard references to shared assets. |
| `GET/POST` | `/api/projects/:projectId/production/comic/panels` | List or create reusable comic panels linked to scenes/assets. |
| `GET/POST` | `/api/projects/:projectId/production/comic/speech-bubbles` | List or create comic speech bubbles and lettering records. |
| `GET/POST` | `/api/projects/:projectId/production/animation/timelines` | List or create animation timelines. |
| `GET/POST` | `/api/projects/:projectId/production/animation/timelines/:timelineId/keyframes` | List or create animation keyframes. |
| `GET/POST` | `/api/projects/:projectId/production/voices` | List or create reusable character voice profiles. |
| `GET/POST` | `/api/projects/:projectId/production/motion/sequences` | List or create slideshow/motion-comic sequences. |
| `GET/POST` | `/api/projects/:projectId/production/animation/assets` | List or create reusable animation rigs, body parts, poses, and presets. |

## Security Status

This codebase is still a prototype. Optional API-key protection can be enabled with `REQUIRE_API_KEY=true`, but full user authentication, sessions/JWTs, role-based authorization, and per-user project ownership enforcement are still not implemented.
