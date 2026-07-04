import { query } from '../services/db.js';
import { createError } from '../middleware/errorHandler.js';
import eventBus from '../services/eventBus.js';
import logger from '../utils/logger.js';
import { planScriptIntake } from '../services/storyIntakeService.js';
import { enhanceIntake } from '../services/storyIntakePhase2.js';
import { syncEntityToGraph } from '../services/knowledgeGraphService.js';

const log = logger.child('production');

function paginate(req) {
  const limit = Math.min(parseInt(req.query.limit ?? 50, 10), 200);
  const offset = Math.max(parseInt(req.query.offset ?? 0, 10), 0);
  return { limit, offset };
}

function uuidArray(value) {
  return Array.isArray(value) ? value : [];
}

function json(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

async function listRows({ req, res, table, collection, filters = [], orderBy }) {
  const { projectId } = req.params;
  const { limit, offset } = paginate(req);

  let sql = `SELECT * FROM ${table} WHERE project_id = $1`;
  const params = [projectId];
  let i = 2;

  if (!['motion_comic_cues'].includes(table)) sql += ' AND deleted_at IS NULL';

  for (const filter of filters) {
    const value = req.query[filter.queryKey];
    if (value !== undefined && value !== '') {
      sql += ` AND ${filter.column} = $${i++}`;
      params.push(value);
    }
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
  sql += ` ORDER BY ${orderBy} LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const [rows, count] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2)),
  ]);

  res.json({ [collection]: rows.rows, total: parseInt(count.rows[0].count, 10), limit, offset });
}

async function getRow({ req, res, table, singular, idParam = 'id' }) {
  const { projectId } = req.params;
  const id = req.params[idParam];
  const deletedGuard = ['motion_comic_cues'].includes(table) ? '' : ' AND deleted_at IS NULL';
  const result = await query(
    `SELECT * FROM ${table} WHERE id = $1 AND project_id = $2${deletedGuard}`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, `${singular} not found.`);
  res.json({ [singular]: result.rows[0] });
}

// ── Phase 1 Story Intake / Production Planner ───────────────────────────────

export async function planStoryIntake(req, res) {
  const { projectId } = req.params;
  const { title, scriptText, scriptId, chapterNumber, panelsPerPage } = req.body;

  try {
    const result = await planScriptIntake(projectId, {
      title,
      scriptText,
      scriptId,
      chapterNumber,
      panelsPerPage,
    });

    res.status(201).json({
      message: 'Story intake planned and saved.',
      scriptId: result.saved.scriptId,
      chapter: result.saved.chapter,
      scenes: result.saved.scenes,
      pages: result.saved.pages,
      panels: result.saved.panels,
      continuityRules: result.saved.continuityRules,
      plan: result.plan,
    });
  } catch (err) {
    throw createError(err.message === 'Script not found.' ? 404 : 400, err.message);
  }
}

// ── Phase 2 AI-Enhanced Story Intake ────────────────────────────────────────

export async function enhanceStoryIntake(req, res) {
  const { projectId } = req.params;
  const { chapterId, scriptId } = req.body;

  if (!chapterId || !scriptId) {
    throw createError(400, 'Both chapterId and scriptId are required for Phase 2 enhancement.');
  }

  try {
    const results = await enhanceIntake(projectId, { chapterId, scriptId });

    res.json({
      message: 'Phase 2 AI enhancement complete.',
      script_analysis: results.script_analysis,
      characters_processed: results.characters.length,
      characters: results.characters.map(c => ({ name: c.name, action: c.action })),
      locations_processed: results.locations.length,
      locations: results.locations.map(l => ({ name: l.name })),
      errors: results.errors,
    });
  } catch (err) {
    throw createError(500, `Phase 2 enhancement failed: ${err.message}`);
  }
}

// ── Chapters ────────────────────────────────────────────────────────────────

export async function listChapters(req, res) {
  return listRows({
    req, res,
    table: 'chapters',
    collection: 'chapters',
    filters: [{ queryKey: 'status', column: 'status' }, { queryKey: 'episodeId', column: 'episode_id' }],
    orderBy: 'chapter_number ASC NULLS LAST, created_at ASC',
  });
}

export async function getChapter(req, res) {
  const { projectId, id } = req.params;
  const chapter = await query(
    `SELECT * FROM chapters WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [id, projectId]
  );
  if (!chapter.rows.length) throw createError(404, 'Chapter not found.');

  const [pages, panels] = await Promise.all([
    query(
      `SELECT * FROM comic_pages WHERE chapter_id = $1 AND project_id = $2 AND deleted_at IS NULL ORDER BY page_number ASC`,
      [id, projectId]
    ),
    query(
      `SELECT * FROM comic_panels WHERE chapter_id = $1 AND project_id = $2 AND deleted_at IS NULL ORDER BY panel_number ASC`,
      [id, projectId]
    ),
  ]);

  res.json({ chapter: chapter.rows[0], pages: pages.rows, panels: panels.rows });
}

export async function createChapter(req, res) {
  const { projectId } = req.params;
  const { episode_id, script_id, title, chapter_number, synopsis, status, metadata } = req.body;
  if (!title) throw createError(400, 'Chapter title is required.');

  const result = await query(
    `INSERT INTO chapters (project_id, episode_id, script_id, title, chapter_number, synopsis, status, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [projectId, episode_id ?? null, script_id ?? null, title, chapter_number ?? null, synopsis ?? null, status ?? 'draft', json(metadata, {})]
  );

  const chapter = result.rows[0];
  eventBus.emit('chapter:created', { projectId, chapter });
  res.status(201).json({ chapter });
}

export async function updateChapter(req, res) {
  const { projectId, id } = req.params;
  const fields = req.body;
  const result = await query(
    `UPDATE chapters SET
       episode_id = COALESCE($1, episode_id), script_id = COALESCE($2, script_id),
       title = COALESCE($3, title), chapter_number = COALESCE($4, chapter_number),
       synopsis = COALESCE($5, synopsis), status = COALESCE($6, status),
       metadata = COALESCE($7, metadata), updated_at = NOW()
     WHERE id = $8 AND project_id = $9 AND deleted_at IS NULL RETURNING *`,
    [fields.episode_id, fields.script_id, fields.title, fields.chapter_number, fields.synopsis, fields.status, fields.metadata ? json(fields.metadata, {}) : null, id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Chapter not found.');
  eventBus.emit('chapter:updated', { projectId, id, changes: fields });
  res.json({ chapter: result.rows[0] });
}

export async function deleteChapter(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `UPDATE chapters SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Chapter not found.');
  res.json({ deleted: id });
}

// ── Comic Pages ─────────────────────────────────────────────────────────────

export async function listComicPages(req, res) {
  return listRows({
    req, res,
    table: 'comic_pages',
    collection: 'pages',
    filters: [{ queryKey: 'chapterId', column: 'chapter_id' }, { queryKey: 'status', column: 'status' }],
    orderBy: 'page_number ASC, created_at ASC',
  });
}

export async function getComicPage(req, res) {
  const { projectId, id } = req.params;
  const page = await query(
    `SELECT * FROM comic_pages WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [id, projectId]
  );
  if (!page.rows.length) throw createError(404, 'Comic page not found.');

  const panels = await query(
    `SELECT * FROM comic_panels WHERE page_id = $1 AND project_id = $2 AND deleted_at IS NULL ORDER BY panel_number ASC`,
    [id, projectId]
  );

  res.json({ page: page.rows[0], panels: panels.rows });
}

export async function createComicPage(req, res) {
  const { projectId } = req.params;
  const { chapter_id, page_number, layout, title, summary, background_asset_id, status, metadata } = req.body;
  if (!page_number) throw createError(400, 'Page number is required.');

  const result = await query(
    `INSERT INTO comic_pages (project_id, chapter_id, page_number, layout, title, summary, background_asset_id, status, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [projectId, chapter_id ?? null, page_number, layout ?? 'grid', title ?? null, summary ?? null, background_asset_id ?? null, status ?? 'draft', json(metadata, {})]
  );

  const page = result.rows[0];
  eventBus.emit('comic_page:created', { projectId, page });
  res.status(201).json({ page });
}

export async function updateComicPage(req, res) {
  const { projectId, id } = req.params;
  const f = req.body;
  const result = await query(
    `UPDATE comic_pages SET
       chapter_id = COALESCE($1, chapter_id), page_number = COALESCE($2, page_number),
       layout = COALESCE($3, layout), title = COALESCE($4, title), summary = COALESCE($5, summary),
       background_asset_id = COALESCE($6, background_asset_id), status = COALESCE($7, status),
       metadata = COALESCE($8, metadata), updated_at = NOW()
     WHERE id = $9 AND project_id = $10 AND deleted_at IS NULL RETURNING *`,
    [f.chapter_id, f.page_number, f.layout, f.title, f.summary, f.background_asset_id, f.status, f.metadata ? json(f.metadata, {}) : null, id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Comic page not found.');
  res.json({ page: result.rows[0] });
}

export async function deleteComicPage(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `UPDATE comic_pages SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Comic page not found.');
  res.json({ deleted: id });
}

// ── Comic Panels ────────────────────────────────────────────────────────────

export async function listComicPanels(req, res) {
  return listRows({
    req, res,
    table: 'comic_panels',
    collection: 'panels',
    filters: [
      { queryKey: 'chapterId', column: 'chapter_id' },
      { queryKey: 'pageId', column: 'page_id' },
      { queryKey: 'sceneId', column: 'scene_id' },
      { queryKey: 'status', column: 'status' },
    ],
    orderBy: 'panel_number ASC, created_at ASC',
  });
}

export async function getComicPanel(req, res) {
  return getRow({ req, res, table: 'comic_panels', singular: 'panel' });
}

export async function createComicPanel(req, res) {
  const { projectId } = req.params;
  const {
    chapter_id, page_id, scene_id, panel_number, shot_type, camera_angle,
    description, dialogue, characters, assets, location_id, image_asset_id,
    effects, continuity_notes, status, metadata,
  } = req.body;
  if (!panel_number) throw createError(400, 'Panel number is required.');

  const result = await query(
    `INSERT INTO comic_panels
       (project_id, chapter_id, page_id, scene_id, panel_number, shot_type, camera_angle,
        description, dialogue, characters, assets, location_id, image_asset_id, effects,
        continuity_notes, status, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [
      projectId, chapter_id ?? null, page_id ?? null, scene_id ?? null, panel_number,
      shot_type ?? null, camera_angle ?? null, description ?? null, json(dialogue, []),
      uuidArray(characters), uuidArray(assets), location_id ?? null, image_asset_id ?? null,
      json(effects, []), continuity_notes ?? null, status ?? 'draft', json(metadata, {}),
    ]
  );

  const panel = result.rows[0];
  eventBus.emit('comic_panel:created', { projectId, panel });

  syncEntityToGraph(projectId, {
    entityId: panel.id,
    entityType: 'comic_panel',
    label: `Panel ${panel.panel_number}`,
    properties: { page_id, chapter_id, scene_id, status: panel.status, shot_type },
  }).catch(err => log.debug('Comic panel KG sync skipped', { err: err.message }));

  res.status(201).json({ panel });
}

export async function updateComicPanel(req, res) {
  const { projectId, id } = req.params;
  const f = req.body;
  const result = await query(
    `UPDATE comic_panels SET
       chapter_id = COALESCE($1, chapter_id), page_id = COALESCE($2, page_id), scene_id = COALESCE($3, scene_id),
       panel_number = COALESCE($4, panel_number), shot_type = COALESCE($5, shot_type), camera_angle = COALESCE($6, camera_angle),
       description = COALESCE($7, description), dialogue = COALESCE($8, dialogue), characters = COALESCE($9, characters),
       assets = COALESCE($10, assets), location_id = COALESCE($11, location_id), image_asset_id = COALESCE($12, image_asset_id),
       effects = COALESCE($13, effects), continuity_notes = COALESCE($14, continuity_notes), status = COALESCE($15, status),
       metadata = COALESCE($16, metadata), updated_at = NOW()
     WHERE id = $17 AND project_id = $18 AND deleted_at IS NULL RETURNING *`,
    [
      f.chapter_id, f.page_id, f.scene_id, f.panel_number, f.shot_type, f.camera_angle,
      f.description, f.dialogue ? json(f.dialogue, []) : null, Array.isArray(f.characters) ? f.characters : null,
      Array.isArray(f.assets) ? f.assets : null, f.location_id, f.image_asset_id,
      f.effects ? json(f.effects, []) : null, f.continuity_notes, f.status,
      f.metadata ? json(f.metadata, {}) : null, id, projectId,
    ]
  );
  if (!result.rows.length) throw createError(404, 'Comic panel not found.');
  res.json({ panel: result.rows[0] });
}

export async function deleteComicPanel(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `UPDATE comic_panels SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Comic panel not found.');
  res.json({ deleted: id });
}

// ── Voice Profiles ──────────────────────────────────────────────────────────

export async function listVoiceProfiles(req, res) {
  return listRows({
    req, res,
    table: 'voice_profiles',
    collection: 'voiceProfiles',
    filters: [{ queryKey: 'characterId', column: 'character_id' }],
    orderBy: 'is_default DESC, created_at DESC',
  });
}

export async function getVoiceProfile(req, res) {
  return getRow({ req, res, table: 'voice_profiles', singular: 'voiceProfile' });
}

export async function createVoiceProfile(req, res) {
  const { projectId } = req.params;
  const { character_id, asset_id, name, provider, voice_ref, tone, pace, accent, sample_text, settings, is_default } = req.body;
  if (!name) throw createError(400, 'Voice profile name is required.');

  if (is_default && character_id) {
    await query(`UPDATE voice_profiles SET is_default = FALSE WHERE project_id = $1 AND character_id = $2`, [projectId, character_id]);
  }

  const result = await query(
    `INSERT INTO voice_profiles
       (project_id, character_id, asset_id, name, provider, voice_ref, tone, pace, accent, sample_text, settings, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [projectId, character_id ?? null, asset_id ?? null, name, provider ?? null, voice_ref ?? null, tone ?? null, pace ?? null, accent ?? null, sample_text ?? null, json(settings, {}), Boolean(is_default)]
  );

  const voiceProfile = result.rows[0];
  eventBus.emit('voice_profile:created', { projectId, voiceProfile });
  res.status(201).json({ voiceProfile });
}

export async function updateVoiceProfile(req, res) {
  const { projectId, id } = req.params;
  const f = req.body;

  if (f.is_default && f.character_id) {
    await query(`UPDATE voice_profiles SET is_default = FALSE WHERE project_id = $1 AND character_id = $2 AND id <> $3`, [projectId, f.character_id, id]);
  }

  const result = await query(
    `UPDATE voice_profiles SET
       character_id = COALESCE($1, character_id), asset_id = COALESCE($2, asset_id), name = COALESCE($3, name),
       provider = COALESCE($4, provider), voice_ref = COALESCE($5, voice_ref), tone = COALESCE($6, tone),
       pace = COALESCE($7, pace), accent = COALESCE($8, accent), sample_text = COALESCE($9, sample_text),
       settings = COALESCE($10, settings), is_default = COALESCE($11, is_default), updated_at = NOW()
     WHERE id = $12 AND project_id = $13 AND deleted_at IS NULL RETURNING *`,
    [f.character_id, f.asset_id, f.name, f.provider, f.voice_ref, f.tone, f.pace, f.accent, f.sample_text, f.settings ? json(f.settings, {}) : null, f.is_default, id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Voice profile not found.');
  res.json({ voiceProfile: result.rows[0] });
}

export async function deleteVoiceProfile(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `UPDATE voice_profiles SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Voice profile not found.');
  res.json({ deleted: id });
}

// ── Motion Comic Sequences/Cues ─────────────────────────────────────────────

export async function listMotionSequences(req, res) {
  return listRows({
    req, res,
    table: 'motion_comic_sequences',
    collection: 'sequences',
    filters: [{ queryKey: 'chapterId', column: 'chapter_id' }, { queryKey: 'status', column: 'status' }],
    orderBy: 'created_at DESC',
  });
}

export async function getMotionSequence(req, res) {
  const { projectId, id } = req.params;
  const sequence = await query(
    `SELECT * FROM motion_comic_sequences WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [id, projectId]
  );
  if (!sequence.rows.length) throw createError(404, 'Motion comic sequence not found.');

  const cues = await query(
    `SELECT * FROM motion_comic_cues WHERE sequence_id = $1 AND project_id = $2 ORDER BY cue_order ASC`,
    [id, projectId]
  );

  res.json({ sequence: sequence.rows[0], cues: cues.rows });
}

export async function createMotionSequence(req, res) {
  const { projectId } = req.params;
  const { chapter_id, title, playback_mode, transition, duration_sec, page_ids, audio_asset_ids, settings, status } = req.body;
  if (!title) throw createError(400, 'Motion comic sequence title is required.');

  const result = await query(
    `INSERT INTO motion_comic_sequences
       (project_id, chapter_id, title, playback_mode, transition, duration_sec, page_ids, audio_asset_ids, settings, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [projectId, chapter_id ?? null, title, playback_mode ?? 'slideshow', transition ?? 'fade', duration_sec ?? null, uuidArray(page_ids), uuidArray(audio_asset_ids), json(settings, {}), status ?? 'draft']
  );

  res.status(201).json({ sequence: result.rows[0] });
}

export async function updateMotionSequence(req, res) {
  const { projectId, id } = req.params;
  const f = req.body;
  const result = await query(
    `UPDATE motion_comic_sequences SET
       chapter_id = COALESCE($1, chapter_id), title = COALESCE($2, title), playback_mode = COALESCE($3, playback_mode),
       transition = COALESCE($4, transition), duration_sec = COALESCE($5, duration_sec), page_ids = COALESCE($6, page_ids),
       audio_asset_ids = COALESCE($7, audio_asset_ids), settings = COALESCE($8, settings), status = COALESCE($9, status), updated_at = NOW()
     WHERE id = $10 AND project_id = $11 AND deleted_at IS NULL RETURNING *`,
    [f.chapter_id, f.title, f.playback_mode, f.transition, f.duration_sec, Array.isArray(f.page_ids) ? f.page_ids : null, Array.isArray(f.audio_asset_ids) ? f.audio_asset_ids : null, f.settings ? json(f.settings, {}) : null, f.status, id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Motion comic sequence not found.');
  res.json({ sequence: result.rows[0] });
}

export async function deleteMotionSequence(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `UPDATE motion_comic_sequences SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Motion comic sequence not found.');
  res.json({ deleted: id });
}

export async function createMotionCue(req, res) {
  const { projectId, sequenceId } = req.params;
  const { page_id, panel_id, cue_order, start_time_ms, duration_ms, transition, camera_motion, audio_asset_id, voice_profile_id, caption, metadata } = req.body;
  if (!cue_order) throw createError(400, 'Cue order is required.');

  const result = await query(
    `INSERT INTO motion_comic_cues
       (project_id, sequence_id, page_id, panel_id, cue_order, start_time_ms, duration_ms, transition, camera_motion, audio_asset_id, voice_profile_id, caption, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [projectId, sequenceId, page_id ?? null, panel_id ?? null, cue_order, start_time_ms ?? 0, duration_ms ?? 3000, transition ?? 'fade', json(camera_motion, {}), audio_asset_id ?? null, voice_profile_id ?? null, caption ?? null, json(metadata, {})]
  );

  res.status(201).json({ cue: result.rows[0] });
}

export async function updateMotionCue(req, res) {
  const { projectId, cueId } = req.params;
  const f = req.body;
  const result = await query(
    `UPDATE motion_comic_cues SET
       page_id = COALESCE($1, page_id), panel_id = COALESCE($2, panel_id), cue_order = COALESCE($3, cue_order),
       start_time_ms = COALESCE($4, start_time_ms), duration_ms = COALESCE($5, duration_ms), transition = COALESCE($6, transition),
       camera_motion = COALESCE($7, camera_motion), audio_asset_id = COALESCE($8, audio_asset_id),
       voice_profile_id = COALESCE($9, voice_profile_id), caption = COALESCE($10, caption), metadata = COALESCE($11, metadata),
       updated_at = NOW()
     WHERE id = $12 AND project_id = $13 RETURNING *`,
    [f.page_id, f.panel_id, f.cue_order, f.start_time_ms, f.duration_ms, f.transition, f.camera_motion ? json(f.camera_motion, {}) : null, f.audio_asset_id, f.voice_profile_id, f.caption, f.metadata ? json(f.metadata, {}) : null, cueId, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Motion comic cue not found.');
  res.json({ cue: result.rows[0] });
}

export async function deleteMotionCue(req, res) {
  const { projectId, cueId } = req.params;
  const result = await query(`DELETE FROM motion_comic_cues WHERE id = $1 AND project_id = $2 RETURNING id`, [cueId, projectId]);
  if (!result.rows.length) throw createError(404, 'Motion comic cue not found.');
  res.json({ deleted: cueId });
}

// ── Animation Assets ────────────────────────────────────────────────────────

export async function listAnimationAssets(req, res) {
  return listRows({
    req, res,
    table: 'animation_assets',
    collection: 'animationAssets',
    filters: [{ queryKey: 'characterId', column: 'character_id' }, { queryKey: 'assetKind', column: 'asset_kind' }],
    orderBy: 'created_at DESC',
  });
}

export async function getAnimationAsset(req, res) {
  return getRow({ req, res, table: 'animation_assets', singular: 'animationAsset' });
}

export async function createAnimationAsset(req, res) {
  const { projectId } = req.params;
  const { character_id, asset_id, name, asset_kind, part_name, file_url, thumbnail, rig_data, compatible_with, status } = req.body;
  if (!name) throw createError(400, 'Animation asset name is required.');
  if (!asset_kind) throw createError(400, 'Animation asset kind is required.');

  const result = await query(
    `INSERT INTO animation_assets
       (project_id, character_id, asset_id, name, asset_kind, part_name, file_url, thumbnail, rig_data, compatible_with, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [projectId, character_id ?? null, asset_id ?? null, name, asset_kind, part_name ?? null, file_url ?? null, thumbnail ?? null, json(rig_data, {}), uuidArray(compatible_with), status ?? 'draft']
  );

  const animationAsset = result.rows[0];
  eventBus.emit('animation_asset:created', { projectId, animationAsset });
  res.status(201).json({ animationAsset });
}

export async function updateAnimationAsset(req, res) {
  const { projectId, id } = req.params;
  const f = req.body;
  const result = await query(
    `UPDATE animation_assets SET
       character_id = COALESCE($1, character_id), asset_id = COALESCE($2, asset_id), name = COALESCE($3, name),
       asset_kind = COALESCE($4, asset_kind), part_name = COALESCE($5, part_name), file_url = COALESCE($6, file_url),
       thumbnail = COALESCE($7, thumbnail), rig_data = COALESCE($8, rig_data), compatible_with = COALESCE($9, compatible_with),
       status = COALESCE($10, status), updated_at = NOW()
     WHERE id = $11 AND project_id = $12 AND deleted_at IS NULL RETURNING *`,
    [f.character_id, f.asset_id, f.name, f.asset_kind, f.part_name, f.file_url, f.thumbnail, f.rig_data ? json(f.rig_data, {}) : null, Array.isArray(f.compatible_with) ? f.compatible_with : null, f.status, id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Animation asset not found.');
  res.json({ animationAsset: result.rows[0] });
}

export async function deleteAnimationAsset(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `UPDATE animation_assets SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Animation asset not found.');
  res.json({ deleted: id });
}
