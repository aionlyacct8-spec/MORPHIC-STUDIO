# Morphic Studio Roadmap

This roadmap follows the [Production Automation Architecture](./PRODUCTION_AUTOMATION_ARCHITECTURE.md) and [Comic Production Automation Architecture](./COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md). Morphic Studio is an AI-assisted animation and comic production platform, not an AI video or AI comic generator. Roadmap items should prioritize reusable assets, editable rigs, timeline-based automation, comic story intelligence, panel planning, reading-flow analysis, project memory, and creator control.

## Phase 1 — Foundation

- Stabilize project, script, story-analysis, scene, panel, page-layout, dialogue, character, world, asset, style, voice, and workflow-stage save/load contracts.
- Keep open-source engines behind evaluation and planning until contracts are stable.
- Document which Morphic records each integration writes to.

## Phase 2 — Open-source adapters

- ComfyUI adapter for visual asset/reference workflows that write editable, reusable Asset Library records.
- MinIO/S3-compatible storage for imported, authored, AI-assisted, rendered, and exported production files and thumbnails.
- Redis/BullMQ queue runtime for long-running production automation jobs.
- Fabric.js/Konva/PixiJS/Paper.js/tldraw editor adapter plan for canvas, vectors, layers, previews, and reusable graphics.
- OpenCV image-intelligence plan for segmentation, masking, tracking, cleanup, analysis, and quality checks.
- Krita/OpenToonz/SkelForm/Synfig/Glaxnimate/Blender evaluation plan before custom comic, rigging, and animation replacements.
- Remotion/FFmpeg rendering plan from saved panels, voices, timeline tracks, camera cues, and timing.
- Socket.IO progress events for real-time status.
- Canon Validation Engine for checking scripts, scenes, panels, page layouts, dialogue placement, rigs, and timelines against saved character, world, relationship, and production memory before automation runs.
- Research OpenTimelineIO for timeline interoperability.
- Research OpenColorIO for color-management consistency.

## Not included for now

- Replit is removed from the website stack.
- Odyssey remains research only.
- Additional image-generation engines are postponed because Morphic should first prove durable asset reuse, editable automation outputs, and ComfyUI-backed production-assist workflows.
- Text-to-video and image-to-video projects are removed from the core architecture unless a future export/research task proves they can preserve editable production records.
- Git Workflow Skill is postponed.
