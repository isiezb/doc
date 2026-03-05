import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET() {
  const stats = await queryOne(`
    SELECT
      COUNT(*)::int AS gesamt,
      COUNT(*) FILTER (WHERE ist_facharzt)::int AS fachaezte,
      COUNT(*) FILTER (WHERE NOT ist_facharzt)::int AS ohne_facharzttitel,
      COUNT(DISTINCT stadt)::int AS staedte
    FROM aerzte
  `);

  return NextResponse.json(stats);
}
