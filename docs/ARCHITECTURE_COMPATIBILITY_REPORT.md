# Architecture Compatibility Report

**Date:** 2026-07-08  
**Scope:** Repository review against the updated Production Automation, Comic Production Automation, and refined Open Source Integration architecture.

## Review basis

This report treats the following documents as the current source of architectural truth:

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `OPEN_SOURCE_INTEGRATION_PLAN.md`
- `docs/PHASE2_OPEN_SOURCE_BLUEPRINT.md`
- `docs/ROADMAP.md`

The review goal is alignment before feature expansion. Working systems should not be rewritten unless they conflict with reusable production assets, modular production workflows, non-destructive editing, or creator control.

## Compatible systems

These systems already align with the updated architecture and should be preserved.

| System | Current evidence | Recommendation |
|---|---|---|
| Express/PostgreSQL monolith | Current backend routes, controllers, services, and migrations are organized enough for adapter-contract work. | Keep while contracts stabilize; do not migrate frameworks during the architecture refactor. |
| Project Brain | Existing `project_brain`, memory endpoints, versions, search, locks, and memory append APIs support shared project knowledge. | Preserve and expand toward production intelligence rather than replacing. |
| Asset Library base | Assets, asset versions, storage objects, usage counters, metadata, tags, and soft delete support durable reusable assets. | Keep and strengthen search/reuse controls before adding heavy editor integrations. |
| Character/world/story APIs | Existing project-scoped characters, worlds, scripts, scenes, and knowledge graph APIs support reusable production entities. | Preserve; align labels and payloads with production-asset terminology over time. |
| Production workflow tables | Chapters, comic pages, panels, voice profiles, motion sequences/cues, animation assets, and workflow stages already model saved production records. | Keep; extend with comic intelligence, rigging detail, timelines, and non-destructive edit history. |
| Deterministic story intake | Phase 1 intake creates scripts, scenes, pages, panels, continuity rules, and Project Brain memory without requiring an AI key. | Keep as the stable foundation; improve reuse matching and user review. |
| ComfyUI adapter boundary | Existing planning/runtime adapter is backend-only and stores jobs, assets, panel metadata, and workflow stages. | Keep behind saved records; rename product-facing language from generation to production-assist when touched. |
| Config/queue/storage health services | Runtime config, queue, storage, and health endpoints provide integration readiness. | Keep; implement real queue/storage only after contracts remain stable. |
| No default DB seed/demo scripts | `database/setup.js` applies schema/migrations only and avoids injecting demo projects. | Preserve this cleanup decision. |

## Partially compatible systems

These systems are useful but need modification before further feature work.

| System | Gap | Recommended modification |
|---|---|---|
| `generation_jobs` naming | The table/service name still implies one-shot output generation. | Keep the table for compatibility now; plan a non-breaking alias or migration toward `production_jobs` / `automation_jobs` after API contracts are reviewed. |
| Agent task names | Internal task names such as `generate_panels`, `generate_outline`, and `generate_character_dna` reflect older generation wording. | Preserve exports for compatibility; add production-assist aliases and update UI copy before changing route contracts. |
| Comic panel status values | Status values include `generated`, which conflicts with editable production automation language. | Add/transition to statuses such as `planned`, `assisted`, `revised`, `reviewed`, and `approved` in a future DB migration. |
| Asset `source` values | `ai_generated` is still part of the base asset source taxonomy. | Extend source taxonomy with `ai_assisted`, `authored`, `imported`, `rendered`, and `exported`; keep old value as legacy-compatible. |
| Storyboard frontend | The storyboard UI still has prominent Generate/Regenerate controls and prompt wording. | Reframe as “Plan,” “Assist,” “Revise,” or “Create production draft”; keep disabled/guarded until backed by saved records. |
| Open Source Roadmap frontend | Copy still overemphasizes visual generation and omits the refined Tier 1 stack. | Update copy to production automation stack before presenting it as current architecture. |
| Motion comic language | Motion comic rendering is useful but can imply video-output-first thinking. | Keep as timeline/export pipeline, not a core AI video generation workflow. |
| Current docs with older terms | Some older docs still mention generation as shorthand. | Continue replacing terms when files are touched; do not churn working code solely for naming. |

## Conflicting systems

These items conflict with the updated direction unless redesigned.

| System or pattern | Conflict | Recommendation |
|---|---|---|
| One-click “Generate” UX as primary workflow | Suggests finished output ownership by AI rather than editable production assistance. | Redesign UI flow around saved plans, asset reuse, user review, and non-destructive revisions. |
| Any future text-to-video/image-to-video integration as core dependency | Optimizes for finished media generation instead of reusable assets, rigging, timeline editing, and creator control. | Keep out of core architecture; allow only later research/export experiments if they preserve production records. |
| Static mock/demo cards presented as product data | Confuses real projects with examples and increases cleanup debt. | Remove from default user paths or clearly mark as optional examples/templates. |
| Opaque output files without asset/version metadata | Breaks reuse, provenance, and non-destructive editing. | Block new integrations until they write Asset Library, storage, version, job, and workflow-stage records. |

## Deferred systems

These systems should wait until architecture contracts stabilize.

| Deferred system | Why deferred | Required prerequisite |
|---|---|---|
| React/Next.js editor migration | Current static frontend can validate API contracts without framework churn. | Stable save/load contracts and architecture cleanup. |
| Fabric.js/Konva/PixiJS/Paper.js production editors | Large editor integrations can lock in wrong data contracts. | Comic page, vector layer, asset, dialogue, and panel-layout contracts. |
| OpenCV image intelligence | Needs masks, segmentation records, target-edit records, and storage metadata. | Asset/version/storage schema refinement. |
| Krita/OpenToonz/SkelForm/Synfig/Glaxnimate integration | Should inform architecture before becoming dependencies. | Rigging, comic, and animation data models. |
| Real Redis/BullMQ worker rollout | Useful for long jobs, but premature before job taxonomy is settled. | Automation job model and object storage. |
| Full AI cognitive layer | Needs stable production records to reason over. | Project Brain, Asset Library, production pipeline, and job history cleanup. |

## Technical debt

### Duplicate or overlapping systems

- `generation_jobs` and `workflow_stages` overlap as job/progress/history records. Keep both for now, but define responsibility boundaries: jobs track execution; workflow stages track production state.
- Project Brain JSON sections, knowledge graph nodes, and dedicated tables can duplicate facts. Define source-of-truth rules before adding semantic search.
- `assets`, `animation_assets`, voice profiles, and panel image links can all reference files. Keep shared `assets` as canonical file/metadata records and let domain tables reference it.

### Placeholder, fake, or demo content

- Some frontend pages still use static cards or demo fallbacks when APIs return nothing.
- Preview copy still mentions demo responses and demo universe language.
- Storyboard controls still dispatch generic panel-generation tasks.

Recommendation: remove from default workflows or label as templates/examples; keep fixtures only for testing.

### Archived and attached files

- Root patch files and large `attached_assets` archives/PDFs are useful history but are not active runtime assets.
- Recommendation: move historical prompt/archive artifacts into an `archive/` or `docs/reference/` area after confirming no scripts depend on them.

### Naming debt

- Internal function names using `generate*` may remain temporarily for compatibility.
- Product-facing language should shift to plan, assist, create draft, revise, render, export, or automate.

### Dependency debt

- Both `package-lock.json` and `pnpm-lock.yaml` exist. Decide on one package manager before dependency expansion.
- Do not add Tier 1/Tier 2 open-source packages until data contracts are stable.

## Cleanup recommendations

1. Update visible frontend copy that still describes generation-first workflows.
2. Rename or alias job/task terminology to production automation without breaking existing APIs.
3. Add DB migration planning for reusable production entities: character rigs, expressions, poses, environments, timelines, agent tasks, production jobs, and non-destructive revisions.
4. Move historical prompt/PDF/zip artifacts out of the active root/asset path after confirming they are reference-only.
5. Decide package-manager lockfile policy.
6. Keep ComfyUI backend smoke testing, but prevent UI-triggered heavy automation until storage and queue contracts are ready.

## Highest-priority next task

Create a database refactoring proposal that maps current tables to the target reusable production entities and identifies non-breaking migration steps for `production_jobs`, character rigs, expressions, poses, environments, timelines, AI memory, and agent tasks.
