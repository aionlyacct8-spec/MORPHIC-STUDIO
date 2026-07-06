# Replit Cleanup Plan

This checklist divides the Replit-specific cleanup into ten one-at-a-time steps so each change stays small and reviewable.

## Step 1 — Delete historical Replit patch artifacts

Status: Done in this branch.

Delete the historical `0003-Update-Replit-configuration-and-fix-backend-server.patch` and `0004-Update-Replit-config-and-refactor-backend-server-ini.patch` files because they are patch artifacts from earlier Replit Agent work, not active application code or configuration.

## Step 2 — Review remaining patch artifacts

Decide whether the older `0001-*` and `0002-*` patch artifacts are still needed for project history, then delete or archive them outside the active source tree.

## Step 3 — Replace Replit-only package lock URLs

Regenerate `package-lock.json` outside Replit-specific registry mirrors so dependency metadata uses portable public npm registry URLs.

## Step 4 — Audit live Replit config files

Check for active `.replit`, `replit.md`, or workflow files and remove them unless Replit deployment remains an explicit target.

## Step 5 — Normalize port documentation

Make README, deployment docs, architecture notes, and backend defaults agree on the same runtime port and environment variable behavior.

## Step 6 — Replace Replit storage assumptions

Change Replit Object Storage references to provider-neutral object storage guidance such as S3-compatible storage, Cloudflare R2, or local development storage.

## Step 7 — Replace Replit database assumptions

Change Replit PostgreSQL setup language to generic PostgreSQL setup using `DATABASE_URL` and the existing migration scripts.

## Step 8 — Upgrade provider documentation

Clarify the supported AI provider order, required environment variables, and fallback behavior for OpenAI, OpenRouter, and Gemini-compatible generation.

## Step 9 — Remove stale pasted audit assets

Review `attached_assets/` pasted Replit transcript and audit notes, then keep only current product references or move historical notes to external documentation.

## Step 10 — Run full validation and update docs

Run the project checks, update the final cleanup status, and confirm no unintended Replit-only references remain in active source or deployment docs.
