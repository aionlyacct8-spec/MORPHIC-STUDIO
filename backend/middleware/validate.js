import { createError } from './errorHandler.js';

// require(fields) — middleware that 400s if any required body field is missing
export function requireBody(...fields) {
  return (req, _res, next) => {
    const missing = fields.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '');
    if (missing.length > 0) {
      return next(createError(400, `Missing required fields: ${missing.join(', ')}`));
    }
    next();
  };
}

// requireParams — same but for URL params
export function requireParams(...params) {
  return (req, _res, next) => {
    const missing = params.filter(p => !req.params[p]);
    if (missing.length > 0) {
      return next(createError(400, `Missing required URL params: ${missing.join(', ')}`));
    }
    next();
  };
}
