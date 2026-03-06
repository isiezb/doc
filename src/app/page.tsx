import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import SearchFilters from "@/components/SearchFilters";
import ArztCard from "@/components/ArztCard";
import StatsBar from "@/components/StatsBar";

interface Arzt {
  id: number;
  vorname: string;
  nachname: string;
  titel: string;
  geschlecht: string;
  ist_facharzt: boolean;
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
  klinik_gmbh: boolean;
  eingriffe: string | null;
  source: string | null;
  verified: boolean;
  gkv_zugelassen: boolean | null;
}

interface SearchParams {
  q?: string;
  eingriff?: string;
  stadt?: string;
  bundesland?: string;
  land?: string;
  nur_fachaezte?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 50;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawSp = await searchParams;
  // Strip undefined values so URLSearchParams doesn't produce "key=undefined"
  const sp = Object.fromEntries(
    Object.entries(rawSp).filter(([, v]) => v !== undefined)
  ) as SearchParams;

  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;

  if (sp.q) {
    conditions.push(`(a.vorname || ' ' || a.nachname ILIKE $${idx} OR a.nachname ILIKE $${idx + 1})`);
    values.push(`%${sp.q}%`, `%${sp.q}%`);
    idx += 2;
  }
  if (sp.eingriff) {
    conditions.push(`a.id IN (SELECT arzt_id FROM spezialisierungen WHERE eingriff = $${idx})`);
    values.push(sp.eingriff);
    idx += 1;
  }
  if (sp.stadt) {
    conditions.push(`a.stadt = $${idx}`);
    values.push(sp.stadt);
    idx += 1;
  }
  if (sp.bundesland) {
    conditions.push(`a.bundesland = $${idx}`);
    values.push(sp.bundesland);
    idx += 1;
  }
  if (sp.land) {
    conditions.push(`a.land = $${idx}`);
    values.push(sp.land);
    idx += 1;
  }
  if (sp.nur_fachaezte === "1") {
    conditions.push("a.ist_facharzt = true");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const page = Math.max(1, parseInt(sp.page || "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let orderBy: string;
  switch (sp.sort) {
    case "erfahrung":
      orderBy = "a.facharzt_seit_jahr ASC NULLS LAST, a.approbation_jahr ASC";
      break;
    case "neu":
      orderBy = "a.id DESC";
      break;
    case "name":
      orderBy = "a.nachname ASC, a.vorname ASC";
      break;
    default:
      orderBy = "a.id DESC";
  }

  const aerzte = await query(`
    SELECT
      a.*,
      k.name AS klinik_name, k.typ AS klinik_typ, k.impressum_gmbh AS klinik_gmbh,
      (SELECT STRING_AGG(DISTINCT eingriff, ',') FROM spezialisierungen WHERE arzt_id = a.id) AS eingriffe
    FROM aerzte a
    LEFT JOIN kliniken k ON a.klinik_id = k.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `, values) as Arzt[];

  const filteredCount = await queryOne(`
    SELECT COUNT(*)::int AS total FROM aerzte a ${where}
  `, values) as { total: number };
  const totalFiltered = filteredCount.total;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

  const stats = await queryOne(`
    SELECT
      COUNT(*)::int AS gesamt,
      COUNT(*) FILTER (WHERE ist_facharzt)::int AS fachaezte,
      COUNT(*) FILTER (WHERE NOT ist_facharzt)::int AS ohne_facharzttitel,
      COUNT(DISTINCT stadt)::int AS staedte
    FROM aerzte
  `) as { gesamt: number; fachaezte: number; ohne_facharzttitel: number; staedte: number };

  const eingriffe = await query(`
    SELECT DISTINCT eingriff FROM spezialisierungen ORDER BY eingriff
  `) as { eingriff: string }[];

  const staedte = await query(`
    SELECT DISTINCT stadt FROM aerzte WHERE stadt IS NOT NULL ORDER BY stadt
  `) as { stadt: string }[];

  const bundeslaender = await query(`
    SELECT DISTINCT bundesland FROM aerzte WHERE bundesland IS NOT NULL ORDER BY bundesland
  `) as { bundesland: string }[];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href="/" className="inline-block mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Schönheitsarzt-Verzeichnis
            </h1>
          </Link>
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
              {totalFiltered} Aerzte gefunden (Seite {page} von {totalPages})
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

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Zurück
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
                  ) : (
                    <Link
                      key={p}
                      href={`/?${new URLSearchParams({ ...sp, page: String(p) }).toString()}`}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        p === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
              {page < totalPages && (
                <Link
                  href={`/?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Weiter
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
