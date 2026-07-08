# AI Pipelines

## Planned Morphic-owned systems

- Character Consistency Engine
- Style Consistency Engine
- Comic Production Automation Pipeline
- Animation Production Automation Pipeline
- Visual Identity Engine
- Story Intelligence Pipeline
- Asset Retrieval and Reuse Pipeline
- Local Organizer
- AI Communication System

## Primary open-source workflow engine

ComfyUI is the planned primary AI workflow engine for controlled visual workflows, targeted edits, reference-guided asset work, custom pipelines, and missing-piece creation. It should not be treated as a one-click generator that owns final production output.

## Reuse-first image intelligence flow

```text
Existing Character
↓
Existing Pose?
↓
Existing Expression?
↓
Existing Background?
↓
Need Editing?
↓
AI Edit
↓
Need New Asset?
↓
Create Only Missing Pieces
```

This flow keeps computation lower, preserves continuity, and supports long-running projects.

## Core open-source stack

- ComfyUI for AI workflow orchestration.
- Fabric.js for interactive comic/page/asset editing.
- Konva for layer management, selections, and transforms.
- PixiJS for GPU-backed rendering and complex scene previews.
- OpenCV for image analysis, segmentation, masking, tracking, cleanup, and quality checks.
- Paper.js for vector paths, masks, guides, speech shapes, and reusable graphics.

## Comic intelligence

AI should assist with page composition, panel layout, reading flow, dialogue fitting, speech bubble placement, caption placement, perspective suggestions, visual pacing, and scene continuity.

## Animation intelligence

AI should assist with keyframe creation, in-between frames, body posing, facial animation, walk cycles, run cycles, camera motion, secondary motion, physics assistance, and motion cleanup.

## Production intelligence

The Project Brain coordinates story understanding, character memory, world memory, project memory, asset tracking, continuity checking, workflow planning, agent coordination, documentation, and scheduling.

## Research additions

- Krita, OpenToonz, Glaxnimate, Synfig Studio, SkelForm, and Blender should be evaluated as comic, vector, rigging, animation, and future-capability references before Morphic builds equivalent systems from scratch.
- OpenTimelineIO may be useful for timeline import/export between animation and video tools.
- OpenColorIO may be useful for consistent color management across comics, animation, and rendering.

## Non-goal

Text-to-video and image-to-video systems are not core Morphic Studio architecture dependencies. They optimize for finished media generation, while Morphic Studio focuses on reusable assets, rigging, timeline editing, production automation, and creator control.
