import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  initDb();
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS gesamt,
      SUM(ist_facharzt) AS fachaezte,
      COUNT(*) - SUM(ist_facharzt) AS ohne_facharzttitel,
      COUNT(DISTINCT stadt) AS staedte
    FROM aerzte
  `).get() as Record<string, number>;

  return NextResponse.json(stats);
}
