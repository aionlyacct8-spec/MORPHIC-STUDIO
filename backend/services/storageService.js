import { mkdir, stat, writeFile, readFile } from 'fs/promises';
import { join, normalize } from 'path';
import crypto from 'crypto';
import { getStorageConfig } from './configService.js';

function safeSegment(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function ensureStorageRoot() {
  const config = getStorageConfig();
  if (config.provider !== 'local') {
    return { ready: false, provider: config.provider, reason: 'External storage provider configured; local root not used.' };
  }
  await mkdir(config.localRoot, { recursive: true });
  return { ready: true, provider: config.provider, root: config.localRoot };
}

export async function getStorageHealth() {
  const config = getStorageConfig();
  if (config.provider !== 'local') {
    return { provider: config.provider, ready: true, writable: null, root: null };
  }

  try {
    await mkdir(config.localRoot, { recursive: true });
    const probePath = join(config.localRoot, '.healthcheck');
    await writeFile(probePath, String(Date.now()));
    const stats = await stat(config.localRoot);
    return { provider: 'local', ready: true, writable: true, root: config.localRoot, isDirectory: stats.isDirectory() };
  } catch (error) {
    return { provider: 'local', ready: false, writable: false, root: config.localRoot, error: error.message };
  }
}

export function validateUpload({ mimeType, byteSize }) {
  const config = getStorageConfig();
  const maxBytes = config.maxUploadMb * 1024 * 1024;
  if (byteSize > maxBytes) throw new Error(`Upload exceeds ${config.maxUploadMb} MB limit.`);
  if (mimeType && !config.allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}

export async function saveBase64Object({ projectId, fileName, mimeType, contentBase64 }) {
  const config = getStorageConfig();
  if (config.provider !== 'local') throw new Error(`Storage provider ${config.provider} is not implemented yet.`);
  if (!contentBase64) throw new Error('contentBase64 is required.');

  const buffer = Buffer.from(contentBase64, 'base64');
  validateUpload({ mimeType, byteSize: buffer.length });

  const projectDir = join(config.localRoot, safeSegment(projectId));
  await mkdir(projectDir, { recursive: true });

  const objectKey = `${Date.now()}-${crypto.randomUUID()}-${safeSegment(fileName || 'upload.bin')}`;
  const filePath = normalize(join(projectDir, objectKey));
  await writeFile(filePath, buffer);

  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  const fileUrl = config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/$/, '')}/${safeSegment(projectId)}/${objectKey}`
    : filePath;

  return { objectKey, filePath, fileUrl, byteSize: buffer.length, checksum };
}

export async function readLocalObject(projectId, objectKey) {
  const config = getStorageConfig();
  const filePath = join(config.localRoot, safeSegment(projectId), safeSegment(objectKey));
  return readFile(filePath);
}
