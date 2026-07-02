/**
 * Event Bus — lightweight in-process pub/sub for Morphic Studio.
 *
 * Instead of services calling each other directly, they emit events and
 * subscribers react. This keeps the architecture modular and easy to extend.
 *
 * Usage:
 *   import eventBus from './eventBus.js';
 *
 *   // Publish
 *   eventBus.emit('character:created', { projectId, character });
 *
 *   // Subscribe
 *   eventBus.on('character:created', ({ projectId, character }) => { ... });
 *
 * ── Full event contract ──────────────────────────────────────────────────────
 *
 * Project
 *   project:created       { projectId, project }
 *   project:updated       { projectId, changes }
 *   project:deleted       { projectId }
 *
 * Brain
 *   brain:updated         { projectId, section }
 *   brain:rebuilt         { projectId, contextLength }
 *   brain:locked          { projectId, reason }
 *   brain:unlocked        { projectId }
 *   brain:version_saved   { projectId, versionNum }
 *
 * Characters
 *   character:created     { projectId, character }
 *   character:updated     { projectId, id, changes }
 *   character:evolved     { projectId, id, evolution }
 *   character:deleted     { projectId, id }
 *   character:restored    { projectId, id }
 *
 * Worlds & Locations
 *   world:created         { projectId, world }
 *   world:updated         { projectId, id, changes }
 *   world:deleted         { projectId, id }
 *   location:created      { projectId, worldId, location }
 *   location:updated      { projectId, id, changes }
 *
 * Scenes & Episodes
 *   scene:created         { projectId, scene }
 *   scene:updated         { projectId, id, changes }
 *   scene:deleted         { projectId, id }
 *   episode:created       { projectId, episode }
 *   episode:updated       { projectId, id, changes }
 *
 * Stories & Scripts
 *   story:analyzed        { projectId, scriptId, panels }
 *   story:outline_generated { projectId, scriptId, outline }
 *   script:created        { projectId, scriptId }
 *   script:updated        { projectId, scriptId }
 *
 * Assets
 *   asset:created         { projectId, asset }
 *   asset:updated         { projectId, id, changes }
 *   asset:deleted         { projectId, id }
 *   asset:restored        { projectId, id }
 *   asset:used            { projectId, id }
 *   asset:version_created { projectId, id, versionNum }
 *
 * Knowledge Graph
 *   knowledge_graph:node_upserted  { projectId, node }
 *   knowledge_graph:node_deleted   { projectId, entityId, entityType }
 *   knowledge_graph:edge_upserted  { projectId, edge, relation }
 *   knowledge_graph:updated        { projectId }
 *
 * AI / Generation
 *   ai:completed          { projectId, taskType, agentName, durationMs, jobId }
 *   ai:failed             { projectId, taskType, agentName, error, jobId }
 *   storyboard:generated  { projectId, scriptId, panels }
 *   comic:generated       { projectId, panels }
 *   animation:generated   { projectId, assetId }
 *   voice:generated       { projectId, characterId, assetId }
 *   export:completed      { projectId, exportId, fileUrl }
 *
 * Memory
 *   memory:appended       { projectId, agentType, memoryType }
 *   memory:expired        { projectId, count }
 */

import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

const log = logger.child('eventBus');

// All valid event names — used for validation in dev
const EVENTS = new Set([
  // Project
  'project:created', 'project:updated', 'project:deleted',
  // Brain
  'brain:updated', 'brain:rebuilt', 'brain:locked', 'brain:unlocked', 'brain:version_saved',
  // Characters
  'character:created', 'character:updated', 'character:evolved',
  'character:deleted', 'character:restored',
  // Worlds & Locations
  'world:created', 'world:updated', 'world:deleted',
  'location:created', 'location:updated',
  // Scenes & Episodes
  'scene:created', 'scene:updated', 'scene:deleted',
  'episode:created', 'episode:updated',
  // Stories
  'story:analyzed', 'story:outline_generated', 'script:created', 'script:updated',
  // Assets
  'asset:created', 'asset:updated', 'asset:deleted', 'asset:restored',
  'asset:used', 'asset:version_created',
  // Knowledge Graph
  'knowledge_graph:node_upserted', 'knowledge_graph:node_deleted',
  'knowledge_graph:edge_upserted', 'knowledge_graph:updated',
  // AI / Generation
  'ai:completed', 'ai:failed',
  'storyboard:generated', 'comic:generated', 'animation:generated',
  'voice:generated', 'export:completed',
  // Memory
  'memory:appended', 'memory:expired',
]);

class MorphicEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit to avoid Node warnings for high-subscription modules
    this.setMaxListeners(100);
  }

  /**
   * emit — typed, logged emit.
   * In development it warns if an unregistered event name is used.
   */
  emit(event, payload) {
    if (process.env.NODE_ENV !== 'production' && !EVENTS.has(event)) {
      log.warn(`⚠ Unknown event "${event}" — add it to eventBus.js contract`);
    }
    log.info(`↗ ${event}`, payload ? { projectId: payload.projectId } : {});
    return super.emit(event, payload);
  }

  /**
   * onEvent — alias for .on() that returns an unsubscribe function.
   */
  onEvent(event, handler) {
    this.on(event, handler);
    return () => this.off(event, handler);
  }

  /**
   * onceEvent — fires once, returns a Promise that resolves with the payload.
   */
  onceEvent(event) {
    return new Promise(resolve => this.once(event, resolve));
  }
}

// Singleton — the whole app shares one bus
const eventBus = new MorphicEventBus();

// ── Auto-wiring cross-domain reactions ───────────────────────────────────────
// These keep modules decoupled while ensuring consistency.

// When knowledge graph changes, mark brain as stale (non-blocking)
eventBus.on('knowledge_graph:node_upserted', ({ projectId }) => {
  eventBus.emit('knowledge_graph:updated', { projectId });
});

export default eventBus;
