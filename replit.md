# Morphic Studio

**"Create Once. Evolve Forever."**

An AI-powered creative OS for storytelling — enabling individual creators and small teams to produce professional-quality stories, comics, and animations with persistent AI memory that never forgets your characters, world, or creative decisions.

## How to Run

```bash
npm install
npm start
```

The app runs on port **5000**. The workflow `Start application` handles this automatically.

## Project Structure

```
backend/
  server.js          — Express server; serves frontend + REST API
database/
  setup.js           — Initialize PostgreSQL schema (run once)
frontend/
  index.html              — Landing page
  signin.html             — Authentication
  new-project.html        — New project wizard (3-step)
  creator-profile.html    — Onboarding step 1: creator persona
  goals-atmosphere.html   — Onboarding step 2: goals & genre
  world-character-foundations.html — Onboarding step 3: world & characters
  style-ai-planning.html  — Onboarding step 4: style & AI synthesis
  universe-created.html   — Onboarding success / universe created

  dashboard.html          — Nexus Workspace (script editor + Narrative Intelligence)
  story-hub.html          — Story Bible (relationship graph, arc planner, codex)
  character-manager.html  — Character Manager (roster, DNA profiles, expressions)
  world-builder.html      — World Builder (locations, lore, world rules, timeline)
  asset-library.html      — Asset Library (searchable, filterable, upload)

  storyboard.html         — Storyboard Studio
  comic-studio.html       — Comic Studio
  animation-studio.html   — Animation Studio
  motion-comic-studio.html — Motion Comic Studio
```

## Environment Variables Required

| Variable | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ⚠️ Not set — app starts but DB calls fail |
| `OPENROUTER_API_KEY` | AI storyboard generation | ⚠️ Not set — AI features disabled |
| `CORS_ORIGIN` | Optional CORS allow-list | Optional |
| `REQUIRE_API_KEY` / `API_KEY` | Optional API-key guard for deployments | Optional |

To fully enable the app, provision a Replit PostgreSQL database (sets `DATABASE_URL` automatically), then run `npm run setup` to apply the base schema, run migrations, and seed demo data.

## Tech Stack

- **Backend:** Node.js + Express (ESM), `pg` for PostgreSQL
- **Frontend:** Standalone HTML pages with Tailwind CSS (CDN), Material Symbols, EB Garamond + Hanken Grotesk + JetBrains Mono fonts
- **AI:** Provider gateway for OpenAI, OpenRouter, and Gemini
- **Platform:** Replit

## Design System

- **Theme:** Cinematic dark — `#051424` background, `#c0c1ff` primary (lavender)
- **Fonts:** EB Garamond (headlines), Hanken Grotesk (body), JetBrains Mono (labels/mono)
- **Components:** Glassmorphism panels, Material Symbols icons, consistent sidebar nav

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api` | API discovery/status |
| GET | `/api/health` | Runtime/provider/database health |
| GET/POST | `/api/projects` | List or create projects |
| GET/PATCH/DELETE | `/api/projects/:id` | Read, update, or soft-delete a project |
| GET | `/api/projects/:projectId/brain` | Read Project Brain |
| PUT/PATCH | `/api/projects/:projectId/brain/sections/:section` | Update a Project Brain section |
| GET/POST | `/api/projects/:projectId/characters` | List or create characters |
| GET/POST | `/api/projects/:projectId/worlds` | List or create worlds |
| GET/POST | `/api/projects/:projectId/assets` | List or create assets |
| GET/POST | `/api/projects/:projectId/stories/scripts` | List or create scripts |
| GET/POST | `/api/projects/:projectId/graph/nodes` | List or upsert graph nodes |
| POST | `/api/projects/:projectId/jobs/dispatch` | Dispatch an AI orchestration job |
| GET/POST | `/api/projects/:projectId/scenes` | List or create scenes |
| GET/POST | `/api/projects/:projectId/episodes` | List or create episodes |
| GET/POST | `/api/projects/:projectId/production/chapters` | List or create chapters |
| GET/POST | `/api/projects/:projectId/production/comic/pages` | List or create comic pages |
| GET/POST | `/api/projects/:projectId/production/comic/panels` | List or create reusable comic panels |
| GET/POST | `/api/projects/:projectId/production/voices` | List or create reusable character voice profiles |
| GET/POST | `/api/projects/:projectId/production/motion/sequences` | List or create motion-comic slideshow sequences |
| GET/POST | `/api/projects/:projectId/production/animation/assets` | List or create animation rigs, body parts, poses, and presets |

## User Preferences

- Hold on adding API keys until strictly needed
- Keep existing project structure and stack — do not restructure
- Add pages that are missing based on the spec documents (78 PDFs read and stored in memory)
- Use the design system consistently across all new pages
