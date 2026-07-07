import pkg from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { getPgPoolConfig } from '../../database/pgOptions.js';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool(getPgPoolConfig({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}));

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error', { message: err.message });
});

// Convenience: run a parameterised query
export async function query(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

// Convenience: run multiple queries in one transaction
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
