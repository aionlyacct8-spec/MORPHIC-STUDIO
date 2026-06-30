import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Client } = pkg;

// Connect using the URL Replit automatically generated for you
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function initializeDatabase() {
  try {
    await client.connect();
    console.log("🔌 Connected to PostgreSQL Database.");

    // 1. Build the Shared Asset Library: Characters
    await client.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        appearance TEXT,
        personality TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Build the Script Studio Memory
    await client.query(`
      CREATE TABLE IF NOT EXISTS scripts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Build the Storyboard Memory (Linked to Scripts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS storyboards (
        id SERIAL PRIMARY KEY,
        script_id INTEGER REFERENCES scripts(id),
        panel_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Morphic Studio Database Schema created successfully!");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  } finally {
    await client.end();
  }
}

initializeDatabase();