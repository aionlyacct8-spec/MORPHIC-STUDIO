import { query, transaction } from './db.js';
import { appendMemory } from './brainService.js';
import eventBus from './eventBus.js';

const DEFAULT_PANELS_PER_PAGE = 4;

function wordCount(text = '') {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function cleanLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

function splitScenes(scriptText) {
  const normalized = scriptText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks = normalized
    .split(/\n\s*(?=(?:scene\s+\d+|chapter\s+\d+|int\.|ext\.|page\s+\d+|panel\s+\d+)\b)/gi)
    .map(chunk => chunk.trim())
    .filter(Boolean);

  const fallbackChunks = chunks.length > 1
    ? chunks
    : normalized.split(/\n\s*\n+/).map(chunk => chunk.trim()).filter(Boolean);

  return (fallbackChunks.length ? fallbackChunks : [normalized]).slice(0, 60);
}

function extractDialogue(chunk) {
  const dialogue = [];
  const lines = chunk.split('\n').map(cleanLine).filter(Boolean);

  for (const line of lines) {
    const colon = line.match(/^([A-Z][A-Z0-9 _.'-]{1,40}):\s*(.+)$/);
    if (colon) {
      dialogue.push({ character_name: colon[1].trim(), text: colon[2].trim() });
      continue;
    }

    const quoted = [...line.matchAll(/[“"]([^”"]{2,220})[”"]/g)];
    for (const match of quoted) {
      dialogue.push({ character_name: null, text: match[1].trim() });
    }
  }

  return dialogue.slice(0, 8);
}

function guessLocation(chunk, index) {
  const heading = chunk.match(/\b(?:INT\.|EXT\.)\s+([^\n.-]+(?:\s+-\s+[^\n]+)?)/i);
  if (heading) return cleanLine(heading[1]).slice(0, 120);

  const locationHints = [
    'city', 'street', 'room', 'castle', 'school', 'forest', 'ship', 'market',
    'house', 'road', 'kingdom', 'planet', 'station', 'lab', 'office', 'alley',
  ];
  const lower = chunk.toLowerCase();
  const found = locationHints.find(hint => lower.includes(hint));
  return found ? found[0].toUpperCase() + found.slice(1) : `Scene Location ${index + 1}`;
}

function summarize(chunk, max = 220) {
  const text = cleanLine(chunk.replace(/^(scene|chapter|page|panel)\s+\d+[:\-.]?/i, ''));
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function extractCandidateCharacters(scriptText) {
  const names = new Map();
  const dialogueNames = [...scriptText.matchAll(/^([A-Z][A-Z0-9 _.'-]{1,40}):/gm)].map(m => m[1].trim());
  for (const name of dialogueNames) names.set(name.toLowerCase(), name);

  const capitalized = [...scriptText.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g)].map(m => m[1].trim());
  const blocked = new Set(['Scene', 'Chapter', 'Page', 'Panel', 'Act', 'The', 'A', 'An', 'Int', 'Ext']);
  for (const name of capitalized) {
    if (!blocked.has(name.split(' ')[0]) && name.length > 2) names.set(name.toLowerCase(), name);
  }

  return [...names.values()].slice(0, 20);
}

function buildPlan({ title, scriptText, panelsPerPage = DEFAULT_PANELS_PER_PAGE }) {
  const sceneChunks = splitScenes(scriptText);
  const candidateCharacters = extractCandidateCharacters(scriptText);

  const scenes = sceneChunks.map((chunk, index) => {
    const dialogue = extractDialogue(chunk);
    const description = summarize(chunk);
    return {
      scene_number: index + 1,
      title: `Scene ${index + 1}`,
      location_name: guessLocation(chunk, index),
      description,
      action: description,
      mood: /fight|danger|run|blood|scream|explode/i.test(chunk) ? 'tense' : 'cinematic',
      dialogue,
      raw: chunk,
    };
  });

  const panels = scenes.flatMap((scene, sceneIndex) => {
    const dialogue = scene.dialogue.length ? scene.dialogue : [{ character_name: null, text: '' }];
    return dialogue.slice(0, 4).map((line, lineIndex) => ({
      scene_number: sceneIndex + 1,
      panel_number: sceneIndex * 4 + lineIndex + 1,
      shot_type: lineIndex === 0 ? 'WS' : line.text ? 'MCU' : 'MS',
      camera_angle: lineIndex === 0 ? 'establishing' : 'character focus',
      description: line.text
        ? `${scene.description} Dialogue beat: ${line.text}`
        : scene.description,
      dialogue: line.text ? [{ character_name: line.character_name, text: line.text }] : [],
      effects: scene.mood === 'tense' ? [{ type: 'mood', label: 'tension shadows' }] : [],
      continuity_notes: `Uses saved scene ${sceneIndex + 1} context and should reuse matching character/location assets.`,
    }));
  });

  const pages = [];
  for (let i = 0; i < panels.length; i += panelsPerPage) {
    pages.push({
      page_number: pages.length + 1,
      layout: panelsPerPage >= 5 ? 'webtoon' : 'grid',
      title: `${title} — Page ${pages.length + 1}`,
      summary: panels.slice(i, i + panelsPerPage).map(panel => panel.description).join(' ').slice(0, 300),
      panels: panels.slice(i, i + panelsPerPage),
    });
  }

  return {
    title,
    summary: summarize(scriptText, 500),
    candidateCharacters,
    scenes,
    pages,
    panels,
    continuityRules: [
      'Reuse existing character, location, voice, and style assets whenever names match Project Brain or Asset Library records.',
      'Do not redesign saved characters between chapters unless the script explicitly describes a transformation, outfit change, injury, or time jump.',
      'Save new characters, props, places, panels, voices, and animation pieces as reusable assets before later production steps.',
    ],
  };
}

async function findCharacterIds(projectId, names) {
  if (!names.length) return new Map();
  const result = await query(
    `SELECT id, name FROM characters WHERE project_id = $1 AND deleted_at IS NULL`,
    [projectId]
  );
  const byName = new Map(result.rows.map(row => [row.name.toLowerCase(), row.id]));
  return new Map(names.map(name => [name, byName.get(name.toLowerCase())]).filter(([, id]) => id));
}

async function savePlan(projectId, plan, { scriptId, title, chapterNumber, scriptText }) {
  const characterIds = await findCharacterIds(projectId, plan.candidateCharacters);

  return transaction(async (client) => {
    let savedScriptId = scriptId ?? null;

    if (!savedScriptId) {
      const script = await client.query(
        `INSERT INTO scripts (project_id, title, content, status, word_count)
         VALUES ($1,$2,$3,'planned',$4) RETURNING *`,
        [projectId, title, scriptText, wordCount(scriptText)]
      );
      savedScriptId = script.rows[0].id;
    } else {
      await client.query(
        `UPDATE scripts SET title = COALESCE($1, title), content = COALESCE($2, content),
          status = 'planned', word_count = COALESCE($3, word_count), updated_at = NOW()
         WHERE id = $4 AND project_id = $5`,
        [title, scriptText || null, scriptText ? wordCount(scriptText) : null, savedScriptId, projectId]
      );
    }

    const chapterResult = await client.query(
      `INSERT INTO chapters (project_id, script_id, title, chapter_number, synopsis, status, metadata)
       VALUES ($1,$2,$3,$4,$5,'planned',$6) RETURNING *`,
      [projectId, savedScriptId, title, chapterNumber ?? 1, plan.summary, JSON.stringify({ planner: 'deterministic_phase_1', character_candidates: plan.candidateCharacters })]
    );
    const chapter = chapterResult.rows[0];

    const savedScenes = [];
    for (const scene of plan.scenes) {
      const sceneCharacters = plan.candidateCharacters.map(name => characterIds.get(name)).filter(Boolean);
      const result = await client.query(
        `INSERT INTO scenes
           (project_id, script_id, title, scene_number, description, action, characters, mood, metadata, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft') RETURNING *`,
        [
          projectId, savedScriptId, scene.title, scene.scene_number, scene.description,
          scene.action, sceneCharacters, scene.mood,
          JSON.stringify({ planner_location_name: scene.location_name, dialogue: scene.dialogue, raw_excerpt: scene.raw.slice(0, 1000) }),
        ]
      );
      savedScenes.push(result.rows[0]);
    }

    const savedPages = [];
    const savedPanels = [];
    for (const page of plan.pages) {
      const pageResult = await client.query(
        `INSERT INTO comic_pages (project_id, chapter_id, page_number, layout, title, summary, status, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,'storyboarded',$7) RETURNING *`,
        [projectId, chapter.id, page.page_number, page.layout, page.title, page.summary, JSON.stringify({ planner: 'deterministic_phase_1' })]
      );
      const savedPage = pageResult.rows[0];
      savedPages.push(savedPage);

      for (const panel of page.panels) {
        const scene = savedScenes[panel.scene_number - 1];
        const panelCharacterIds = panel.dialogue
          .map(line => line.character_name ? characterIds.get(line.character_name) : null)
          .filter(Boolean);
        const panelResult = await client.query(
          `INSERT INTO comic_panels
             (project_id, chapter_id, page_id, scene_id, panel_number, shot_type, camera_angle,
              description, dialogue, characters, effects, continuity_notes, status, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft',$13) RETURNING *`,
          [
            projectId, chapter.id, savedPage.id, scene?.id ?? null, panel.panel_number,
            panel.shot_type, panel.camera_angle, panel.description, JSON.stringify(panel.dialogue),
            panelCharacterIds, JSON.stringify(panel.effects), panel.continuity_notes,
            JSON.stringify({ planner: 'deterministic_phase_1', scene_number: panel.scene_number }),
          ]
        );
        savedPanels.push(panelResult.rows[0]);
      }
    }

    const continuityRows = [];
    for (const rule of plan.continuityRules) {
      const result = await client.query(
        `INSERT INTO continuity_rules (project_id, rule, category, severity, source)
         VALUES ($1,$2,'production','must','phase_1_story_intake') RETURNING *`,
        [projectId, rule]
      );
      continuityRows.push(result.rows[0]);
    }

    return { scriptId: savedScriptId, chapter, scenes: savedScenes, pages: savedPages, panels: savedPanels, continuityRules: continuityRows };
  });
}

export async function planScriptIntake(projectId, { title = 'Untitled Script', scriptText, scriptId, chapterNumber, panelsPerPage } = {}) {
  if (!scriptText?.trim() && !scriptId) {
    throw new Error('Either scriptText or scriptId is required.');
  }

  let sourceText = scriptText;
  let sourceTitle = title;
  if (scriptId && !sourceText) {
    const script = await query(
      `SELECT * FROM scripts WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [scriptId, projectId]
    );
    if (!script.rows.length) throw new Error('Script not found.');
    sourceText = script.rows[0].content;
    sourceTitle = title || script.rows[0].title;
  }

  const plan = buildPlan({ title: sourceTitle, scriptText: sourceText, panelsPerPage: panelsPerPage ?? DEFAULT_PANELS_PER_PAGE });
  const saved = await savePlan(projectId, plan, {
    scriptId,
    title: sourceTitle,
    chapterNumber,
    scriptText: sourceText,
  });

  await appendMemory(projectId, {
    agentType: 'story',
    memoryType: 'decision',
    content: `Phase 1 story intake planned "${sourceTitle}" into ${saved.scenes.length} scenes, ${saved.pages.length} comic pages, and ${saved.panels.length} reusable panels.`,
    importance: 8,
    refs: [{ entity_type: 'chapter', entity_id: saved.chapter.id, label: saved.chapter.title }],
  }).catch(() => {});

  eventBus.emit('story:intake_planned', { projectId, chapterId: saved.chapter.id, scriptId: saved.scriptId });

  return { plan, saved };
}

export default { planScriptIntake };
