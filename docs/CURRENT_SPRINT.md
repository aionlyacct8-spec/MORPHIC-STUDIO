# Current Sprint

## Focus

Real Storyboard + Asset Contract.

## Active work

- Keep the Phase 1/Phase 2 bridge centered on saved Morphic records before wiring heavy engines to UI buttons.
- Verify Story Intake saves scripts, chapters, scenes, comic pages, and comic panels.
- Verify Storyboard Review reloads saved pages/panels from the backend, edits panel metadata, and writes a `storyboard_review` workflow stage.
- Use `npm run verify:storyboard` as the regression check for the story-intake-to-storyboard save/load path.
- Keep ComfyUI planning adapter work behind saved panels, saved assets, and workflow stages.
- Use `npm run verify:comfyui-plan` as the Phase 2 regression check for one saved panel prompt producing one simulated ComfyUI job, one Asset Library record, and one `comfyui_planning` workflow stage.
- Follow the selected [Phase 2 Open-Source Blueprint](./PHASE2_OPEN_SOURCE_BLUEPRINT.md): real ComfyUI next, then durable storage and queues before UI-triggered generation.
- Checkpoint for the next AI agent: the adapter now has a real-runtime bridge guarded by `COMFYUI_MODE=real`, `COMFYUI_BASE_URL`, and `COMFYUI_WORKFLOW_PATH`; start by running `npm run verify:comfyui-runtime` against a reachable ComfyUI host with an API-format workflow JSON.

## Supabase verification runbook

The storyboard verifier has a safe real-database mode. When `DATABASE_URL` is present it refuses to create records unless `VERIFY_STORYBOARD_WRITE=1` is also set, then it attempts to delete its temporary verification project after the run.

Run the real Supabase verification from an environment that can resolve the Supabase pooler host. If a cloud/dev container reports `getaddrinfo EAI_AGAIN` for the pooler host, do not spend time debugging the storyboard verifier; move the same commands to a native host terminal or CI runner with working DNS.

Status: Option 2 was successfully verified on the native host machine. With the pooled Supabase `DATABASE_URL` set and `VERIFY_STORYBOARD_WRITE=1`, both `npm run setup` and `npm run verify:storyboard` passed against the real database.

### Native host terminal

```bash
# Use the current Supabase pooled connection string from the dashboard.
# Keep the secret local; do not commit it.
export DATABASE_URL='postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
export VERIFY_STORYBOARD_WRITE=1

npm run setup
# or: npm run migrate

npm run verify:storyboard
```

PowerShell equivalent:

```powershell
$env:DATABASE_URL="postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
$env:VERIFY_STORYBOARD_WRITE="1"
npm run setup
npm run verify:storyboard
```

### CI runner

Store the pooled Supabase URL as a secret, then run the verifier with writes explicitly enabled:

```yaml
name: Supabase Storyboard Verification

on:
  workflow_dispatch:
  pull_request:

jobs:
  verify-storyboard:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run setup
        env:
          DATABASE_URL: ${{ secrets.SUPABASE_DB_URL }}
      - run: npm run verify:storyboard
        env:
          DATABASE_URL: ${{ secrets.SUPABASE_DB_URL }}
          VERIFY_STORYBOARD_WRITE: 1
```

## Next implementation steps

1. Run `npm run setup` or `npm run migrate` against the real Supabase database from a native host or CI runner that can resolve the Supabase pooler.
2. Run `VERIFY_STORYBOARD_WRITE=1 npm run verify:storyboard` with `DATABASE_URL` set in that same runtime environment to validate the real database path.
3. Run `npm run verify:comfyui-runtime` against a reachable `Comfy-Org/ComfyUI` host and a known-good API-format workflow JSON.
4. Add MinIO/S3-compatible object storage so generated files become durable Asset Library objects instead of ComfyUI `/view` URLs or mock URLs.
5. Add Redis/BullMQ runtime configuration and a durable job status model before enabling heavy image generation from the UI.
6. Add Socket.IO only after durable jobs exist, starting with job progress/status events rather than multi-user collaboration.
