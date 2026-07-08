# Current Sprint

## Focus

Phase 2 implementation foundations through 2F.

The current sprint has expanded the implementation foundation from Phase 2A shared assets into additive Phase 2B-2F records for reusable characters, scene composition, storyboard references, comic lettering/layout, and animation timelines.

## Active work

- Use [Production Automation Architecture](./PRODUCTION_AUTOMATION_ARCHITECTURE.md), [Comic Production Automation Architecture](./COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md), and [Open Source Integration Plan](../OPEN_SOURCE_INTEGRATION_PLAN.md) as the current architectural source of truth.
- Begin Phase 2A with saved Morphic asset records, asset versions, provenance, metadata, storage links, usage relationships, and reuse-first retrieval before wiring heavy engines to UI buttons.
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

## Phase 2 database/API verification

`npm run verify:phase2` is the focused Phase 2A-2F validation harness. It requires `DATABASE_URL`, applies the base schema plus migrations, starts the Express app in-process without binding the normal long-running server, creates temporary production records through the public API, verifies persistence in the new tables, and deletes the temporary project.

Current verification status: local `.env` was configured with the development Supabase URL and `.gitignore` already excludes `.env`/`.env.*`. The verification scripts load `.env` before checking `DATABASE_URL`. Package-install root-cause investigation found two issues: the committed lockfile used an environment-specific `package-firewall.replit.local` mirror for resolved tarballs, and this container forces npm/curl through an Envoy proxy that returns `403 Forbidden` for both the mirror and `registry.npmjs.org`. The lockfile mirror URLs have been normalized back to `registry.npmjs.org`; verification still must be rerun in a normal development environment with package registry access because this container cannot fetch npm packages through its proxy.

```bash
export DATABASE_URL='postgresql://postgres.<project-ref>:<url-encoded-password>@<host>:5432/postgres'
npm run verify:phase2
```

## Phase 2 implementation sequence

1. **Phase 2A — Shared Asset System:** reusable asset infrastructure, versioning, metadata, provenance, storage links, relationships, usage tracking, and reuse-first retrieval.
2. **Phase 2B — Character System:** reusable characters with rigs, expressions, clothing, metadata, continuity rules, and versioning.
3. **Phase 2C — Scene Builder:** editable scene containers assembled from shared characters, environments, props, lighting, cameras, timeline cues, and continuity rules.
4. **Phase 2D — Storyboard Workspace:** storyboards directly connected to shared characters, environments, props, scenes, shot plans, and continuity notes.
5. **Phase 2E — Comic Production:** comic pages, panels, lettering, reading flow, and export built on shared assets and scenes.
6. **Phase 2F — Animation Production:** timelines, rigs, motion clips, camera/audio/dialogue tracks, and export built on shared assets and scenes.

## Next implementation steps

1. Restore npm dependencies in a normal development environment with package-registry access, then rerun `VERIFY_STORYBOARD_WRITE=1 npm run verify:storyboard`.
2. If storyboard verification passes, run `npm run verify:phase2` against the configured development database to validate Migrations 005 and 006 plus shared asset and Phase 2B-2F API persistence.
3. Implement reuse controls and stronger character matching during script intake after asset schema gaps are closed.
4. Decide whether `generation_jobs` should be aliased, migrated, or left as a legacy internal implementation name before adding new automation workers.
5. Decide package-manager lockfile policy.
6. Identify archive strategy for historical patch files and attached planning assets.
7. Run `npm run verify:comfyui-runtime` only when a reachable `Comfy-Org/ComfyUI` host and known-good API-format workflow JSON are available.
8. Add MinIO/S3-compatible object storage after the storage policy and production job taxonomy are stable.
9. Add Redis/BullMQ runtime configuration after durable job semantics are decided.
