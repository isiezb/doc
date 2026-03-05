import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const eingriffe = await query(`
    SELECT eingriff, kategorie, COUNT(DISTINCT arzt_id)::int AS anzahl_aerzte
    FROM spezialisierungen
    GROUP BY eingriff, kategorie
    ORDER BY anzahl_aerzte DESC
  `);

  return NextResponse.json(eingriffe);
}
