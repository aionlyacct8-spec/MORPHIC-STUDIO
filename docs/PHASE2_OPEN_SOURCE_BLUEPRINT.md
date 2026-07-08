# Phase 2 Open-Source Blueprint

## Decision

Use a combined blueprint:

- Keep the layer model from the third proposal because it makes every open-source tool replaceable.
- Keep the build-order discipline from the second proposal because Morphic should not jump into canvas, voice, or animation before the memory and asset contracts are stable.
- Keep the cloud-decoupling rule from the first proposal because the website must stay responsive while heavy AI work runs on separate GPU/storage/queue infrastructure.

Morphic Studio's advantage is not any single model, canvas package, or finished-media generator. The advantage is the production memory layer: projects, canon, characters, worlds, panels, assets, voices, styles, rigs, timelines, and workflow stages stored as durable Morphic records before any engine creates, edits, or exports output.

## Phase status

Morphic is now in Phase 2, but only in the backend-adapter slice of Phase 2.

Already started:

- Saved storyboard records are verified against the backend.
- The ComfyUI planning adapter exists in simulated mode.
- The ComfyUI planning adapter can switch to real runtime mode with `COMFYUI_MODE=real`, `COMFYUI_BASE_URL`, and `COMFYUI_WORKFLOW_PATH`.
- `npm run verify:comfyui-plan` proves one saved panel can produce one generation job, one Asset Library record, a panel asset reference, and one `comfyui_planning` workflow stage.
- `npm run verify:comfyui-runtime` is the handoff checkpoint for validating the same contract against a reachable ComfyUI server.

Not started yet:

- A confirmed real ComfyUI runtime verification run in this environment.
- Redis/BullMQ workers for long-running jobs.
- MinIO/S3 object persistence for imported, authored, AI-assisted, rendered, and exported binaries.
- React/Next.js editor UI actions that trigger production automation.
- OpenCV/Paper.js evaluation for image intelligence and vector editing.
- Krita/OpenToonz/Glaxnimate/Synfig/SkelForm evaluation for comic, animation, and rigging concepts.
- Voice, motion comic rendering, full animation, and canon validation UI.

## Selected stack by layer

### Layer 1 — Interface

| Tool | Decision | Timing |
|---|---|---|
| Next.js + React | Keep as the eventual app shell for dashboard, asset library, and editors. | After backend contracts stabilize. |
| shadcn/ui | Use for a fast, themeable component system once React migration begins. | Later Phase 2. |
| Zustand | Use for editor-local state such as selected panel, drag state, and layout state. | Later Phase 2. |
| tldraw | Use for storyboard / infinite planning canvas exploration. | Later Phase 2. |
| Fabric.js | Required canvas editor for comic pages, assets, text, panels, and production elements. | Later Phase 2 after save/load contracts. |
| Konva | Required high-performance layer, selection, transform, and editor-interaction layer. | Later Phase 2 after save/load contracts. |
| PixiJS | Required GPU rendering layer for complex scenes, previews, comic motion, and animation workspaces. | Phase 3+. |
| Paper.js | Required vector editing reference/runtime candidate for paths, masks, guides, speech shapes, and reusable vector elements. | Later Phase 2. |
| Remotion / FFmpeg | Export/render candidates from saved panels, voices, timeline tracks, camera cues, and timing data. | Phase 3+. |

### Layer 2 — Morphic Memory Layer

This is custom Morphic code, not an outsourced open-source tool.

Core modules:

- Story Memory Engine
- Character Memory Engine
- World Memory Engine
- Timeline/Episode Memory
- Relationship Engine
- Canon Validation Engine
- Asset Library
- Style and Voice Memory
- AI Orchestrator

Rule: LLMs and image engines can read from memory, but they do not own memory. PostgreSQL remains the source of truth.

### Layer 3 — Backend and data contracts

| Tool | Decision | Timing |
|---|---|---|
| Existing Express API | Keep for now. Do not migrate to NestJS during the current adapter sprint. | Now. |
| PostgreSQL | Keep as source of truth. | Now. |
| Prisma | Postpone. Current SQL migrations and controllers are already active; revisit only when schema churn slows. | Later. |
| Auth.js | Add when user accounts/projects need real authentication. | Later Phase 2. |
| Qdrant or pgvector | Add only after canon/memory retrieval needs semantic search. Prefer pgvector first if Supabase support is enough. | Later. |
| Meilisearch | Add only when Asset Library search becomes too large for PostgreSQL filters. | Later. |

### Layer 4 — Storage

| Tool | Decision | Timing |
|---|---|---|
| MinIO / S3-compatible storage | Add before imported, authored, AI-assisted, rendered, or exported files are treated as production assets. | Next backend infrastructure step. |

The adapter should save binaries to object storage, then save Morphic metadata in `assets`, `asset_versions`, `storage_objects`, panel metadata, and workflow stages.

### Layer 5 — AI job queue

| Tool | Decision | Timing |
|---|---|---|
| Redis + BullMQ | Add before heavy ComfyUI jobs are exposed to the website UI. | Immediately after the real runtime smoke path or alongside it. |

Direct API calls are acceptable for a backend-only smoke test. User-facing generation must go through jobs.

### Layer 6 — Core production automation stack

| Tool | Decision | Timing |
|---|---|---|
| ComfyUI | Required AI workflow engine for controlled pipelines, targeted edits, and missing-piece asset creation. | Now / next. |
| OpenCV | Required image intelligence layer for analysis, segmentation, masking, tracking, cleanup, and quality checks. | Phase 2 after asset metadata contracts. |
| Paper.js | Required vector graphics layer for comic/vector production records. | Later Phase 2. |
| IP-Adapter / InstantID / ControlNet OpenPose | Research inside ComfyUI workflows for reference-guided assets and pose/control inputs. | After first real ComfyUI smoke. |
| Rembg / SAM 2 | Candidate helpers for asset cleanup and targeted edits if OpenCV and ComfyUI workflows need additional segmentation. | Later Phase 2. |

Do not add text-to-video or image-to-video systems as core dependencies. They optimize for finished media generation, while Morphic needs reusable assets, rigging, timeline editing, production automation, and creator control.

### Layer 7 — Comic, rigging, animation, and export references

| Tool | Decision | Timing |
|---|---|---|
| Krita | Highest-priority comic production reference for drawing, panels, text/balloon workflows, and PSD-oriented art workflows. | Evaluate before custom comic drawing tools. |
| OpenToonz | Production workflow, scene management, onion-skinning, and animation pipeline reference. | Phase 3+. |
| SkelForm | High-priority skeletal rigging reference for IK, mesh deformation, PSD import, and reusable 2D character animation concepts. | Phase 3 rigging research. |
| Synfig Studio | High-priority reference for bones, tweening, cut-out animation, and vector/bitmap deformation. | Phase 3 rigging research. |
| Glaxnimate | SVG/vector animation and reusable graphics reference. | Phase 3+. |
| Blender | Future-capability reference for rigging, Grease Pencil, camera/lighting/rendering, not an immediate dependency. | Later. |
| Coqui TTS / RVC / whisper.cpp | Voice generation, voice conversion, and timing/transcription candidates. | Phase 3. |
| Remotion / FFmpeg | Rendering/export candidates from saved production records. | Phase 3. |

## Build order

1. Keep the current Express + PostgreSQL backend and finish the saved-record contracts.
2. Run the real ComfyUI API smoke test using `Comfy-Org/ComfyUI`, `COMFYUI_MODE=real`, `COMFYUI_BASE_URL`, and `COMFYUI_WORKFLOW_PATH`.
3. Add object storage so imported, authored, AI-assisted, rendered, and exported files become durable Asset Library records instead of mock URLs.
4. Add Redis/BullMQ so long-running production automation work is queued and restart-safe.
5. Add character consistency workflow inputs: master reference asset, pose/control inputs, prompt seed, model/workflow metadata, and repeatable output tracking.
6. Add canon validation as a backend service that checks scripts against saved character/world/timeline facts before production automation runs.
7. Start the React/Next.js editor migration only after the API contracts are stable.
8. Evaluate OpenCV and Paper.js before custom image-intelligence/vector systems.
9. Add canvas/page editing, comic intelligence, motion comics, voice, rigging, and animation in later phases.

## Immediate next implementation target

Validate the real ComfyUI runtime bridge without changing the UI:

- Provide `COMFYUI_BASE_URL`, `COMFYUI_WORKFLOW_PATH`, and optional timeout/runtime config.
- Load one saved `comic_panel`.
- Build the existing `comfyui_panel_plan_v1` payload.
- Send it to ComfyUI only when `COMFYUI_MODE=real`.
- Save the returned image into object storage when storage is configured; otherwise keep a safe local/mock fallback.
- Save or update `generation_jobs`, `assets`, `asset_versions`, `storage_objects`, `comic_panels.metadata`, and `workflow_stages`.
- Run `npm run verify:comfyui-runtime` against a real ComfyUI host without requiring frontend changes.

## Handoff checkpoint

Next agent start here:

```bash
export COMFYUI_MODE=real
export COMFYUI_BASE_URL=http://127.0.0.1:8188
export COMFYUI_WORKFLOW_PATH=/path/to/comfyui-api-workflow.json
export VERIFY_COMFYUI_WRITE=1 # only when DATABASE_URL is set and real DB writes are intended
npm run verify:comfyui-runtime
```

If that passes, the next code task is object storage: save the generated image bytes into MinIO/S3/local storage and record the output in `storage_objects`, `assets`, and `asset_versions`.

## Explicit non-goals for this sprint

- Do not migrate Express to NestJS yet.
- Do not migrate SQL migrations to Prisma yet.
- Do not wire production automation to a frontend button yet.
- Do not add every character-consistency model at once.
- Do not add text-to-video or image-to-video projects as core architecture dependencies.
- Do not build voice, Remotion, rigging, or animation before the visual asset contract is reliable.
