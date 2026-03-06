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
    case "stadt":
      orderBy = "a.stadt ASC NULLS LAST, a.nachname ASC";
      break;
    case "name":
    default:
      orderBy = "a.nachname ASC, a.vorname ASC";
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

  const staedte = await query(`
    SELECT stadt, COUNT(*)::int AS cnt
    FROM aerzte
    WHERE stadt IS NOT NULL
    GROUP BY stadt
    ORDER BY cnt DESC
    LIMIT 15
  `) as { stadt: string; cnt: number }[];

  const bundeslaender = await query(`
    SELECT DISTINCT bundesland FROM aerzte WHERE bundesland IS NOT NULL ORDER BY bundesland
  `) as { bundesland: string }[];

  return (
    <main className="min-h-screen">
      {/* NAV */}
      <nav className="bg-[var(--navy)] px-10 h-[60px] flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-['Fraunces',serif] text-lg text-white font-semibold tracking-tight">
          Facharzt<span className="text-[#4dd9c0]">Register</span>
        </Link>
        <ul className="flex gap-8 list-none">
          <li><Link href="/" className="text-white/65 text-sm no-underline hover:text-white transition-colors">Verzeichnis</Link></li>
          <li><Link href="#warum" className="text-white/65 text-sm no-underline hover:text-white transition-colors">Warum keine Bewertungen?</Link></li>
          <li><Link href="#ueber" className="text-white/65 text-sm no-underline hover:text-white transition-colors">Über uns</Link></li>
        </ul>
      </nav>

      {/* HERO */}
      <div className="hero bg-[var(--navy)] px-10 pt-8 pb-12 relative overflow-hidden">
        <div className="max-w-[680px] mx-auto text-center">
          <h1 className="font-['Fraunces',serif] text-[clamp(26px,4vw,40px)] font-light text-white leading-[1.15] tracking-tight mb-3">
            Ist dein Chirurg <em className="italic text-[#4dd9c0]">wirklich</em> Facharzt?
          </h1>

          <p className="text-white/50 text-sm leading-relaxed max-w-[460px] mx-auto mb-6 font-light">
            Facharzttitel geprüft bei Ärztekammern, MedReg und ÖÄK. Kein Selbstmarketing. Keine Bewertungen.
          </p>

          <form method="GET" className="flex bg-white rounded-lg overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)] max-w-[540px] mx-auto">
            <input
              type="text"
              name="q"
              placeholder="Name oder Klinik suchen..."
              defaultValue={sp.q || ""}
              className="flex-1 px-4 py-3 border-none outline-none text-sm font-['DM_Sans',sans-serif] text-[var(--text)] placeholder:text-[var(--muted)]"
            />
            <div className="w-px bg-[var(--border)] my-2" />
            <select
              name="stadt"
              defaultValue={sp.stadt || ""}
              className="px-4 py-3 border-none outline-none text-sm font-['DM_Sans',sans-serif] text-[var(--text)] bg-transparent min-w-[140px]"
            >
              <option value="">Alle Städte</option>
              {staedte.map((s) => (
                <option key={s.stadt} value={s.stadt}>{s.stadt}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-[var(--teal)] text-white border-none px-6 text-sm font-medium font-['DM_Sans',sans-serif] cursor-pointer hover:bg-[#0a6855] transition-colors"
            >
              Suchen
            </button>
          </form>
        </div>
      </div>

      {/* STATS STRIP */}
      <StatsBar stats={stats} />

      {/* MAIN LAYOUT */}
      <div className="max-w-[1340px] mx-auto px-6 py-6 grid grid-cols-[200px_1fr] gap-6 items-start">
        {/* SIDEBAR */}
        <aside>
          <SearchFilters
            bundeslaender={bundeslaender.map((b) => b.bundesland)}
            currentParams={sp}
          />
        </aside>

        {/* RESULTS */}
        <div>
          {/* No Ratings Banner */}
          <div id="warum" className="bg-[var(--navy)] rounded-lg px-4 py-3 flex gap-3 items-center mb-4">
            <span className="text-base shrink-0">⚖️</span>
            <p className="text-xs text-white/65">
              <strong className="text-white font-medium">Keine Bewertungen.</strong>{" "}
              Unser einziges Qualitätsmerkmal ist der Ärztekammer-geprüfte Facharzttitel — den kann niemand kaufen.
            </p>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--muted)]">
              <strong className="text-[var(--text)] font-medium">{totalFiltered} Fachärzte</strong> gefunden · Seite {page} von {totalPages}
            </span>
            <form method="GET">
              {/* Preserve existing params */}
              {sp.q && <input type="hidden" name="q" value={sp.q} />}
              {sp.stadt && <input type="hidden" name="stadt" value={sp.stadt} />}
              {sp.land && <input type="hidden" name="land" value={sp.land} />}
              {sp.bundesland && <input type="hidden" name="bundesland" value={sp.bundesland} />}
              <select
                name="sort"
                defaultValue={sp.sort || "name"}
                className="py-1.5 px-3 border border-[var(--border)] rounded-lg text-[13px] font-['DM_Sans',sans-serif] text-[var(--text)] outline-none bg-white"
              >
                <option value="name">Name A–Z</option>
                <option value="neu">Neueste zuerst</option>
                <option value="stadt">Stadt</option>
              </select>
            </form>
          </div>

          {/* CARDS GRID */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {aerzte.map((arzt) => (
              <Link key={arzt.id} href={`/arzt/${arzt.seo_slug}`} className="no-underline text-inherit">
                <ArztCard arzt={arzt} />
              </Link>
            ))}
          </div>

          {aerzte.length === 0 && (
            <div className="text-center py-12 text-[var(--muted)]">
              Keine Fachärzte mit diesen Kriterien gefunden.
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1.5 mt-8">
              {page > 1 && (
                <Link
                  href={`/?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}
                  className="w-9 h-9 rounded-lg border border-[var(--border)] bg-white text-sm flex items-center justify-center text-[var(--text)] no-underline hover:border-[var(--teal)] hover:text-[var(--teal)] transition-all"
                >
                  ←
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
                    <span key={`dots-${i}`} className="px-2 text-[var(--muted)]">…</span>
                  ) : (
                    <Link
                      key={p}
                      href={`/?${new URLSearchParams({ ...sp, page: String(p) }).toString()}`}
                      className={`w-9 h-9 rounded-lg border text-sm flex items-center justify-center no-underline transition-all ${
                        p === page
                          ? "bg-[var(--teal)] border-[var(--teal)] text-white"
                          : "border-[var(--border)] bg-white text-[var(--text)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
              {page < totalPages && (
                <Link
                  href={`/?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}
                  className="w-9 h-9 rounded-lg border border-[var(--border)] bg-white text-sm flex items-center justify-center text-[var(--text)] no-underline hover:border-[var(--teal)] hover:text-[var(--teal)] transition-all"
                >
                  →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
