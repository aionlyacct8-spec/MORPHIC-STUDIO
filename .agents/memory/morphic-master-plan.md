---
name: Morphic Studio Master Plan
description: Full project vision, tagline, core philosophy, tech stack, development phases, and what's built vs. planned
---

# Morphic Studio Master Plan

## Tagline & Vision
- **Tagline:** "Create Once. Evolve Forever."
- **Vision:** The "operating system for AI-assisted storytelling" — enabling individual creators and small teams to produce professional-quality stories, comics, and animations in a unified ecosystem.
- **Core Philosophy:** Creative assets generated once, remembered permanently, reused intelligently. AI is a creative assistant/conductor, not the director. Final authority always belongs to the user.

## What Is Already Built (Current Repo State)
- Node.js/Express backend (`backend/server.js`) serving static frontend HTML files
- Multiple HTML frontend pages: Comic Studio, Animation Studio, Storyboard, Character Manager, Dashboard, etc.
- PostgreSQL integration via `pg` (tables: `scripts`, `storyboards`, `characters`)
- OpenRouter API integration for AI storyboard generation (GPT-4o-mini)
- `database/setup.js` to initialize schema
- **Missing:** DATABASE_URL env var, OPENROUTER_API_KEY env var — app cannot run without them

## Planned Tech Stack (from specs)
- **Frontend:** React + TypeScript + Tailwind CSS (currently plain HTML — migration planned)
- **Backend:** Node.js + Express (current) → NestJS (planned for later phases)
- **Database:** PostgreSQL + Prisma ORM (currently using raw `pg`)
- **AI Gateway:** Unified gateway routing to multiple providers (OpenRouter, Google Gemini, ComfyUI, Kokoro TTS)
- **Platform:** Replit (development + deployment)
- **Version Control:** GitHub
- **UI Design:** Google Stitch (design source)

## Development Phases (from roadmap docs)
- **Phase 0:** Documentation — COMPLETE (the 78 PDFs are this phase)
- **Phase 1:** Development foundation — Auth, DB schema, dashboard shell
- **Phase 2:** Core platform — Story Bible, Character Manager, Asset Library
- **Phase 3:** AI integration — AI orchestration, Comic Studio workflow
- **Phase 4:** Full Comic Studio — Script analysis, storyboard, panel generation, export
- **Phase 5:** Animation Studio — Timeline, keyframes, lip-sync
- **Phase 6:** Collaboration — Teams, roles, shared workspaces
- **Phase 7:** Platform expansion — Marketplace, API for third parties
- **Phase 8:** Enterprise — SSO, advanced analytics, white-label

## Product Versions
- **v1 (Foundation):** Core OS, Story Bible, consistent character generation, comic production
- **v2 (Creative Studio):** Advanced editors — pose, expression, World Builder
- **v3–v4 (Motion/Animation):** Timeline editing, keyframes, lip-sync, asset reuse across frames
- **v5–v8 (Intelligent Production & Ecosystem):** AI production assistants, team collab, marketplace

## Core Concepts
- **Project Brain:** Per-project memory — current production state, user intent, active workflows
- **Story Bible:** Canonical source of truth for characters, locations, relationships, world rules
- **Project DNA:** Defines visual style, narrative tone, audio direction, AI behavior settings
- **Character IDs:** Every character has a unique persistent ID ensuring cross-scene consistency
- **Creative Timeline:** Every significant action creates a checkpoint (non-destructive, branchable)
- **AI Task Bus:** Message bus coordinating specialized AI agents

## Definition of Done (from Master Playbook)
A feature is complete only when: it functions, is tested, documented, committed, with no critical defects.

## AI Task Flow (canonical sequence)
1. Read Project Brain / Story Bible / Project DNA
2. Search Asset Library for reusable assets
3. Identify missing information
4. Plan execution
5. Execute with AI agents
6. User approval gate
7. Update persistent memory
