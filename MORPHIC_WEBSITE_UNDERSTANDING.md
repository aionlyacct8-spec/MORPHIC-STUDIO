# Morphic Website Understanding

This file records the product understanding to preserve before choosing the next build step. It combines the owner's blueprint, current repository code, and current public research on the open-source tools being considered.

## 1. The core idea

Morphic Studio is not meant to be only an AI comic generator, only an AI animation generator, or a generic AI wrapper. The product is a complete AI-assisted storytelling studio where the platform remembers and reuses creative assets across multiple output formats.

The key philosophy is:

> Generate once. Save permanently. Reuse forever.

That means characters, locations, props, outfits, hairstyles, expressions, voices, backgrounds, story rules, universe laws, panels, animation parts, camera presets, and sound choices should become reusable project assets. The system should avoid regenerating the same character or world from scratch every chapter.

AI is not the whole answer by itself. AI is one engine inside the platform. The platform's unique value is memory, structure, reusable assets, workflow orchestration, and letting the creator move from story to comic to motion comic to animation without losing consistency.

## 2. Intended creator workflow

The long-term creator path is:

1. Start a project.
2. Add or generate story material: idea, script, chapter, scene, or character.
3. The system analyzes the script and extracts story structure.
4. Project Brain stores continuity, lore, character facts, world rules, relationships, and creative decisions.
5. Shared Asset Library stores reusable creative assets.
6. The creator chooses output:
   - Comic / webtoon.
   - Motion-comic slideshow.
   - Full animation.
7. Every output reuses the same saved characters, worlds, locations, props, voices, and story memory.

## 3. Two major production branches

### Branch A: Comic and webtoon workflow

The comic workflow should turn scripts into structured comic production data:

1. Script input.
2. AI story analysis.
3. Scene breakdown.
4. Storyboard.
5. Comic page layout.
6. Comic panels.
7. Comic-style effects and design language.
8. Comic editor.
9. Export as PDF, images, webtoon, or motion-comic source.

The important part is not only generating images. The important part is storing the comic production plan: chapters, pages, panels, characters in each panel, backgrounds, props, dialogue, shot type, camera angle, effects, and continuity notes.

### Branch B: Animation workflow

The animation workflow should not be treated as simple text-to-video. The owner's goal is closer to an animator's workflow:

1. Reuse or create characters.
2. Break characters into reusable parts when needed: body, arms, legs, head, face, mouth, eyes, outfits, poses, walk cycles, run cycles, expressions.
3. Use script and scene data to decide movement, camera, voice, lip sync, and actions.
4. Store animation rigs, presets, poses, and body-part assets.
5. Render or export through animation tools.

The animation branch may begin directly from story data. It can also optionally begin from a finished comic, but comic-to-animation is a shortcut, not the only path.

## 4. Motion comic / slideshow layer

Motion comic is a separate middle layer between comic and full animation.

It should not require moving character limbs. It should reuse comic panels and pages, then add:

- Page-to-page or panel-to-panel transitions.
- Guided reading movement: left/right, scroll, pan, zoom, hold.
- Character voices and narration.
- Music and sound effects.
- Captions and timing.

This is the correct place to add voice assignment and slideshow sequencing before full animation complexity.

## 5. Shared Asset Library requirements

The Asset Library should become the visible center of the website. It should store, search, reuse, and link:

- Characters.
- Outfits.
- Hairstyles.
- Facial expressions.
- Body poses.
- Props.
- Weapons.
- Vehicles.
- Buildings.
- Backgrounds.
- Worlds and locations.
- Music.
- Sound effects.
- Voices.
- Comic panels.
- Animation rigs.
- Body parts.
- Walk/run cycles.
- Camera presets.
- Lighting presets.

Every generated or imported thing should become an asset with enough metadata to reuse it later.

## 6. Character system requirements

Every character needs persistent identity and evolution, not one-off generation.

A character should store:

- Name.
- Age.
- Gender or identity notes.
- Appearance.
- Visual DNA.
- Outfits.
- Hair styles.
- Accessories.
- Facial expressions.
- Body poses.
- Walking style.
- Running style.
- Voice.
- Personality.
- Relationships.
- Arc progress.
- Status changes.

If a new script introduces a new character, the system should extract the character description, create the character record, save it into the library, and reuse it in later chapters.

If an existing character changes outfit, is injured, ages, transforms, or evolves emotionally, that should be recorded as character history instead of overwriting or regenerating the character from zero.

## 7. World and continuity requirements

The platform must remember the laws of the user's story universe.

World Builder and Project Brain should save:

- Cities.
- Schools.
- Kingdoms.
- Castles.
- Houses.
- Roads.
- Shops.
- Countries.
- Planets.
- Maps.
- Magic/technology/social rules.
- Timeline events.
- Continuity rules.
- Character relationships.
- Lore and story facts.

If a script contradicts established lore, the system should be able to flag it or preserve the existing rule unless the creator confirms a change.

## 8. Current codebase alignment

The current codebase already has part of the correct foundation:

- Node/Express backend.
- PostgreSQL schema and migrations.
- Static HTML frontend with Morphic-style UI.
- Project records.
- Project Brain records.
- Character, world, asset, script, scene, and episode models.
- Production models for chapters, comic pages, comic panels, voice profiles, motion-comic sequences/cues, and animation assets.
- Phase 1 story intake that saves scripts, chapters, scenes, pages, panels, and continuity rules.
- Phase 2 AI enhancement endpoint for deeper character/location/story analysis when an AI provider is configured.

This means the next work should not start by replacing everything. The next work should strengthen the foundation and make the saved-memory workflow visible and reliable.

## 9. What should not happen next

Do not add a large open-source editor just because a button is blank.

Do not add ComfyUI, Blender, SadTalker, FFmpeg, or a React rewrite before the save/load contracts are clear.

Do not treat AI generation as the product. The product is the organized reusable story-production system.

Do not build full animation before comic/story/asset consistency is stable.

## 10. Recommended next build order

### Step 1: Foundation correctness

- Make project selection reliable across pages.
- Make every API-backed page load real database data or show a clear empty state.
- Make Project Brain and Asset Library visible as the center of memory.
- Make characters, worlds, scripts, scenes, pages, and panels easy to inspect.

### Step 2: Asset Library first

- Add richer asset fields and UI for type, subtype, linked entity, tags, file URL, thumbnail, source, and usage.
- Make characters, worlds, panels, voices, and animation assets appear in one library.
- Add upload/import metadata before adding heavy generation.

### Step 3: Comic workflow

- Improve Story Intake into a clear chapter plan.
- Show generated scenes, pages, and panels in Storyboard/Comic Studio.
- Add edit/save for panel descriptions, dialogue, shot type, characters, props, effects, and continuity notes.
- Only then connect image generation through ComfyUI or another provider.

### Step 4: Motion comic workflow

- Use saved comic pages/panels to create motion sequences.
- Add cue editor: panel/page, start time, duration, transition, pan/zoom, caption, audio, voice profile.
- Add preview playback before final export.
- Add FFmpeg when export assembly is ready.

### Step 5: Animation workflow

- Add animation asset editor for rigs, body parts, poses, expressions, walk cycles, run cycles, lip-sync targets, and camera presets.
- Connect Blender only after animation asset data can be saved and loaded.
- Add lip sync after voice profiles and audio assets are stable.

### Step 6: Full open-source orchestration

- Connect ComfyUI for image workflows.
- Connect Blender for rigging/rendering workflows.
- Connect TTS/voice tooling after voice profile data is stable.
- Connect SadTalker or another lip-sync tool only if it fits the chosen animation style.
- Use FFmpeg for final assembly/export.

## 11. Open-source research notes

These notes are based on public project websites/GitHub pages checked on 2026-07-06.

### OpenHands

OpenHands is an open-source, model-agnostic platform for cloud coding agents. It is useful for development assistance and codebase work, not as an end-user creative feature inside Morphic. It should be treated as a developer tool for building Morphic faster.

Sources:
- https://github.com/OpenHands/openhands
- https://www.openhands.dev/

### ComfyUI

ComfyUI is a modular node-graph workflow engine for visual AI generation. It fits Morphic's future image-generation layer for characters, backgrounds, outfits, props, panels, and possibly video/3D/audio workflows. It should be integrated after Morphic has stable asset records and prompt/workflow metadata to save outputs back into the Asset Library.

Sources:
- https://github.com/comfy-org/comfyui
- https://comfy.org/

### Blender

Blender is a free and open-source 3D creation suite covering modeling, rigging, animation, simulation, rendering, compositing, motion tracking, and video editing. It fits Morphic's future animation/rendering layer, especially for rigging, camera, lighting, and final render workflows. It should come after animation asset contracts exist.

Sources:
- https://www.blender.org/
- https://github.com/blender/blender

### Coqui TTS

Coqui TTS is an open-source text-to-speech toolkit with pretrained models and training/fine-tuning tools. However, project status and active maintenance should be checked carefully before choosing it as the primary voice layer. Morphic should keep the voice-provider interface replaceable so Coqui, cloud TTS, or another open-source TTS system can be swapped.

Sources:
- https://github.com/coqui-ai/TTS
- https://github.com/idiap/coqui-ai-TTS

### SadTalker

SadTalker is a talking-head/lip-sync research/tooling direction for generating facial motion from audio and image input. It may be useful for talking portrait output, but it should not define the whole animation architecture. Use it only after deciding whether Morphic needs talking-head lip sync or a broader body-rig animation system.

Sources:
- https://sadtalker.github.io/
- https://github.com/OpenTalker/SadTalker

### FFmpeg

FFmpeg is a leading multimedia framework for decoding, encoding, transcoding, muxing, demuxing, streaming, filtering, and playing media. It is the right tool family for final export, audio/video assembly, compression, and format conversion after Morphic has pages, panels, motion cues, audio tracks, and render outputs.

Sources:
- https://www.ffmpeg.org/
- https://www.ffmpeg.org/about.html
- https://ffmpeg.org/ffmpeg.html

### PostgreSQL

PostgreSQL is the right database foundation for Morphic's structured project memory because it supports relational links, JSON metadata, transactions, indexing, and durable project records. Morphic already uses PostgreSQL, which matches the blueprint.

Sources:
- https://www.postgresql.org/
- https://www.postgresql.org/about/
- https://github.com/postgres/postgres

### Node.js

Node.js remains a good backend orchestration layer for Morphic's current Express API, business logic, provider gateways, generation jobs, and integration with external services.

Source:
- https://nodejs.org/

### React

React is a good future frontend direction for rich editors, reusable components, dashboards, asset managers, timelines, and canvas-heavy workflows. The current app is static HTML; a React migration should wait until the core data flows are stable enough to avoid rewriting the UI twice.

Source:
- https://react.dev/

## 12. What the owner should provide before choosing the next task

Before installing or integrating any open-source project, the owner should provide:

1. Which workflow comes first: Asset Library, Comic Studio, Motion Comic, or Animation Studio.
2. Any specific GitHub repos/packages to evaluate.
3. Whether commercial use is planned, so licenses can be checked.
4. Preferred storage direction: local Replit/FydeOS filesystem, cloud object storage, or provider-hosted URLs.
5. Which AI provider/API keys are available now.
6. Whether the first version is only for personal use or a small 3-5 user private beta.

## 13. My current understanding in one sentence

Morphic Studio should become a memory-first creative production platform where one story universe can become comic, webtoon, motion comic, and full animation by reusing saved characters, worlds, props, voices, panels, and animation assets instead of regenerating everything every time.
