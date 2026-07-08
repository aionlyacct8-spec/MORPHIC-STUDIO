# Development Log

This log records completed work so future human and AI contributors can understand project history. Add a new entry after each major coding or architecture session.

## 2026-07-08 — Architecture alignment and AI handoff system

**Summary**

- Added architecture compatibility reporting for the updated production-automation vision.
- Added a living roadmap that tracks completed milestones, current milestone, active/upcoming/blocked/deferred tasks, architecture changes, decisions, integration progress, and known issues.
- Added an AI handoff guide for future coding agents.
- Added a session handoff file for quick continuation context.
- Updated documentation indexes to make the new operational docs discoverable.

**Files modified**

- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`
- `docs/AI_HANDOFF.md`
- `docs/DATABASE_REFACTORING_PLAN.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`
- `README.md`
- `docs/CURRENT_SPRINT.md`

**Reason for change**

The project needs architectural alignment, cleanup guidance, living roadmap state, and AI-to-AI handoff documentation before further feature development.

**Related architecture documents**

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `OPEN_SOURCE_INTEGRATION_PLAN.md`
- `docs/PHASE2_OPEN_SOURCE_BLUEPRINT.md`

**Breaking changes**

None. Documentation-only change.

**Recommended follow-up work**

Review and refine `docs/DATABASE_REFACTORING_PLAN.md`, then draft Migration 005 for additive taxonomy/readiness changes.

## 2026-07-08 — AI Session Protocol standardization

**Summary**

- Added root `AGENTS.md` so repository-level AI session rules are automatically discoverable by future coding agents.
- Added `docs/AI_SESSION_PROTOCOL.md` as the canonical AI coding session workflow.
- Added root `ROADMAP.md` as a quick-entry roadmap linked to the canonical living roadmap.
- Updated README, Current Sprint, Living Roadmap, AI Handoff, and Session Handoff references so the protocol is part of the standard workflow.

**Files modified**

- `AGENTS.md`
- `docs/AI_SESSION_PROTOCOL.md`
- `ROADMAP.md`
- `README.md`
- `docs/AI_HANDOFF.md`
- `docs/LIVING_ROADMAP.md`
- `docs/CURRENT_SPRINT.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`

**Reason for change**

The AI Session Protocol must be a permanent repository workflow, not only conversation-level guidance.

**Related architecture documents**

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`

**Breaking changes**

None. Documentation-only workflow standardization.

**Recommended follow-up work**

Review and refine `docs/DATABASE_REFACTORING_PLAN.md`, then draft Migration 005 for additive taxonomy/readiness changes.

## 2026-07-08 — Conflict 2 core dependency guardrail

**Summary**

- Addressed Architecture Compatibility Report Conflict 2 by adding an explicit open-source evaluation exclusion for text-to-video and image-to-video candidates as core dependencies.
- Preserved future research/export optionality only when a candidate can prove durable Morphic records, creator review, provenance, asset reuse, and non-destructive timeline or rig editability.
- Updated roadmap and handoff documentation to record the Conflict 2 status.

**Files modified**

- `backend/services/openSourceService.js`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`
- `ROADMAP.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`

**Reason for change**

The next approved architecture conflict required preventing future text-to-video/image-to-video tools from being planned as core dependencies.

**Related architecture documents**

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `OPEN_SOURCE_INTEGRATION_PLAN.md`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`

**Breaking changes**

None. Existing approved tool plans remain unchanged; excluded candidates now receive a more explicit architecture decision.

**Recommended follow-up work**

Begin Conflict 3: remove or clearly label static mock/demo cards in default user paths without changing backend contracts.

## 2026-07-08 — Conflict 3 preview demo-content cleanup

**Summary**

- Addressed Architecture Compatibility Report Conflict 3 in the default preview launcher by removing demo-response and demo-universe wording from product-facing copy.
- Reframed the no-database preview behavior as non-persistent API/frontend verification rather than product demo data.
- Updated roadmap and handoff documentation to record the Conflict 3 status and remaining conflict work.

**Files modified**

- `frontend/preview.html`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`
- `ROADMAP.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`

**Reason for change**

The next approved architecture conflict required removing or clearly relabeling static mock/demo content in default user paths so examples are not presented as real product data.

**Related architecture documents**

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`

**Breaking changes**

None. Copy-only frontend cleanup.

**Recommended follow-up work**

Begin Conflict 4: enforce that new integrations cannot create opaque output files without Asset Library, storage, version, job, and workflow-stage metadata.

## 2026-07-08 — Conflict 1 and 2 UX/dependency alignment

**Summary**

- Addressed Architecture Compatibility Report Conflict 1 by replacing visible one-click Generate/Regenerate frontend wording with Plan/Assist/Revise language across current static production screens.
- Preserved backward compatibility by leaving legacy backend task types internal while reframing user-facing status messages and prompts as production-assist planning actions.
- Revalidated Conflict 2 by keeping text-to-video/image-to-video candidates excluded from core dependency planning in the open-source evaluation service.

**Files modified**

- `frontend/storyboard.html`
- `frontend/index.html`
- `frontend/comic-studio.html`
- `frontend/animation-studio.html`
- `frontend/motion-comic-studio.html`
- `frontend/character-manager.html`
- `frontend/world-builder.html`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`
- `ROADMAP.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`

**Reason for change**

The requested conflicts required removing one-click generation positioning from visible product UX and confirming text-to-video/image-to-video integrations remain excluded from the core dependency path.

**Related architecture documents**

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`

**Breaking changes**

None. Frontend copy/function-name cleanup only; backend task contracts remain compatible.

**Recommended follow-up work**

Begin Conflict 4: enforce that new integrations cannot create opaque output files without Asset Library, storage, version, job, and workflow-stage metadata.

## 2026-07-08 — Conflict 4 output-record guardrail

**Summary**

- Addressed Architecture Compatibility Report Conflict 4 by adding an output-record policy to open-source evaluation.
- Output-producing integration plans now must declare writes to `assets`, `asset_versions`, `storage_objects`, `generation_jobs`, and `workflow_stages` before they can proceed.
- Unknown/custom integration proposals are blocked until their adapter brief proves the durable Morphic output-record contract.

**Files modified**

- `backend/services/openSourceService.js`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`
- `ROADMAP.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`

**Reason for change**

The final conflicting-system row required preventing integrations from creating opaque output files without reusable asset/version/storage/job/workflow-stage metadata.

**Related architecture documents**

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `OPEN_SOURCE_INTEGRATION_PLAN.md`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`

**Breaking changes**

None. Existing runtime adapters remain compatible; the evaluation service now blocks incomplete future adapter plans until their output records are declared.

**Recommended follow-up work**

Review and refine `docs/DATABASE_REFACTORING_PLAN.md`, then draft Migration 005 for additive taxonomy/readiness changes without breaking existing APIs.
