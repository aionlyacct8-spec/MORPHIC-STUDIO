---
name: Morphic Studio Architecture
description: Layered architecture, service boundaries, backend/frontend/DB/AI separation, API design, and scalability strategy
---

# Morphic Studio Architecture

## Four-Layer Architecture
- **Layer 1 — UX:** Dashboard, editors, studio interfaces (React + TypeScript + Tailwind)
- **Layer 2 — Project Brain:** Isolated per-project memory, state, and intent tracking
- **Layer 3 — Morphic Core:** AI orchestration, agent coordination, asset synchronization
- **Layer 4 — AI Services:** External specialized models (ComfyUI, Kokoro TTS, OpenRouter LLMs, Google Gemini)

## Backend Architecture
- **Current:** Node.js + Express (ESM modules), single `backend/server.js`
- **Planned:** Modular service architecture, potentially NestJS for later phases
- **API Design:** RESTful, versioned (`/api/v1/`), JSON responses
- **Middleware:** CORS, JSON body parsing, auth middleware (JWT), request logging
- **Error Handling:** Standardized error responses with error codes

### Core Backend Services (planned)
1. **Auth Service** — registration, login, JWT issuance/refresh, session management
2. **Project Service** — CRUD for projects, Project Brain state
3. **Asset Service** — upload, versioning, search, deduplication
4. **AI Gateway Service** — routes requests to AI providers, rate limiting, cost tracking
5. **Workflow Engine** — async task queue, job scheduling, background processing
6. **Export Service** — render pipeline, format conversion, packaging
7. **Notification Service** — real-time updates to frontend

## Frontend Architecture
- **Current:** Static HTML files served by Express
- **Planned:** React SPA with TypeScript, component library, Tailwind CSS
- **State Management:** Context API + custom hooks (lightweight), not Redux
- **Routing:** React Router (client-side routing)
- **Key Pages/Views:** Dashboard, Comic Studio, Animation Studio, Storyboard Studio, Character Manager, World Builder, Asset Library, Script Editor, Settings

## Database Architecture
- **Primary DB:** PostgreSQL
- **ORM (planned):** Prisma
- **Current raw tables:** `scripts`, `storyboards`, `characters`
- **Connection:** Pool via `pg` / Prisma client, `DATABASE_URL` env var

## AI Gateway
- Unified gateway sits between the backend and all AI providers
- Handles: provider selection, failover, rate limiting, cost tracking, prompt validation, context filtering
- Providers: OpenRouter (LLMs), Google Gemini (multimodal), ComfyUI (image generation), Kokoro TTS (voice)
- Platform remains vendor-agnostic — providers are swappable

## Communication Patterns
- **Frontend → Backend:** REST API calls
- **Backend → AI:** AI Gateway (HTTP/gRPC to provider APIs)
- **Async Work:** Workflow Engine / task queue (rendering, export, long AI jobs)
- **Real-time:** WebSocket or Server-Sent Events for job status updates

## Scalability Strategy
- "Build Small / Design Big" — start monolithic, design interfaces for future decomposition
- All services communicate via standardized interfaces to support later microservice extraction
- Stateless API servers; state in DB + cache
- Distributed tracing via globally unique Trace IDs

## Development Environment
- Replit as primary platform (development + deployment)
- GitHub for version control (feature branch → dev → review → merge → deploy)
- Port: 3000 (default), configurable via `PORT` env var
- Static files served from `frontend/` directory
