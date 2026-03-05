import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

/** Run a query and return all rows. */
export async function query(
  sql: string,
  params?: (string | number | boolean | null)[]
) {
  const result = await pool.query(sql, params);
  return result.rows;
}

/** Run a query and return the first row or null. */
export async function queryOne(
  sql: string,
  params?: (string | number | boolean | null)[]
) {
  const result = await pool.query(sql, params);
  return result.rows[0] ?? null;
}
