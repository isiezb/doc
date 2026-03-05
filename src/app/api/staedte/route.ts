import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  initDb();
  const db = getDb();

  const staedte = db.prepare(`
    SELECT stadt, bundesland, COUNT(*) AS anzahl_aerzte
    FROM aerzte
    GROUP BY stadt
    ORDER BY anzahl_aerzte DESC
  `).all();

  return NextResponse.json(staedte);
}
