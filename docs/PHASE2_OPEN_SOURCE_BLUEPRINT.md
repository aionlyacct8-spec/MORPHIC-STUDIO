# Phase 2 Open-Source Blueprint

## Decision

Use a combined blueprint:

- Keep the layer model from the third proposal because it makes every open-source tool replaceable.
- Keep the build-order discipline from the second proposal because Morphic should not jump into canvas, voice, or animation before the memory and asset contracts are stable.
- Keep the cloud-decoupling rule from the first proposal because the website must stay responsive while heavy AI work runs on separate GPU/storage/queue infrastructure.

Morphic Studio's advantage is not any single model or canvas package. The advantage is the Memory Layer: projects, canon, characters, worlds, panels, assets, voices, styles, and workflow stages stored as durable Morphic records before any engine generates output.

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
- MinIO/S3 object persistence for generated binaries.
- React/Next.js editor UI actions that trigger generation.
- Voice, motion comic rendering, full animation, and canon validation UI.

## Selected stack by layer

### Layer 1 — Interface

| Tool | Decision | Timing |
|---|---|---|
| Next.js + React | Keep as the eventual app shell for dashboard, asset library, and editors. | After backend contracts stabilize. |
| shadcn/ui | Use for a fast, themeable component system once React migration begins. | Later Phase 2. |
| Zustand | Use for editor-local state such as selected panel, drag state, and layout state. | Later Phase 2. |
| tldraw | Use for storyboard / infinite planning canvas exploration. | Later Phase 2. |
| React Grid Layout or Fabric.js | Use for comic page layout editing; decide after the panel layout JSON contract exists. | Later Phase 2. |
| Remotion | Use for motion-comic/slideshow export from saved panels, voices, and timing data. | Phase 3+. |

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
| MinIO / S3-compatible storage | Add before real generated image/audio/video files are treated as production assets. | Next backend infrastructure step. |

The adapter should save binaries to object storage, then save Morphic metadata in `assets`, `asset_versions`, `storage_objects`, panel metadata, and workflow stages.

### Layer 5 — AI job queue

| Tool | Decision | Timing |
|---|---|---|
| Redis + BullMQ | Add before heavy ComfyUI jobs are exposed to the website UI. | Immediately after the real runtime smoke path or alongside it. |

Direct API calls are acceptable for a backend-only smoke test. User-facing generation must go through jobs.

### Layer 6 — Visual generation and character consistency

| Tool | Decision | Timing |
|---|---|---|
| ComfyUI | Primary visual generation runtime. | Now / next. |
| IP-Adapter / InstantID / ControlNet OpenPose | Research and test inside ComfyUI workflows after one real panel image is generated. | After first real ComfyUI smoke. |
| StoryDiffusion / CharaConsist / PhotoMaker | Research candidates for multi-panel character consistency. | After baseline ComfyUI bridge works. |
| Rembg / SAM 2 | Useful for asset cleanup and targeted edits. | Later Phase 2. |

Do not make StoryDiffusion, CharaConsist, or a custom node pack mandatory until the core ComfyUI API bridge can run one controlled workflow and return one saved asset.

### Layer 7 — Voice, motion comic, and animation

| Tool | Decision | Timing |
|---|---|---|
| Coqui TTS / RVC / whisper.cpp | Voice generation, voice conversion, and timing/transcription candidates. | Phase 3. |
| Remotion | Programmatic motion comic rendering from saved panels and timing. | Phase 3. |
| SadTalker / Blender / OpenToonz / FFmpeg | Animation and export tools. | Last; do not start before visual generation and asset memory are reliable. |

## Build order

1. Keep the current Express + PostgreSQL backend and finish the saved-record contracts.
2. Run the real ComfyUI API smoke test using `Comfy-Org/ComfyUI`, `COMFYUI_MODE=real`, `COMFYUI_BASE_URL`, and `COMFYUI_WORKFLOW_PATH`.
3. Add object storage so generated files become durable Asset Library files instead of mock URLs.
4. Add Redis/BullMQ so long-running AI work is queued and restart-safe.
5. Add character consistency workflow inputs: master reference asset, pose/control inputs, prompt seed, model/workflow metadata, and repeatable output tracking.
6. Add canon validation as a backend service that checks scripts against saved character/world/timeline facts before generation.
7. Start the React/Next.js editor migration only after the API contracts are stable.
8. Add canvas/page editing, motion comics, voice, and animation in later phases.

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
- Do not wire generation to a frontend button yet.
- Do not add every character-consistency model at once.
- Do not build voice, Remotion, or animation before the visual asset contract is reliable.
