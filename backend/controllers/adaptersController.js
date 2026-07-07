import { createError } from '../middleware/errorHandler.js';
import { planPanelImage } from '../services/comfyuiAdapter.js';

export async function planComfyUiPanel(req, res) {
  const { projectId } = req.params;
  const { panelId, options } = req.body;

  if (!panelId) throw createError(400, 'panelId is required.');

  const result = await planPanelImage(projectId, panelId, options ?? {});
  res.status(201).json({
    message: 'ComfyUI planning adapter completed in simulated mode.',
    ...result,
  });
}
