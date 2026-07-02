const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function fmt(level, module, msg, meta) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]${module ? ` [${module}]` : ''}`;
  return meta ? `${prefix} ${msg} ${JSON.stringify(meta)}` : `${prefix} ${msg}`;
}

function log(level, module, msg, meta) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const line = fmt(level, module, msg, meta);
  level === 'error' ? console.error(line) : console.log(line);
}

function makeLogger(module) {
  return {
    debug: (msg, meta) => log('debug', module, msg, meta),
    info:  (msg, meta) => log('info',  module, msg, meta),
    warn:  (msg, meta) => log('warn',  module, msg, meta),
    error: (msg, meta) => log('error', module, msg, meta),
  };
}

// Root logger (no module tag)
const root = makeLogger(null);
root.child = makeLogger;

export default root;
