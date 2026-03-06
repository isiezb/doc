import Link from "next/link";
import { notFound } from "next/navigation";
import { query, queryOne } from "@/lib/db";

interface Spezialisierung {
  kategorie: string;
  eingriff: string;
  erfahrungslevel: string;
}

interface WerdegangEntry {
  typ: string;
  institution: string;
  stadt: string;
  land: string;
  von_jahr: number;
  bis_jahr: number | null;
  beschreibung: string;
  verifiziert: boolean;
}

interface Mitgliedschaft {
  gesellschaft: string;
  mitglied_seit_jahr: number;
  mitgliedsstatus: string;
  verifiziert: boolean;
  quelle_url: string | null;
}

interface Preis {
  eingriff: string;
  preis_von: number;
  preis_bis: number;
  waehrung: string;
  quelle: string;
}

interface Promotion {
  titel: string;
  thema: string;
  universitaet: string;
  jahr: number;
  verifiziert: boolean;
}

interface ArztProfile {
  id: number;
  vorname: string;
  nachname: string;
  titel: string;
  geschlecht: string;
  ist_facharzt: boolean;
  facharzttitel: string | null;
  selbstbezeichnung: string;
  approbation_verifiziert: boolean;
  kammer_id: string | null;
  approbation_jahr: number;
  facharzt_seit_jahr: number | null;
  position: string;
  stadt: string;
  bundesland: string;
  plz: string;
  strasse: string | null;
  seo_slug: string;
  website_url: string | null;
  telefon: string | null;
  email: string | null;
  fax: string | null;
  schwerpunkte: string | null;
  land: string;
  klinik_name: string | null;
  klinik_typ: string | null;
  klinik_website: string | null;
  klinik_gmbh: boolean;
  klinik_tuev: boolean;
  klinik_fallzahlen: number | null;
  source: string | null;
  verified: boolean;
  gkv_zugelassen: boolean | null;
}

const KATEGORIE_LABELS: Record<string, string> = {
  brust: "Brust",
  gesicht: "Gesicht",
  koerper: "Körper",
  minimal_invasiv: "Minimal-invasiv",
};

const LEVEL_COLORS: Record<string, string> = {
  spezialist: "bg-[var(--teal-light)] text-[var(--teal)]",
  fortgeschritten: "bg-blue-50 text-blue-700",
  basis: "bg-[var(--sand)] text-[var(--muted)]",
};

const TYP_LABELS: Record<string, string> = {
  studium: "Studium",
  klinik: "Klinische Tätigkeit",
  weiterbildung: "Weiterbildung",
  promotion: "Promotion",
  zertifikat: "Zertifikat",
};

const AVATAR_COLORS = ["#1a3050", "#2d4a6b", "#0d7c66", "#1e4d7b", "#3d5a80", "#0a5c4f"];

export default async function ArztProfilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const arzt = await queryOne(`
    SELECT a.*, k.name AS klinik_name, k.typ AS klinik_typ,
           k.website_url AS klinik_website, k.impressum_gmbh AS klinik_gmbh,
           k.tuev_zertifiziert AS klinik_tuev, k.fallzahlen_plastik AS klinik_fallzahlen
    FROM aerzte a
    LEFT JOIN kliniken k ON a.klinik_id = k.id
    WHERE a.seo_slug = $1
  `, [slug]) as ArztProfile | null;

  if (!arzt) notFound();

  const spezialisierungen = await query(
    "SELECT kategorie, eingriff, erfahrungslevel FROM spezialisierungen WHERE arzt_id = $1 ORDER BY kategorie, eingriff",
    [arzt.id]
  ) as Spezialisierung[];

  const werdegang = await query(
    "SELECT typ, institution, stadt, land, von_jahr, bis_jahr, beschreibung, verifiziert FROM werdegang WHERE arzt_id = $1 ORDER BY von_jahr DESC",
    [arzt.id]
  ) as WerdegangEntry[];

  const mitgliedschaften = await query(
    "SELECT gesellschaft, mitglied_seit_jahr, mitgliedsstatus, verifiziert, quelle_url FROM mitgliedschaften WHERE arzt_id = $1",
    [arzt.id]
  ) as Mitgliedschaft[];

  const promotion = await queryOne(
    "SELECT titel, thema, universitaet, jahr, verifiziert FROM promotionen WHERE arzt_id = $1",
    [arzt.id]
  ) as Promotion | null;

  const preise = await query(
    "SELECT eingriff, preis_von, preis_bis, waehrung, quelle FROM preise WHERE arzt_id = $1 ORDER BY eingriff",
    [arzt.id]
  ) as Preis[];

  const fullName = [arzt.titel, arzt.vorname, arzt.nachname].filter(Boolean).join(" ");
  const initials = `${arzt.vorname?.[0] || ""}${arzt.nachname?.[0] || ""}`;
  const avatarColor = AVATAR_COLORS[(arzt.id || 0) % AVATAR_COLORS.length];

  const spezGrouped: Record<string, Spezialisierung[]> = {};
  for (const s of spezialisierungen) {
    if (!spezGrouped[s.kategorie]) spezGrouped[s.kategorie] = [];
    spezGrouped[s.kategorie].push(s);
  }

  const hasDetailedData = spezialisierungen.length > 0 || werdegang.length > 0 || mitgliedschaften.length > 0 || promotion || preise.length > 0;
  const landLabel = arzt.land === "DE" ? "Deutschland" : arzt.land === "AT" ? "Österreich" : arzt.land === "CH" ? "Schweiz" : arzt.land;
  const hasContact = arzt.telefon || arzt.email || arzt.website_url;
  const subtitle = arzt.selbstbezeichnung || arzt.facharzttitel || "Plastische Chirurgie";
  const locationLine = [arzt.stadt, landLabel].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen flex flex-col bg-[var(--sand)]">
      {/* Hero header with navy background */}
      <div className="bg-[var(--navy)]">
        {/* Nav */}
        <nav className="max-w-[900px] mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between">
          <Link href="/" className="font-['Fraunces',serif] text-lg text-white font-semibold tracking-tight no-underline">
            Facharzt<span className="text-[#4dd9c0]">Register</span>
          </Link>
        </nav>

        {/* Back + Profile hero */}
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/50 text-sm no-underline hover:text-white transition-colors mb-6"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Alle Fachärzte
          </Link>

          <div className="flex items-center gap-4 sm:gap-5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-white font-['Fraunces',serif] text-xl sm:text-2xl font-semibold flex items-center justify-center shrink-0 ring-2 ring-white/10"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-semibold text-white leading-tight">
                {fullName}
              </h1>
              <p className="text-white/50 text-sm mt-1">{subtitle}</p>
              {locationLine && (
                <p className="text-white/35 text-sm mt-0.5">{locationLine}</p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4 ml-0 sm:ml-[100px]">
            {arzt.verified && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-[#4dd9c0] text-xs font-medium py-1.5 px-3 rounded-full backdrop-blur-sm">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                  <path d="M10 3L5 9 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Verifiziert
              </span>
            )}
            {arzt.gkv_zugelassen === true && (
              <span className="inline-flex items-center text-xs font-medium py-1.5 px-3 rounded-full bg-white/10 text-amber-300">
                Kassenärztlich zugelassen
              </span>
            )}
            {arzt.gkv_zugelassen === false && (
              <span className="inline-flex items-center text-xs font-medium py-1.5 px-3 rounded-full bg-white/10 text-white/60">
                Privatärztlich
              </span>
            )}
            {arzt.schwerpunkte && (
              <span className="inline-flex items-center text-xs font-medium py-1.5 px-3 rounded-full bg-white/10 text-white/60">
                {arzt.schwerpunkte}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 flex-1 w-full -mt-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left column: contact + location */}
          <div className="md:col-span-1 space-y-4">
            {/* Contact */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-5">
              <h3 className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Kontakt</h3>
              {hasContact ? (
                <div className="space-y-3">
                  {arzt.telefon && (
                    <a href={`tel:${arzt.telefon}`} className="flex items-start gap-2.5 text-sm text-[var(--text)] no-underline hover:text-[var(--teal)] transition-colors group">
                      <span className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center shrink-0 group-hover:bg-[var(--teal)] group-hover:text-white transition-colors">
                        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[var(--teal)] group-hover:text-white">
                          <path d="M6.5 2H4a1 1 0 00-1 1v1.5a9.5 9.5 0 008.5 8.5H13a1 1 0 001-1v-2.5l-3-1.5-1 1.5a6 6 0 01-4-4L7.5 4 6.5 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span className="pt-1.5">{arzt.telefon}</span>
                    </a>
                  )}
                  {arzt.email && (
                    <a href={`mailto:${arzt.email}`} className="flex items-start gap-2.5 text-sm text-[var(--text)] no-underline hover:text-[var(--teal)] transition-colors group truncate">
                      <span className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center shrink-0 group-hover:bg-[var(--teal)] group-hover:text-white transition-colors">
                        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[var(--teal)] group-hover:text-white">
                          <rect x="2" y="3.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M2 4.5l6 4 6-4" stroke="currentColor" strokeWidth="1.2"/>
                        </svg>
                      </span>
                      <span className="pt-1.5 truncate">{arzt.email}</span>
                    </a>
                  )}
                  {arzt.website_url && (
                    <a href={arzt.website_url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 text-sm text-[var(--text)] no-underline hover:text-[var(--teal)] transition-colors group">
                      <span className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center shrink-0 group-hover:bg-[var(--teal)] group-hover:text-white transition-colors">
                        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[var(--teal)] group-hover:text-white">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M2 8h12M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12" stroke="currentColor" strokeWidth="1.2"/>
                        </svg>
                      </span>
                      <span className="pt-1.5">Website besuchen</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)] leading-relaxed">Noch keine Kontaktdaten vorhanden.</p>
              )}
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-5">
              <h3 className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Standort</h3>
              <div className="space-y-1 text-sm">
                {arzt.strasse && <p className="text-[var(--text)]">{arzt.strasse}</p>}
                {(arzt.plz || arzt.stadt) && (
                  <p className="text-[var(--text)]">{[arzt.plz, arzt.stadt].filter(Boolean).join(" ")}</p>
                )}
                {arzt.bundesland && <p className="text-[var(--muted)]">{arzt.bundesland}</p>}
                <p className="text-[var(--muted)]">{landLabel}</p>
              </div>
              {arzt.klinik_name && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Praxis / Klinik</p>
                  <p className="text-sm text-[var(--text)] font-medium">{arzt.klinik_name}</p>
                </div>
              )}
            </div>

            {/* Back to search (prominent on sidebar) */}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--navy)] text-white text-sm font-medium rounded-xl no-underline hover:bg-[var(--navy-mid)] transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Alle Fachärzte ansehen
            </Link>
          </div>

          {/* Right column: data cards */}
          <div className="md:col-span-2 space-y-4">
            {/* Basisdaten */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
              <h2 className="font-['Fraunces',serif] text-base font-semibold text-[var(--text)] mb-4">Basisdaten</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {arzt.facharzttitel && (
                  <div className="col-span-2">
                    <p className="text-[var(--muted)] text-[11px] uppercase tracking-wider mb-0.5">Facharzttitel</p>
                    <p className="text-[var(--text)] font-medium">{arzt.facharzttitel}</p>
                  </div>
                )}
                <div>
                  <p className="text-[var(--muted)] text-[11px] uppercase tracking-wider mb-0.5">Land</p>
                  <p className="text-[var(--text)]">{landLabel}</p>
                </div>
                {arzt.facharzt_seit_jahr && (
                  <div>
                    <p className="text-[var(--muted)] text-[11px] uppercase tracking-wider mb-0.5">Facharzt seit</p>
                    <p className="text-[var(--text)]">{arzt.facharzt_seit_jahr}</p>
                  </div>
                )}
                {arzt.approbation_jahr && (
                  <div>
                    <p className="text-[var(--muted)] text-[11px] uppercase tracking-wider mb-0.5">Approbation</p>
                    <p className="text-[var(--text)]">{arzt.approbation_jahr}</p>
                  </div>
                )}
                {arzt.kammer_id && (
                  <div>
                    <p className="text-[var(--muted)] text-[11px] uppercase tracking-wider mb-0.5">Kammer-ID</p>
                    <p className="text-[var(--text)] font-mono text-xs">{arzt.kammer_id}</p>
                  </div>
                )}
                {arzt.position && (
                  <div>
                    <p className="text-[var(--muted)] text-[11px] uppercase tracking-wider mb-0.5">Position</p>
                    <p className="text-[var(--text)]">{arzt.position}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info note when limited data */}
            {!hasDetailedData && (
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-5 py-4 text-sm text-blue-700 leading-relaxed">
                Für diesen Eintrag liegen derzeit nur Basisdaten vor. Weitere Informationen werden laufend ergänzt.
              </div>
            )}

            {/* Spezialisierungen */}
            {spezialisierungen.length > 0 && (
              <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
                <h2 className="font-['Fraunces',serif] text-base font-semibold text-[var(--text)] mb-4">Spezialisierungen</h2>
                <div className="space-y-4">
                  {Object.entries(spezGrouped).map(([kat, items]) => (
                    <div key={kat}>
                      <h3 className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
                        {KATEGORIE_LABELS[kat] || kat}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map((s) => (
                          <span
                            key={s.eingriff}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                              LEVEL_COLORS[s.erfahrungslevel] || "bg-[var(--sand)] text-[var(--muted)]"
                            }`}
                          >
                            {s.eingriff}
                            <span className="ml-1.5 opacity-70">({s.erfahrungslevel})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Werdegang Timeline */}
            {werdegang.length > 0 && (
              <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
                <h2 className="font-['Fraunces',serif] text-base font-semibold text-[var(--text)] mb-4">Werdegang</h2>
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-[var(--border)]" />
                  <div className="space-y-4">
                    {werdegang.map((w, i) => (
                      <div key={i} className="relative pl-8">
                        <div
                          className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                            w.verifiziert
                              ? "bg-[var(--teal)] border-[var(--teal)]"
                              : "bg-white border-[var(--border)]"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--text)]">
                              {TYP_LABELS[w.typ] || w.typ}
                            </span>
                            <span className="text-xs text-[var(--muted)]">
                              {w.von_jahr}{w.bis_jahr ? `–${w.bis_jahr}` : "–heute"}
                            </span>
                            {w.verifiziert && (
                              <span className="text-xs text-[var(--teal)]">verifiziert</span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--muted)]">
                            {w.institution}, {w.stadt}
                          </p>
                          {w.beschreibung && (
                            <p className="text-xs text-[var(--muted)] mt-0.5">{w.beschreibung}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fachgesellschaften */}
            {mitgliedschaften.length > 0 && (
              <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
                <h2 className="font-['Fraunces',serif] text-base font-semibold text-[var(--text)] mb-4">Fachgesellschaften</h2>
                <div className="space-y-3">
                  {mitgliedschaften.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--text)]">{m.gesellschaft}</span>
                        {m.verifiziert && (
                          <span className="text-xs text-[var(--teal)] bg-[var(--teal-light)] px-1.5 py-0.5 rounded">
                            verifiziert
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--muted)]">
                        {m.mitgliedsstatus} seit {m.mitglied_seit_jahr}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promotion */}
            {promotion && (
              <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
                <h2 className="font-['Fraunces',serif] text-base font-semibold text-[var(--text)] mb-3">Promotion</h2>
                <p className="text-sm text-[var(--text)] font-medium">{promotion.titel} ({promotion.jahr})</p>
                <p className="text-sm text-[var(--muted)] mt-1">{promotion.thema}</p>
                <p className="text-sm text-[var(--muted)]">{promotion.universitaet}</p>
                {promotion.verifiziert && (
                  <span className="inline-block mt-2 text-xs text-[var(--teal)] bg-[var(--teal-light)] px-1.5 py-0.5 rounded">
                    verifiziert
                  </span>
                )}
              </div>
            )}

            {/* Preise */}
            {preise.length > 0 && (
              <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
                <h2 className="font-['Fraunces',serif] text-base font-semibold text-[var(--text)] mb-4">Preise (Richtwerte)</h2>
                <div className="space-y-2">
                  {preise.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">{p.eingriff}</span>
                      <span className="text-[var(--text)] font-medium">
                        {p.preis_von.toLocaleString("de-DE")}–{p.preis_bis.toLocaleString("de-DE")} {p.waehrung}
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-[var(--muted)] mt-2">
                    Quelle: {[...new Set(preise.map((p) => p.quelle))].join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Klinik-Info */}
            {arzt.klinik_name && (
              <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
                <h2 className="font-['Fraunces',serif] text-base font-semibold text-[var(--text)] mb-3">Klinik</h2>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-[var(--text)]">{arzt.klinik_name}</p>
                  <p className="text-[var(--muted)]">Typ: {arzt.klinik_typ?.replace(/_/g, " ")}</p>
                  {arzt.klinik_tuev && (
                    <span className="inline-block bg-[var(--teal-light)] text-[var(--teal)] text-xs px-2 py-0.5 rounded">
                      TÜV-zertifiziert
                    </span>
                  )}
                  {arzt.klinik_fallzahlen && (
                    <p className="text-[var(--muted)]">
                      Fallzahlen Plastische Chirurgie: {arzt.klinik_fallzahlen}
                    </p>
                  )}
                  {arzt.klinik_gmbh && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                      <p className="text-sm text-amber-800">
                        <strong>Hinweis:</strong> Diese Klinik ist als GmbH organisiert.
                        Der Arzt ist möglicherweise angestellt und nicht selbst haftend.
                      </p>
                    </div>
                  )}
                  {arzt.klinik_website && (
                    <a
                      href={arzt.klinik_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--teal)] no-underline hover:underline"
                    >
                      Klinik-Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--navy)] px-4 sm:px-6 py-6 mt-8">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-['Fraunces',serif] text-white font-semibold tracking-tight no-underline text-sm">
            Facharzt<span className="text-[#4dd9c0]">Register</span>
          </Link>
          <Link href="/" className="text-white/40 text-xs no-underline hover:text-white/70 transition-colors">
            Zurück zur Suche
          </Link>
        </div>
      </footer>
    </main>
  );
}
