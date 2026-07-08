# Morphic Studio Roadmap

**Canonical living roadmap:** [`docs/LIVING_ROADMAP.md`](./docs/LIVING_ROADMAP.md)  
**Last updated:** 2026-07-08

This root roadmap exists so future developers and AI coding agents can find the current project state immediately. Keep this file synchronized with `docs/LIVING_ROADMAP.md` and `SESSION_HANDOFF.md`.

## Current milestone

Architecture Refactoring and Cleanup.

The project priority is architectural alignment before feature expansion. Do not add major features until the architecture review, database refactoring plan, frontend terminology cleanup, and handoff workflow are stable.

## Current objective

Align the existing prototype with the production-automation architecture:

- Morphic Studio is an AI-assisted production-automation platform for comics and animation.
- It is not an AI video generator, AI comic generator, or one-click content generator.
- Comic and animation workflows must reuse the same Character Library, Environment Library, Asset Library, Scene Builder, Project Brain, and Production Database.
- Open-source integrations should be added one at a time after their Morphic data contracts exist.

## Active tasks

1. Review and refine `docs/DATABASE_REFACTORING_PLAN.md`.
2. Draft additive Migration 005 readiness changes for production-oriented taxonomy/status/source values.
3. Update frontend terminology and demo/default content in `frontend/storyboard.html`, `frontend/open-source-roadmap.html`, and `frontend/preview.html`.
4. Decide whether `generation_jobs` should be aliased, migrated, or left as a legacy internal name.
5. Decide package manager and lockfile policy.

## Blockers

- Real ComfyUI verification requires an external ComfyUI host and API-format workflow JSON.
- Object storage behavior needs final policy before implementation.
- Production job taxonomy is unresolved.
- Heavy editor integrations are blocked until page/panel/vector/timeline save-load contracts are stable.

## Next recommended task

Review and refine `docs/DATABASE_REFACTORING_PLAN.md`, then draft Migration 005 for additive taxonomy/readiness changes without breaking existing APIs.
