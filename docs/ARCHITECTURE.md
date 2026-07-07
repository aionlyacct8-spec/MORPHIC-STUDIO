# Morphic Studio Architecture

## Current architecture

The current app is a Node.js/Express monolith that serves static frontend pages and JSON APIs from the same server.

## Target open-source-ready architecture

- Frontend: Next.js and React when the static prototype is ready to migrate.
- Backend runtime: Node.js.
- Object storage: MinIO or another S3-compatible store for generated images, audio, video, thumbnails, and workflow outputs.
- Queue/cache/session layer: Redis.
- Background jobs: BullMQ.
- Real-time updates: Socket.IO.
- Visual generation adapter: ComfyUI.
- Canvas/editor layer: tldraw, React Grid Layout, Fabric.js, Konva.js, and PixiJS after panel/page layout contracts are stable.
- Motion comic rendering: Remotion after saved panels, timing, and voice records exist.
- Research additions: OpenTimelineIO and OpenColorIO.

## Adapter rule

Heavy engines should not be wired directly to UI buttons. Each engine needs an adapter that validates inputs, runs or queues work, saves outputs to Morphic records, and reports workflow status.

## Blueprint

The selected Phase 2 blueprint is documented in [Phase 2 Open-Source Blueprint](./PHASE2_OPEN_SOURCE_BLUEPRINT.md). The short version is: keep the current Express/PostgreSQL backend while adapter contracts are changing, connect real ComfyUI behind the existing backend adapter, add object storage and BullMQ before user-facing generation, then migrate the editor UI after the saved-record contracts are proven.
