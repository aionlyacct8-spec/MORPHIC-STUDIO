import { createError } from './errorHandler.js';

/**
 * Optional API-key guard for production hardening.
 *
 * Local/prototype behavior is unchanged unless REQUIRE_API_KEY=true. When enabled,
 * callers must send either:
 *   Authorization: Bearer <API_KEY>
 *   x-api-key: <API_KEY>
 */
export function optionalApiKeyAuth(req, _res, next) {
  if (process.env.REQUIRE_API_KEY !== 'true') return next();

  if (!process.env.API_KEY) {
    return next(createError(500, 'API_KEY must be set when REQUIRE_API_KEY=true.'));
  }

  const auth = req.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  const apiKey = req.get('x-api-key') ?? bearer;

  if (apiKey !== process.env.API_KEY) {
    return next(createError(401, 'Unauthorized.'));
  }

  next();
}
