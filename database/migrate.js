/**
 * Morphic Studio — Migration runner
 * Runs all SQL files in database/migrations/ in order.
 * Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __dir = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Ensure migrations tracking table exists
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
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`[done] ${file}`);
  }

  await pool.end();
  console.log('✅ All migrations complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
