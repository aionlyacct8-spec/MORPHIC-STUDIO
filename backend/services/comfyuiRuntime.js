import { readFile } from 'fs/promises';
import crypto from 'crypto';
import { getComfyUiConfig } from './configService.js';

function trimSlash(value) {
  return String(value || '').replace(/\/$/, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function readWorkflowPrompt(options = {}) {
  if (options.workflowPrompt && typeof options.workflowPrompt === 'object') return options.workflowPrompt;
  if (options.workflowJson && typeof options.workflowJson === 'object') return options.workflowJson;

  const config = getComfyUiConfig();
  const workflowPath = options.workflowPath || config.workflowPath;
  if (!workflowPath) return null;

  const raw = await readFile(workflowPath, 'utf8');
  return JSON.parse(raw);
}

function findImages(historyEntry) {
  const outputs = historyEntry?.outputs || {};
  const images = [];
  for (const nodeOutput of Object.values(outputs)) {
    for (const image of nodeOutput?.images || []) {
      if (image?.filename) images.push(image);
    }
  }
  return images;
}

export async function runComfyUiPrompt(panelPayload, options = {}) {
  const config = getComfyUiConfig();
  const runtimeMode = options.runtimeMode || config.mode;
  if (runtimeMode !== 'real') {
    return { mode: 'simulated', skipped: true, reason: 'COMFYUI_MODE is not set to real.' };
  }
  if (!config.baseUrl) {
    throw new Error('COMFYUI_BASE_URL is required when COMFYUI_MODE=real.');
  }

  const workflowPrompt = await readWorkflowPrompt(options);
  if (!workflowPrompt) {
    throw new Error('A ComfyUI API-format workflow is required for real runtime mode. Set COMFYUI_WORKFLOW_PATH or pass options.workflowPrompt.');
  }

  const baseUrl = trimSlash(config.baseUrl);
  const clientId = options.clientId || config.clientId || `morphic-${crypto.randomUUID()}`;
  const queueBody = {
    prompt: workflowPrompt,
    client_id: clientId,
    extra_data: {
      morphic: {
        adapter: 'comfyuiAdapter',
        panelPayload,
      },
    },
  };

  const queued = await fetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queueBody),
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });
  const queueResult = await queued.json().catch(() => ({}));
  if (!queued.ok) {
    throw new Error(`ComfyUI /prompt failed (${queued.status}): ${queueResult.error || queueResult.message || queued.statusText}`);
  }

  const promptId = queueResult.prompt_id;
  if (!promptId) throw new Error('ComfyUI /prompt response did not include prompt_id.');

  let history;
  let images = [];
  for (let attempt = 0; attempt < config.maxPolls; attempt += 1) {
    await sleep(config.pollIntervalMs);
    const historyRes = await fetch(`${baseUrl}/history/${encodeURIComponent(promptId)}`, {
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    });
    const historyBody = await historyRes.json().catch(() => ({}));
    if (!historyRes.ok) {
      throw new Error(`ComfyUI /history/${promptId} failed (${historyRes.status}): ${historyBody.error || historyBody.message || historyRes.statusText}`);
    }
    history = historyBody[promptId] || historyBody;
    images = findImages(history);
    if (images.length) break;
  }

  if (!images.length) {
    throw new Error(`ComfyUI prompt ${promptId} did not produce an image before polling timed out.`);
  }

  const viewUrls = images.map(image => {
    const params = new URLSearchParams({
      filename: image.filename,
      subfolder: image.subfolder || '',
      type: image.type || 'output',
    });
    return `${baseUrl}/view?${params.toString()}`;
  });

  return {
    mode: 'real',
    promptId,
    clientId,
    outputUrl: viewUrls[0],
    outputs: images.map((image, index) => ({ ...image, viewUrl: viewUrls[index] })),
    history,
  };
}
