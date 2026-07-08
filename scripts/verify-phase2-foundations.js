#!/usr/bin/env node
import http from 'http';
import { once } from 'events';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
process.env.MORPHIC_SKIP_LISTEN = '1';

const __dir = dirname(fileURLToPath(import.meta.url));
let Client;
let migrate;
let getPgPoolConfig;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required for Phase 2 database/API verification.');
  process.exit(1);
}

async function setupDatabase() {
  const client = new Client(getPgPoolConfig());
  await client.connect();
  try {
    await client.query(readFileSync(join(__dir, '../database/schema.sql'), 'utf8'));
  } finally {
    await client.end();
  }
  await migrate();
}

function listen(app) {
  const server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  return once(server, 'listening').then(() => server);
}

async function request(baseUrl, method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  ({ Client } = await import('pg').then(mod => mod.default));
  ({ migrate } = await import('../database/migrate.js'));
  ({ getPgPoolConfig } = await import('../database/pgOptions.js'));
  const { default: app } = await import('../backend/server.js');
  const { default: pool } = await import('../backend/services/db.js');
  await setupDatabase();
  const server = await listen(app);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const stamp = Date.now();

  try {
    const { project } = await request(baseUrl, 'POST', '/api/projects', {
      title: `Phase 2 verification ${stamp}`,
      format: 'comic',
      genre: 'validation',
      style: 'production-automation',
    });
    const projectId = project.id;

    const { character } = await request(baseUrl, 'POST', `/api/projects/${projectId}/characters`, {
      name: 'Validation Character',
      role: 'protagonist',
    });
    const { asset } = await request(baseUrl, 'POST', `/api/projects/${projectId}/assets`, {
      name: 'Validation Character Turnaround',
      type: 'character',
      source: 'authored',
      metadata: { purpose: 'phase2-validation' },
      storage_object: {
        object_key: `phase2/${stamp}/turnaround.png`,
        file_url: `file://phase2/${stamp}/turnaround.png`,
        mime_type: 'image/png',
      },
    });
    const { asset: propAsset } = await request(baseUrl, 'POST', `/api/projects/${projectId}/assets`, {
      name: 'Validation Prop',
      type: 'prop',
      source: 'authored',
    });
    await request(baseUrl, 'POST', `/api/projects/${projectId}/assets/${asset.id}/relationships`, {
      target_asset_id: propAsset.id,
      relationship_type: 'references',
      metadata: { verifier: true },
    });

    const { scene } = await request(baseUrl, 'POST', `/api/projects/${projectId}/scenes`, {
      title: 'Validation Scene',
      scene_number: 1,
      characters: [character.id],
    });
    const { chapter } = await request(baseUrl, 'POST', `/api/projects/${projectId}/production/chapters`, {
      title: 'Validation Chapter',
      chapter_number: 1,
    });
    const { page } = await request(baseUrl, 'POST', `/api/projects/${projectId}/production/comic/pages`, {
      chapter_id: chapter.id,
      page_number: 1,
      title: 'Validation Page',
    });
    const { panel } = await request(baseUrl, 'POST', `/api/projects/${projectId}/production/comic/panels`, {
      chapter_id: chapter.id,
      page_id: page.id,
      scene_id: scene.id,
      panel_number: 1,
      description: 'Validation panel',
      characters: [character.id],
      assets: [asset.id],
    });

    const endpoints = [
      ['character asset links', 'POST', `/api/projects/${projectId}/production/characters/${character.id}/asset-links`, { asset_id: asset.id, asset_version_id: asset.current_version_id, link_type: 'turnaround' }, 'assetLink'],
      ['character rigs', 'POST', `/api/projects/${projectId}/production/characters/${character.id}/rigs`, { name: 'Validation Rig', asset_id: asset.id, asset_version_id: asset.current_version_id, rig_data: { bones: [] } }, 'rig'],
      ['character expressions', 'POST', `/api/projects/${projectId}/production/characters/${character.id}/expressions`, { name: 'Focused', emotion: 'focus', asset_id: asset.id }, 'expression'],
      ['character poses', 'POST', `/api/projects/${projectId}/production/characters/${character.id}/poses`, { name: 'Ready Pose', asset_id: asset.id, pose_data: { stance: 'ready' } }, 'pose'],
      ['character clothing sets', 'POST', `/api/projects/${projectId}/production/characters/${character.id}/clothing-sets`, { name: 'Default Outfit', asset_id: asset.id, clothing_data: { layers: [] } }, 'clothingSet'],
      ['scene placements', 'POST', `/api/projects/${projectId}/production/scenes/${scene.id}/placements`, { asset_id: asset.id, character_id: character.id, placement_type: 'character', transform: { x: 10, y: 20 } }, 'placement'],
      ['storyboard asset references', 'POST', `/api/projects/${projectId}/production/storyboards/asset-references`, { panel_id: panel.id, scene_id: scene.id, asset_id: asset.id, reference_role: 'character' }, 'assetReference'],
      ['comic speech bubbles', 'POST', `/api/projects/${projectId}/production/comic/speech-bubbles`, { page_id: page.id, panel_id: panel.id, character_id: character.id, text_content: 'Validation line.', geometry: { x: 1, y: 2 } }, 'speechBubble'],
      ['animation timelines', 'POST', `/api/projects/${projectId}/production/animation/timelines`, { scene_id: scene.id, name: 'Validation Timeline', duration_seconds: 3 }, 'timeline'],
    ];

    let timelineId;
    for (const [label, method, path, body, key] of endpoints) {
      const created = await request(baseUrl, method, path, body);
      if (!created[key]?.id) throw new Error(`${label} did not return ${key}.id`);
      if (key === 'timeline') timelineId = created[key].id;
    }

    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/characters/${character.id}/asset-links`);
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/characters/${character.id}/rigs`);
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/characters/${character.id}/expressions`);
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/characters/${character.id}/poses`);
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/characters/${character.id}/clothing-sets`);
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/scenes/${scene.id}/placements`);
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/storyboards/asset-references`);
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/comic/speech-bubbles`);
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/animation/timelines`);

    const keyframe = await request(baseUrl, 'POST', `/api/projects/${projectId}/production/animation/timelines/${timelineId}/keyframes`, {
      asset_id: asset.id,
      character_id: character.id,
      track_type: 'body',
      frame_number: 1,
      keyframe_data: { pose: 'ready' },
    });
    if (!keyframe.keyframe?.id) throw new Error('animation keyframe did not persist.');
    await request(baseUrl, 'GET', `/api/projects/${projectId}/production/animation/timelines/${timelineId}/keyframes`);

    const tables = ['asset_relationships','character_asset_links','character_rigs','character_expressions','character_poses','character_clothing_sets','scene_asset_placements','storyboard_asset_references','comic_speech_bubbles','animation_timelines','animation_keyframes'];
    const client = new Client(getPgPoolConfig());
    await client.connect();
    try {
      for (const table of tables) {
        const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE project_id = $1 AND deleted_at IS NULL`, [projectId]);
        if (rows[0].count < 1) throw new Error(`${table} did not persist verification rows.`);
      }
    } finally {
      await client.end();
    }

    await request(baseUrl, 'DELETE', `/api/projects/${projectId}`);
    console.log('✅ Phase 2A-2F migrations, schema, API endpoints, and persistence verified.');
  } finally {
    server.close();
    await pool.end();
  }
}

main().catch(err => {
  console.error(`❌ Phase 2 verification failed: ${err.message}`);
  process.exit(1);
});
