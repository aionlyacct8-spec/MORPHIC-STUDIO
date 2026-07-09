# Morphic Studio Roadmap

**Canonical living roadmap:** [`docs/LIVING_ROADMAP.md`](./docs/LIVING_ROADMAP.md)  
**Last updated:** 2026-07-09

This root roadmap exists so future developers and AI coding agents can find the current project state immediately. Keep this file synchronized with `docs/LIVING_ROADMAP.md` and `SESSION_HANDOFF.md`.

## Current milestone

Phase 2 Implementation — Shared Production Foundation.

The project priority has shifted from architecture cleanup into implementation. Begin with Phase 2A Shared Asset System, then build character, scene, storyboard, comic, and animation workspaces on top of the same reusable production records.

## Current objective

Implement the production-automation architecture in the safest dependency order:

- Morphic Studio is an AI-assisted production-automation platform for comics and animation.
- It is not an AI video generator, AI comic generator, or one-click content generator.
- Comic and animation workflows must reuse the same Character Library, Environment Library, Asset Library, Scene Builder, Project Brain, and Production Database.
- Open-source integrations should be added one at a time after their Morphic data contracts exist; text-to-video/image-to-video candidates must remain excluded from the core dependency path, and output-producing adapters must declare Asset Library, version, storage, job, and workflow-stage records before implementation.
- Advanced AI orchestration and automation layers should wait until the shared asset, character, scene, storyboard, comic, and animation foundations are solid.

## Active tasks

1. Run `npm run verify:phase2` in an environment with a reachable development PostgreSQL `DATABASE_URL` to validate Migrations 005/006/007, every Phase 2A-2F persistence endpoint, and the Scene Builder profile/edit contract.
2. Use the verifier output to make focused corrections only; preserve backward compatibility and avoid new schema unless a verified issue requires it.
3. Keep frontend/backend terminology cleanup compatibility-preserving as related implementation files are touched.
4. Treat `production_jobs` as the read-only compatibility alias for legacy `generation_jobs`; defer any destructive table rename until automation workers and API clients are migrated.
5. Decide package manager and lockfile policy.

## Phase 2 milestone order

1. **Phase 2A — Shared Asset System:** reusable asset infrastructure, versioning, metadata, provenance, storage links, relationships, usage tracking, and reuse-first retrieval.
2. **Phase 2B — Character System:** reusable characters with rigs, expressions, clothing, metadata, continuity rules, and versioning.
3. **Phase 2C — Scene Builder:** editable scene containers assembled from shared characters, environments, props, lighting, cameras, timeline cues, and continuity rules.
4. **Phase 2D — Storyboard Workspace:** storyboards directly connected to shared characters, environments, props, scenes, shot plans, and continuity notes.
5. **Phase 2E — Comic Production:** comic pages, panels, lettering, reading flow, and export built on shared assets and scenes.
6. **Phase 2F — Animation Production:** timelines, rigs, motion clips, camera/audio/dialogue tracks, and export built on shared assets and scenes.

## Blockers

- Real ComfyUI verification requires an external ComfyUI host and API-format workflow JSON.
- Object storage behavior needs final policy before implementation.
- Production job taxonomy has an initial compatibility alias (`production_jobs`) but still needs service/client migration before new automation workers depend on production terminology.
- Heavy editor integrations are blocked until page/panel/vector/timeline save-load contracts are stable.

## Next recommended task

Run `npm run verify:phase2` from a network environment that can resolve the Supabase pooler host and fix any remaining Migration 005/006/007 or Scene Builder profile/edit persistence failures it reports.
