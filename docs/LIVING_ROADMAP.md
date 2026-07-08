# Morphic Studio Living Roadmap

**Last updated:** 2026-07-08  
**Current priority:** Phase 2 implementation, beginning with Shared Asset System foundations.

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

### Phase 2 Implementation — Shared Production Foundation

Goal: shift from architecture cleanup into implementation of the shared production foundation, starting with reusable asset infrastructure and then building character, scene, storyboard, comic, and animation systems on top of the same records.

Active outcomes:

- Architecture Compatibility Report conflicts are addressed enough to begin implementation.
- Core Data Model is available as the canonical implementation reference for entities, relationships, output-record contracts, and additive migrations.
- Phase 2 milestone order is established as 2A Shared Asset System, 2B Character System, 2C Scene Builder, 2D Storyboard Workspace, 2E Comic Production, and 2F Animation Production.
- Advanced AI orchestration and automation layers remain deferred until the shared asset, character, scene, storyboard, comic, and animation foundations are solid.
- Living roadmap, AI handoff documentation, development log, session handoff file, AI Session Protocol, and root AGENTS instructions are available.

## Active tasks

- Follow `docs/AI_SESSION_PROTOCOL.md` / root `AGENTS.md` at the start and end of every AI coding session.
- Continue Phase 2 implementation validation: Migrations 005 and 006 now start shared assets plus Phase 2B-2F foundation records; next verify them against a real database and expand UI/use-case coverage.
- Use `docs/CORE_DATA_MODEL.md` to keep Phase 2A implementation additive and compatible with existing APIs.
- Decide whether `generation_jobs` should be renamed, aliased, or superseded by `production_jobs` / `automation_jobs` before adding new automation workers.
- Decide package-manager lockfile policy.
- Identify which attached assets/patch files are historical references and can be archived.

## Phase 2 implementation milestones

1. **Phase 2A — Shared Asset System:** build reusable asset infrastructure that every downstream workspace relies on, including versions, metadata, provenance, storage links, usage tracking, relationships, and reuse-first retrieval controls.
2. **Phase 2B — Character System:** create reusable characters with rigs, expressions, clothing, metadata, continuity rules, and versioning, all backed by shared assets rather than duplicate character outputs.
3. **Phase 2C — Scene Builder:** allow users to assemble reusable characters, environments, props, lighting, camera positions, timeline cues, and continuity rules into editable scene containers.
4. **Phase 2D — Storyboard Workspace:** tie storyboard beats, frames, panels, shot plans, and continuity notes directly to shared characters, environments, props, and scenes.
5. **Phase 2E — Comic Production:** build comic page, panel, lettering, reading-flow, and export workflows on top of the same shared assets and scene records.
6. **Phase 2F — Animation Production:** build animation timelines, rigs, motion clips, camera tracks, audio/dialogue tracks, and export workflows on top of the same assets and scene/timeline records.

## Upcoming tasks

1. Next implementation slice: run Migrations 005 and 006 against a real development database, then add verification coverage for shared assets, character rigs/poses/expressions/clothing, scene placements, storyboard references, comic speech bubbles, animation timelines, and keyframes.
2. Implement Shared Asset System reuse controls and stronger character matching during script intake.
3. Object storage implementation for durable imported/authored/AI-assisted/rendered/exported files.
4. Frontend terminology cleanup for any remaining demo/default workflows when related screens are touched.
5. Redis/BullMQ production automation queue after job taxonomy is stable.
6. OpenCV/Paper.js evaluation after asset masks/vector contracts exist.
7. Fabric.js/Konva/PixiJS editor work after comic page/panel/vector contracts are stable.

## Blocked tasks

- Real ComfyUI runtime verification requires a reachable ComfyUI host and API-format workflow JSON.
- Object storage completion requires final local/S3/MinIO policy and storage object behavior; output-producing integration plans are now blocked unless they declare Asset Library, version, storage, job, and workflow-stage records.
- Heavy frontend editor integration is blocked until save/load data contracts are stable.
- Cognitive AI layer is blocked until production records and Asset Library reuse are stable.

## Deferred tasks

- Text-to-video and image-to-video integrations are excluded from core architecture; the open-source evaluation service now returns an explicit excluded-core-dependency decision for those candidates.
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

- Current static frontend controls have been reframed away from Generate/Regenerate language for Conflict 1; remaining generation terminology is primarily backend/internal compatibility naming.
- Conflict 4 output-record guardrail is active in open-source evaluation; new output-producing adapters must declare `assets`, `asset_versions`, `storage_objects`, `generation_jobs`, and `workflow_stages`.
- Some backend and database names still use generation terminology for compatibility.
- Preview launcher demo/default wording has been cleaned up for Conflict 3; continue auditing static frontend cards and example/template content when related screens are touched.
- Large attached assets and patch files may be historical references rather than active project files.
- No authenticated multi-user ownership model is implemented yet.
