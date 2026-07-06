# Open Source Integration Plan

Use this file before adding any GitHub repository or npm package to Morphic Studio.

## Right time to add open source tools

Add an open-source repo only when the related Morphic data model and save/load API already exist. Do not add a large editor just to make a button clickable.

### Add after these are ready

- **Canvas/comic editor**: after comic pages and panels can be loaded, edited, and saved with layer metadata.
- **Motion timeline editor**: after motion sequences and cues have stable fields for page, panel, start time, duration, transition, camera motion, captions, and audio.
- **Animation/rig editor**: after animation assets have stable rig/body-part/pose JSON and file storage URLs.
- **Voice/music tools**: after scripts, dialogue, voice profiles, audio assets, and storage are stable.
- **Export/render tools**: after storage, background jobs, and a rendering queue are stable.
- **Authentication/social login**: before account/profile/share/notifications are activated.

## What I need from you before adding a GitHub repo

For each repo/package, provide:

1. GitHub URL or npm package name.
2. Exact feature you want it to power, for example canvas layers, motion timeline, animation rigging, voice synthesis, music generation, auth, or export.
3. License approval: confirm the license is acceptable for your intended commercial/non-commercial use.
4. Whether generated files should be stored locally, in object storage, or only referenced by URL.
5. Any API keys, model/provider account, or service dashboard access needed.
6. Preferred UX: embedded editor, modal tool, background job, or separate studio page.

## Recommended candidates to evaluate later

These are categories, not approvals. Review license, maintenance, bundle size, and API fit before installing.

- Canvas/editor: Fabric.js, Konva, Excalidraw-compatible primitives, Tldraw.
- Timeline/video composition: Remotion, React Video Editor patterns, ffmpeg.wasm for limited browser-side jobs, server-side FFmpeg for production.
- Animation: Lottie ecosystem, Rive runtime, three.js for 3D previews, PixiJS for 2D stage rendering.
- Audio: wavesurfer.js for waveform UI, Tone.js for browser audio composition, provider SDKs for TTS when chosen.
- Auth: Passport.js or better a managed auth/provider-specific SDK after user ownership is designed.
- Jobs/queues: BullMQ with Redis when background generation leaves prototype mode.

## Evaluation checklist

- License is compatible.
- Package is maintained and has recent releases.
- Bundle size and browser support are acceptable.
- Data can be serialized into Morphic database records.
- It can work with project-scoped assets and Project Brain context.
- It does not require replacing the whole app architecture unless planned.
- It supports accessibility and keyboard basics or can be wrapped.
