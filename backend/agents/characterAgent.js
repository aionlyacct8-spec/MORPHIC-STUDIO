/**
 * Character Agent — generates, evolves, and tracks characters.
 * Maintains Character DNA: visual, personality, voice, relationships, arc.
 */
import { callAI, parseJSON } from './gateway.js';
import logger from '../utils/logger.js';

const log = logger.child('characterAgent');

const SYSTEM = `You are the Character Agent for Morphic Studio — a deep expert in character psychology, visual design, and narrative arcs.
You create richly detailed, consistent characters and track their evolution across a story.
You always respect established character traits from the Project Brain and never contradict them.
Return responses as valid JSON.`;

/**
 * generateDNA({ name, role, description, genre, brainContext })
 * Creates a full Character DNA profile.
 */
export async function generateDNA({ name, role = 'supporting', description = '', genre = '', brainContext = '' }) {
  log.info('generateDNA', { name, role });

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Create a complete Character DNA profile for:
Name: ${name}
Role: ${role}
Description: ${description}
Genre context: ${genre}

Return JSON:
{
  "visual_dna": {
    "build": "...", "height": "...", "hair": "...", "eyes": "...",
    "skin": "...", "age_appearance": "...", "distinguishing_features": [...],
    "default_outfit": "...", "style_archetype": "..."
  },
  "personality": {
    "core_traits": [...], "values": [...], "fears": [...],
    "motivations": [...], "flaws": [...], "strengths": [...]
  },
  "voice_profile": {
    "tone": "...", "pace": "...", "vocabulary_level": "...",
    "speech_patterns": "...", "catchphrases": [...], "accent": "..."
  },
  "backstory_summary": "...",
  "arc_potential": "...",
  "relationship_tendencies": "..."
}`
    }],
    maxTokens: 1500,
  });

  return parseJSON(result.content) ?? { raw: result.content };
}

/**
 * evolveCharacter({ character, event, sceneReference, brainContext })
 * Returns what changed in the character after a significant story event.
 */
export async function evolveCharacter({ character, event, sceneReference = '', brainContext = '' }) {
  log.info('evolveCharacter', { name: character.name, event: event?.slice(0, 60) });

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Character ${character.name} just experienced this event: "${event}" in scene "${sceneReference}".

Current character state:
${JSON.stringify({ personality: character.personality, arc_progress: character.arc_progress, status: character.status }, null, 2)}

Determine what has changed. Return JSON:
{
  "event_type": "personality_shift|appearance_change|relationship_change|status_change|outfit_change",
  "changes": { "personality": {...only changed fields}, "visual_dna": {...}, "status": "..." },
  "arc_progress_delta": 0,
  "narrative_significance": "...",
  "memory_note": "One sentence fact for the project brain."
}`
    }],
    maxTokens: 800,
  });

  return parseJSON(result.content) ?? { raw: result.content };
}

/**
 * suggestRelationships({ characters, brainContext })
 * Given a list of characters, suggest relationship dynamics between them.
 */
export async function suggestRelationships({ characters = [], brainContext = '' }) {
  log.info('suggestRelationships', { count: characters.length });

  const charList = characters.map(c => `${c.name} (${c.role})`).join(', ');

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Define relationship dynamics between these characters: ${charList}.

Return JSON: { "relationships": [{ "from": "...", "to": "...", "type": "ally|rival|mentor|love|family|enemy|neutral", "dynamic": "...", "tension": "..." }] }`
    }],
    maxTokens: 800,
  });

  return parseJSON(result.content) ?? { raw: result.content };
}

export default { generateDNA, evolveCharacter, suggestRelationships };
