# Current Sprint

## Focus

Real Storyboard + Asset Contract.

## Active work

- Keep the Phase 1/Phase 2 bridge centered on saved Morphic records before wiring heavy engines to UI buttons.
- Verify Story Intake saves scripts, chapters, scenes, comic pages, and comic panels.
- Verify Storyboard Review reloads saved pages/panels from the backend, edits panel metadata, and writes a `storyboard_review` workflow stage.
- Use `npm run verify:storyboard` as the regression check for the story-intake-to-storyboard save/load path.
- Keep ComfyUI planning adapter work behind saved panels, saved assets, and workflow stages.

## Next implementation steps

1. Run `npm run setup` or `npm run migrate` against the real Supabase database once DNS/network access to the Supabase pooler is available.
2. Run `VERIFY_STORYBOARD_WRITE=1 npm run verify:storyboard` with `DATABASE_URL` set in the runtime environment to validate the real database path.
3. Add the first ComfyUI planning adapter endpoint: one saved panel prompt in, one queued planning/generation job out, one Asset Library record saved when output exists.
4. Add Redis/BullMQ runtime configuration and a durable job status model before enabling heavy image generation from the UI.
5. Add Socket.IO only after durable jobs exist, starting with job progress/status events rather than multi-user collaboration.
