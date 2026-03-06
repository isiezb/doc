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
      COUNT(DISTINCT stadt)::int AS staedte,
      COUNT(DISTINCT land)::int AS laender
    FROM aerzte
  `) as { gesamt: number; fachaezte: number; ohne_facharzttitel: number; staedte: number; laender: number };

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

  const hasActiveFilters = sp.q || sp.stadt || sp.land || sp.bundesland || sp.nur_fachaezte || sp.eingriff;

  return (
    <main className="min-h-screen flex flex-col">
      {/* NAV */}
      <nav className="bg-[var(--navy)] px-4 sm:px-10 h-[56px] flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-['Fraunces',serif] text-lg text-white font-semibold tracking-tight">
          Facharzt<span className="text-[#4dd9c0]">Register</span>
        </Link>
        <ul className="hidden sm:flex gap-6 list-none">
          <li><Link href="/" className="text-white/65 text-[13px] no-underline hover:text-white transition-colors">Verzeichnis</Link></li>
          <li><Link href="#warum" className="text-white/65 text-[13px] no-underline hover:text-white transition-colors">Unsere Mission</Link></li>
        </ul>
      </nav>

      {/* HERO */}
      <div className="hero bg-[var(--navy)] px-4 sm:px-10 pt-8 pb-12 relative overflow-hidden">
        <div className="max-w-[680px] mx-auto text-center">
          <h1 className="font-['Fraunces',serif] text-[clamp(24px,4vw,38px)] font-light text-white leading-[1.15] tracking-tight mb-3">
            Ist dein Chirurg <em className="italic text-[#4dd9c0]">wirklich</em> Facharzt?
          </h1>

          <p className="text-white/50 text-[13px] leading-relaxed max-w-[460px] mx-auto mb-5 font-light">
            Facharzttitel geprüft bei Ärztekammern, MedReg und ÖÄK. Kein Selbstmarketing. Keine Bewertungen.
          </p>

          <form method="GET" className="flex flex-col sm:flex-row bg-white rounded-lg overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)] max-w-[540px] mx-auto">
            <input
              type="text"
              name="q"
              placeholder="Name oder Klinik suchen..."
              defaultValue={sp.q || ""}
              className="flex-1 px-4 py-3 border-none outline-none text-sm font-['DM_Sans',sans-serif] text-[var(--text)] placeholder:text-[var(--muted)]"
            />
            <div className="hidden sm:block w-px bg-[var(--border)] my-2" />
            <select
              name="stadt"
              defaultValue={sp.stadt || ""}
              className="px-4 py-3 border-none sm:border-t-0 border-t border-[var(--border)] outline-none text-sm font-['DM_Sans',sans-serif] text-[var(--text)] bg-transparent min-w-[140px]"
            >
              <option value="">Alle Städte</option>
              {staedte.map((s) => (
                <option key={s.stadt} value={s.stadt}>{s.stadt} ({s.cnt})</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-[var(--teal)] text-white border-none px-6 py-3 sm:py-0 text-sm font-medium font-['DM_Sans',sans-serif] cursor-pointer hover:bg-[#0a6855] transition-colors"
            >
              Suchen
            </button>
          </form>
        </div>
      </div>

      {/* STATS STRIP */}
      <StatsBar stats={stats} />

      {/* MISSION SECTION */}
      <div id="warum" className="bg-white border-b border-[var(--border)]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-10 py-8 sm:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--navy)] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#4dd9c0]">
                  <path d="M10 1l2.39 4.84L18 6.71l-4 3.9.94 5.5L10 13.47 5.06 16.1 6 10.6l-4-3.9 5.61-.87L10 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-['Fraunces',serif] text-sm font-semibold text-[var(--text)] mb-1">Keine Bewertungen. Absichtlich.</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Sternebewertungen sind leicht manipulierbar und sagen nichts über die fachliche Qualifikation aus. Wir verzichten bewusst darauf.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--navy)] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#4dd9c0]">
                  <path d="M16.5 3.5L7.5 12.5 3.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="1" y="1" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div>
                <h3 className="font-['Fraunces',serif] text-sm font-semibold text-[var(--text)] mb-1">Nur geprüfte Facharzttitel</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Jeder Eintrag basiert auf offiziellen Ärztekammer-Daten. Der Titel &bdquo;Facharzt für Plastische und Ästhetische Chirurgie&ldquo; ist gesetzlich geschützt &mdash; den kann niemand kaufen.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--navy)] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#4dd9c0]">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 5v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-['Fraunces',serif] text-sm font-semibold text-[var(--text)] mb-1">Transparenz statt Marketing</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Kein Arzt kann sich hier besser darstellen oder für Sichtbarkeit bezahlen. Alle Daten stammen aus öffentlichen, unabhängigen Quellen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 py-5 flex-1 w-full">
        <div className="flex gap-5 items-start">
          {/* SIDEBAR — hidden on mobile */}
          <aside className="hidden md:block w-[200px] shrink-0 sticky top-[68px]">
            <SearchFilters
              bundeslaender={bundeslaender.map((b) => b.bundesland)}
              currentParams={sp}
            />
          </aside>

          {/* RESULTS */}
          <div className="flex-1 min-w-0">

            {/* Mobile Filters */}
            <details className="md:hidden mb-4 bg-white rounded-lg border border-[var(--border)]">
              <summary className="px-4 py-2.5 text-[12px] font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer">
                Filter {hasActiveFilters ? "(aktiv)" : ""}
              </summary>
              <div className="px-2 pb-2">
                <SearchFilters
                  bundeslaender={bundeslaender.map((b) => b.bundesland)}
                  currentParams={sp}
                />
              </div>
            </details>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="text-sm text-[var(--muted)]">
                <strong className="text-[var(--text)] font-medium">{totalFiltered.toLocaleString("de-DE")}</strong> Fachärzte
                {totalPages > 1 && <span className="hidden sm:inline"> · Seite {page}/{totalPages}</span>}
              </span>
              <form method="GET" className="shrink-0">
                {sp.q && <input type="hidden" name="q" value={sp.q} />}
                {sp.stadt && <input type="hidden" name="stadt" value={sp.stadt} />}
                {sp.land && <input type="hidden" name="land" value={sp.land} />}
                {sp.bundesland && <input type="hidden" name="bundesland" value={sp.bundesland} />}
                {sp.nur_fachaezte && <input type="hidden" name="nur_fachaezte" value={sp.nur_fachaezte} />}
                <select
                  name="sort"
                  defaultValue={sp.sort || "name"}
                  className="py-1.5 px-3 border border-[var(--border)] rounded-lg text-[13px] font-['DM_Sans',sans-serif] text-[var(--text)] outline-none bg-white"
                >
                  <option value="name">Name A-Z</option>
                  <option value="neu">Neueste zuerst</option>
                  <option value="stadt">Stadt</option>
                </select>
              </form>
            </div>

            {/* CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aerzte.map((arzt) => (
                <Link key={arzt.id} href={`/arzt/${arzt.seo_slug}`} className="no-underline text-inherit">
                  <ArztCard arzt={arzt} />
                </Link>
              ))}
            </div>

            {aerzte.length === 0 && (
              <div className="text-center py-16 text-[var(--muted)]">
                <div className="text-3xl mb-3">&#128269;</div>
                <p className="text-sm">Keine Fachärzte mit diesen Kriterien gefunden.</p>
                {hasActiveFilters && (
                  <Link href="/" className="text-sm text-[var(--teal)] mt-2 inline-block no-underline hover:underline">
                    Filter zurücksetzen
                  </Link>
                )}
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
                    &#8592;
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
                      <span key={`dots-${i}`} className="px-2 text-[var(--muted)]">&#8230;</span>
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
                    &#8594;
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* WARUM SECTION — full explanation */}
      <section className="bg-[var(--sand)] border-t border-[var(--border)] px-4 sm:px-10 py-10 sm:py-14">
        <div className="max-w-[720px] mx-auto">
          <h2 className="font-['Fraunces',serif] text-xl sm:text-2xl font-semibold text-[var(--text)] text-center mb-6">
            Warum keine Bewertungen?
          </h2>
          <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
            <p>
              Plastische Chirurgie ist ein Bereich, in dem Patienten oft unsicher sind, wem sie vertrauen können. Viele Portale bieten Sternebewertungen an &mdash; doch diese sind leicht manipulierbar: Bewertungen können gekauft, negative gelöscht und Profile gegen Bezahlung hervorgehoben werden.
            </p>
            <p>
              <strong className="text-[var(--text)]">Wir gehen einen anderen Weg.</strong> Unser einziges Qualitätskriterium ist der Facharzttitel. Der Titel &bdquo;Facharzt für Plastische und Ästhetische Chirurgie&ldquo; ist in Deutschland gesetzlich geschützt und erfordert eine mindestens 6-jährige Weiterbildung nach dem Medizinstudium. Er wird von der zuständigen Ärztekammer verliehen und ist öffentlich überprüfbar.
            </p>
            <p>
              Jeder Arzt in diesem Verzeichnis wurde anhand offizieller Ärztekammer-Daten verifiziert. Kein Arzt kann sich besser darstellen, für Sichtbarkeit bezahlen oder seine Position beeinflussen. Das macht FacharztRegister zum transparentesten Verzeichnis für Plastische Chirurgen im deutschsprachigen Raum.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="ueber" className="bg-[var(--navy)] px-4 sm:px-10 py-8 mt-auto">
        <div className="max-w-[1340px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-['Fraunces',serif] text-white font-semibold tracking-tight">
                Facharzt<span className="text-[#4dd9c0]">Register</span>
              </div>
              <p className="text-white/40 text-xs mt-1 max-w-md">
                Das transparente Verzeichnis für Plastische Chirurgen in Deutschland. Facharzttitel geprüft anhand offizieller Ärztekammer-Quellen.
              </p>
            </div>
            <div className="flex gap-6 text-white/40 text-xs">
              <Link href="/" className="no-underline text-white/40 hover:text-white/70 transition-colors">Verzeichnis</Link>
              <Link href="#warum" className="no-underline text-white/40 hover:text-white/70 transition-colors">Unsere Mission</Link>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-white/25 text-[11px]">
            Alle Daten stammen aus öffentlichen Ärztekammer-Verzeichnissen und offiziellen Quellen. Keine Gewähr.
          </div>
        </div>
      </footer>
    </main>
  );
}
