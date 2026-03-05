import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const staedte = await query(`
    SELECT stadt, bundesland, COUNT(*)::int AS anzahl_aerzte
    FROM aerzte
    WHERE stadt IS NOT NULL
    GROUP BY stadt, bundesland
    ORDER BY anzahl_aerzte DESC
  `);

  return NextResponse.json(staedte);
}
