#!/usr/bin/env node
import { spawn } from 'node:child_process';

if (!process.env.COMFYUI_BASE_URL) {
  console.error('[verify-comfyui-runtime] ❌ COMFYUI_BASE_URL is required.');
  process.exit(1);
}
if (!process.env.COMFYUI_WORKFLOW_PATH) {
  console.error('[verify-comfyui-runtime] ❌ COMFYUI_WORKFLOW_PATH must point to a ComfyUI API-format workflow JSON file.');
  process.exit(1);
}

const child = spawn(process.execPath, ['scripts/verify-comfyui-plan.js'], {
  env: { ...process.env, COMFYUI_MODE: 'real' },
  stdio: 'inherit',
});

child.on('exit', code => process.exit(code ?? 1));
