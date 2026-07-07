# Morphic Studio Architecture

## Current architecture

The current app is a Node.js/Express monolith that serves static frontend pages and JSON APIs from the same server.

## Target open-source-ready architecture

- Frontend: Next.js and React when the static prototype is ready to migrate.
- Backend runtime: Node.js.
- Queue/cache/session layer: Redis.
- Background jobs: BullMQ.
- Real-time updates: Socket.IO.
- Visual generation adapter: ComfyUI.
- Canvas/editor layer: Fabric.js, Konva.js, and PixiJS.
- Research additions: OpenTimelineIO and OpenColorIO.

## Adapter rule

Heavy engines should not be wired directly to UI buttons. Each engine needs an adapter that validates inputs, runs or queues work, saves outputs to Morphic records, and reports workflow status.
