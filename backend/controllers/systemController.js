import { query } from '../services/db.js';
import { createError } from '../middleware/errorHandler.js';
import { getRuntimeConfig } from '../services/configService.js';
import { getQueueHealth } from '../services/queueService.js';
import { getStorageHealth, saveBase64Object } from '../services/storageService.js';

export function getConfig(_req, res) {
  res.json({ config: getRuntimeConfig() });
}

export async function getStorageStatus(_req, res) {
  res.json({ storage: await getStorageHealth() });
}

export function getQueueStatus(_req, res) {
  res.json({ queue: getQueueHealth() });
}

export async function uploadProjectObject(req, res) {
  const { projectId } = req.params;
  const { fileName, mimeType, contentBase64, assetName, assetType = 'asset', metadata = {} } = req.body;

  if (!fileName) throw createError(400, 'fileName is required.');
  if (!contentBase64) throw createError(400, 'contentBase64 is required.');

  try {
    const stored = await saveBase64Object({ projectId, fileName, mimeType, contentBase64 });

    const assetResult = await query(
      `INSERT INTO assets (project_id, name, type, file_url, metadata, source)
       VALUES ($1,$2,$3,$4,$5,'uploaded') RETURNING *`,
      [projectId, assetName || fileName, assetType, stored.fileUrl, JSON.stringify({ ...metadata, mimeType, byteSize: stored.byteSize, checksum: stored.checksum })]
    );
    const asset = assetResult.rows[0];

    const objectResult = await query(
      `INSERT INTO storage_objects (project_id, asset_id, bucket, object_key, file_path, file_url, mime_type, byte_size, checksum, metadata)
       VALUES ($1,$2,'local',$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [projectId, asset.id, stored.objectKey, stored.filePath, stored.fileUrl, mimeType || null, stored.byteSize, stored.checksum, JSON.stringify(metadata)]
    );

    res.status(201).json({ asset, storageObject: objectResult.rows[0] });
  } catch (error) {
    throw createError(400, error.message);
  }
}
