const truthy = new Set(['1', 'true', 'yes', 'on', 'enabled']);

function bool(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return truthy.has(String(value).toLowerCase());
}

function list(name, fallback = []) {
  const value = process.env[name];
  if (!value) return fallback;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function number(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getServerConfig() {
  return {
    host: process.env.HOST || '0.0.0.0',
    port: number('PORT', 5000),
  };
}

export function getFeatureFlags() {
  return {
    nextFrontend: bool('FEATURE_NEXT_FRONTEND'),
    redisQueue: bool('FEATURE_REDIS_QUEUE'),
    localStorage: bool('FEATURE_LOCAL_STORAGE', true),
    imageGeneration: bool('FEATURE_IMAGE_GENERATION'),
    motionComic: bool('FEATURE_MOTION_COMIC'),
    animationStudio: bool('FEATURE_ANIMATION_STUDIO'),
  };
}

export function getStorageConfig() {
  return {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localRoot: process.env.STORAGE_LOCAL_ROOT || './storage',
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || '',
    maxUploadMb: Number(process.env.STORAGE_MAX_UPLOAD_MB || 25),
    allowedMimeTypes: list('STORAGE_ALLOWED_MIME_TYPES', [
      'image/png', 'image/jpeg', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm', 'application/pdf',
    ]),
  };
}


export function getComfyUiConfig() {
  return {
    mode: process.env.COMFYUI_MODE || 'simulated',
    baseUrl: process.env.COMFYUI_BASE_URL || '',
    workflowPath: process.env.COMFYUI_WORKFLOW_PATH || '',
    clientId: process.env.COMFYUI_CLIENT_ID || '',
    requestTimeoutMs: number('COMFYUI_REQUEST_TIMEOUT_MS', 30000),
    pollIntervalMs: number('COMFYUI_POLL_INTERVAL_MS', 1000),
    maxPolls: number('COMFYUI_MAX_POLLS', 120),
  };
}

export function getQueueConfig() {
  return {
    provider: process.env.QUEUE_PROVIDER || 'memory',
    redisUrlConfigured: Boolean(process.env.REDIS_URL),
    names: list('QUEUE_NAMES', ['image-gen', 'tts', 'export']),
  };
}

export function getAiKeyStatus() {
  return {
    provider: process.env.AI_PROVIDER || 'openai',
    openai: Boolean(process.env.OPENAI_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    replicate: Boolean(process.env.REPLICATE_API_TOKEN),
    fal: Boolean(process.env.FAL_KEY),
  };
}

export function getRuntimeConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    server: getServerConfig(),
    logLevel: process.env.LOG_LEVEL || 'info',
    corsConfigured: Boolean(process.env.CORS_ORIGIN),
    apiKeyRequired: bool('REQUIRE_API_KEY'),
    features: getFeatureFlags(),
    storage: getStorageConfig(),
    queue: getQueueConfig(),
    comfyui: getComfyUiConfig(),
    aiKeys: getAiKeyStatus(),
  };
}
