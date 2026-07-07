/**
 * Shared PostgreSQL connection options.
 * Supabase pooler/direct hosts require TLS, while local Postgres usually does not.
 */
export function getPgSslOptions(connectionString = process.env.DATABASE_URL) {
  const mode = (process.env.PGSSLMODE || '').toLowerCase();
  if (mode === 'disable') return undefined;
  if (mode === 'no-verify') return { rejectUnauthorized: false };
  if (['require', 'verify-ca', 'verify-full'].includes(mode)) return true;

  try {
    const host = new URL(connectionString).hostname;
    if (host.endsWith('.supabase.com') || host.endsWith('.supabase.co')) {
      return { rejectUnauthorized: false };
    }
  } catch (_err) {
    // Leave SSL unset for invalid/missing URLs; callers validate DATABASE_URL.
  }

  return undefined;
}

export function getPgPoolConfig(overrides = {}) {
  const connectionString = overrides.connectionString || process.env.DATABASE_URL;
  const ssl = getPgSslOptions(connectionString);
  return {
    connectionString,
    ...(ssl ? { ssl } : {}),
    ...overrides,
  };
}
