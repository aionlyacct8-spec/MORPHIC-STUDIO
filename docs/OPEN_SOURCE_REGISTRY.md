# Morphic Studio Open Source Registry

**Status:** Operational registry for adopted and planned open-source components.  
**Last updated:** 2026-07-08

This is a registry, not a roadmap. Use it to track every open-source component Morphic Studio adopts or intentionally plans to adopt, including licensing, integration ownership, adapter status, and whether the component replaces custom code.

## Registry fields

- **Name:** Component name used in Morphic Studio planning and implementation.
- **Repository:** Canonical upstream repository or official project URL.
- **License:** Upstream license as currently documented; verify again before distribution or production bundling.
- **Purpose:** Why Morphic Studio uses or plans to use the component.
- **Integration status:** Current Morphic implementation state.
- **Adapter status:** Whether Morphic has an adapter boundary, planned adapter boundary, or no adapter yet.
- **Current version:** Installed package/version, external runtime version, or `Not installed` when planned only.
- **Replaces custom code?:** Whether the component should prevent Morphic from building equivalent custom infrastructure.
- **Owner subsystem:** Morphic subsystem accountable for integration decisions and compatibility.
- **Notes:** Architecture constraints, sequencing, or license caveats.

## Component registry

| Name | Repository | License | Purpose | Integration status | Adapter status | Current version | Replaces custom code? | Owner subsystem | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ComfyUI | https://github.com/Comfy-Org/ComfyUI | GPL-3.0 | Controlled image workflow orchestration for visual asset/reference workflows and missing-piece creation. | ✅ Integrated behind backend planning/runtime adapter; real runtime requires external host. | ✅ Adapter exists in backend service/routes. | External runtime; not vendored. | Yes — replaces custom AI workflow graph/orchestration engine. | AI workflow / visual asset adapters | Output-producing use must write job, workflow-stage, asset, asset-version, and storage-object records. |
| Fabric.js | https://github.com/fabricjs/fabric.js | MIT | Interactive 2D canvas editing for comic pages, assets, panels, text, and layout elements. | Planned | Planned editor adapter after save/load contracts stabilize. | Not installed | Yes — replaces custom object-canvas editor primitives. | Editor workspace / comic layout | Do not integrate before page, panel, vector, and asset contracts are stable. |
| Konva | https://github.com/konvajs/konva | MIT | High-performance layer management, transforms, selections, and structured editor interactions. | Planned | Planned editor adapter after save/load contracts stabilize. | Not installed | Yes — replaces custom layer/selection/transform framework. | Editor workspace / scene and page composition | Evaluate with Fabric.js rather than duplicating editor state models. |
| PixiJS | https://github.com/pixijs/pixijs | MIT | GPU-backed rendering for complex scene previews, animation workspace previews, and motion/comic rendering surfaces. | Planned | Planned rendering adapter. | Not installed | Yes — replaces custom WebGL renderer. | Rendering / animation preview | Add after shared asset and scene save/load contracts are stable. |
| OpenCV | https://github.com/opencv/opencv | Apache-2.0 | Image analysis, cleanup, masks, segmentation helpers, tracking, and quality checks. | Planned | Planned image-intelligence adapter. | Not installed | Yes — replaces custom image-analysis algorithms where practical. | Image intelligence / QA | Add after asset mask/segmentation metadata contracts exist. |
| Paper.js | https://github.com/paperjs/paper.js | MIT | Vector paths, masks, guides, speech shapes, reusable graphics, and vector editing operations. | Planned | Planned vector adapter. | Not installed | Yes — replaces custom vector-geometry engine. | Vector graphics / lettering and masks | Coordinate with Fabric.js/Konva editor responsibilities before adoption. |
| FFmpeg | https://github.com/FFmpeg/FFmpeg | LGPL-2.1-or-later by default; GPL applies when GPL components are enabled. | Audio/video conversion, render assembly, export transcodes, thumbnails, and delivery formats. | Planned | Planned export adapter. | Not installed | Yes — replaces custom media transcoding/export pipelines. | Export / media processing | Keep build configuration license-aware before bundling or distributing binaries. |
| Coqui TTS | https://github.com/coqui-ai/TTS | MPL-2.0 for code; model licenses vary. | Voice/TTS research for dialogue scratch tracks and future audio asset workflows. | Planned | Research adapter only. | Not installed | Partially — replaces custom TTS model work, not voice asset governance. | Audio / voice profiles | Verify model-specific licenses before use; voice workflows remain deferred. |
| SAM 2 | https://github.com/facebookresearch/sam2 | Apache-2.0 for core SAM 2 code/checkpoints; demo fonts have separate SIL OFL terms. | Promptable image/video segmentation for masks, cutouts, cleanup, and targeted edits. | Planned | Planned segmentation adapter after mask metadata contracts. | Not installed | Yes — replaces custom promptable segmentation model work. | Image intelligence / asset cleanup | Use behind asset/version/storage records; do not expose as opaque output generation. |
| Krita | https://invent.kde.org/graphics/krita | GPL-3.0-or-later | Professional drawing/comic workflow reference and possible external art-editing integration. | Evaluation/reference | No adapter yet. | Not installed | Partially — avoids rebuilding professional drawing tools. | Comic art / external editor research | Evaluate workflow interoperability before runtime dependency. |
| OpenToonz | https://github.com/opentoonz/opentoonz | BSD-3-Clause | Animation production workflow, scene/exposure-sheet concepts, and possible external pipeline integration. | Evaluation/reference | No adapter yet. | Not installed | Partially — avoids rebuilding mature animation production concepts. | Animation production research | Reference before direct integration. |
| Synfig Studio | https://github.com/synfig/synfig | GPL-3.0-or-later | Bone animation, tweening, vector/bitmap deformation, and cut-out animation reference. | Evaluation/reference | No adapter yet. | Not installed | Partially — informs rig/tween architecture. | Animation rigging research | Defer until character rigs and timeline contracts are stable. |
| Glaxnimate | https://gitlab.com/mattbas/glaxnimate | GPL-3.0-or-later | SVG/vector animation, tweening, and motion-design reference. | Evaluation/reference | No adapter yet. | Not installed | Partially — informs vector animation tooling. | Vector animation research | Defer until vector/timeline contracts are stable. |
| Blender | https://github.com/blender/blender | GPL-3.0-or-later | Future 3D, rigging, Grease Pencil, camera, lighting, and rendering reference/integration candidate. | Evaluation/reference | No adapter yet. | Not installed | Partially — avoids premature custom 3D stack. | Future 3D / animation research | Future-capability reference, not an immediate dependency. |

## Next stages after Phase 2A

1. **Phase 2B — Character Library:** implement reusable characters, rigs, expressions, poses, clothing, and metadata on top of shared assets.
2. **Phase 2C — Scene Builder:** implement scene composition, environment placement, prop placement, character placement, and references to shared assets without duplication.
3. **Phase 2D — Storyboard Workspace:** connect storyboard panels to characters, props, environments, and cameras using references rather than copies.
4. **Phase 2E — Comic Pipeline:** implement comic pages, panels, speech bubbles, and layout using the same shared assets.
5. **Phase 2F — Animation Pipeline:** implement timeline, keyframes, rig animation, motion, and camera animation using the same shared assets.
