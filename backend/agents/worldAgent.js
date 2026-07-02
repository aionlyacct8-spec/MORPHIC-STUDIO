/**
 * World Agent — builds and maintains the world bible, locations, and lore.
 * Generates reusable world entities: cities, buildings, environments, rules.
 */
import { callAI, parseJSON } from './gateway.js';
import logger from '../utils/logger.js';

const log = logger.child('worldAgent');

const SYSTEM = `You are the World Agent for Morphic Studio — a master world-builder who creates rich, internally consistent story worlds.
You design worlds with deep history, clear rules, and vivid sensory atmospheres.
You generate reusable locations and environments that artists and writers can reference repeatedly.
Always respect existing world facts from the Project Brain. Return responses as valid JSON.`;

/**
 * generateWorldBible({ name, premise, genre, era, brainContext })
 * Creates a full world bible from scratch or expands an existing one.
 */
export async function generateWorldBible({ name, premise, genre = '', era = '', brainContext = '' }) {
  log.info('generateWorldBible', { name });

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Build a complete world bible for:
World Name: ${name}
Era/Time: ${era}
Genre: ${genre}
Premise: ${premise}

Return JSON:
{
  "name": "...",
  "description": "...",
  "history": ["Major historical event 1", "..."],
  "rules": [
    { "rule": "...", "category": "physical|social|technological|magical" }
  ],
  "atmosphere": {
    "dominant_mood": "...", "climate": "...", "sounds": "...",
    "smells": "...", "visual_palette": "..."
  },
  "power_structures": "...",
  "key_factions": [...],
  "technology_level": "...",
  "locations_to_create": ["Location name 1 (type)", "..."]
}`
    }],
    maxTokens: 2000,
  });

  return parseJSON(result.content) ?? { raw: result.content };
}

/**
 * generateLocation({ name, type, worldContext, brainContext })
 * Creates a detailed, reusable location asset.
 */
export async function generateLocation({ name, type = 'building', worldContext = '', brainContext = '' }) {
  log.info('generateLocation', { name, type });

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Create a detailed, reusable location:
Name: ${name}
Type: ${type}
World context: ${worldContext}

Return JSON:
{
  "name": "...",
  "type": "...",
  "description": "...",
  "atmosphere": {
    "lighting": "...", "sounds": "...", "temperature": "...", "smell": "..."
  },
  "visual_preset": {
    "dominant_colors": [...], "architectural_style": "...",
    "key_props": [...], "mood_keywords": [...]
  },
  "story_uses": ["This location works well for..."],
  "hidden_details": ["..."],
  "connected_locations": ["..."]
}`
    }],
    maxTokens: 1000,
  });

  return parseJSON(result.content) ?? { raw: result.content };
}

/**
 * buildTimeline({ events, brainContext })
 * Organises story events into a coherent, chronologically ordered timeline.
 */
export async function buildTimeline({ events = [], brainContext = '' }) {
  log.info('buildTimeline', { eventCount: events.length });

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Organise these story events into a coherent timeline, identify any continuity issues, and suggest missing connective events.

Events: ${JSON.stringify(events)}

Return JSON: {
  "timeline": [{ "order": 1, "event": "...", "timepoint": "...", "significance": "..." }],
  "continuity_issues": [...],
  "suggested_additions": [...]
}`
    }],
    maxTokens: 1500,
  });

  return parseJSON(result.content) ?? { raw: result.content };
}

export default { generateWorldBible, generateLocation, buildTimeline };
