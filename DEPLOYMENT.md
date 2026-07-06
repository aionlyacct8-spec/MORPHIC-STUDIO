# Morphic Studio Deployment Guide

**Create Once. Evolve Forever.**

Morphic Studio is an AI-powered creative OS for storytelling, comics, motion comics, and animation. This guide describes how to run and deploy the current Node/Express API plus static frontend without relying on a platform-specific workflow file.

## Runtime Requirements

- Node.js 20 or newer within the supported range in `package.json`.
- npm for dependency installation and scripts.
- PostgreSQL for persistent project, story, asset, and production workflow data.
- Optional AI provider credentials for OpenAI, OpenRouter, or Gemini-compatible generation.

## Local Development

```bash
npm install
cp .env.example .env
# Edit DATABASE_URL and any AI provider keys you need.
npm run setup
npm start
```

The server listens on `PORT` when set, otherwise it defaults to `5000`. Bind address is controlled by `HOST` and defaults to `0.0.0.0`, which works for containers and managed Node hosts.

## Process Entrypoint

The web process is declared in `Procfile`:

```text
web: npm start
```

The `npm start` script runs the Express server at `backend/server.js`, which serves both the API and static frontend.

## Environment Variables

| Variable | Purpose | Required |
|---|---|---:|
| `PORT` | HTTP port for the Node server. Defaults to `5000`. | No |
| `HOST` | Bind address for the Node server. Defaults to `0.0.0.0`. | No |
| `DATABASE_URL` | PostgreSQL connection string for persistent API endpoints. | Yes for database-backed use |
| `AI_PROVIDER` | AI provider selection: `openai`, `openrouter`, or `gemini`. | No |
| `OPENAI_API_KEY` | OpenAI API key when using OpenAI. | Provider-dependent |
| `OPENROUTER_API_KEY` | OpenRouter API key when using OpenRouter. | Provider-dependent |
| `GEMINI_API_KEY` | Gemini API key when using Gemini. | Provider-dependent |
| `APP_URL` | Public app URL used in AI provider metadata; defaults locally to `http://localhost:5000` when unset. | Recommended |
| `CORS_ORIGIN` | Comma-separated allow-list for browser origins. | No |
| `REQUIRE_API_KEY` / `API_KEY` | Optional API-key guard for deployments. | No |
| `STORAGE_PROVIDER` | Storage backend selector. Current local default is `local`. | No |
| `STORAGE_LOCAL_ROOT` | Local upload/storage root when local storage is enabled. | No |

## Database Setup

After provisioning PostgreSQL and setting `DATABASE_URL`, run:

```bash
npm run setup
```

For existing databases that only need pending migrations, run:

```bash
npm run migrate
```

## Application Structure

```text
backend/
  server.js          Express server; serves frontend + REST API
  routes/            API route definitions
  controllers/       Request/response handlers
  services/          Database, queue, storage, config, and product logic
  agents/            AI specialists and provider gateway
  middleware/        Auth, rate limiting, validation, errors, preview mode

database/
  schema.sql         Base PostgreSQL schema
  setup.js           Base setup + migrations
  migrate.js         Migration runner
  migrations/        Incremental SQL migrations

frontend/
  index.html                         Landing page
  signin.html                        Sign in / entry page
  new-project.html                   New project wizard
  creator-profile.html               Onboarding: creator persona
  goals-atmosphere.html              Onboarding: goals and genre
  world-character-foundations.html   Onboarding: world and characters
  style-ai-planning.html             Onboarding: style and AI synthesis
  universe-created.html              Onboarding success
  dashboard.html                     Nexus Workspace / story intake
  story-hub.html                     Story Bible / story systems
  character-manager.html             Character Manager
  world-builder.html                 World Builder
  asset-library.html                 Asset Library
  storyboard.html                    Storyboard Studio
  comic-studio.html                  Comic Studio
  motion-comic-studio.html           Motion Comic Studio
  animation-studio.html              Animation Studio
```

## Health and Verification

- `GET /api` returns API discovery and module information.
- `GET /api/health` returns runtime, provider, database, queue, and storage health.
- `npm run check` syntax-checks backend and database JavaScript files.

## Deployment Notes

1. Install dependencies with `npm install` or `npm ci`.
2. Set production environment variables in the host's secret manager.
3. Provision PostgreSQL and run `npm run setup` once.
4. Start the web process with `npm start` or the `Procfile` command.
5. Ensure the host routes external HTTP traffic to the configured `HOST`/`PORT` pair.

## Design System Reference

- Theme: cinematic dark background with lavender primary accents.
- Fonts: EB Garamond for headlines, Hanken Grotesk for body text, JetBrains Mono for labels/technical text.
- Components: glassmorphism panels, Material Symbols icons, and consistent studio navigation.
