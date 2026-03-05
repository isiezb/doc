import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const arzt = await queryOne(`
    SELECT a.*, k.name AS klinik_name, k.typ AS klinik_typ,
           k.website_url AS klinik_website, k.impressum_gmbh AS klinik_gmbh,
           k.tuev_zertifiziert AS klinik_tuev, k.fallzahlen_plastik AS klinik_fallzahlen,
           k.google_rating AS klinik_google_rating, k.google_reviews_count AS klinik_google_reviews
    FROM aerzte a
    LEFT JOIN kliniken k ON a.klinik_id = k.id
    WHERE a.seo_slug = $1
  `, [slug]);

  if (!arzt) {
    return NextResponse.json({ error: "Arzt nicht gefunden" }, { status: 404 });
  }

  const id = (arzt as Record<string, unknown>).id as number;

  const spezialisierungen = await query(
    "SELECT kategorie, eingriff, erfahrungslevel FROM spezialisierungen WHERE arzt_id = $1 ORDER BY kategorie, eingriff",
    [id]
  );

  const werdegang = await query(
    "SELECT typ, institution, stadt, land, von_jahr, bis_jahr, beschreibung, verifiziert FROM werdegang WHERE arzt_id = $1 ORDER BY von_jahr DESC",
    [id]
  );

  const mitgliedschaften = await query(
    "SELECT gesellschaft, mitglied_seit_jahr, mitgliedsstatus, verifiziert, quelle_url FROM mitgliedschaften WHERE arzt_id = $1",
    [id]
  );

  const promotion = await queryOne(
    "SELECT titel, thema, universitaet, jahr, verifiziert FROM promotionen WHERE arzt_id = $1",
    [id]
  );

  const preise = await query(
    "SELECT eingriff, preis_von, preis_bis, waehrung, quelle FROM preise WHERE arzt_id = $1 ORDER BY eingriff",
    [id]
  );

  return NextResponse.json({
    ...arzt as Record<string, unknown>,
    spezialisierungen,
    werdegang,
    mitgliedschaften,
    promotion,
    preise,
  });
}
