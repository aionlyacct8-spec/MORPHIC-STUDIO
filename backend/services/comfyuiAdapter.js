import { query, transaction } from './db.js';
import { runComfyUiPrompt } from './comfyuiRuntime.js';

const DEFAULT_WORKFLOW_KEY = 'comfyui_panel_plan_v1';
const DEFAULT_STAGE_KEY = 'comfyui_planning';

function json(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function buildPrompt(panel) {
  return [
    panel.description,
    panel.shot_type ? `Shot: ${panel.shot_type}` : null,
    panel.camera_angle ? `Camera: ${panel.camera_angle}` : null,
    panel.continuity_notes ? `Continuity: ${panel.continuity_notes}` : null,
  ].filter(Boolean).join('\n');
}

export function buildComfyUiPanelPayload(panel, options = {}) {
  const prompt = options.prompt || buildPrompt(panel) || 'Storyboard panel concept art, cinematic composition.';
  return {
    engine: 'comfyui',
    workflow: options.workflow || DEFAULT_WORKFLOW_KEY,
    mode: 'simulated_planning',
    prompt,
    negativePrompt: options.negativePrompt || 'low quality, blurry, inconsistent character identity',
    parameters: {
      steps: options.steps ?? 20,
      cfgScale: options.cfgScale ?? 7,
      width: options.width ?? 1024,
      height: options.height ?? 1024,
      sampler: options.sampler || 'euler',
      seed: options.seed ?? null,
    },
    refs: {
      projectId: panel.project_id,
      chapterId: panel.chapter_id,
      pageId: panel.page_id,
      panelId: panel.id,
    },
  };
}

export async function planPanelImage(projectId, panelId, options = {}) {
  const panelResult = await query(
    `SELECT * FROM comic_panels
     WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [panelId, projectId]
  );
  if (!panelResult.rows.length) {
    const err = new Error('Comic panel not found.');
    err.status = 404;
    throw err;
  }

  const panel = panelResult.rows[0];
  const payload = buildComfyUiPanelPayload(panel, options);
  const startedAt = new Date();
  const runtime = await runComfyUiPrompt(payload, options);
  const runtimeMode = runtime.mode || 'simulated';
  const outputUrl = runtime.outputUrl || options.outputUrl || `mock://comfyui/panels/${panel.id}/test-${startedAt.getTime()}.png`;
  const jobStatus = runtimeMode === 'real' ? 'complete' : 'complete';
  const jobOutput = {
    outputUrl,
    runtimeMode,
    simulated: runtimeMode !== 'real',
    panelId: panel.id,
    promptId: runtime.promptId ?? null,
    outputs: runtime.outputs ?? [],
    skipReason: runtime.reason ?? null,
  };

  return transaction(async client => {
    const jobResult = await client.query(
      `INSERT INTO generation_jobs
         (project_id, job_type, status, agent, provider, model, input, output, duration_ms, started_at, completed_at)
       VALUES ($1,'comic',$2,'comfyuiAdapter','comfyui',$3,$4,$5,$6,NOW(),NOW())
       RETURNING *`,
      [
        projectId,
        jobStatus,
        payload.workflow,
        json({ payload, runtimeConfig: { mode: runtimeMode } }, {}),
        json(jobOutput, {}),
        Math.max(1, Date.now() - startedAt.getTime()),
      ]
    );
    const job = jobResult.rows[0];

    const assetMetadata = {
      adapter: 'comfyuiAdapter',
      stage: DEFAULT_STAGE_KEY,
      simulated: runtimeMode !== 'real',
      runtimeMode,
      prompt: payload.prompt,
      comfyuiPayload: payload,
      comfyuiRuntime: {
        promptId: runtime.promptId ?? null,
        outputs: runtime.outputs ?? [],
      },
      generationJobId: job.id,
      panelId: panel.id,
      chapterId: panel.chapter_id,
      pageId: panel.page_id,
    };

    const assetResult = await client.query(
      `INSERT INTO assets
         (project_id, name, type, subtype, description, file_url, thumbnail, metadata, tags, source, linked_id, version_number)
       VALUES ($1,$2,'panel','comfyui_plan',$3,$4,$4,$5,$6,'ai_generated',$7,1)
       RETURNING *`,
      [
        projectId,
        `ComfyUI test image for panel ${panel.panel_number}`,
        `${runtimeMode === 'real' ? 'ComfyUI' : 'Simulated ComfyUI'} planning output for saved panel ${panel.panel_number}.`,
        outputUrl,
        json(assetMetadata, {}),
        ['comfyui', 'phase-2', runtimeMode, 'panel-plan'],
        panel.id,
      ]
    );
    const asset = assetResult.rows[0];

    await client.query(
      `INSERT INTO asset_versions
         (asset_id, project_id, version_number, file_url, thumbnail, metadata, notes, created_by)
       VALUES ($1,$2,1,$3,$3,$4,$5,'comfyuiAdapter')
       ON CONFLICT (asset_id, version_number) DO NOTHING`,
      [asset.id, projectId, outputUrl, json(assetMetadata, {}), `Initial ${runtimeMode} ComfyUI planning output`]
    );

    const panelMetadataPatch = {
      comfyuiPlanning: {
        adapter: 'comfyuiAdapter',
        stage: DEFAULT_STAGE_KEY,
        jobId: job.id,
        assetId: asset.id,
        outputUrl,
        runtimeMode,
        simulated: runtimeMode !== 'real',
        promptId: runtime.promptId ?? null,
        verifiedAt: startedAt.toISOString(),
      },
    };

    const updatedPanelResult = await client.query(
      `UPDATE comic_panels SET
         image_asset_id = $1,
         assets = CASE WHEN NOT ($1 = ANY(assets)) THEN array_append(assets, $1) ELSE assets END,
         status = 'generated',
         metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
         updated_at = NOW()
       WHERE id = $3 AND project_id = $4
       RETURNING *`,
      [asset.id, json(panelMetadataPatch, {}), panel.id, projectId]
    );
    const updatedPanel = updatedPanelResult.rows[0];

    const stageInputRefs = [{ type: 'comic_panel', id: panel.id }];
    const stageOutputRefs = [
      { type: 'generation_job', id: job.id },
      { type: 'asset', id: asset.id },
    ];
    const stageMetadata = {
      adapter: 'comfyuiAdapter',
      workflow: payload.workflow,
      runtimeMode,
      simulated: runtimeMode !== 'real',
      outputUrl,
      prompt: payload.prompt,
      promptId: runtime.promptId ?? null,
    };

    const existingStage = await client.query(
      `SELECT id FROM workflow_stages
       WHERE project_id = $1 AND stage_key = $2 AND (($3::uuid IS NULL AND chapter_id IS NULL) OR chapter_id = $3::uuid)
       ORDER BY updated_at DESC LIMIT 1`,
      [projectId, DEFAULT_STAGE_KEY, panel.chapter_id ?? null]
    );

    let workflowStage;
    if (existingStage.rows.length) {
      const stageResult = await client.query(
        `UPDATE workflow_stages SET
           status = 'complete', input_refs = $1, output_refs = $2, metadata = $3,
           started_at = COALESCE(started_at, NOW()), completed_at = NOW(), updated_at = NOW()
         WHERE id = $4 AND project_id = $5
         RETURNING *`,
        [json(stageInputRefs, []), json(stageOutputRefs, []), json(stageMetadata, {}), existingStage.rows[0].id, projectId]
      );
      workflowStage = stageResult.rows[0];
    } else {
      const stageResult = await client.query(
        `INSERT INTO workflow_stages
           (project_id, chapter_id, stage_key, status, input_refs, output_refs, metadata, started_at, completed_at)
         VALUES ($1,$2,$3,'complete',$4,$5,$6,NOW(),NOW())
         RETURNING *`,
        [projectId, panel.chapter_id ?? null, DEFAULT_STAGE_KEY, json(stageInputRefs, []), json(stageOutputRefs, []), json(stageMetadata, {})]
      );
      workflowStage = stageResult.rows[0];
    }

    return { panel: updatedPanel, asset, generationJob: job, workflowStage, payload, runtime };
  });
}
