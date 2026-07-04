/**
 * Morphic Studio — Phase 2 AI-Enhanced Story Intake
 *
 * After Phase 1 deterministic parsing creates the skeleton
 * (script → chapter → scenes → pages → panels), Phase 2 uses
 * the AI orchestrator to enrich everything with deeper analysis:
 *
 *  1. analyze_script  → themes, conflicts, arcs, tone
 *  2. generate_character_dna → for each detected character
 *  3. generate_location → for each detected location
 *  4. Brain updates with AI-enriched data
 *
 * This runs asynchronously after Phase 1 and updates existing records.
 */

import { query, transaction } from './db.js';
import { dispatch, dispatchParallel } from '../agents/orchestrator.js';
import { updateSection, appendMemory, getBrain } from './brainService.js';
import eventBus from './eventBus.js';
import logger from '../utils/logger.js';

const log = logger.child('storyIntakePhase2');

/**
 * enhanceIntake(projectId, { chapterId, scriptId })
 *
 * Takes the Phase 1 output and enriches it with AI analysis.
 * Returns a summary of all enhancements made.
 */
export async function enhanceIntake(projectId, { chapterId, scriptId }) {
  const startTime = Date.now();
  const results = { script_analysis: null, characters: [], locations: [], errors: [] };

  // ── 1. Load the saved script and scenes ──────────────────────────────────
  const scriptResult = await query(
    `SELECT * FROM scripts WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [scriptId, projectId]
  );
  if (!scriptResult.rows.length) throw new Error('Script not found for Phase 2 enhancement.');
  const script = scriptResult.rows[0];

  const scenesResult = await query(
    `SELECT * FROM scenes WHERE script_id = $1 AND project_id = $2 ORDER BY scene_number ASC`,
    [scriptId, projectId]
  );
  const scenes = scenesResult.rows;

  const chapterResult = await query(
    `SELECT * FROM chapters WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [chapterId, projectId]
  );
  const chapter = chapterResult.rows[0];
  if (!chapter) throw new Error('Chapter not found for Phase 2 enhancement.');

  // ── 2. AI Script Analysis ────────────────────────────────────────────────
  log.info('Phase 2: Starting AI script analysis', { projectId, scriptId });
  try {
    const analysisResult = await dispatch({
      projectId,
      taskType: 'analyze_script',
      input: {
        script_title: script.title,
        script_content: script.content.slice(0, 6000),
        scene_count: scenes.length,
        scene_summaries: scenes.slice(0, 15).map(s => ({
          number: s.scene_number,
          title: s.title,
          description: s.description,
        })),
      },
      useCache: false,
    });

    results.script_analysis = analysisResult.result;

    // Update Brain with analysis results
    if (analysisResult.result) {
      const analysis = analysisResult.result;

      if (analysis.themes || analysis.conflicts || analysis.arcs || analysis.tone) {
        await updateSection(projectId, 'story_bible', {
          ai_analysis: {
            themes: analysis.themes || [],
            conflicts: analysis.conflicts || [],
            arcs: analysis.arcs || [],
            tone: analysis.tone || '',
            analyzed_at: new Date().toISOString(),
          },
        });
      }

      // Update chapter synopsis with AI-enriched version
      if (analysis.summary) {
        await query(
          `UPDATE chapters SET synopsis = $1, metadata = metadata || $2, updated_at = NOW() WHERE id = $3`,
          [
            analysis.summary,
            JSON.stringify({ ai_enhanced: true, phase_2_at: new Date().toISOString() }),
            chapterId,
          ]
        );
      }
    }
  } catch (err) {
    log.warn('Phase 2: Script analysis failed, continuing', { err: err.message });
    results.errors.push({ step: 'script_analysis', error: err.message });
  }

  // ── 3. AI Character DNA Generation ───────────────────────────────────────
  // Extract candidate characters from Phase 1 metadata
  const candidateCharacters = chapter.metadata?.character_candidates || [];

  if (candidateCharacters.length > 0) {
    log.info('Phase 2: Generating character DNA', { count: candidateCharacters.length });

    for (const charName of candidateCharacters.slice(0, 8)) {
      try {
        // Check if character already exists
        const existing = await query(
          `SELECT id FROM characters WHERE project_id = $1 AND LOWER(name) = LOWER($2) AND deleted_at IS NULL`,
          [projectId, charName]
        );

        if (existing.rows.length > 0) {
          // Character exists — evolve with new script context
          const dnaResult = await dispatch({
            projectId,
            taskType: 'evolve_character',
            input: {
              character: { name: charName, personality: {}, arc_progress: '', status: '' },
              event: `New chapter context: ${script.title}`,
              sceneReference: script.title,
            },
            useCache: false,
          });
          results.characters.push({ name: charName, action: 'evolved', result: dnaResult.result });
        } else {
          // New character — generate DNA
          const dnaResult = await dispatch({
            projectId,
            taskType: 'generate_character_dna',
            input: {
              character_name: charName,
              script_context: script.content.slice(0, 3000),
              chapter_title: script.title,
            },
            useCache: false,
          });

          // Save new character to database
          if (dnaResult.result) {
            const dna = dnaResult.result;
            await query(
              `INSERT INTO characters (project_id, name, role, visual_dna, personality, voice_profile, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                projectId,
                charName,
                dna.role || 'supporting',
                JSON.stringify(dna.visual_dna || {}),
                JSON.stringify(dna.personality || {}),
                JSON.stringify(dna.voice_profile || {}),
                JSON.stringify({
                  created_by: 'phase_2_ai',
                  source_script: scriptId,
                  ai_generated: true,
                }),
              ]
            );
          }

          results.characters.push({ name: charName, action: 'created', result: dnaResult.result });
        }
      } catch (err) {
        log.warn(`Phase 2: Character DNA failed for ${charName}`, { err: err.message });
        results.errors.push({ step: `character_dna:${charName}`, error: err.message });
      }
    }

    // Update character_bible in Brain
    if (results.characters.length > 0) {
      await updateSection(projectId, 'character_bible', {
        ai_characters: results.characters.map(c => ({
          name: c.name,
          action: c.action,
          enhanced_at: new Date().toISOString(),
        })),
      }).catch(() => {});
    }
  }

  // ── 4. AI Location Generation ────────────────────────────────────────────
  const locationNames = [...new Set(
    scenes
      .map(s => s.metadata?.planner_location_name)
      .filter(Boolean)
      .filter(name => !name.startsWith('Scene Location'))
  )];

  if (locationNames.length > 0) {
    log.info('Phase 2: Generating locations', { count: locationNames.length });

    for (const locationName of locationNames.slice(0, 6)) {
      try {
        const locResult = await dispatch({
          projectId,
          taskType: 'generate_location',
          input: {
            location_name: locationName,
            script_context: script.content.slice(0, 3000),
          },
          useCache: false,
        });
        results.locations.push({ name: locationName, result: locResult.result });
      } catch (err) {
        log.warn(`Phase 2: Location generation failed for ${locationName}`, { err: err.message });
        results.errors.push({ step: `location:${locationName}`, error: err.message });
      }
    }

    // Update world_bible in Brain
    if (results.locations.length > 0) {
      await updateSection(projectId, 'world_bible', {
        ai_locations: results.locations.map(l => ({
          name: l.name,
          enhanced_at: new Date().toISOString(),
        })),
      }).catch(() => {});
    }
  }

  // ── 5. Update script and chapter status ──────────────────────────────────
  await query(
    `UPDATE scripts SET status = 'analyzed', updated_at = NOW() WHERE id = $1`,
    [scriptId]
  );
  await query(
    `UPDATE chapters SET status = 'planned', metadata = metadata || $1, updated_at = NOW() WHERE id = $2`,
    [
      JSON.stringify({
        phase_2_complete: true,
        phase_2_at: new Date().toISOString(),
        phase_2_stats: {
          characters_processed: results.characters.length,
          locations_processed: results.locations.length,
          errors: results.errors.length,
        },
      }),
      chapterId,
    ]
  );

  // ── 6. Record to Brain memory ────────────────────────────────────────────
  const durationMs = Date.now() - startTime;
  await appendMemory(projectId, {
    agentType: 'story',
    memoryType: 'milestone',
    content: `Phase 2 AI enhancement completed for "${script.title}": analyzed script, processed ${results.characters.length} characters and ${results.locations.length} locations in ${(durationMs / 1000).toFixed(1)}s.`,
    importance: 9,
    refs: [
      { entity_type: 'chapter', entity_id: chapterId, label: chapter.title },
      { entity_type: 'script', entity_id: scriptId, label: script.title },
    ],
  }).catch(() => {});

  eventBus.emit('ai:completed', { projectId, task: 'phase_2_enhance', durationMs });

  log.info('Phase 2: Enhancement complete', {
    projectId,
    characters: results.characters.length,
    locations: results.locations.length,
    errors: results.errors.length,
    durationMs,
  });

  return results;
}

export default { enhanceIntake };
