# Open Source Integration Plan

Use this file before adding any GitHub repository or npm package to Morphic Studio. The stack is now tuned for production automation, not one-shot AI video or AI comic generation.

## Stack principle

Morphic Studio should prioritize tools that help creators reuse assets, edit production decisions, build rigs, compose pages, manage timelines, and export professional work. Text-to-video and image-to-video projects are not core architecture dependencies because they optimize for finished media generation rather than editable production workflows.

## Tier 1 — Core foundation

These projects are the required foundation for the production-automation platform.

| Purpose | Open source project | Keep? | Reason |
|---|---|---:|---|
| AI workflow engine | ComfyUI | ✅ Required | Orchestrates AI workflows, custom pipelines, controlled asset edits, and missing-piece creation. |
| Canvas editor | Fabric.js | ✅ Required | Interactive editing of comic pages, assets, text, panels, and production elements. |
| High-performance canvas/layers | Konva | ✅ Required | Layer management, selections, transforms, and structured editor interactions. |
| GPU rendering | PixiJS | ✅ Required | Fast rendering for complex scenes, previews, comic motion, and animation workspaces. |
| Image intelligence | OpenCV | ✅ Required | Image analysis, segmentation, masking, tracking, cleanup, and quality checks. |
| Vector graphics | Paper.js | ✅ Required | Vector editing for comics, diagrams, masks, guides, speech shapes, and reusable graphic elements. |

## Tier 2 — Comic production

These projects directly support professional comic workflows and should be evaluated before building equivalent features from scratch.

| Open source project | Purpose | Priority |
|---|---|---:|
| Krita | Professional drawing, comic panels, text/balloon workflows, brushes, and PSD-oriented art workflows. | ⭐⭐⭐⭐⭐ |
| OpenToonz | Scene management, exposure-sheet concepts, onion skinning, and production-pipeline references. | ⭐⭐⭐⭐ |
| Glaxnimate | SVG/vector animation, reusable vector graphics, tweening, and motion-design references. | ⭐⭐⭐⭐ |

Krita is especially relevant for comic production because its official features include vector/text tools for comic panels and word-bubble style workflows, and its manual documents a Comic Panel Editing Tool for slicing and merging panel shapes.

## Tier 3 — Animation production

These projects match Morphic Studio's production-automation vision better than text-to-video systems.

| Open source project | Purpose | Priority |
|---|---|---:|
| OpenToonz | Professional animation workflow and production pipeline concepts. | ⭐⭐⭐⭐⭐ |
| Synfig Studio | Bone animation, tweening, cut-out animation, and vector/bitmap deformation references. | ⭐⭐⭐⭐⭐ |
| SkelForm | Skeletal rigging, inverse kinematics, mesh deformation, PSD import, and reusable 2D character animation concepts. | ⭐⭐⭐⭐⭐ |
| Blender | Rigging concepts, Grease Pencil workflows, camera/lighting/rendering references, and future expansion. | ⭐⭐⭐⭐ |

## Tier 4 — Character rigging focus

The platform needs to understand characters as editable production assets. Required rigging capabilities include:

- Bone hierarchy
- Inverse kinematics (IK)
- Mesh deformation
- Joint constraints
- Skin weights
- Pose presets
- Facial rigs
- Hand rigs
- Animation retargeting

SkelForm and Synfig Studio are valuable references because they already expose several concepts Morphic needs for editable 2D character animation.

## Tier 5 — Morphic-owned asset management

Asset management should be a custom Morphic Studio subsystem rather than borrowed wholesale. The system should search before creating anything new:

1. Existing characters
2. Existing backgrounds
3. Existing props
4. Existing poses
5. Existing expressions
6. Existing lighting setups
7. Existing effects

The Asset Library should preserve metadata, provenance, versions, project links, usage history, and approval state for every imported, authored, AI-assisted, rendered, and exported asset.

## Tier 6 — Image intelligence workflow

The image workflow should be reuse-first and edit-first:

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

This reduces compute cost, maintains long-series consistency, and keeps projects editable.

## Tier 7 — Comic intelligence

AI should assist with page composition, panel layout, reading flow, dialogue fitting, speech bubble placement, caption placement, perspective suggestions, visual pacing, and scene continuity.

## Tier 8 — Animation intelligence

AI should assist with keyframe creation, in-between frames, body posing, facial animation, walk cycles, run cycles, camera motion, secondary motion, physics assistance, and motion cleanup.

## Tier 9 — Production intelligence

The Project Brain is Morphic Studio's production intelligence layer. Responsibilities include story understanding, character memory, world memory, project memory, asset tracking, continuity checking, workflow planning, agent coordination, documentation, and scheduling.

## Updated priority order

1. ComfyUI
2. Fabric.js
3. Konva
4. PixiJS
5. OpenCV
6. Paper.js
7. Krita
8. OpenToonz
9. SkelForm
10. Synfig Studio
11. Glaxnimate
12. Blender as a future-capability reference before it becomes an immediate dependency

## Right time to add open source tools

Add an open-source repo only when the related Morphic data model and save/load API already exist. Do not add a large editor just to make a button clickable.

### Add after these are ready

- **Canvas/comic editor**: after comic pages, panels, dialogue, captions, SFX, and layout metadata can be loaded, edited, and saved.
- **Vector tools**: after vector layer, path, mask, speech-shape, and panel-border metadata contracts exist.
- **Image intelligence tools**: after asset masks, segmentation metadata, analysis results, and target-edit records have stable storage.
- **Motion timeline editor**: after motion sequences and cues have stable fields for page, panel, start time, duration, transition, camera motion, captions, and audio.
- **Animation/rig editor**: after animation assets have stable rig/body-part/pose JSON and file storage URLs.
- **Voice/music tools**: after scripts, dialogue, voice profiles, audio assets, and storage are stable.
- **Export/render tools**: after storage, background jobs, and a rendering queue are stable.
- **Authentication/social login**: before account/profile/share/notifications are activated.

## What I need before adding a GitHub repo

For each repo/package, provide:

1. GitHub URL or npm package name.
2. Exact feature it should power, such as canvas layers, vector masks, panel layout, rigging, IK, segmentation, speech bubbles, voice synthesis, auth, or export.
3. License approval for the intended commercial/non-commercial use.
4. Whether files should be stored locally, in object storage, or only referenced by URL.
5. Any API keys, model/provider account, runtime, GPU, or service dashboard access needed.
6. Preferred UX: embedded editor, modal tool, background job, desktop handoff, or separate studio page.

## Evaluation checklist

- License is compatible.
- Package is maintained and has recent releases.
- Bundle size and browser/runtime support are acceptable.
- Data can be serialized into Morphic database records.
- It can work with project-scoped assets and Project Brain context.
- It supports non-destructive editing, versioning, and provenance or can be wrapped to do so.
- It does not require replacing the whole app architecture unless planned.
- It supports accessibility and keyboard basics or can be wrapped.

## Current source notes

- Krita official feature docs describe vector and text tooling for comic panels and word-bubble workflows, and the Krita manual documents a Comic Panel Editing Tool.
- SkelForm describes itself as a free/open-source 2D skeletal animator with inverse kinematics, mesh deformation, PSD import support, and sheet/video exports.
- Synfig official docs describe a bone system for cut-out animation and skeleton tooling.
- Glaxnimate official/KDE docs describe it as open-source vector animation and motion-design software with tweening, precompositions, motion along paths, text support, raster-to-vector support, and SVG support.
