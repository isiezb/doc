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
  const locationParts = [arzt.plz, arzt.stadt].filter(Boolean).join(" ");
  const hasContact = arzt.telefon || arzt.email || arzt.website_url;

  return (
    <main className="min-h-screen flex flex-col">
      {/* NAV */}
      <nav className="bg-[var(--navy)] px-4 sm:px-10 h-[56px] flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-['Fraunces',serif] text-lg text-white font-semibold tracking-tight no-underline">
          Facharzt<span className="text-[#4dd9c0]">Register</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-white/65 text-[13px] no-underline hover:text-white transition-colors">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">Zurück zur Suche</span>
          <span className="sm:hidden">Zurück</span>
        </Link>
      </nav>

      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 space-y-4 flex-1 w-full">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-white font-['Fraunces',serif] text-lg sm:text-xl font-semibold flex items-center justify-center shrink-0"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-['Fraunces',serif] text-xl sm:text-2xl font-semibold text-[var(--text)] leading-tight">
                {fullName}
              </h1>
              {arzt.selbstbezeichnung && (
                <p className="text-sm text-[var(--muted)] mt-1">{arzt.selbstbezeichnung}</p>
              )}
              {!arzt.selbstbezeichnung && arzt.facharzttitel && (
                <p className="text-sm text-[var(--muted)] mt-1">{arzt.facharzttitel}</p>
              )}
              {arzt.schwerpunkte && (
                <p className="text-xs text-[var(--muted)] mt-0.5">{arzt.schwerpunkte}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {arzt.verified && (
                  <span className="inline-flex items-center gap-1 bg-[var(--verified-bg)] text-[var(--verified)] text-[11px] font-medium py-1 px-2.5 rounded-md">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M10 3L5 9 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Verifiziert
                  </span>
                )}
                {arzt.ist_facharzt && (
                  <span className="inline-flex items-center text-[11px] font-medium py-1 px-2.5 rounded-md bg-blue-50 text-blue-700">
                    Facharzt
                  </span>
                )}
                {arzt.gkv_zugelassen === true && (
                  <span className="inline-flex items-center text-[11px] font-medium py-1 px-2.5 rounded-md bg-amber-50 text-amber-700">
                    Kassenärztlich zugelassen
                  </span>
                )}
                {arzt.gkv_zugelassen === false && (
                  <span className="inline-flex items-center text-[11px] font-medium py-1 px-2.5 rounded-md bg-gray-100 text-gray-600">
                    Privatärztlich
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Location Card */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[var(--muted)]">
                <path d="M8 1.5C5.24 1.5 3 3.74 3 6.5c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">Standort</span>
            </div>
            {arzt.strasse && <p className="text-sm text-[var(--text)]">{arzt.strasse}</p>}
            {locationParts && <p className="text-sm text-[var(--text)]">{locationParts}</p>}
            {arzt.bundesland && <p className="text-sm text-[var(--muted)]">{arzt.bundesland}</p>}
            <p className="text-sm text-[var(--muted)]">{landLabel}</p>
            {arzt.klinik_name && (
              <p className="text-sm text-[var(--text)] mt-2 pt-2 border-t border-[var(--border)]">{arzt.klinik_name}</p>
            )}
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[var(--muted)]">
                <path d="M2 4l6 4 6-4M2 4v8h12V4H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              <span className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">Kontakt</span>
            </div>
            {hasContact ? (
              <div className="space-y-2">
                {arzt.telefon && (
                  <a href={`tel:${arzt.telefon}`} className="flex items-center gap-2 text-sm text-[var(--teal)] no-underline hover:underline">
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0">
                      <path d="M6.5 2H4a1 1 0 00-1 1v1.5a9.5 9.5 0 008.5 8.5H13a1 1 0 001-1v-2.5l-3-1.5-1 1.5a6 6 0 01-4-4L7.5 4 6.5 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                    {arzt.telefon}
                  </a>
                )}
                {arzt.email && (
                  <a href={`mailto:${arzt.email}`} className="flex items-center gap-2 text-sm text-[var(--teal)] no-underline hover:underline truncate">
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0">
                      <rect x="2" y="3.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2 4.5l6 4 6-4" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    {arzt.email}
                  </a>
                )}
                {arzt.website_url && (
                  <a href={arzt.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--teal)] no-underline hover:underline truncate">
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2 8h12M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    Website
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Noch keine Kontaktdaten vorhanden.</p>
            )}
          </div>
        </div>

        {/* Basisdaten */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-5 sm:p-6">
          <h2 className="font-['Fraunces',serif] text-base font-semibold text-[var(--text)] mb-4">Basisdaten</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {arzt.facharzttitel && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[var(--muted)] text-[11px] uppercase tracking-wider">Facharzttitel</span>
                <p className="text-[var(--text)] mt-0.5">{arzt.facharzttitel}</p>
              </div>
            )}
            {landLabel && (
              <div>
                <span className="text-[var(--muted)] text-[11px] uppercase tracking-wider">Land</span>
                <p className="text-[var(--text)] mt-0.5">{landLabel}</p>
              </div>
            )}
            {arzt.facharzt_seit_jahr && (
              <div>
                <span className="text-[var(--muted)] text-[11px] uppercase tracking-wider">Facharzt seit</span>
                <p className="text-[var(--text)] mt-0.5">{arzt.facharzt_seit_jahr}</p>
              </div>
            )}
            {arzt.approbation_jahr && (
              <div>
                <span className="text-[var(--muted)] text-[11px] uppercase tracking-wider">Approbation</span>
                <p className="text-[var(--text)] mt-0.5">{arzt.approbation_jahr}</p>
              </div>
            )}
            {arzt.kammer_id && (
              <div>
                <span className="text-[var(--muted)] text-[11px] uppercase tracking-wider">Kammer-ID</span>
                <p className="text-[var(--text)] mt-0.5 font-mono text-xs">{arzt.kammer_id}</p>
              </div>
            )}
            {arzt.position && (
              <div>
                <span className="text-[var(--muted)] text-[11px] uppercase tracking-wider">Position</span>
                <p className="text-[var(--text)] mt-0.5">{arzt.position}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info note when limited data */}
        {!hasDetailedData && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800 leading-relaxed">
            Für diesen Eintrag liegen derzeit nur Basisdaten vor. Weitere Informationen werden ergänzt, sobald sie aus offiziellen Quellen verfügbar sind.
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

      {/* Footer */}
      <footer className="bg-[var(--navy)] px-4 sm:px-6 py-6 mt-auto">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-['Fraunces',serif] text-white font-semibold tracking-tight no-underline text-sm">
            Facharzt<span className="text-[#4dd9c0]">Register</span>
          </Link>
          <Link href="/" className="text-white/40 text-xs no-underline hover:text-white/70 transition-colors">
            Alle Fachärzte ansehen
          </Link>
        </div>
      </footer>
    </main>
  );
}
