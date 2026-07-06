/**
 * Lightweight preview/demo API responses used only when DATABASE_URL is absent.
 * This keeps the static website preview usable in development environments that
 * do not have PostgreSQL provisioned, without changing DB-backed production behavior.
 */

const demoProject = {
  id: 'demo-project',
  title: 'Morphic Demo Universe',
  description: 'Preview project available because DATABASE_URL is not configured.',
  genre: 'AI Story Studio',
  format: 'Comic · Motion Comic · Animation',
  style: 'Cinematic dark fantasy sci-fi',
  status: 'active',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

const demoBrain = {
  project_id: demoProject.id,
  story_bible: { premise: 'Create once, save permanently, reuse forever.' },
  character_bible: {},
  world_bible: { rule: 'Every reusable story detail should be stored before generation scales.' },
  timeline: [],
  continuity_rules: [
    'Reuse saved character identity, voice, outfit, and world rules across chapters.',
  ],
  voice_profiles: {},
  style_guide: { mood: 'cinematic, polished, creator-first' },
  art_direction: { palette: 'dark navy with lavender highlights' },
  memory_context: 'Preview mode is running without PostgreSQL. Connect DATABASE_URL and run npm run setup for persistent saved projects.',
};

function json(res, payload, status = 200) {
  res.status(status).json({ ...payload, previewMode: true });
}

function splitScript(scriptText) {
  const chunks = String(scriptText || '')
    .split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(part => part.trim())
    .filter(Boolean);
  return chunks.length ? chunks.slice(0, 12) : ['Opening scene waiting for script details.'];
}

function buildPreviewPlan(body = {}) {
  const title = body.title || 'Preview Chapter';
  const chapterNumber = Number(body.chapterNumber || 1);
  const panelsPerPage = Math.max(1, Math.min(Number(body.panelsPerPage || 4), 8));
  const sceneTexts = splitScript(body.scriptText);

  const scenes = sceneTexts.map((text, index) => ({
    id: `preview-scene-${index + 1}`,
    scene_number: index + 1,
    title: `Scene ${index + 1}`,
    summary: text.slice(0, 220),
    location: index === 0 ? 'Opening location' : 'Story location',
    characters: [],
  }));

  const pages = [];
  const panels = scenes.map((scene, index) => {
    const pageNumber = Math.floor(index / panelsPerPage) + 1;
    if (!pages.find(page => page.page_number === pageNumber)) {
      pages.push({
        id: `preview-page-${pageNumber}`,
        chapter_id: 'preview-chapter-1',
        page_number: pageNumber,
        layout: 'adaptive-grid',
        panel_count: 0,
      });
    }
    const page = pages.find(item => item.page_number === pageNumber);
    page.panel_count += 1;
    return {
      id: `preview-panel-${index + 1}`,
      page_id: page.id,
      scene_id: scene.id,
      panel_number: index + 1,
      description: scene.summary,
      dialogue: '',
      shot_type: index % 2 === 0 ? 'establishing' : 'medium',
      camera_angle: 'story-driven',
      effects: [],
      continuity_notes: ['Preview-only plan; save to PostgreSQL for persistence.'],
    };
  });

  return {
    scriptId: 'preview-script-1',
    chapter: {
      id: 'preview-chapter-1',
      title,
      chapter_number: chapterNumber,
      project_id: demoProject.id,
    },
    scenes,
    pages,
    panels,
    continuityRules: [
      'Character, world, panel, voice, and animation choices must be saved as reusable assets.',
      'Do not regenerate existing characters from scratch when the story continues.',
    ],
  };
}

export function previewModeNotice(req, res, next) {
  if (process.env.DATABASE_URL) return next();
  res.setHeader('X-Morphic-Preview-Mode', 'true');
  next();
}

export function demoModeApi(req, res, next) {
  if (process.env.DATABASE_URL) return next();
  if (!req.path.startsWith('/api')) return next();
  if (req.path === '/api' || req.path === '/api/health' || req.path.startsWith('/api/system')) return next();

  const path = req.path;

  if (path === '/api/projects') {
    if (req.method === 'GET') return json(res, { projects: [demoProject], total: 1, limit: 50, offset: 0 });
    if (req.method === 'POST') return json(res, { project: { ...demoProject, ...(req.body || {}), id: 'demo-project' } }, 201);
  }

  if (path === '/api/projects/demo-project') return json(res, { project: demoProject, brain: demoBrain });
  if (path === '/api/projects/demo-project/brain') return json(res, { brain: demoBrain });
  if (path.includes('/production/intake/plan') && req.method === 'POST') return json(res, buildPreviewPlan(req.body), 201);
  if (path.includes('/production/intake/enhance') && req.method === 'POST') {
    return json(res, {
      script_analysis: { themes: ['continuity', 'asset reuse'], conflicts: [], tone: 'prototype preview', summary: 'AI enhancement needs an AI key and database for persistent updates.' },
      characters_processed: 0,
      locations_processed: 0,
      characters: [],
      locations: [],
      errors: ['Preview mode does not persist AI enhancement.'],
    });
  }

  if (path.includes('/characters')) return json(res, { characters: [] });
  if (path.includes('/worlds')) return json(res, path.includes('/locations') ? { locations: [] } : { worlds: [] });
  if (path.includes('/assets/stats')) return json(res, { stats: { total: 0, by_type: [] } });
  if (path.includes('/assets')) return json(res, { assets: [] });
  if (path.includes('/stories/scripts')) return json(res, { scripts: [] });
  if (path.includes('/scenes')) return json(res, { scenes: [] });
  if (path.includes('/episodes')) return json(res, { episodes: [] });
  if (path.includes('/graph/neighbors')) return json(res, { node: null, neighbors: [], edges: [] });
  if (path.includes('/graph/nodes')) return json(res, { nodes: [] });
  if (path.includes('/graph')) return json(res, { nodes: [], edges: [] });
  if (path.includes('/jobs/dispatch') && req.method === 'POST') return json(res, { job: { id: 'preview-job', status: 'queued', preview: true } }, 202);
  if (path.includes('/jobs')) return json(res, { jobs: [] });
  if (path.includes('/production/chapters')) return json(res, { chapters: [] });
  if (path.includes('/production/comic/pages')) return json(res, { pages: [] });
  if (path.includes('/production/comic/panels')) return json(res, { panels: [] });
  if (path.includes('/production/motion/sequences')) return json(res, { sequences: [] });
  if (path.includes('/production/voices')) return json(res, { voices: [] });
  if (path.includes('/production/animation/assets')) return json(res, { animationAssets: [] });

  return next();
}
