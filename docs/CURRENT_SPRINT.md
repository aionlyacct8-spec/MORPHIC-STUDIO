# Current Sprint

## Focus

Architecture alignment before feature expansion.

The current sprint is not a feature sprint. It is an architecture refactoring and cleanup-planning sprint so future work follows the production-automation direction instead of one-click generation workflows.

## Active work

- Use [Production Automation Architecture](./PRODUCTION_AUTOMATION_ARCHITECTURE.md), [Comic Production Automation Architecture](./COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md), and [Open Source Integration Plan](../OPEN_SOURCE_INTEGRATION_PLAN.md) as the current architectural source of truth.
- Keep the Phase 1/Phase 2 bridge centered on saved Morphic records before wiring heavy engines to UI buttons.
- Maintain the [Architecture Compatibility Report](./ARCHITECTURE_COMPATIBILITY_REPORT.md) as the cleanup guide for compatible, partially compatible, conflicting, deferred, and technical-debt areas.
- Use [Core Data Model](./CORE_DATA_MODEL.md) as the canonical implementation reference before migrations, APIs, adapters, or save/load contracts are changed.
- Follow [AI Session Protocol](./AI_SESSION_PROTOCOL.md) and root `AGENTS.md` before making changes and before ending a major session.
- Maintain the [Living Roadmap](./LIVING_ROADMAP.md), root `ROADMAP.md`, [AI Handoff Guide](./AI_HANDOFF.md), root `SESSION_HANDOFF.md`, and root `DEVELOPMENT_LOG.md` whenever meaningful changes are made.
- Continue to preserve working backend/API systems unless they conflict with reusable production assets, modular workflows, non-destructive editing, or creator control.

## Current architecture checkpoint

- Morphic Studio is an AI-assisted production-automation platform for comics and animation.
- It is not an AI video generator, AI comic generator, or one-click content generator.
- Comic and animation workflows must reuse the same Character Library, Environment Library, Asset Library, Scene Builder, Project Brain, and Production Database.
- Text-to-video and image-to-video systems are not core dependencies.
- Open-source integrations should be added one at a time after the relevant Morphic data contracts exist.

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

1. Use `docs/CORE_DATA_MODEL.md` to review and refine `docs/DATABASE_REFACTORING_PLAN.md`, then draft Migration 005 for additive taxonomy/readiness changes.
2. Update frontend terminology and demo/default content in `frontend/storyboard.html`, `frontend/open-source-roadmap.html`, and `frontend/preview.html`.
3. Decide whether `generation_jobs` should be aliased, migrated, or left as a legacy internal implementation name.
4. Decide package-manager lockfile policy.
5. Identify archive strategy for historical patch files and attached planning assets.
6. Run `npm run verify:comfyui-runtime` only when a reachable `Comfy-Org/ComfyUI` host and known-good API-format workflow JSON are available.
7. Add MinIO/S3-compatible object storage after the storage policy and production job taxonomy are stable.
8. Add Redis/BullMQ runtime configuration after durable job semantics are decided.
