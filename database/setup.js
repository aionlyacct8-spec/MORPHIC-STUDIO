import pkg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pkg;

async function initializeDatabase() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL.');

    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);

    // Seed a default project so the UI has something to show
    const existing = await client.query("SELECT id FROM projects LIMIT 1");
    if (existing.rows.length === 0) {
      const proj = await client.query(`
        INSERT INTO projects (title, description, genre, format, style)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `, ['The Last Echo', 'A cyberpunk noir about memory, identity, and survival in Neo-Veridia.', 'cyberpunk-noir', 'comic', 'neo-noir']);

      const projectId = proj.rows[0].id;

      await client.query(`
        INSERT INTO project_brain (project_id, story_bible, world_bible, memory_context)
        VALUES ($1, $2, $3, $4)
      `, [
        projectId,
        JSON.stringify({
          premise: 'In 2084, Arc-Runner Kael discovers his memories have been selectively erased by The Director — the architect of Neo-Veridia\'s surveillance state.',
          themes: ['identity', 'memory', 'surveillance', 'resistance'],
          tone: 'dark, tense, cinematic',
          acts: ['Awakening', 'The Descent', 'Reckoning']
        }),
        JSON.stringify({
          name: 'Neo-Veridia',
          era: '2084',
          type: 'sci-fi',
          description: 'A rain-soaked cyberpunk megacity stratified by class and technology.'
        }),
        'Project: The Last Echo. Genre: Cyberpunk noir. Setting: Neo-Veridia 2084. Protagonist: Kael (Arc-Runner). Antagonist: Viktor (The Director). Tone: Dark, tense, cinematic.'
      ]);

      console.log(`✅ Seeded default project (id: ${projectId})`);
    }

    console.log('✅ Morphic Studio database schema ready.');
  } catch (err) {
    console.error('❌ Database setup error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();
