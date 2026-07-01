---
name: Morphic Studio AI System
description: AI agents, orchestration patterns, model gateway, safety framework, and provider integrations
---

# Morphic Studio AI System

## Philosophy
- AI is a creative assistant / conductor, not the director
- Human retains final creative authority at all times
- AI never overwrites established lore or character decisions without explicit user approval
- Vendor-agnostic — providers are swappable modules

## Specialized AI Agents (the Agent Team)
1. **Planner Agent** — Decomposes user intent into ordered task plans; coordinates other agents
2. **Story Agent** — Script analysis, narrative consistency, dialogue generation
3. **Character Agent** — Character description generation, consistency enforcement via Character DNA
4. **World Agent** — Location descriptions, atmosphere, lore management
5. **Asset Agent** — Asset search, retrieval, generation requests
6. **Comic Agent** — Panel composition, shot selection, layout decisions
7. **Animation Agent** — Motion planning, keyframe suggestions, lip-sync processing
8. **Audio Agent** — Voice synthesis, music selection, SFX placement
9. **Quality Agent** — Validates outputs against Project DNA, Story Bible, and consistency rules

## AI Orchestration
- **AI Task Bus:** Message bus coordinating agent-to-agent communication
- **Execution flow:** Planner reads context → assigns tasks to specialized agents → agents execute in parallel where possible → Quality Agent validates → user approval gate → memory update
- **Context injection:** Every agent call is prefixed with relevant Project Brain + Story Bible + Project DNA context
- **Decision Engine:** Routes requests to the right agent(s) based on task type

## AI Model Gateway
- Single unified gateway between the platform and all external AI providers
- Responsibilities: provider selection, intelligent routing, failover, rate limiting, cost tracking, prompt validation, context filtering, usage quotas, provider isolation
- **Supported Providers:**
  - OpenRouter (multi-LLM: GPT-4o-mini, Claude, etc.) — currently integrated
  - Google Gemini (multimodal: text + image understanding)
  - ComfyUI (image generation — character art, backgrounds, panels)
  - Kokoro TTS (voice synthesis for characters)
- Provider credentials stored as environment secrets, never in code

## AI Learning Framework
- Tracks user feedback and approval/rejection patterns
- Improves prompt strategies over time per project
- Stores successful generation parameters in Project Brain for reuse
- Does not use user creative data for training without explicit consent

## AI Safety Framework
- Prompt validation before sending to providers (injection prevention)
- Content filtering on outputs
- Context size limits per request
- Usage quotas per user/project to prevent runaway costs
- Provider isolation — one provider's failure doesn't cascade
- Audit log of all AI calls (provider, model, tokens, cost, timestamp)

## AI Planning Framework
- Before any generation task, Planner Agent produces a structured plan:
  1. What assets are needed?
  2. Which already exist in the Asset Library?
  3. What needs to be generated?
  4. In what order?
  5. What are the consistency constraints (from Story Bible)?
- User can review and approve/modify the plan before execution

## Current AI Integration (live in repo)
- OpenRouter API (`POST https://openrouter.ai/api/v1/chat/completions`)
- Model: `openai/gpt-4o-mini`
- Auth: `Bearer ${OPENROUTER_API_KEY}` header
- Used for: script-to-storyboard conversion
- Requires: `OPENROUTER_API_KEY` environment secret

## Planned Additional AI Capabilities
- Image generation via ComfyUI for panel art
- Voice synthesis via Kokoro TTS
- Google Gemini for visual understanding (analyzing uploaded reference images)
- Batch generation for multiple panels simultaneously
