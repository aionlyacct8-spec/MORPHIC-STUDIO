# Morphic Studio Core Data Model

**Status:** Canonical implementation reference for additive data-model work.  
**Last updated:** 2026-07-08

This document defines the shared production data model for Morphic Studio. Use it before adding migrations, API routes, adapters, frontend save/load flows, or AI-agent memory writes.

Morphic Studio is an AI-assisted production-automation platform for comics and animation. The data model must preserve reusable assets, creator control, provenance, non-destructive editing, and shared comic/animation workflows.

## Data-model principles

1. **Projects own production context.** Every durable creative record should be scoped to a project unless it is explicitly global configuration.
2. **Assets are reusable production records, not media dumps.** Files, rendered outputs, imported references, generated drafts, masks, audio, rigs, and exports should be represented through `assets`, `asset_versions`, and `storage_objects` where practical.
3. **Characters, scenes, comics, animation, and timelines reference shared assets.** Do not create duplicate per-pipeline character, environment, prop, or file models unless a specialized table adds structured behavior.
4. **AI work is assistance, not ownership.** AI operations should write job/task history, workflow-stage context, provenance metadata, and editable draft records.
5. **Compatibility comes before destructive cleanup.** Existing tables such as `generation_jobs` may remain as legacy implementation names until compatibility aliases or additive migrations are reviewed.
6. **Non-destructive editing is a first-class requirement.** Revisions, versions, branches, accepted/rejected suggestions, and source references should be preserved.

## Canonical entity map

| Entity | Purpose | Current implementation | Target direction |
|---|---|---|---|
| Project | Root ownership, production scope, settings, format, style, and status. | `projects` | Keep as the root container for all production records. |
| Project Memory | Canon, continuity, world facts, style rules, story context, and agent memory. | `project_brain`, `ai_memory`, `knowledge_graph_nodes`, `knowledge_graph_edges` | Define source-of-truth boundaries before semantic search or cognitive agents expand. |
| Story | Series/story grouping, premise, arcs, chapters, and continuity context. | Split across `scripts`, `chapters`, Project Brain, and metadata | Add explicit story/series records only when publishing structure requires them. |
| Script | Written source material for story, storyboard, comic, and animation planning. | `scripts`, `chapters` | Link scripts to analysis, scene breakdowns, storyboard/page plans, and workflow stages. |
| Character | Canonical reusable character identity, personality, voice, appearance, and role. | `characters`, Project Brain character bible, character assets | Keep `characters` canonical; link to rigs, expressions, poses, clothing, voice profiles, and assets. |
| Character Rig | Editable rig structure, parts, joints, compatibility data, and control metadata. | `animation_assets.asset_kind = 'rig'`, `rig_data` | Add `character_rigs` and `character_rig_parts` when rig editing begins. |
| Pose | Reusable body/hand/face pose preset tied to rig compatibility and assets. | `animation_assets.asset_kind = 'pose'`, asset metadata | Add `character_poses` when pose editing/reuse needs structured records. |
| Expression | Reusable facial expression or emotion preset tied to character continuity. | `animation_assets.asset_kind = 'expression'`, asset metadata | Add `character_expressions` when expression editing/reuse needs structured records. |
| Asset | Canonical reusable production item: character art, prop, background, audio, panel, mask, rig, style, export, or reference. | `assets` | Keep as the shared file/provenance layer for comic, storyboard, animation, and export pipelines. |
| Asset Version | Non-destructive version of an asset with file URL, thumbnail, notes, and metadata. | `asset_versions` | Every produced or revised output should create or reference an asset version where practical. |
| Storage Object | Durable binary/object storage metadata, bucket/key/path/url, checksum, and object metadata. | `storage_objects` | Required for output-producing integrations once object-storage policy is finalized. |
| Environment | Reusable place or background with location rules, atmosphere, and scene suitability. | `locations`, `assets.type = 'background'/'location'`, Project Brain world data | Strengthen `locations` or add `environments` only when metadata exceeds current tables. |
| Prop | Reusable object that can appear in scenes, comics, animation, and continuity checks. | `assets.type = 'prop'`, knowledge graph nodes | Keep props asset-first unless structured behavior requires a dedicated table. |
| Scene | Reusable production container for characters, props, locations, camera, lighting, continuity, and timeline cues. | `scenes`, `comic_panels.scene_id`, motion cues | Expand scene composition metadata before heavy editor integrations. |
| Storyboard | Editable visual plan made from pages/panels/shots, scenes, and workflow stages. | `comic_pages`, `comic_panels`, `workflow_stages`, storyboard frontend metadata | Keep storyboard plans saved as Morphic records; add storyboard-specific tables only if panels/pages cannot represent boards cleanly. |
| Comic | Comic publishing structure, page layout, panel plans, dialogue placement, reading flow, and export metadata. | `chapters`, `comic_pages`, `comic_panels` | Add `comics`/`comic_issues` only when multi-series publishing requires them. |
| Animation | Animation workspace records, clips, cues, motion assets, renders, and export metadata. | `motion_comic_sequences`, `motion_comic_cues`, `animation_assets` | Add `animations` and `animation_timelines` when the animation workspace begins. |
| Timeline | Ordered editable tracks for body, face, camera, lighting, dialogue, audio, effects, and export timing. | Project Brain timeline JSON, `timeline_events`, `motion_comic_cues` | Define one canonical timeline model before major editor integrations. |
| Agent Task | AI/automation task history, status, input, output, errors, and provenance. | `generation_jobs`, orchestrator task records, `workflow_stages` | Add compatibility naming such as `production_jobs`/`agent_tasks` after API review. |
| Workflow Stage | Production-state checkpoint for story intake, storyboard review, adapter runs, export, QA, and user approval. | `workflow_stages` | Use for production state; jobs track execution while workflow stages track production progress. |
| Revision | Non-destructive branchable edit, target, author, status, and compare/restore metadata. | Not yet centralized | Add `production_revisions` and `production_revision_targets` when revision workflows begin. |

## Relationship rules

- A `project` may own many scripts, characters, assets, scenes, pages, panels, workflow stages, jobs, memory records, and storage objects.
- A `character` may reference many assets, rigs, poses, expressions, clothing sets, voice profiles, and scene appearances.
- An `asset` may have many `asset_versions` and many `storage_objects` over time.
- A `scene` should reference canonical characters, environments, props, assets, workflow stages, and timeline cues rather than duplicating facts.
- A `comic_panel` or storyboard shot should reference scenes, assets, page layout metadata, dialogue, camera notes, and workflow-stage context.
- An `animation` or motion sequence should reference scenes, assets, rigs, timeline tracks, audio, effects, and export assets.
- An AI/automation job should record input/output/provenance and should be linked to workflow stages and any assets or versions it creates.

## Output-producing integration contract

Any adapter that produces a file, rendered output, generated draft, media export, mask, audio file, rig file, or reusable external artifact must prove the following record path before user-facing exposure:

1. `generation_jobs` or future `production_jobs` / `agent_tasks` records execution, status, input, output, and errors.
2. `workflow_stages` records production context, creator-review status, and next action.
3. `assets` records reusable production identity, source/provenance, type, tags, and ownership.
4. `asset_versions` records non-destructive output versions, notes, metadata, and file references.
5. `storage_objects` records durable binary/object metadata, bucket/key/path/url, checksum, and storage policy context.

If an integration cannot satisfy this path, it remains research-only or blocked.

## Source-of-truth guidance

| Fact type | Preferred source of truth | Notes |
|---|---|---|
| Project ownership and status | `projects` | Project settings may extend this later. |
| Character identity and continuity | `characters` plus Project Brain summaries | Avoid creating separate comic/animation character identities. |
| Canon/story/world facts | Project Brain and domain tables | Knowledge graph nodes should reference, not replace, source records. |
| File identity and provenance | `assets` | Domain records should reference assets rather than embed file-only truth. |
| File versions | `asset_versions` | Use for non-destructive edits, assisted outputs, and revisions. |
| Object storage metadata | `storage_objects` | Required when a binary object is persisted. |
| Execution history | `generation_jobs` for now | Rename or alias later without breaking existing APIs. |
| Production progress | `workflow_stages` | Stages should describe production state, review, blockers, and next steps. |
| Timeline timing | Canonical timeline model when defined | Until then, avoid duplicating timing across incompatible schemas. |

## Additive migration priorities

1. Add production-oriented taxonomy/source/status values while preserving legacy values.
2. Add compatibility naming for production jobs without deleting `generation_jobs`.
3. Strengthen asset/version/storage links for all output-producing adapters.
4. Add reusable rig, pose, and expression tables only when editing workflows need them.
5. Add comic intelligence records only when metadata is insufficient.
6. Add shared non-destructive revision records before branch/compare/restore workflows.
7. Define the canonical timeline model before heavy editor integrations.

## Implementation checklist for future features

Before adding a new feature, confirm:

- Which canonical entity owns the new data?
- Does it reuse existing project, character, scene, asset, memory, and workflow records?
- Does any produced file create or reference `assets`, `asset_versions`, and `storage_objects`?
- Does any AI/automation action write job/task history and workflow-stage context?
- Does the UI preserve creator review, editability, undo/revision paths, and provenance?
- Is the migration additive and backward compatible?
- Does documentation need updates in the same session?
