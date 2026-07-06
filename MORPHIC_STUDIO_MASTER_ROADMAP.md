# Morphic Studio — Master Roadmap

A unified execution plan combining foundational infrastructure, cleanup work, missing systems review, and the phased build-out for Morphic Studio's AI comic/animation production pipeline.

---

## Immediate Cleanup: Placeholder & Demo Content Audit

*Must happen before major feature expansion so the current website feels intentional and does not confuse real projects with demo data.*

### C.1 Remove unnecessary placeholders
- [ ] Identify placeholder text, temporary UI, dummy features, and unfinished stubs across the current frontend and backend.
- [ ] Identify unfinished demo features that appear usable but are not connected to real application functionality.
- [ ] Identify duplicated, unreachable, or dead code.
- [ ] For every candidate removal, determine whether it affects the current website or active API routes.
- [ ] Remove or refactor only items that are safe to remove.
- [ ] Preserve anything required for application functionality, routing, database setup, migration compatibility, or future planned systems.
- [ ] Keep intentionally future-facing UI only when it is clearly labeled as planned, preview, template, or disabled.

### C.2 Clean up the Local Organizer / default project experience
- [ ] Remove automatic sample/demo scripts from the default user experience.
- [ ] Make new projects start clean by default.
- [ ] Ensure opening or creating a project does not inject an unexpected fake/example script.
- [ ] Keep sample data only if it is clearly marked as optional.
- [ ] Move example scripts into a separate Templates or Examples section that users explicitly choose to load.
- [ ] Preserve optional testing fixtures outside the default user workflow.

### C.3 Character consistency + Asset Library foundation *(recommended next step)*
- [ ] Strengthen character matching during story/script intake so existing saved characters are reused instead of duplicated.
- [ ] When a script introduces a genuinely new character, create and save that character as a reusable record.
- [ ] Link scenes, comic panels, voice profiles, and later animation assets back to saved character records.
- [ ] Build or wire a real Asset Library UI for characters, locations, props, voices, panels, and animation assets.
- [ ] Add manual reuse controls so creators can choose saved assets instead of regenerating them.
- [ ] Make the Asset Library the visible center of the “generate once, save permanently, reuse forever” workflow.

---

## Phase 0: Foundation Infrastructure & Production Readiness

*Must be in place before any new production feature work begins. Existing implemented items should be audited before being rebuilt.*

### 0.1 Configuration
- [ ] Environment configuration
- [ ] Secrets management
- [ ] Feature flags
- [ ] AI provider API key management
- [ ] Storage configuration

### 0.2 Database Migration
New or audited tables required:
- [ ] Assets
- [ ] Characters
- [ ] Locations
- [ ] Pages
- [ ] Panels
- [ ] Jobs
- [ ] Exports
- [ ] Voice Models
- [ ] Style Presets
- [ ] Project Settings

### 0.3 Logging
- [ ] Structured logging
- [ ] Error logging
- [ ] AI request logging
- [ ] Queue logging

### 0.4 Monitoring
- [ ] Health endpoints
- [ ] Queue monitoring
- [ ] AI provider monitoring
- [ ] Storage monitoring

---

## Phase 1: Platform Foundation

### 1.1 Initialize Next.js + React project alongside existing frontend
- [ ] Create Next.js app in `/frontend-next/`
- [ ] Set up project structure (app router, components, lib, hooks)
- [ ] Install core dependencies (Fabric.js, Konva, PixiJS, Socket.io-client)
- [ ] Create shared design system (colors, typography, components)
- [ ] Port landing page (`index.html` → Next.js)

### 1.2 Set up Redis + BullMQ job queue
- [ ] Install Redis
- [ ] Add BullMQ to backend
- [ ] Create job queue workers (image-gen, tts, export)
- [ ] Add Socket.io for real-time job progress to frontend
- [ ] Add Bull Board for job monitoring

### 1.3 Set up asset storage system
- [ ] Create `/storage/` directory structure for local dev
- [ ] Build asset upload/download API endpoints
- [ ] Add Sharp for image optimization and thumbnails
- [ ] Wire asset URLs into the existing assets DB table

### 1.4 Extend AI Gateway for image generation
- [ ] Add image generation provider support to `gateway.js`
- [ ] Support Replicate API (Stable Diffusion / Flux)
- [ ] Support FAL.ai as fallback
- [ ] Create `imageAgent.js` for prompt engineering
- [ ] Wire image results into asset storage

---

## Phase 2: AI Generation Systems

### 2.1 Prompt Builder
Composable prompt construction instead of single free-text prompts:

```text
Character + Location + Camera + Lighting + Mood + Art Style + Negative Prompt = Final Prompt
```

- [ ] Build reusable prompt assembly module
- [ ] Expose as shared service across image/animation pipelines

### 2.2 Comic panel image generation
- [ ] Take AI script analysis output (`visual_description` per panel)
- [ ] Feed through imageAgent → image generation API
- [ ] Store generated images as assets with panel linkage
- [ ] Display generated panel images in comic-studio

### 2.3 Character consistency system
- [ ] Generate character reference sheet from Character DNA
- [ ] Use reference images for consistent character generation
- [ ] Store character reference assets in asset library
- [ ] Reuse existing saved character records during script intake before generating new character assets
- [ ] Link every character image, pose, expression, voice, and animation asset to the canonical character record

### 2.4 Background generation
- [ ] Generate location backgrounds from Location DNA
- [ ] Store as reusable background assets
- [ ] Link backgrounds to location records

### 2.5 Image Upscaler
Pre-export upscaling:
- [ ] Real-ESRGAN integration
- [ ] Upscayl integration
- [ ] Flux Upscaler integration

### 2.6 Inpainting
Targeted regeneration instead of full-image redo:
- [ ] Regenerate face only
- [ ] Regenerate hand only
- [ ] Regenerate background only
- [ ] Regenerate speech bubble area only

### 2.7 Image Editing Pipeline
- [ ] Remove background
- [ ] Expand canvas
- [ ] Erase object
- [ ] Replace object
- [ ] Change expression
- [ ] Change pose

---

## Phase 3: Comic Page & Layout Pipeline

### 3.1 Comic page canvas editor (Fabric.js)
- [ ] Build React component wrapping Fabric.js
- [ ] Panel layout system (grid, custom, manga-style)
- [ ] Drag-drop panels onto page
- [ ] Speech bubble / caption placement
- [ ] Text editing in bubbles
- [ ] Page zoom/pan controls

### 3.2 Thumbnail Generator
- [ ] Generate tiny rough page layouts before final render

### 3.3 Storyboard View
- [ ] Entire chapter overview
- [ ] Drag pages to reorder

### 3.4 Automatic Page Layout AI
Instead of manual panel placement, AI generates:
- [ ] Manga layout
- [ ] Western layout
- [ ] Webtoon layout

### 3.5 Speech Bubble Auto Placement
- [ ] AI places bubbles without covering faces

### 3.6 Reading Order Detection
- [ ] Detect and encode reading order for exports

---

## Phase 4: Audio & Motion Pipeline

### 4.1 TTS voice generation
- [ ] Set up Piper TTS as FastAPI microservice
- [ ] Create voice assignment UI (map character → voice model)
- [ ] Generate dialogue audio per panel/scene
- [ ] Store audio assets with timeline metadata

### 4.2 Motion comic timeline & player
- [ ] Build PixiJS-based motion comic renderer
- [ ] wavesurfer.js audio timeline component
- [ ] Camera pan/zoom/Ken Burns effects per panel
- [ ] Parallax layer separation (character vs background)
- [ ] Panel transition effects (fade, slide, zoom)

### 4.3 Lip sync system
- [ ] Integrate Rhubarb for phoneme extraction
- [ ] Map phonemes to mouth shape sprites
- [ ] Sync mouth animation to audio timeline

### 4.4 Sound design
- [ ] Tone.js audio mixing engine
- [ ] SFX library browser (Freesound API integration)
- [ ] Ambient track assignment per scene
- [ ] BGM track support

### 4.5 Character Rigging *(future-proofing)*
- [ ] Live2D support
- [ ] Spine support
- [ ] Puppet animation support

### 4.6 Camera Timeline Editor
Separate from the audio timeline, with dedicated tracks:
- [ ] Camera track
- [ ] Characters track
- [ ] Effects track
- [ ] Audio track
- [ ] Captions track

### 4.7 Keyframe Editor
- [ ] Zoom keyframes
- [ ] Rotation keyframes
- [ ] Opacity keyframes
- [ ] Position keyframes

---

## Phase 5: Asset Management & Project Memory

### 5.1 Asset Browser
- [ ] Folders
- [ ] Tags
- [ ] Search
- [ ] Collections
- [ ] Favorites
- [ ] Character, location, prop, voice, panel, and animation-asset filters
- [ ] Manual asset reuse actions from the library into scenes, panels, motion sequences, and animation planning

### 5.2 Asset Versioning
- [ ] Every edit creates a new version
- [ ] Rollback support

### 5.3 Duplicate Detection
- [ ] Avoid storing the same image multiple times

### 5.4 AI Project Memory
Persistent store so AI stays consistent across the project:
- [ ] Characters
- [ ] Relationships
- [ ] World
- [ ] Locations
- [ ] Timeline
- [ ] Lore
- [ ] Rules
- [ ] Previous chapters
- [ ] Visual style
- [ ] Canonical character-to-asset links
- [ ] Canonical location-to-background links
- [ ] Canonical voice-to-character links

---

## Phase 6: Workflow Engine & Review System

### 6.1 Pipeline Workflow Engine
Structured pipeline instead of disconnected actions, where each stage knows previous outputs:

```text
Idea → Outline → Script → Storyboard → Panels → Images → Dialogue → Voice → Motion → Review → Export
```

- [ ] Define stage schema and state transitions
- [ ] Pass prior-stage outputs forward automatically

### 6.2 Review System
Per-panel controls:
- [ ] Approve
- [ ] Reject
- [ ] Regenerate
- [ ] Lock
- [ ] Unlock

---

## Phase 7: Export & Distribution

### 7.1 Comic PDF export
- [ ] PDFKit or Puppeteer-based PDF generation
- [ ] Print-ready settings (300 DPI, CMYK, bleeds)
- [ ] Digital-optimized export (RGB, compressed)

### 7.2 Motion comic video export
- [ ] FFmpeg video rendering pipeline
- [ ] MP4 and WebM output
- [ ] Resolution options (720p, 1080p, 4K)
- [ ] Progress tracking via BullMQ

### 7.3 WebComic reader mode
- [ ] Scrollable web reader component
- [ ] Episode/chapter navigation
- [ ] Shareable public links

### 7.4 Additional Export Formats
- [ ] PNG pages
- [ ] JPEG pages
- [ ] PSD layers
- [ ] ZIP package
- [ ] EPUB
- [ ] CBZ
- [ ] CBR

---

## Phase 8: AI Agents Architecture

Specialized agents beyond the current `imageAgent`, each focused on a single task:
- [ ] Story Agent
- [ ] Character Agent
- [ ] Dialogue Agent
- [ ] Image Agent
- [ ] Background Agent
- [ ] Color Agent
- [ ] Animation Agent
- [ ] Voice Agent
- [ ] Export Agent
- [ ] QA Agent

---

## Phase 9: Polish & Professional Features

### 9.1 Style consistency engine
- [ ] Color palette enforcement across generated images
- [ ] Art style presets (manga, western comic, graphic novel, webtoon)
- [ ] Color grading pipeline (OpenCV)

### 9.2 Animatic generator
- [ ] Auto-generate timed slideshow from storyboard + voice
- [ ] Preview before committing to full motion comic

### 9.3 Collaboration features
- [ ] Multi-user project access
- [ ] Comment/review system on panels
- [ ] Version history for all assets

### 9.4 User Experience
- [ ] Undo/redo
- [ ] Autosave
- [ ] Draft recovery
- [ ] Keyboard shortcuts
- [ ] Command palette
- [ ] Right-click menus
- [ ] Drag-and-drop uploads
- [ ] Progress notifications

---

## Phase 10: Performance & Scalability

- [ ] Lazy loading
- [ ] Image streaming
- [ ] Tile rendering for huge pages
- [ ] Asset caching
- [ ] CDN support
- [ ] Background preloading

---

## Phase 11: Security & Compliance

- [ ] Rate limiting
- [ ] Upload validation
- [ ] Virus scanning
- [ ] API authentication
- [ ] Permission system
- [ ] Project ownership
- [ ] Audit logs

---

## Phase 12: Testing & QA

- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] AI output validation
- [ ] Export validation
- [ ] Load testing
