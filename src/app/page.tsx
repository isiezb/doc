import Link from "next/link";
import { getDb, initDb } from "@/lib/db";
import SearchFilters from "@/components/SearchFilters";
import ArztCard from "@/components/ArztCard";
import StatsBar from "@/components/StatsBar";

interface Arzt {
  id: number;
  vorname: string;
  nachname: string;
  titel: string;
  geschlecht: string;
  ist_facharzt: number;
  facharzttitel: string | null;
  selbstbezeichnung: string;
  stadt: string;
  bundesland: string;
  facharzt_seit_jahr: number | null;
  approbation_jahr: number;
  land: string;
  seo_slug: string;
  klinik_name: string | null;
  klinik_typ: string | null;
  klinik_gmbh: number;
  eingriffe: string | null;
}

interface SearchParams {
  q?: string;
  eingriff?: string;
  stadt?: string;
  bundesland?: string;
  nur_fachaezte?: string;
  sort?: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  initDb();
  const db = getDb();
  const sp = await searchParams;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (sp.q) {
    conditions.push("(a.vorname || ' ' || a.nachname LIKE ? OR a.nachname LIKE ?)");
    values.push(`%${sp.q}%`, `%${sp.q}%`);
  }
  if (sp.eingriff) {
    conditions.push("a.id IN (SELECT arzt_id FROM spezialisierungen WHERE eingriff = ?)");
    values.push(sp.eingriff);
  }
  if (sp.stadt) {
    conditions.push("a.stadt = ?");
    values.push(sp.stadt);
  }
  if (sp.bundesland) {
    conditions.push("a.bundesland = ?");
    values.push(sp.bundesland);
  }
  if (sp.nur_fachaezte === "1") {
    conditions.push("a.ist_facharzt = 1");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy: string;
  switch (sp.sort) {
    case "erfahrung":
      orderBy = "a.facharzt_seit_jahr ASC NULLS LAST, a.approbation_jahr ASC";
      break;
    default:
      orderBy = "a.nachname ASC, a.vorname ASC";
  }

  const aerzte = db.prepare(`
    SELECT
      a.*,
      k.name AS klinik_name, k.typ AS klinik_typ, k.impressum_gmbh AS klinik_gmbh,
      (SELECT GROUP_CONCAT(DISTINCT eingriff) FROM spezialisierungen WHERE arzt_id = a.id) AS eingriffe
    FROM aerzte a
    LEFT JOIN kliniken k ON a.klinik_id = k.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT 50
  `).all(...values) as Arzt[];

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS gesamt,
      SUM(ist_facharzt) AS fachaezte,
      COUNT(*) - SUM(ist_facharzt) AS ohne_facharzttitel,
      COUNT(DISTINCT stadt) AS staedte
    FROM aerzte
  `).get() as { gesamt: number; fachaezte: number; ohne_facharzttitel: number; staedte: number };

  const eingriffe = db.prepare(`
    SELECT DISTINCT eingriff FROM spezialisierungen ORDER BY eingriff
  `).all() as { eingriff: string }[];

  const staedte = db.prepare(`
    SELECT DISTINCT stadt FROM aerzte ORDER BY stadt
  `).all() as { stadt: string }[];

  const bundeslaender = db.prepare(`
    SELECT DISTINCT bundesland FROM aerzte ORDER BY bundesland
  `).all() as { bundesland: string }[];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schoenheitsarzt-Verzeichnis
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Facharzt oder Fantasietitel? Wir zeigen die Wahrheit.
          </p>

          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="q"
              placeholder="Name suchen..."
              defaultValue={sp.q || ""}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <select
              name="eingriff"
              defaultValue={sp.eingriff || ""}
              className="px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Alle Eingriffe</option>
              {eingriffe.map((e) => (
                <option key={e.eingriff} value={e.eingriff}>
                  {e.eingriff}
                </option>
              ))}
            </select>
            <select
              name="stadt"
              defaultValue={sp.stadt || ""}
              className="px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Alle Staedte</option>
              {staedte.map((s) => (
                <option key={s.stadt} value={s.stadt}>
                  {s.stadt}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Suchen
            </button>
          </form>
        </div>
      </header>

      <StatsBar stats={stats} />

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          <SearchFilters
            bundeslaender={bundeslaender.map((b) => b.bundesland)}
            currentParams={sp}
          />
        </aside>

        <section className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {aerzte.length} Aerzte gefunden
            </p>
          </div>

          <div className="space-y-4">
            {aerzte.map((arzt) => (
              <Link key={arzt.id} href={`/arzt/${arzt.seo_slug}`} className="block">
                <ArztCard arzt={arzt} />
              </Link>
            ))}
          </div>

          {aerzte.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Keine Aerzte mit diesen Kriterien gefunden.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
