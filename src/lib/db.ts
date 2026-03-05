import { Pool } from "pg";

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Strip brackets from password if present (Supabase uses [password] format)
const DATABASE_URL = rawUrl.replace(
  /\/\/([^:]+):\[([^\]]+)\]@/,
  "//$1:$2@"
);

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
