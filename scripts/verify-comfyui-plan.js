#!/usr/bin/env node
import { spawn } from 'node:child_process';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 5101);
const baseUrl = process.env.MORPHIC_VERIFY_BASE_URL || `http://${host}:${port}`;
const shouldStartServer = !process.env.MORPHIC_VERIFY_BASE_URL;
const isDbBacked = Boolean(process.env.DATABASE_URL);
const allowDbWrites = process.env.VERIFY_COMFYUI_WRITE === '1' || process.env.VERIFY_STORYBOARD_WRITE === '1';

function log(message) {
  console.log(`[verify-comfyui-plan] ${message}`);
}

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed (${res.status}): ${body.error || body.message || res.statusText}`);
  }
  return body;
}

async function waitForApi() {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < 30_000) {
    try {
      return await request('/api/health');
    } catch (err) {
      lastError = err;
      await sleep(500);
    }
  }
  throw lastError || new Error('API did not become ready.');
}

let createdProjectId = null;

async function getOrCreateProject() {
  const projectsResult = await request('/api/projects');
  if (!isDbBacked) return projectsResult.projects[0];

  if (!allowDbWrites) {
    throw new Error('DATABASE_URL is set. Re-run with VERIFY_COMFYUI_WRITE=1 to allow this smoke test to create temporary verification records.');
  }

  const created = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: `ComfyUI Plan Verification ${new Date().toISOString()}`,
      description: 'Temporary project created by scripts/verify-comfyui-plan.js',
      genre: 'Verification',
      format: 'Comic',
      style: 'Morphic ComfyUI adapter smoke test',
    }),
  });
  createdProjectId = created.project.id;
  return created.project;
}

async function main() {
  let server;
  if (shouldStartServer) {
    const env = { ...process.env, HOST: host, PORT: String(port) };
    server = spawn(process.execPath, ['backend/server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', chunk => process.stdout.write(chunk));
    server.stderr.on('data', chunk => process.stderr.write(chunk));
    server.on('exit', code => {
      if (code && !process.exitCode) process.exitCode = code;
    });
  }

  try {
    const health = await waitForApi();
    log(`API ready (${health.database || 'unknown database mode'}).`);

    const project = await getOrCreateProject();
    if (!project?.id) throw new Error('No project available for verification.');
    log(`Using project ${project.id}.`);

    const intake = await request(`/api/projects/${project.id}/production/intake/plan`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'ComfyUI Adapter Verification Chapter',
        chapterNumber: 9201,
        panelsPerPage: 2,
        scriptText: [
          'EXT. NEON ROOFTOP - NIGHT',
          'A saved storyboard panel frames a courier watching rain ripple through holograms.',
          'The panel prompt is ready for the first backend-only visual planning adapter.',
        ].join('\n'),
      }),
    });
    if (!intake.panels?.length) throw new Error('Story intake did not save panels.');
    const panel = intake.panels[0];
    log(`Story intake saved panel ${panel.id}.`);

    const planned = await request(`/api/projects/${project.id}/adapters/comfyui/plan`, {
      method: 'POST',
      body: JSON.stringify({ panelId: panel.id }),
    });

    if (planned.asset?.type !== 'panel') throw new Error('ComfyUI adapter did not return a panel asset.');
    if (planned.generationJob?.status !== 'complete') throw new Error('ComfyUI adapter did not complete the simulated generation job.');
    if (planned.workflowStage?.stage_key !== 'comfyui_planning') throw new Error('ComfyUI adapter did not write the comfyui_planning workflow stage.');
    log(`ComfyUI adapter saved asset ${planned.asset.id} and job ${planned.generationJob.id}.`);

    const assetsResult = await request(`/api/projects/${project.id}/assets?type=panel&limit=200`);
    if (!assetsResult.assets.some(asset => asset.id === planned.asset.id)) {
      throw new Error('Asset Library did not reload the ComfyUI planning asset.');
    }
    log('Asset Library record reloaded from backend.');

    const panelResult = await request(`/api/projects/${project.id}/production/comic/panels/${panel.id}`);
    if (panelResult.panel.image_asset_id !== planned.asset.id) {
      throw new Error('Panel image_asset_id does not reference the ComfyUI planning asset.');
    }
    log('Panel now references the ComfyUI planning asset.');

    const workflowList = await request(`/api/projects/${project.id}/production/workflow/stages?chapterId=${intake.chapter.id}`);
    if (!workflowList.workflowStages.some(stage => stage.stage_key === 'comfyui_planning')) {
      throw new Error('Workflow stage list did not include comfyui_planning.');
    }
    log('Workflow stage reloaded from backend.');

    log('✅ ComfyUI planning adapter verification passed.');
  } finally {
    if (createdProjectId) {
      try {
        await request(`/api/projects/${createdProjectId}`, { method: 'DELETE' });
        log(`Cleaned up temporary project ${createdProjectId}.`);
      } catch (err) {
        log(`Temporary project cleanup skipped: ${err.message}`);
      }
    }
    if (server) server.kill('SIGTERM');
  }
}

main().catch(err => {
  console.error(`[verify-comfyui-plan] ❌ ${err.message}`);
  process.exit(1);
});
