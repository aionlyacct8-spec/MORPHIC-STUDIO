# Morphic Studio AI Session Protocol

These instructions apply to the entire repository. Every AI coding session must follow this protocol before making code changes and before ending a session.

## 1. Understand the project before coding

Before writing or modifying code, read the current operational documents:

- `docs/PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `docs/COMIC_PRODUCTION_AUTOMATION_ARCHITECTURE.md`
- `OPEN_SOURCE_INTEGRATION_PLAN.md`
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md`
- `docs/LIVING_ROADMAP.md`
- `ROADMAP.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`
- `docs/AI_HANDOFF.md`
- Any active milestone/sprint document such as `docs/CURRENT_SPRINT.md`

Do not assume previous knowledge if it is not documented.

## 2. Determine current state

Before implementation, identify:

- Current milestone
- Current objective
- Active task
- Completed work
- Pending work
- Known blockers
- Files currently modified in `git status --short`

If anything is unclear, investigate the repository before changing files.

## 3. Validate architecture

Confirm that requested work follows the latest Morphic Studio architecture.

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

If a request conflicts with the architecture, explain the conflict and recommend a compatible approach before proceeding.

## 4. Plan before coding

Before modifying files, form a concise implementation plan that identifies:

- Affected files
- Dependencies
- Potential risks
- Logical implementation order

Then implement in the smallest safe steps.

## 5. Preserve existing functionality

Avoid unnecessary rewrites. Prefer to extend, refactor, modularize, or improve existing systems. Do not break working features without a compelling architectural reason.

## 6. Keep documentation synchronized

Whenever architecture, workflows, major features, priorities, blockers, or decisions change, update the relevant documentation in the same session:

- `docs/LIVING_ROADMAP.md`
- `ROADMAP.md`
- `DEVELOPMENT_LOG.md`
- `SESSION_HANDOFF.md`
- Architecture docs if affected
- `docs/ARCHITECTURE_COMPATIBILITY_REPORT.md` if compatibility status changes
- `docs/AI_HANDOFF.md` if handoff context changes

Documentation must remain synchronized with code and architecture.

## 7. End-of-session handoff

Before ending a major session, update `SESSION_HANDOFF.md` with:

- Completed work
- In-progress work
- Remaining work
- Files modified
- Architectural decisions
- Problems encountered
- Exactly one recommended next task

Also add an entry to `DEVELOPMENT_LOG.md` with:

- Date
- Summary
- Files modified
- Reason for the change
- Related architecture documents
- Breaking changes, if any
- Recommended follow-up work

## 8. General priorities

Always prioritize architectural consistency, reusable production assets, modular design, AI-assisted production, human creative control, comprehensive documentation, smooth AI-to-AI handoffs, minimal technical debt, and long-term scalability.

Never optimize for speed at the expense of architecture. If uncertain, preserve consistency over adding new features.
