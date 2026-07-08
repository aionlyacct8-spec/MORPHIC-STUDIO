# Morphic Studio Architecture

## Current architecture

The current app is a Node.js/Express monolith that serves static frontend pages and JSON APIs from the same server.


## Product architecture update

Morphic Studio is an AI-assisted animation and comic production platform, not a one-click AI video generator. The target system should behave like an operating system for production: creators direct story, acting, timing, camera, style, and final approval while AI agents automate repetitive production work.

The canonical direction is documented in [Production Automation Architecture](./PRODUCTION_AUTOMATION_ARCHITECTURE.md), with comic-specific requirements in [Comic Production Automation Architecture](./COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md). Earlier references to video generation, comic generation, page generation, or fully generated animation should be interpreted as editable production automation: reusable assets, rigs, timeline tracks, story intelligence, panel planning, scene organization, camera suggestions, dialogue placement, reading-flow analysis, in-betweening, lip sync, cleanup, rendering, and export.

## Target production modules

- Story Development and Script Writing.
- Storyboard, Story Intelligence, Panel Planning, and Comic Layout.
- Character, Environment, and Asset Libraries.
- Scene Builder and reuse-first Asset Retrieval.
- Character Rigging.
- Animation Workspace and Animation Automation Engine.
- Timeline Editing, Lighting, Effects, Audio, Rendering, and Export.
- Shared Project Memory and multi-agent production assistants.

## Target open-source-ready architecture

- Frontend: Next.js and React when the static prototype is ready to migrate.
- Backend runtime: Node.js.
- Object storage: MinIO or another S3-compatible store for imported, authored, AI-assisted, rendered, and exported production assets.
- Queue/cache/session layer: Redis.
- Background jobs: BullMQ.
- Real-time updates: Socket.IO.
- Visual workflow adapter: ComfyUI for asset, reference, targeted edit, and production-assist workflows behind editable Morphic records.
- Canvas/editor layer: Fabric.js, Konva, PixiJS, Paper.js, and tldraw-style planning after panel/page/vector contracts are stable.
- Image intelligence layer: OpenCV for segmentation, masking, tracking, cleanup, analysis, and quality checks.
- Comic/animation references: Krita, OpenToonz, SkelForm, Synfig Studio, Glaxnimate, and Blender evaluated before custom replacements.
- Rendering/export: Remotion or FFmpeg-style adapters after saved panels, timing, voices, timeline records, and asset links exist.
- Research additions: OpenTimelineIO and OpenColorIO.

## Adapter rule

Heavy engines should not be wired directly to UI buttons. Each engine needs an adapter that validates inputs, runs or queues work, saves editable outputs to Morphic records, preserves provenance/versioning, and reports workflow status. Text-to-video and image-to-video systems should not be core architecture dependencies.

## Blueprint

The selected Phase 2 blueprint is documented in [Phase 2 Open-Source Blueprint](./PHASE2_OPEN_SOURCE_BLUEPRINT.md). The short version is: keep the current Express/PostgreSQL backend while adapter contracts are changing, connect real ComfyUI behind the existing backend adapter, add object storage and BullMQ before user-facing long-running automation, then migrate the editor UI after the saved-record contracts are proven.
