# AI Session Protocol

**Status:** Required standard workflow  
**Applies to:** Every future Morphic Studio AI coding session  
**Last updated:** 2026-07-08

This protocol makes the repository self-orienting for future AI coding agents. It is also mirrored in root `AGENTS.md` so agents that support repository instructions automatically load it before working in this codebase.

## Step 1 — Understand the project

Before writing or modifying code, read:

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `OPEN_SOURCE_INTEGRATION_PLAN.md`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`
- `ROADMAP.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`
- `docs/AI_HANDOFF.md`
- Active milestone/sprint documents such as `docs/CURRENT_SPRINT.md`

Do not assume previous knowledge if it is not documented.

## Step 2 — Understand current state

Determine:

- Current milestone
- Current objective
- Active task
- Completed work
- Pending work
- Known blockers
- Files currently being modified

Use `git status --short` before making changes. If anything is unclear, investigate the repository before editing.

## Step 3 — Validate architecture

Before implementing anything, confirm the request follows the latest Morphic Studio architecture.

Morphic Studio is an AI-assisted production-automation platform for comics and animation. It is not an AI video generator, AI comic generator, or one-click content generator.

Do not reintroduce concepts that conflict with:

- Reusable production assets
- Modular architecture
- Shared comic/animation production pipeline
- AI-assisted production rather than AI ownership
- Creator control
- Non-destructive editing and versioning
- Open-source integrations behind adapters
- Minimal technical debt

If a requested change conflicts with the architecture, explain the conflict and recommend a compatible approach before proceeding.

## Step 4 — Plan before coding

Before modifying files, identify:

- Implementation plan
- Affected files
- Dependencies
- Potential risks
- Logical implementation order

Then proceed in the smallest safe steps.

## Step 5 — Preserve existing functionality

Avoid unnecessary rewrites. Prefer to extend, refactor, modularize, or improve existing systems instead of replacing them.

Do not break working features without a compelling architectural reason.

## Step 6 — Keep documentation updated

Whenever architecture, workflows, major features, priorities, blockers, or decisions change, update the affected documentation in the same session:

- `docs/LIVING_ROADMAP.md`
- `ROADMAP.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`
- Architecture documents if affected
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md` if compatibility status changes
- `docs/AI_HANDOFF.md` if handoff context changes

Documentation should never become outdated after a major architectural decision.

## Step 7 — End-of-session handoff

Before ending a major session, update `SESSION_HANDOFF.md` with:

- Completed work
- In-progress work
- Remaining work
- Files modified
- Architectural decisions
- Problems encountered
- Exactly one highest-priority recommended next task

Also update `DEVELOPMENT_LOG.md` with:

- Date
- Summary
- Files modified
- Reason for the change
- Related architecture documents
- Breaking changes, if any
- Recommended follow-up work

## General rules

Always prioritize:

- Reusable production assets
- Modular architecture
- AI-assisted production
- Creator control
- Maintainability
- Documentation
- Minimal technical debt
- Long-term scalability

Never optimize for speed at the expense of architecture. If uncertain, preserve consistency over adding new features.
