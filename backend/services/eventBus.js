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
 * Defined event contracts:
 *   character:created   { projectId, character }
 *   character:updated   { projectId, id, changes }
 *   character:deleted   { projectId, id }
 *   world:created       { projectId, world }
 *   world:updated       { projectId, id, changes }
 *   location:created    { projectId, worldId, location }
 *   asset:created       { projectId, asset }
 *   asset:updated       { projectId, id, changes }
 *   asset:used          { projectId, id }
 *   brain:updated       { projectId, section }
 *   story:analyzed      { projectId, scriptId, panels }
 */

import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

const log = logger.child('eventBus');

class MorphicEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit to avoid Node warnings for high-subscription modules
    this.setMaxListeners(50);
  }

  /**
   * Typed emit — logs every event in dev so you can trace data flow.
   */
  emit(event, payload) {
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
}

// Singleton — the whole app shares one bus
const eventBus = new MorphicEventBus();

export default eventBus;
