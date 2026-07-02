/**
 * Storyboard Agent — converts analyzed scripts into detailed visual panel breakdowns.
 * Injects character DNA and world context so every panel is production-ready.
 */
import { callAI, parseJSON } from './gateway.js';
import logger from '../utils/logger.js';

const log = logger.child('storyboardAgent');

const SYSTEM = `You are the Storyboard Agent for Morphic Studio — a professional storyboard artist and cinematographer.
You think in frames, shots, and visual rhythm. Every panel you design is production-ready with precise shot types, lighting cues, and character blocking.
You reference character DNA and world details so artists never have to guess.
Return responses as valid JSON.`;

/**
 * generatePanels({ panels, characters, world, style, brainContext })
 * Enriches story analysis panels with full visual production detail.
 */
export async function generatePanels({ panels = [], characters = [], world = {}, style = '', brainContext = '' }) {
  log.info('generatePanels', { panelCount: panels.length });

  const charSummary = characters.map(c =>
    `${c.name} (${c.role}): ${JSON.stringify(c.visual_dna ?? {})}`
  ).join('\n');

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Enrich these storyboard panels with full visual production detail.

Visual style: ${style || 'cinematic noir'}
World setting: ${world.name ?? ''} — ${world.description ?? ''}

Character DNA:
${charSummary || 'No character data provided'}

Panels to enrich:
${JSON.stringify(panels, null, 2)}

For each panel return:
{
  "panel_num": 1,
  "shot_type": "WS|MS|MCU|CU|ECU|OTS|POV|CRANE",
  "composition": "Rule of thirds / symmetry / dutch angle etc",
  "foreground": "...",
  "midground": "...",
  "background": "...",
  "lighting": "...",
  "color_mood": "...",
  "character_blocking": "...",
  "dialogue": "...",
  "sound_notes": "...",
  "panel_transition": "cut|dissolve|smash|wipe|match"
}

Return JSON: { "panels": [...], "production_notes": "..." }`
    }],
    maxTokens: 3000,
  });

  const parsed = parseJSON(result.content);
  return {
    panels: parsed?.panels ?? [],
    production_notes: parsed?.production_notes ?? '',
    raw: result.content,
  };
}

/**
 * refinePanels({ panels, feedback, brainContext })
 * Revises panels based on director/creator feedback.
 */
export async function refinePanels({ panels = [], feedback = '', brainContext = '' }) {
  log.info('refinePanels', { panelCount: panels.length, feedback: feedback.slice(0, 80) });

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Revise these storyboard panels based on this feedback: "${feedback}"

Current panels:
${JSON.stringify(panels, null, 2)}

Return JSON: { "panels": [...], "changes_made": [...] }`
    }],
    maxTokens: 2500,
  });

  const parsed = parseJSON(result.content);
  return {
    panels: parsed?.panels ?? panels,
    changes_made: parsed?.changes_made ?? [],
  };
}

export default { generatePanels, refinePanels };
