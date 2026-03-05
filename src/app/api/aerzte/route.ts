import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  initDb();
  const db = getDb();
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

  if (q) {
    conditions.push("(a.vorname || ' ' || a.nachname LIKE ? OR a.nachname LIKE ?)");
    values.push(`%${q}%`, `%${q}%`);
  }
  if (eingriff) {
    conditions.push("a.id IN (SELECT arzt_id FROM spezialisierungen WHERE eingriff = ?)");
    values.push(eingriff);
  }
  if (stadt) {
    conditions.push("a.stadt = ?");
    values.push(stadt);
  }
  if (bundesland) {
    conditions.push("a.bundesland = ?");
    values.push(bundesland);
  }
  if (nurFachaezte) {
    conditions.push("a.ist_facharzt = 1");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy: string;
  switch (sort) {
    case "erfahrung":
      orderBy = "a.facharzt_seit_jahr ASC NULLS LAST, a.approbation_jahr ASC";
      break;
    case "bewertungen":
      orderBy = "bew_score DESC NULLS LAST";
      break;
    case "name":
    default:
      orderBy = "a.nachname ASC, a.vorname ASC";
  }

  const sql = `
    SELECT
      a.*,
      k.name AS klinik_name,
      k.typ AS klinik_typ,
      k.impressum_gmbh AS klinik_gmbh,
      (SELECT GROUP_CONCAT(DISTINCT eingriff) FROM spezialisierungen WHERE arzt_id = a.id) AS eingriffe,
      (SELECT ROUND(AVG(score / max_score * 5), 1) FROM bewertungen WHERE arzt_id = a.id) AS bew_score,
      (SELECT SUM(anzahl_bewertungen) FROM bewertungen WHERE arzt_id = a.id) AS bew_total
    FROM aerzte a
    LEFT JOIN kliniken k ON a.klinik_id = k.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);

  const aerzte = db.prepare(sql).all(...values);

  const countSql = `
    SELECT COUNT(*) as total
    FROM aerzte a
    ${where}
  `;
  const countValues = values.slice(0, -2);
  const { total } = db.prepare(countSql).get(...countValues) as { total: number };

  return NextResponse.json({ aerzte, total, limit, offset });
}
