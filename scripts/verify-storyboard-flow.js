#!/usr/bin/env node
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 5099);
const baseUrl = process.env.MORPHIC_VERIFY_BASE_URL || `http://${host}:${port}`;
const shouldStartServer = !process.env.MORPHIC_VERIFY_BASE_URL;
const isDbBacked = Boolean(process.env.DATABASE_URL);
const allowDbWrites = process.env.VERIFY_STORYBOARD_WRITE === '1';

function log(message) {
  console.log(`[verify-storyboard] ${message}`);
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
    throw new Error('DATABASE_URL is set. Re-run with VERIFY_STORYBOARD_WRITE=1 to allow this smoke test to create temporary verification records.');
  }

  const created = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: `Storyboard Verification ${new Date().toISOString()}`,
      description: 'Temporary project created by scripts/verify-storyboard-flow.js',
      genre: 'Verification',
      format: 'Comic',
      style: 'Morphic smoke test',
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

  let project;
  try {
    const health = await waitForApi();
    log(`API ready (${health.database || 'unknown database mode'}).`);

    project = await getOrCreateProject();
    if (!project?.id) throw new Error('No project available for verification.');
    log(`Using project ${project.id}.`);

    const intake = await request(`/api/projects/${project.id}/production/intake/plan`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Storyboard Verification Chapter',
        chapterNumber: 9101,
        panelsPerPage: 2,
        scriptText: [
          'INT. ORBITAL LAB - NIGHT',
          'MIRA: The bridge is live.',
          'A console blooms with violet light as the station turns toward Earth.',
          'JON: Save the panel before you call the engine.',
        ].join('\n'),
      }),
    });
    if (!intake.pages?.length || !intake.panels?.length) throw new Error('Story intake did not save pages and panels.');
    log(`Story intake saved ${intake.pages.length} page(s) and ${intake.panels.length} panel(s).`);

    const pagesResult = await request(`/api/projects/${project.id}/production/comic/pages?chapterId=${intake.chapter.id}`);
    const panelsResult = await request(`/api/projects/${project.id}/production/comic/panels?chapterId=${intake.chapter.id}`);
    if (pagesResult.pages.length !== intake.pages.length) throw new Error('Saved page count does not match intake result.');
    if (panelsResult.panels.length !== intake.panels.length) throw new Error('Saved panel count does not match intake result.');
    log('Saved pages and panels reloaded from backend.');

    const firstPanel = panelsResult.panels[0];
    const updatedPanel = await request(`/api/projects/${project.id}/production/comic/panels/${firstPanel.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        description: `${firstPanel.description} Verification edit saved.`,
        shot_type: 'WS',
        camera_angle: 'verification angle',
        continuity_notes: 'Smoke test verified storyboard metadata save/load.',
        status: 'edited',
      }),
    });
    if (updatedPanel.panel.status !== 'edited') throw new Error('Panel metadata update did not persist.');
    log('Panel metadata edit saved.');

    await Promise.all([
      ...panelsResult.panels.map(panel => request(`/api/projects/${project.id}/production/comic/panels/${panel.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      })),
      ...pagesResult.pages.map(page => request(`/api/projects/${project.id}/production/comic/pages/${page.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'storyboarded' }),
      })),
    ]);

    const workflow = await request(`/api/projects/${project.id}/production/workflow/stages/storyboard_review`, {
      method: 'PATCH',
      body: JSON.stringify({
        chapter_id: intake.chapter.id,
        status: 'complete',
        input_refs: panelsResult.panels.map(panel => ({ type: 'comic_panel', id: panel.id })),
        output_refs: pagesResult.pages.map(page => ({ type: 'comic_page', id: page.id })),
        metadata: { verifiedBy: 'scripts/verify-storyboard-flow.js', reviewedPanelCount: panelsResult.panels.length },
      }),
    });
    if (workflow.workflowStage.status !== 'complete') throw new Error('Workflow stage did not complete.');
    log('Storyboard review workflow stage saved.');

    const workflowList = await request(`/api/projects/${project.id}/production/workflow/stages?chapterId=${intake.chapter.id}`);
    if (!workflowList.workflowStages.some(stage => stage.stage_key === 'storyboard_review')) {
      throw new Error('Workflow stage list did not include storyboard_review.');
    }
    log('Workflow stage reloaded from backend.');

    log('✅ Storyboard save/load verification passed.');
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
  console.error(`[verify-storyboard] ❌ ${err.message}`);
  process.exit(1);
});
