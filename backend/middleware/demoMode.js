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

const demoStore = {
  chapters: [],
  pages: [],
  panels: [],
  assets: [],
  generationJobs: [],
  workflowStages: [],
};

function now() { return new Date().toISOString(); }
function nextId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`; }

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

  const chapterId = `preview-chapter-${chapterNumber}`;
  const pages = [];
  const panels = scenes.map((scene, index) => {
    const pageNumber = Math.floor(index / panelsPerPage) + 1;
    if (!pages.find(page => page.page_number === pageNumber)) {
      pages.push({
        id: `preview-page-${chapterNumber}-${pageNumber}`,
        project_id: demoProject.id,
        chapter_id: chapterId,
        page_number: pageNumber,
        layout: 'adaptive-grid',
        title: `Page ${pageNumber}`,
        summary: '',
        status: 'draft',
        metadata: {},
        panel_count: 0,
        created_at: now(),
        updated_at: now(),
      });
    }
    const page = pages.find(item => item.page_number === pageNumber);
    page.panel_count += 1;
    return {
      id: `preview-panel-${chapterNumber}-${index + 1}`,
      project_id: demoProject.id,
      chapter_id: chapterId,
      page_id: page.id,
      scene_id: scene.id,
      panel_number: index + 1,
      description: scene.summary,
      dialogue: [],
      shot_type: index % 2 === 0 ? 'establishing' : 'medium',
      camera_angle: 'story-driven',
      effects: [],
      continuity_notes: 'Preview-only plan; connect PostgreSQL for durable persistence.',
      status: 'draft',
      metadata: {},
      created_at: now(),
      updated_at: now(),
    };
  });

  return {
    scriptId: 'preview-script-1',
    chapter: {
      id: chapterId,
      title,
      chapter_number: chapterNumber,
      project_id: demoProject.id,
      status: 'planned',
      created_at: now(),
      updated_at: now(),
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


function savePreviewPlan(plan) {
  demoStore.chapters = [plan.chapter, ...demoStore.chapters.filter(chapter => chapter.id !== plan.chapter.id)];
  demoStore.pages = [
    ...demoStore.pages.filter(page => page.chapter_id !== plan.chapter.id),
    ...plan.pages,
  ];
  demoStore.panels = [
    ...demoStore.panels.filter(panel => panel.chapter_id !== plan.chapter.id),
    ...plan.panels,
  ];
}

function listByProject(items, req) {
  const filtered = items.filter(item => item.project_id === demoProject.id)
    .filter(item => !req.query.chapterId && !req.query.chapter_id ? true : item.chapter_id === (req.query.chapterId || req.query.chapter_id))
    .filter(item => !req.query.pageId && !req.query.page_id ? true : item.page_id === (req.query.pageId || req.query.page_id))
    .filter(item => !req.query.status ? true : item.status === req.query.status);
  return filtered;
}

function updateById(items, id, body) {
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...body, updated_at: now() };
  return items[index];
}

function upsertWorkflowStage(stageKey, body = {}) {
  const chapterId = body.chapter_id ?? null;
  const existingIndex = demoStore.workflowStages.findIndex(stage => stage.stage_key === stageKey && (stage.chapter_id ?? null) === chapterId);
  const payload = {
    id: existingIndex >= 0 ? demoStore.workflowStages[existingIndex].id : nextId('preview-stage'),
    project_id: demoProject.id,
    chapter_id: chapterId,
    stage_key: stageKey,
    status: body.status || 'in_progress',
    input_refs: body.input_refs || [],
    output_refs: body.output_refs || [],
    metadata: body.metadata || {},
    started_at: existingIndex >= 0 ? demoStore.workflowStages[existingIndex].started_at : now(),
    completed_at: ['complete', 'completed', 'approved'].includes(body.status) ? now() : null,
    created_at: existingIndex >= 0 ? demoStore.workflowStages[existingIndex].created_at : now(),
    updated_at: now(),
  };
  if (existingIndex >= 0) demoStore.workflowStages[existingIndex] = payload;
  else demoStore.workflowStages.push(payload);
  return payload;
}

function planPreviewComfyUiPanel(req) {
  const panelId = req.body?.panelId;
  const panel = demoStore.panels.find(item => item.id === panelId && item.project_id === demoProject.id);
  if (!panel) return null;

  const timestamp = Date.now();
  const outputUrl = `mock://comfyui/panels/${panel.id}/test-${timestamp}.png`;
  const payload = {
    engine: 'comfyui',
    workflow: 'comfyui_panel_plan_v1',
    mode: 'simulated_planning',
    prompt: panel.description || 'Storyboard panel concept art, cinematic composition.',
    parameters: { steps: 20, cfgScale: 7, width: 1024, height: 1024 },
    refs: {
      projectId: demoProject.id,
      chapterId: panel.chapter_id,
      pageId: panel.page_id,
      panelId: panel.id,
    },
  };
  const generationJob = {
    id: nextId('preview-job'),
    project_id: demoProject.id,
    job_type: 'comic',
    status: 'complete',
    agent: 'comfyuiAdapter',
    provider: 'comfyui',
    model: payload.workflow,
    input: payload,
    output: { outputUrl, simulated: true, panelId: panel.id },
    created_at: now(),
    started_at: now(),
    completed_at: now(),
  };
  const asset = {
    id: nextId('preview-asset'),
    project_id: demoProject.id,
    name: `ComfyUI test image for panel ${panel.panel_number}`,
    type: 'panel',
    subtype: 'comfyui_plan',
    description: `Simulated ComfyUI planning output for saved panel ${panel.panel_number}.`,
    file_url: outputUrl,
    thumbnail: outputUrl,
    metadata: {
      adapter: 'comfyuiAdapter',
      stage: 'comfyui_planning',
      simulated: true,
      prompt: payload.prompt,
      comfyuiPayload: payload,
      generationJobId: generationJob.id,
      panelId: panel.id,
      chapterId: panel.chapter_id,
      pageId: panel.page_id,
    },
    tags: ['comfyui', 'phase-2', 'simulated', 'panel-plan'],
    source: 'ai_generated',
    linked_id: panel.id,
    version_number: 1,
    created_at: now(),
    updated_at: now(),
  };

  demoStore.generationJobs.push(generationJob);
  demoStore.assets.push(asset);
  updateById(demoStore.panels, panel.id, {
    image_asset_id: asset.id,
    assets: [...new Set([...(panel.assets || []), asset.id])],
    status: 'generated',
    metadata: {
      ...(panel.metadata || {}),
      comfyuiPlanning: {
        adapter: 'comfyuiAdapter',
        stage: 'comfyui_planning',
        jobId: generationJob.id,
        assetId: asset.id,
        outputUrl,
        simulated: true,
      },
    },
  });
  const workflowStage = upsertWorkflowStage('comfyui_planning', {
    chapter_id: panel.chapter_id,
    status: 'complete',
    input_refs: [{ type: 'comic_panel', id: panel.id }],
    output_refs: [
      { type: 'generation_job', id: generationJob.id },
      { type: 'asset', id: asset.id },
    ],
    metadata: {
      adapter: 'comfyuiAdapter',
      workflow: payload.workflow,
      simulated: true,
      outputUrl,
      prompt: payload.prompt,
    },
  });

  return { panel: demoStore.panels.find(item => item.id === panel.id), asset, generationJob, workflowStage, payload };
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
  if (path.includes('/production/intake/plan') && req.method === 'POST') {
    const plan = buildPreviewPlan(req.body);
    savePreviewPlan(plan);
    return json(res, plan, 201);
  }
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


  if (path.includes('/production/chapters')) return json(res, { chapters: listByProject(demoStore.chapters, req) });
  if (path.includes('/production/comic/pages')) {
    const id = path.match(/\/production\/comic\/pages\/([^/]+)$/)?.[1];
    if (req.method === 'PATCH' && id) {
      const page = updateById(demoStore.pages, id, req.body || {});
      return page ? json(res, { page }) : json(res, { error: 'Comic page not found.' }, 404);
    }
    return json(res, { pages: listByProject(demoStore.pages, req) });
  }
  if (path.includes('/production/comic/panels')) {
    const id = path.match(/\/production\/comic\/panels\/([^/]+)$/)?.[1];
    if (req.method === 'POST') {
      const panel = {
        id: nextId('preview-panel'),
        project_id: demoProject.id,
        dialogue: [],
        effects: [],
        characters: [],
        assets: [],
        metadata: {},
        created_at: now(),
        updated_at: now(),
        ...(req.body || {}),
      };
      demoStore.panels.push(panel);
      return json(res, { panel }, 201);
    }
    if (req.method === 'PATCH' && id) {
      const panel = updateById(demoStore.panels, id, req.body || {});
      return panel ? json(res, { panel }) : json(res, { error: 'Comic panel not found.' }, 404);
    }
    if (req.method === 'GET' && id) {
      const panel = demoStore.panels.find(item => item.id === id);
      return panel ? json(res, { panel }) : json(res, { error: 'Comic panel not found.' }, 404);
    }
    return json(res, { panels: listByProject(demoStore.panels, req) });
  }
  if (path.includes('/production/workflow/stages')) {
    const stageKey = path.match(/\/production\/workflow\/stages\/([^/]+)$/)?.[1];
    if (req.method === 'PATCH' && stageKey) return json(res, { workflowStage: upsertWorkflowStage(stageKey, req.body || {}) });
    return json(res, { workflowStages: listByProject(demoStore.workflowStages, req) });
  }

  if (path.includes('/adapters/comfyui/plan') && req.method === 'POST') {
    const result = planPreviewComfyUiPanel(req);
    if (!result) return json(res, { error: 'Comic panel not found.' }, 404);
    return json(res, { message: 'ComfyUI planning adapter completed in simulated mode.', ...result }, 201);
  }

  if (path.includes('/characters')) return json(res, { characters: [] });
  if (path.includes('/worlds')) return json(res, path.includes('/locations') ? { locations: [] } : { worlds: [] });
  if (path.includes('/assets/stats')) return json(res, { stats: { total: 0, by_type: [] } });
  if (path.includes('/assets/') && path.includes('/versions')) return json(res, { versions: [] });
  if (path.includes('/assets/') && path.includes('/storage')) return json(res, { storageObjects: [] });
  if (path.includes('/assets/') && path.includes('/relationships')) return json(res, { relationships: [] });
  if (path.includes('/assets')) return json(res, { assets: listByProject(demoStore.assets, req) });
  if (path.includes('/stories/scripts')) return json(res, { scripts: [] });
  if (path.includes('/scenes')) return json(res, { scenes: [] });
  if (path.includes('/episodes')) return json(res, { episodes: [] });
  if (path.includes('/graph/neighbors')) return json(res, { node: null, neighbors: [], edges: [] });
  if (path.includes('/graph/nodes')) return json(res, { nodes: [] });
  if (path.includes('/graph')) return json(res, { nodes: [], edges: [] });
  if (path.includes('/jobs/dispatch') && req.method === 'POST') return json(res, { job: { id: 'preview-job', status: 'queued', preview: true } }, 202);
  if (path.includes('/jobs')) return json(res, { jobs: [] });
  if (path.includes('/production/motion/sequences')) return json(res, { sequences: [] });
  if (path.includes('/production/voices')) return json(res, { voices: [] });
  if (path.includes('/production/characters/') && path.includes('/library')) return json(res, { characterLibrary: { character: null, assetLinks: [], linkedAssets: [], rigs: [], expressions: [], poses: [], clothingSets: [], summary: { assetLinks: 0, linkedAssets: 0, rigs: 0, expressions: 0, poses: 0, clothingSets: 0 } } });
  if (path.includes('/production/characters/') && path.includes('/asset-links')) return json(res, { assetLinks: [] });
  if (path.includes('/production/characters/') && path.includes('/rigs')) return json(res, { rigs: [] });
  if (path.includes('/production/characters/') && path.includes('/expressions')) return json(res, { expressions: [] });
  if (path.includes('/production/characters/') && path.includes('/poses')) return json(res, { poses: [] });
  if (path.includes('/production/characters/') && path.includes('/clothing-sets')) return json(res, { clothingSets: [] });
  if (path.includes('/production/scenes/') && path.includes('/builder')) return json(res, { sceneBuilder: { scene: null, placements: [], groupedPlacements: { characters: [], props: [], environments: [], lighting: [], cameras: [], weather: [], effects: [] }, characters: [], props: [], environments: [], lighting: [], camera: [], weather: null, effects: [], linkedAssets: [], assetVersions: [], metadata: {}, productionNotes: '', summary: { placements: 0, linkedAssets: 0, assetVersions: 0, characters: 0, props: 0, environments: 0, lighting: 0, cameras: 0, weather: 0, effects: 0 } } });
  if (path.includes('/production/scenes/') && path.includes('/placements')) return json(res, { placements: [] });
  if (path.includes('/production/storyboards/asset-references')) return json(res, { assetReferences: [] });
  if (path.includes('/production/comic/speech-bubbles')) return json(res, { speechBubbles: [] });
  if (path.includes('/production/animation/timelines') && path.includes('/keyframes')) return json(res, { keyframes: [] });
  if (path.includes('/production/animation/timelines')) return json(res, { timelines: [] });
  if (path.includes('/production/animation/assets')) return json(res, { animationAssets: [] });

  return next();
}
