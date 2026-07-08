# Database Refactoring Plan

**Date:** 2026-07-08  
**Status:** Proposal; do not apply destructive migrations yet.

## Goal

Restructure Morphic Studio around reusable production assets and shared comic/animation workflows without breaking the working prototype.

## Target core entities

- Projects
- Stories
- Scripts
- Storyboards
- Characters
- Character Rigs
- Expressions
- Poses
- Assets
- Props
- Environments
- Scenes
- Comics
- Animations
- Timelines
- AI Memory
- Agent Tasks

## Current-to-target mapping

| Target entity | Current tables/fields | Status | Recommended path |
|---|---|---|---|
| Projects | `projects` | Compatible | Keep as root ownership/project container. |
| Stories | `stories` concepts currently split across `scripts`, `chapters`, Project Brain, and metadata | Partial | Add explicit story/series grouping only when needed; avoid duplicating scripts/chapters prematurely. |
| Scripts | `scripts` | Compatible | Keep; link to story, chapters, story analysis, and production plans. |
| Storyboards | `comic_pages`, `comic_panels`, `workflow_stages`, storyboard frontend metadata | Partial | Add storyboard-specific stage/board records only if comic pages/panels cannot represent boards cleanly. |
| Characters | `characters`, Project Brain character bible, knowledge graph nodes, character assets | Compatible | Keep canonical `characters`; improve matching and asset links. |
| Character Rigs | `animation_assets.asset_kind = 'rig'`, `rig_data` | Partial | Add a dedicated `character_rigs` table when rig editing begins; keep `animation_assets` references for files/clips. |
| Expressions | `animation_assets.asset_kind = 'expression'`, assets metadata | Partial | Add `character_expressions` for reusable expression presets linked to character/assets. |
| Poses | `animation_assets.asset_kind = 'pose'`, assets metadata | Partial | Add `character_poses` for reusable pose presets with rig compatibility. |
| Assets | `assets`, `asset_versions`, `storage_objects` | Compatible | Keep as canonical file/metadata/version/provenance layer. |
| Props | `assets.type = 'prop'`, knowledge graph nodes | Partial | Keep props as assets first; add `props` table only if props need structured behavior beyond asset metadata. |
| Environments | `locations`, `assets.type = 'background'/'location'`, scenes metadata | Partial | Add `environments` or strengthen `locations` after environment reuse requirements are defined. |
| Scenes | `scenes`, `comic_panels.scene_id`, motion cues | Compatible | Keep; expand scene composition and reusable scene setup metadata. |
| Comics | `chapters`, `comic_pages`, `comic_panels` | Partial | Add `comics`/`comic_issues` only when multi-series publishing structure is needed. |
| Animations | `motion_comic_sequences`, `motion_comic_cues`, `animation_assets` | Partial | Add `animations` and `animation_timelines` when animation workspace begins. |
| Timelines | Project Brain JSON timeline, `timeline_events`, motion cues | Partial | Define one canonical timeline model before adding editor integrations. |
| AI Memory | `project_brain`, `ai_memory`, `knowledge_graph_*`, workflow metadata | Compatible but overlapping | Define source-of-truth rules between Project Brain, graph, and domain tables. |
| Agent Tasks | `generation_jobs`, orchestrator task records, workflow stages | Partial/conflicting naming | Add `production_jobs` / `agent_tasks` or compatibility views after API review. |

## Non-breaking migration sequence

### Step 1 — Taxonomy cleanup

- Add enum/check documentation for production-oriented statuses and sources.
- Add source values such as `ai_assisted`, `authored`, `imported`, `rendered`, and `exported` while retaining `ai_generated` for legacy rows.
- Add panel/job status values such as `planned`, `assisted`, `revised`, `reviewed`, and `approved` while retaining existing values.

### Step 2 — Production jobs compatibility

- Keep `generation_jobs` table initially.
- Add a `production_jobs` compatibility view or new table after confirming route expectations.
- If adding a new table, backfill from `generation_jobs` and keep write-through compatibility until frontend/services are migrated.

### Step 3 — Reusable rigging primitives

Create tables only when rig editing is ready:

- `character_rigs`
- `character_rig_parts`
- `character_poses`
- `character_expressions`
- `character_motion_presets`

Each should link to `characters`, `assets`, and `asset_versions` where applicable.

### Step 4 — Comic intelligence records

Add structured records when the comic system needs them beyond `metadata`:

- `story_analyses`
- `scene_breakdowns`
- `panel_plans`
- `page_layout_versions`
- `dialogue_placements`
- `reading_flow_checks`

Until then, store drafts in `workflow_stages.metadata` and `comic_pages`/`comic_panels.metadata`.

### Step 5 — Non-destructive revisions

Add a shared revision table for branchable edits:

- `production_revisions`
- `production_revision_targets`

Targets can point to assets, panels, pages, scenes, rigs, timelines, or other production records.

### Step 6 — Timeline consolidation

Define a canonical timeline model that can represent:

- Comic timeline/version history
- Motion comic cue timing
- Animation tracks
- Audio/dialogue timing
- Camera/lighting/effects tracks

Do not wire major timeline UI until this model is reviewed.

## Guardrails

- Prefer additive migrations over destructive changes.
- Preserve current APIs until clients are migrated.
- Avoid duplicating the same fact across Project Brain, graph, and domain tables without source-of-truth rules.
- Every produced or assisted file must route through `assets`, `asset_versions`, and storage metadata.
- Every AI operation should write job/task history and workflow-stage context.

## Recommended immediate migration work

1. Draft Migration 005 as additive taxonomy/readiness changes only.
2. Add compatibility naming for production automation jobs without deleting `generation_jobs`.
3. Add source/status values that allow production-assist language.
4. Add comments or metadata conventions for comic intelligence records before new tables are created.
