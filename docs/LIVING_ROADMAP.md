# Morphic Studio Living Roadmap

**Last updated:** 2026-07-08  
**Current priority:** Architecture alignment before feature expansion.

This roadmap must stay current. Update it whenever architecture, implementation status, blockers, integrations, or priorities change.

## Completed milestones

- Node/Express API serves the static frontend and project-scoped JSON routes.
- PostgreSQL schema and migrations support projects, Project Brain, characters, worlds, assets, stories, scenes, knowledge graph, generation jobs, storage objects, workflow stages, comic pages/panels, voice profiles, motion-comic planning records, and animation assets.
- Phase 1 Story Intake saves scripts, scenes, chapters, comic pages, panels, and continuity rules.
- Project Brain/memory endpoints and knowledge graph services exist.
- Asset Library base APIs support reusable assets, versions, metadata, tags, usage counts, and soft delete.
- ComfyUI planning/runtime adapter exists behind backend endpoints and verification scripts.
- Architecture direction has been reframed around production automation, comic production automation, reusable assets, and a refined open-source stack.

## Current milestone

### Architecture Refactoring and Cleanup

Goal: align the existing prototype with the production-automation architecture before adding major features.

Active outcomes:

- Architecture Compatibility Report is available.
- Living roadmap is available.
- AI handoff documentation is available.
- Development log is available.
- Session handoff file is available.
- AI Session Protocol and root AGENTS instructions are available.

## Active tasks

- Follow `docs/AI_SESSION_PROTOCOL.md` / root `AGENTS.md` at the start and end of every AI coding session.
- Review frontend copy and controls for remaining one-click generation language.
- Decide whether `generation_jobs` should be renamed, aliased, or superseded by `production_jobs` / `automation_jobs`.
- Review the database refactoring plan for reusable production entities and prepare additive migration work.
- Decide package-manager lockfile policy.
- Identify which attached assets/patch files are historical references and can be archived.

## Upcoming tasks

1. Review and refine `docs/DATABASE_REFACTORING_PLAN.md`, then draft additive Migration 005 readiness changes.
2. Frontend terminology cleanup for storyboard, open-source roadmap, preview, and any demo/default workflows.
3. Asset Library reuse controls and stronger character matching during script intake.
4. Object storage implementation for durable imported/authored/AI-assisted/rendered/exported files.
5. Redis/BullMQ production automation queue after job taxonomy is stable.
6. OpenCV/Paper.js evaluation after asset masks/vector contracts exist.
7. Fabric.js/Konva/PixiJS editor work after comic page/panel/vector contracts are stable.

## Blocked tasks

- Real ComfyUI runtime verification requires a reachable ComfyUI host and API-format workflow JSON.
- Object storage completion requires final local/S3/MinIO policy and storage object behavior.
- Heavy frontend editor integration is blocked until save/load data contracts are stable.
- Cognitive AI layer is blocked until production records and Asset Library reuse are stable.

## Deferred tasks

- Text-to-video and image-to-video integrations are excluded from core architecture.
- React/Next.js migration is deferred until backend contracts stabilize.
- Full animation rig editor is deferred until character rig, pose, expression, timeline, and asset schemas are refined.
- Voice/music workflows are deferred until dialogue, voice profile, audio asset, and timeline contracts stabilize.
- Krita/OpenToonz/Synfig/SkelForm/Glaxnimate/Blender integrations are deferred until evaluated individually.

## Architecture changes

- Morphic Studio is an AI-assisted production-automation platform, not an AI video or comic generator.
- Comic and animation systems must share Character Library, Environment Library, Asset Library, Scene Builder, Project Brain, and Production Database.
- Open-source tools must sit behind adapters that validate input, preserve editable outputs, write durable Morphic records, and report workflow status.
- Asset retrieval and reuse come before creating new assets.
- AI proposes; creators approve, modify, reject, regenerate, branch, or restore.

## Open technical decisions

- What is the migration path from `generation_jobs` to production automation terminology?
- Should package management standardize on npm or pnpm?
- Which file/archive locations should hold historical planning assets?
- What is the minimum schema for non-destructive revisions and branchable creative decisions?
- Which editor technology owns final comic page layout interactions: Fabric.js, Konva, or a layered combination?

## Integration progress

| Integration | Status | Next step |
|---|---|---|
| ComfyUI | Adapter exists; simulated mode works; real runtime requires external host. | Run `npm run verify:comfyui-runtime` with real ComfyUI. |
| MinIO/S3/local object storage | Planning/service scaffolding exists. | Implement durable binary persistence after storage policy decision. |
| Redis/BullMQ | Health/config scaffolding exists. | Add workers after production job taxonomy decision. |
| Fabric.js/Konva/PixiJS/Paper.js | Required stack, not integrated. | Wait for editor data contracts. |
| OpenCV | Required image intelligence, not integrated. | Wait for mask/segmentation metadata contracts. |
| Krita/OpenToonz/Synfig/SkelForm/Glaxnimate/Blender | Reference/evaluation only. | Evaluate individually after core contracts stabilize. |

## Known issues

- Some UI copy still uses Generate/Regenerate language.
- Some backend and database names still use generation terminology for compatibility.
- Some static frontend pages include demo fallback cards or preview-only language.
- Large attached assets and patch files may be historical references rather than active project files.
- No authenticated multi-user ownership model is implemented yet.
