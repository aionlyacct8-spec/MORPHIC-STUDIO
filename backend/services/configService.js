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
    port: Number(process.env.PORT || 5000),
    logLevel: process.env.LOG_LEVEL || 'info',
    corsConfigured: Boolean(process.env.CORS_ORIGIN),
    apiKeyRequired: bool('REQUIRE_API_KEY'),
    features: getFeatureFlags(),
    storage: getStorageConfig(),
    queue: getQueueConfig(),
    aiKeys: getAiKeyStatus(),
  };
}
