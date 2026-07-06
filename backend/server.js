/**
 * Morphic Studio — API Server v2
 *
 * Architecture:
 *   routes/       → URL definitions
 *   controllers/  → request/response handling
 *   services/     → business logic & DB access
 *   agents/       → AI specialists (Story, Character, World, Storyboard)
 *   agents/orchestrator.js → multi-agent coordinator with job tracking
 *   agents/gateway.js      → provider-agnostic AI interface
 *   middleware/   → error handling, validation, rate limiting
 *   utils/        → logger
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import projectsRouter    from './routes/projects.js';
import brainRouter       from './routes/brain.js';
import charactersRouter  from './routes/characters.js';
import worldsRouter      from './routes/worlds.js';
import assetsRouter      from './routes/assets.js';
import storiesRouter     from './routes/stories.js';
import knowledgeGraphRouter from './routes/knowledgeGraph.js';
import generationJobsRouter from './routes/generationJobs.js';
import scenesRouter      from './routes/scenes.js';
import productionRouter  from './routes/production.js';
import systemRouter      from './routes/system.js';

import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, aiLimiter } from './middleware/rateLimiter.js';
import { optionalApiKeyAuth } from './middleware/auth.js';
import { getProviderHealth } from './agents/gateway.js';
import { getRuntimeConfig } from './services/configService.js';
import { getQueueHealth } from './services/queueService.js';
import { getStorageHealth } from './services/storageService.js';
import logger from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────
const corsOptions = process.env.CORS_ORIGIN
  ? { origin: process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean) }
  : undefined;

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// Serve static frontend — no-cache for HTML in dev so preview always refreshes
app.use(express.static(join(__dirname, '../frontend'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html') && process.env.NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    }
  },
}));

// ── Rate limiting ─────────────────────────────────────────
// Apply general limiter to all API routes
app.use('/api', generalLimiter);
app.use('/api', optionalApiKeyAuth);

// ── Health / discovery ────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    status:  'online',
    version: '2.0.0',
    name:    'Morphic Studio API',
    ai: {
      provider: process.env.AI_PROVIDER || 'openai',
      gateway:  'active',
      agents:   ['story', 'character', 'world', 'storyboard'],
      orchestrator: 'active',
    },
    modules: [
      'GET  /api/projects',
      'POST /api/projects',
      'GET  /api/projects/:id',
      'GET  /api/projects/:projectId/brain',
      'PUT  /api/projects/:projectId/brain/sections/:section',
      'GET  /api/projects/:projectId/brain/memory',
      'GET  /api/projects/:projectId/brain/versions',
      'GET  /api/projects/:projectId/brain/search',
      'POST /api/projects/:projectId/brain/lock',
      'POST /api/projects/:projectId/brain/unlock',
      'GET  /api/projects/:projectId/characters',
      'POST /api/projects/:projectId/characters',
      'GET  /api/projects/:projectId/worlds',
      'POST /api/projects/:projectId/worlds',
      'GET  /api/projects/:projectId/assets',
      'GET  /api/projects/:projectId/assets/stats',
      'POST /api/projects/:projectId/assets',
      'GET  /api/projects/:projectId/stories/scripts',
      'POST /api/projects/:projectId/stories/scripts',
      'POST /api/projects/:projectId/stories/scripts/:scriptId/analyze',
      'GET  /api/projects/:projectId/scenes',
      'POST /api/projects/:projectId/scenes',
      'GET  /api/projects/:projectId/episodes',
      'POST /api/projects/:projectId/episodes',
      'GET  /api/projects/:projectId/graph',
      'GET  /api/projects/:projectId/graph/nodes',
      'POST /api/projects/:projectId/graph/edges',
      'GET  /api/projects/:projectId/jobs',
      'POST /api/projects/:projectId/jobs/dispatch',
      'GET  /api/system/config',
      'GET  /api/system/queues',
      'GET  /api/system/storage',
      'POST /api/system/projects/:projectId/storage/objects',
      'POST /api/projects/:projectId/production/intake/plan',
      'GET  /api/projects/:projectId/production/chapters',
      'POST /api/projects/:projectId/production/chapters',
      'GET  /api/projects/:projectId/production/comic/pages',
      'POST /api/projects/:projectId/production/comic/panels',
      'GET  /api/projects/:projectId/production/motion/sequences',
      'GET  /api/projects/:projectId/production/voices',
      'GET  /api/projects/:projectId/production/animation/assets',
    ],
  });
});

// ── Provider health check ─────────────────────────────────
app.get('/api/health', async (_req, res) => {
  res.json({
    status:    'ok',
    uptime:    process.uptime(),
    memory:    process.memoryUsage(),
    providers: getProviderHealth(),
    database:  process.env.DATABASE_URL ? 'configured' : 'not_set',
    config:    getRuntimeConfig(),
    queue:     getQueueHealth(),
    storage:   await getStorageHealth(),
  });
});

// ── API routes ────────────────────────────────────────────
app.use('/api/system',                                      systemRouter);
app.use('/api/projects',                                    projectsRouter);
app.use('/api/projects/:projectId/brain',                   brainRouter);
app.use('/api/projects/:projectId/characters',              charactersRouter);
app.use('/api/projects/:projectId/worlds',                  worldsRouter);
app.use('/api/projects/:projectId/assets',                  assetsRouter);
app.use('/api/projects/:projectId/stories',                 storiesRouter);
app.use('/api/projects/:projectId/graph',                   knowledgeGraphRouter);
app.use('/api/projects/:projectId/jobs',                    generationJobsRouter);
app.use('/api/projects/:projectId/production',              productionRouter);
app.use('/api/projects/:projectId',                         scenesRouter);  // /scenes and /episodes

// ── Unknown /api/* → JSON 404 (must precede SPA catch-all) ──
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ── Catch-all → SPA index ─────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../frontend/index.html'));
});

// ── Global error handler ──────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🎬 Morphic Studio live on port ${PORT}`);
  logger.info(`   AI provider : ${process.env.AI_PROVIDER || 'openai'}`);
  logger.info(`   Database    : ${process.env.DATABASE_URL ? 'connected' : 'NOT SET — run: node database/setup.js after adding DATABASE_URL'}`);
  logger.info(`   Rate limiting: active`);
  logger.info(`   Orchestrator: active`);
});
