import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  initDb();
  const db = getDb();
  const { slug } = await params;

  const arzt = db.prepare(`
    SELECT a.*, k.name AS klinik_name, k.typ AS klinik_typ,
           k.website_url AS klinik_website, k.impressum_gmbh AS klinik_gmbh,
           k.tuev_zertifiziert AS klinik_tuev, k.fallzahlen_plastik AS klinik_fallzahlen,
           k.google_rating AS klinik_google_rating, k.google_reviews_count AS klinik_google_reviews
    FROM aerzte a
    LEFT JOIN kliniken k ON a.klinik_id = k.id
    WHERE a.seo_slug = ?
  `).get(slug);

  if (!arzt) {
    return NextResponse.json({ error: "Arzt nicht gefunden" }, { status: 404 });
  }

  const id = (arzt as Record<string, unknown>).id;

  const spezialisierungen = db.prepare(
    "SELECT kategorie, eingriff, erfahrungslevel FROM spezialisierungen WHERE arzt_id = ? ORDER BY kategorie, eingriff"
  ).all(id);

  const werdegang = db.prepare(
    "SELECT typ, institution, stadt, land, von_jahr, bis_jahr, beschreibung, verifiziert FROM werdegang WHERE arzt_id = ? ORDER BY von_jahr DESC"
  ).all(id);

  const mitgliedschaften = db.prepare(
    "SELECT gesellschaft, mitglied_seit_jahr, mitgliedsstatus, verifiziert, quelle_url FROM mitgliedschaften WHERE arzt_id = ?"
  ).all(id);

  const bewertungen = db.prepare(
    "SELECT plattform, score, max_score, anzahl_bewertungen FROM bewertungen WHERE arzt_id = ?"
  ).all(id);

  const promotion = db.prepare(
    "SELECT titel, thema, universitaet, jahr, verifiziert FROM promotionen WHERE arzt_id = ?"
  ).get(id);

  const preise = db.prepare(
    "SELECT eingriff, preis_von, preis_bis, waehrung, quelle FROM preise WHERE arzt_id = ? ORDER BY eingriff"
  ).all(id);

  return NextResponse.json({
    ...arzt as Record<string, unknown>,
    spezialisierungen,
    werdegang,
    mitgliedschaften,
    bewertungen,
    promotion,
    preise,
  });
}
