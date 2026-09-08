import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:admin123@localhost:5432/project_ai_planner';

// Singleton PostgreSQL Connection Pool
const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    // console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res.rows as T[];
}

export async function testPostgresConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await pool.query('SELECT NOW() as now, current_database() as db');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
