# AI Handoff Guide

**Last updated:** 2026-07-08

Use this file to onboard future AI coding agents quickly. Follow `docs/AI_SESSION_PROTOCOL.md` and root `AGENTS.md` before making changes. Keep this file synchronized with `SESSION_HANDOFF.md`, `ROADMAP.md`, `docs/LIVING_ROADMAP.md`, and the architecture documents.

## Current project status

Morphic Studio is a prototype Node/Express + PostgreSQL application with a static HTML frontend. It has project, story, character, world, asset, scene, Project Brain, knowledge graph, production workflow, storage, queue health, system config, and ComfyUI adapter scaffolding.

The product direction is now production automation for comics and animation. Do not treat the app as an AI video generator, AI comic generator, or one-click content generator.

## Current architecture

Canonical architecture documents:

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `OPEN_SOURCE_INTEGRATION_PLAN.md`
- `docs/PHASE2_OPEN_SOURCE_BLUEPRINT.md`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`
- `docs/DATABASE_REFACTORING_PLAN.md`
- `docs/AI_SESSION_PROTOCOL.md`
- `AGENTS.md`

Current runtime shape:

- Backend: Express controllers/services/routes.
- Database: SQL migrations and PostgreSQL via `pg`.
- Frontend: static HTML pages served by Express.
- AI: provider gateway and specialist agents.
- Production records: Project Brain, assets/asset versions/storage objects, workflow stages, comic pages/panels, motion sequences/cues, voice profiles, animation assets.

## Current objectives

1. Finish architecture refactoring and cleanup before feature expansion.
2. Keep all future work aligned with reusable production assets and non-destructive editing.
3. Strengthen database and API contracts for shared comic/animation production pipelines.
4. Update frontend copy and controls away from one-click generation language.
5. Add open-source integrations one at a time only after contracts stabilize.

## Current blockers

- Real ComfyUI verification requires a reachable ComfyUI host and API-format workflow JSON.
- Object storage needs final policy and implementation.
- Job taxonomy still uses generation language.
- Editor integrations are blocked until page/panel/vector/timeline save-load contracts are stable.
- Some demo/static UI remains in default frontend paths.

## Current priorities

1. Review and refine the database refactoring plan, then draft additive Migration 005 readiness changes.
2. Frontend terminology and demo-content cleanup.
3. Production job taxonomy decision.
4. Asset Library reuse controls and stronger character matching.
5. Object storage implementation.
6. Queue/worker implementation.
7. Editor/integration evaluations.

## Recent decisions

- Production automation is the product direction.
- Comic and animation systems share the same asset foundation.
- Text-to-video and image-to-video systems are not core dependencies.
- Tier 1 open-source foundation: ComfyUI, Fabric.js, Konva, PixiJS, OpenCV, Paper.js.
- Krita, OpenToonz, SkelForm, Synfig Studio, Glaxnimate, and Blender are evaluation/reference targets before custom replacements.
- Do not rewrite working systems unless necessary for architectural alignment.

## Pending decisions

- Rename/alias `generation_jobs` to production automation terminology.
- Choose npm vs pnpm lockfile policy.
- Decide historical archive location for attached PDFs/zips/patches.
- Define non-destructive revision/version schema.
- Choose page/vector editor composition strategy.

## Next recommended task

Review and refine `docs/DATABASE_REFACTORING_PLAN.md`, then draft Migration 005 for additive taxonomy/readiness changes without breaking existing APIs.

## Commands commonly used

```bash
npm run check
git diff --check
npm run verify:storyboard-flow
npm run verify:comfyui-plan
# Requires external ComfyUI runtime:
npm run verify:comfyui-runtime
```
