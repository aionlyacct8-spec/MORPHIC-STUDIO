# Morphic Studio Feature Audit

This audit separates working features from prototype controls so the UI is no longer silently blank when a user clicks a shell button.

## Working now

- Static page navigation for the landing page, onboarding, dashboard, story hub, character manager, world builder, asset library, storyboard, comic studio, motion comic studio, and animation studio.
- Project creation through `POST /api/projects` from `frontend/new-project.html`.
- Dashboard Phase 1 story intake through `POST /api/projects/:projectId/production/intake/plan`.
- Dashboard Phase 2 AI enhancement through `POST /api/projects/:projectId/production/intake/enhance` when an AI provider key is configured.
- Character list/create flows through `GET/POST /api/projects/:projectId/characters`.
- Asset list/create/filter/detail flows through `GET/POST /api/projects/:projectId/assets`.
- World list/create flows through `GET/POST /api/projects/:projectId/worlds`.
- Story/production reads for storyboard, comic studio, and motion comic studio from chapters, pages, panels, and sequences.
- Motion-comic sequence creation from a saved chapter through `POST /api/projects/:projectId/production/motion/sequences`.

## Prototype controls now marked in the UI

A global frontend helper (`frontend/morphic-ui.js`) now intercepts unconnected `href="#"` links and buttons without real handlers. Instead of doing nothing, those controls show a clear toast explaining what backend API, auth, storage, provider, or editor integration is needed.

Common marked areas:

- Auth-only controls: sign in, forgot password, account, notifications, settings.
- Collaboration controls: share, workspace settings, support.
- Rendering/export controls: export, download, generate, auto-fix.
- Rich editor controls: brushes, layers, canvas tools, animation timeline buttons, zoom/playback buttons.
- Audio controls: voice and music tabs/options until a voice/music provider or open-source audio workflow is selected.

## API/provider prerequisites before enabling parked controls

1. Add real authentication and user ownership before enabling account, password reset, social login, notifications, settings, and sharing.
2. Finish durable storage and asset file upload before enabling download, export, thumbnails, imported files, or generated media URLs.
3. Keep Phase 1 story intake stable before connecting render/generation tools; render tools need saved chapters, scenes, panels, character IDs, location IDs, and asset IDs.
4. Add background generation jobs and status polling before enabling long-running AI generation buttons.
5. Pick editor/open-source packages only after the data contract is stable: what a panel, canvas layer, timeline cue, animation rig, and export job should save back to PostgreSQL.

## Suggested next audit pass

Run through the site in a browser after creating a project and one script intake plan. Verify every parked toast is acceptable, then promote one workflow at a time from prototype to API-backed behavior.
