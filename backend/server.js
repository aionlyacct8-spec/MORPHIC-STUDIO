/**
 * Morphic Studio — API Server v2
 *
 * Architecture:
 *   routes/       → URL definitions
 *   controllers/  → request/response handling
 *   services/     → business logic & DB access
 *   agents/       → AI specialists (Story, Character, World, Storyboard)
 *   agents/gateway.js → provider-agnostic AI interface (OpenAI / OpenRouter)
 *   middleware/   → error handling, validation
 *   utils/        → logger
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import projectsRouter   from './routes/projects.js';
import brainRouter      from './routes/brain.js';
import charactersRouter from './routes/characters.js';
import worldsRouter     from './routes/worlds.js';
import assetsRouter     from './routes/assets.js';
import storiesRouter    from './routes/stories.js';

import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────
app.use(cors());
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

// ── API routes (all project-scoped under /api/projects/:projectId) ──
app.use('/api/projects',                                    projectsRouter);
app.use('/api/projects/:projectId/brain',                   brainRouter);
app.use('/api/projects/:projectId/characters',              charactersRouter);
app.use('/api/projects/:projectId/worlds',                  worldsRouter);
app.use('/api/projects/:projectId/assets',                  assetsRouter);
app.use('/api/projects/:projectId/stories',                 storiesRouter);

// ── Health / discovery ────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    name: 'Morphic Studio API',
    ai: {
      provider: process.env.AI_PROVIDER || 'openai',
      gateway: 'active',
      agents: ['story', 'character', 'world', 'storyboard'],
    },
    modules: [
      'GET  /api/projects',
      'GET  /api/projects/:id',
      'POST /api/projects',
      'GET  /api/projects/:projectId/brain',
      'PUT  /api/projects/:projectId/brain/sections/:section',
      'GET  /api/projects/:projectId/brain/memory',
      'GET  /api/projects/:projectId/characters',
      'POST /api/projects/:projectId/characters',
      'POST /api/projects/:projectId/characters/:id/evolve',
      'GET  /api/projects/:projectId/worlds',
      'POST /api/projects/:projectId/worlds',
      'POST /api/projects/:projectId/worlds/:worldId/locations',
      'GET  /api/projects/:projectId/assets',
      'POST /api/projects/:projectId/assets',
      'GET  /api/projects/:projectId/stories/scripts',
      'POST /api/projects/:projectId/stories/scripts',
      'POST /api/projects/:projectId/stories/scripts/:scriptId/analyze',
      'POST /api/projects/:projectId/stories/outline',
    ],
  });
});

// ── Unknown /api/* → JSON 404 (must precede SPA catch-all) ──
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ── Catch-all → SPA index ────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../frontend/index.html'));
});

// ── Global error handler ─────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🎬 Morphic Studio live on port ${PORT}`);
  logger.info(`   AI provider : ${process.env.AI_PROVIDER || 'openai'}`);
  logger.info(`   Database    : ${process.env.DATABASE_URL ? 'connected' : 'NOT SET — run: node database/setup.js after adding DATABASE_URL'}`);
});
