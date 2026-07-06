import pkg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { migrate } from './migrate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client, Pool } = pkg;

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env or provision PostgreSQL before running setup.');
  }
}

async function initializeDatabase() {
  requireDatabaseUrl();

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL.');

    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);

    await client.end();

    // Bring the database up to the full application schema, not just the base schema.
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      await migrate({ pool });
    } finally {
      await pool.end();
    }

    // Keep setup clean: schema/migrations only. Projects are created explicitly
    // through the New Project flow so users never inherit demo scripts or story data.

    console.log('✅ Morphic Studio database schema ready.');
  } catch (err) {
    try { await client.end(); } catch (_) { /* already closed */ }
    console.error('❌ Database setup error:', err.message);
    process.exit(1);
  }
}

initializeDatabase();
