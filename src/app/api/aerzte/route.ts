import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const q = params.get("q");
  const eingriff = params.get("eingriff");
  const stadt = params.get("stadt");
  const bundesland = params.get("bundesland");
  const nurFachaezte = params.get("nur_fachaezte") === "1";
  const sort = params.get("sort") || "name";
  const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
  const offset = parseInt(params.get("offset") || "0");

  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;

  if (q) {
    conditions.push(`(a.vorname || ' ' || a.nachname ILIKE $${idx} OR a.nachname ILIKE $${idx + 1})`);
    values.push(`%${q}%`, `%${q}%`);
    idx += 2;
  }
  if (eingriff) {
    conditions.push(`a.id IN (SELECT arzt_id FROM spezialisierungen WHERE eingriff = $${idx})`);
    values.push(eingriff);
    idx += 1;
  }
  if (stadt) {
    conditions.push(`a.stadt = $${idx}`);
    values.push(stadt);
    idx += 1;
  }
  if (bundesland) {
    conditions.push(`a.bundesland = $${idx}`);
    values.push(bundesland);
    idx += 1;
  }
  if (nurFachaezte) {
    conditions.push("a.ist_facharzt = true");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy: string;
  switch (sort) {
    case "erfahrung":
      orderBy = "a.facharzt_seit_jahr ASC NULLS LAST, a.approbation_jahr ASC";
      break;
    case "name":
    default:
      orderBy = "a.nachname ASC, a.vorname ASC";
  }

  const aerzte = await query(`
    SELECT
      a.*,
      k.name AS klinik_name,
      k.typ AS klinik_typ,
      k.impressum_gmbh AS klinik_gmbh,
      (SELECT STRING_AGG(DISTINCT eingriff, ',') FROM spezialisierungen WHERE arzt_id = a.id) AS eingriffe
    FROM aerzte a
    LEFT JOIN kliniken k ON a.klinik_id = k.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${idx} OFFSET $${idx + 1}
  `, [...values, limit, offset]);

  const countResult = await queryOne(`
    SELECT COUNT(*)::int as total FROM aerzte a ${where}
  `, values);

  const total = (countResult as Record<string, unknown>)?.total ?? 0;

  return NextResponse.json({ aerzte, total, limit, offset });
}
