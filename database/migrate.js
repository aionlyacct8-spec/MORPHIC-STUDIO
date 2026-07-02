/**
 * Morphic Studio — Migration runner
 * Runs all SQL files in database/migrations/ in order.
 * Safe to re-run: applied files are tracked in _migrations.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const __dir = dirname(fileURLToPath(import.meta.url));

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env or provision PostgreSQL before running migrations.');
  }
}

export async function migrate({ pool: externalPool } = {}) {
  requireDatabaseUrl();
  const pool = externalPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
  const shouldClose = !externalPool;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const migrationsDir = join(__dir, 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await pool.query(
        'SELECT 1 FROM _migrations WHERE filename = $1',
        [file]
      );
      if (rows.length) {
        console.log(`[skip] ${file} — already applied`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`[run]  ${file}`);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[done] ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    console.log('✅ All migrations complete.');
  } finally {
    if (shouldClose) await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
}
