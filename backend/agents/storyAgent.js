/**
 * Story Agent — handles script analysis, outline generation, and scene expansion.
 * Always receives the Project Brain context so continuity is preserved.
 */
import { callAI, parseJSON } from './gateway.js';
import logger from '../utils/logger.js';

const log = logger.child('storyAgent');

const SYSTEM = `You are the Story Agent for Morphic Studio — an expert narrative architect and screenwriter.
You know every rule of three-act structure, comic pacing, and visual storytelling.
You always respect the Project Brain context provided and never contradict established facts.
Return responses as valid JSON unless told otherwise.`;

/**
 * analyzeScript({ title, scriptText, brainContext })
 * Breaks a script into structured storyboard panels.
 */
export async function analyzeScript({ title, scriptText, brainContext = '' }) {
  log.info('analyzeScript', { title });

  const systemPrompt = `${SYSTEM}

PROJECT BRAIN CONTEXT:
${brainContext || 'No project context available yet.'}`;

  const result = await callAI({
    systemPrompt,
    messages: [{
      role: 'user',
      content: `Analyze this script and break it into storyboard panels.
For each panel return JSON with: panel_num, shot_type (WS/MS/MCU/CU/OTS/POV), visual_description, dialogue, action_notes, mood, characters_present[], location.

Script Title: ${title}

${scriptText}

Return a JSON object: { "panels": [...], "summary": "...", "themes": [...], "pacing_notes": "..." }`
    }],
    maxTokens: 2500,
  });

  const parsed = parseJSON(result.content);
  return {
    panels: parsed?.panels ?? [],
    summary: parsed?.summary ?? '',
    themes: parsed?.themes ?? [],
    pacing_notes: parsed?.pacing_notes ?? '',
    raw: result.content,
  };
}

/**
 * generateOutline({ premise, genre, tone, acts, brainContext })
 * Generates a full story outline with acts and beat sheet.
 */
export async function generateOutline({ premise, genre = '', tone = '', acts = 3, brainContext = '' }) {
  log.info('generateOutline', { premise: premise?.slice(0, 60) });

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Generate a ${acts}-act story outline.
Genre: ${genre}. Tone: ${tone}.
Premise: ${premise}

Return JSON: {
  "title": "...",
  "logline": "...",
  "acts": [{ "act": 1, "name": "...", "beats": ["..."] }],
  "protagonist_arc": "...",
  "central_conflict": "...",
  "themes": [...]
}`
    }],
    maxTokens: 2000,
  });

  return parseJSON(result.content) ?? { raw: result.content };
}

/**
 * expandScene({ sceneDescription, characters, location, tone, brainContext })
 * Expands a brief scene description into full prose/script form.
 */
export async function expandScene({ sceneDescription, characters = [], location = '', tone = '', brainContext = '' }) {
  log.info('expandScene', { location });

  const result = await callAI({
    systemPrompt: `${SYSTEM}\n\nPROJECT BRAIN:\n${brainContext}`,
    messages: [{
      role: 'user',
      content: `Expand this scene into a full script scene with action lines and dialogue.
Location: ${location}. Tone: ${tone}.
Characters: ${characters.join(', ')}.
Scene: ${sceneDescription}

Return JSON: { "scene_heading": "...", "action": "...", "dialogue": [{"character":"...","line":"..."}], "emotional_beats": [...] }`
    }],
    maxTokens: 1500,
  });

  return parseJSON(result.content) ?? { raw: result.content };
}

export default { analyzeScript, generateOutline, expandScene };
