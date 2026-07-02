import logger from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`${req.method} ${req.path} → ${status}`, { message, stack: err.stack?.split('\n')[1] });

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

// Wrap async route handlers so they propagate errors to errorHandler
export function asyncWrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Quick error factory
export function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
