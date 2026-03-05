import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  initDb();
  const db = getDb();

  const eingriffe = db.prepare(`
    SELECT eingriff, kategorie, COUNT(DISTINCT arzt_id) AS anzahl_aerzte
    FROM spezialisierungen
    GROUP BY eingriff
    ORDER BY anzahl_aerzte DESC
  `).all();

  return NextResponse.json(eingriffe);
}
