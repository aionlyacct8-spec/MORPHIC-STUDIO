# Morphic Studio

**"Create Once. Evolve Forever."**

An AI-powered creative OS for storytelling — enabling individual creators and small teams to produce professional-quality stories, comics, and animations with persistent AI memory that never forgets your characters, world, or creative decisions.

## How to Run

```bash
npm install
node backend/server.js
```

The app runs on port **3000**. The workflow `Start application` handles this automatically.

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
| `SESSION_SECRET` | Session signing | ✅ Configured |

To fully enable the app, provision a Replit PostgreSQL database (sets `DATABASE_URL` automatically), then run `node database/setup.js` to create tables.

## Tech Stack

- **Backend:** Node.js + Express (ESM), `pg` for PostgreSQL
- **Frontend:** Standalone HTML pages with Tailwind CSS (CDN), Material Symbols, EB Garamond + Hanken Grotesk + JetBrains Mono fonts
- **AI:** OpenRouter API (GPT-4o-mini) for script → storyboard generation
- **Platform:** Replit

## Design System

- **Theme:** Cinematic dark — `#051424` background, `#c0c1ff` primary (lavender)
- **Fonts:** EB Garamond (headlines), Hanken Grotesk (body), JetBrains Mono (labels/mono)
- **Components:** Glassmorphism panels, Material Symbols icons, consistent sidebar nav

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/analyze-script` | Analyze script + generate storyboard (needs OPENROUTER_API_KEY) |
| GET | `/api/scripts` | List all scripts |
| GET | `/api/scripts/:id` | Get script by ID |
| GET | `/api/storyboards/:scriptId` | Get storyboards for a script |
| POST | `/api/characters` | Create a character |
| GET | `/api/characters` | List characters |

## User Preferences

- Hold on adding API keys until strictly needed
- Keep existing project structure and stack — do not restructure
- Add pages that are missing based on the spec documents (78 PDFs read and stored in memory)
- Use the design system consistently across all new pages
