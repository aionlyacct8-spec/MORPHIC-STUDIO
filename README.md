# Morphic Studio

**Create Once. Evolve Forever.**

Morphic Studio is an AI-assisted story, comic, and animation workspace. This repository currently contains a Node/Express API, PostgreSQL schema/migrations, and a static HTML frontend served by the API process.

## Current Stack

- **Backend:** Node.js 20, Express 4, ESM modules
- **Database:** PostgreSQL via `pg`
- **Frontend:** Static HTML pages with Tailwind CSS CDN and inline browser JavaScript
- **AI:** Provider gateway for OpenAI, OpenRouter, and Gemini-compatible chat generation
- **Deployment:** Replit workflow on port `5000`

## Getting Started

```bash
npm install
cp .env.example .env
# Edit DATABASE_URL and any AI provider keys you need.
npm run setup
npm start
```

The app listens on `PORT` or `5000` by default.

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
| `AI_PROVIDER` | No | `openai`, `openrouter`, or `gemini`; defaults to `openai`. |
| `OPENAI_API_KEY` | Provider-dependent | Required when using OpenAI. |
| `OPENROUTER_API_KEY` | Provider-dependent | Required when using OpenRouter. |
| `GEMINI_API_KEY` | Provider-dependent | Required when using Gemini. |
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



## Planning Documents

- [Morphic Studio Master Roadmap](./MORPHIC_STUDIO_MASTER_ROADMAP.md) tracks the cleanup tasks, character consistency/asset-library next step, and phased build plan for the AI comic and animation production pipeline.

## Phase 1 Workflow

The first production workflow is **Story Intake → Saved Production Plan**:

1. Paste a script into the dashboard Phase 1 Story Intake panel.
2. The backend creates or updates a script record.
3. The planner breaks the text into scenes, a chapter, comic pages, reusable comic panels, and continuity rules.
4. The plan is stored in PostgreSQL so later comic, motion-comic, voice, and animation tools reuse the same records instead of regenerating from scratch.
5. This deterministic planner works without an AI key; OpenRouter can be added next to improve analysis quality.

## Story Production Foundation

The core product direction is now represented in the backend data model:

1. **Shared Asset Library** stores reusable characters, outfits, backgrounds, voices, props, panels, poses, and animation-related files.
2. **Project Brain** stores story/world/continuity memory so generations can stay consistent.
3. **Production Workflow APIs** organize reusable assets into chapters, comic pages, comic panels, motion-comic slideshow sequences, voice profiles, and animation rig/preset assets.
4. **Comic and animation paths share the same project assets** so characters, locations, props, voices, and rules are not regenerated from scratch every chapter.

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
| `GET/POST` | `/api/projects/:projectId/stories/scripts` | List or create scripts. |
| `GET/POST` | `/api/projects/:projectId/graph/nodes` | Read or upsert knowledge graph nodes. |
| `POST` | `/api/projects/:projectId/jobs/dispatch` | Dispatch an AI orchestration job. |
| `GET/POST` | `/api/projects/:projectId/scenes` | List or create scenes. |
| `GET/POST` | `/api/projects/:projectId/episodes` | List or create episodes. |
| `POST` | `/api/projects/:projectId/production/intake/plan` | Phase 1 script intake: save script, chapter, scenes, pages, panels, and continuity rules. |
| `GET/POST` | `/api/projects/:projectId/production/chapters` | List or create story/comic chapters. |
| `GET/POST` | `/api/projects/:projectId/production/comic/pages` | List or create comic pages. |
| `GET/POST` | `/api/projects/:projectId/production/comic/panels` | List or create reusable comic panels linked to scenes/assets. |
| `GET/POST` | `/api/projects/:projectId/production/voices` | List or create reusable character voice profiles. |
| `GET/POST` | `/api/projects/:projectId/production/motion/sequences` | List or create slideshow/motion-comic sequences. |
| `GET/POST` | `/api/projects/:projectId/production/animation/assets` | List or create reusable animation rigs, body parts, poses, and presets. |

## Security Status

This codebase is still a prototype. Optional API-key protection can be enabled with `REQUIRE_API_KEY=true`, but full user authentication, sessions/JWTs, role-based authorization, and per-user project ownership enforcement are still not implemented.
