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

  return (
    <main className="min-h-screen">
      {/* NAV */}
      <nav className="bg-[var(--navy)] px-4 sm:px-10 h-[56px] flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="font-['Fraunces',serif] text-lg text-white font-semibold tracking-tight no-underline">
          Facharzt<span className="text-[#4dd9c0]">Register</span>
        </Link>
        <Link href="/" className="text-white/65 text-[13px] no-underline hover:text-white transition-colors">
          &#8592; Zurück zur Suche
        </Link>
      </nav>

      <div className="max-w-[800px] mx-auto px-4 sm:px-10 py-6 space-y-5">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl text-white font-['Fraunces',serif] text-xl font-semibold flex items-center justify-center shrink-0"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="font-['Fraunces',serif] text-2xl font-semibold text-[var(--text)] leading-tight">
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

              {arzt.verified && (
                <div className="inline-flex items-center gap-1.5 bg-[var(--verified-bg)] text-[var(--verified)] text-xs font-medium py-1 px-2.5 rounded-md mt-3">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M10 3L5 9 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Kammer verifiziert
                </div>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[var(--muted)]">
                {arzt.strasse && <span>{arzt.strasse}</span>}
                <span>{[arzt.plz, arzt.stadt, arzt.bundesland].filter(Boolean).join(", ")}</span>
                {arzt.klinik_name && <span>{arzt.klinik_name}</span>}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                {arzt.telefon && (
                  <a href={`tel:${arzt.telefon}`} className="text-[var(--teal)] no-underline hover:underline">
                    Tel: {arzt.telefon}
                  </a>
                )}
                {arzt.email && (
                  <a href={`mailto:${arzt.email}`} className="text-[var(--teal)] no-underline hover:underline">
                    {arzt.email}
                  </a>
                )}
                {arzt.website_url && (
                  <a href={arzt.website_url} target="_blank" rel="noopener noreferrer" className="text-[var(--teal)] no-underline hover:underline">
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Basisdaten */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <h2 className="font-['Fraunces',serif] text-lg font-semibold text-[var(--text)] mb-4">Basisdaten</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {arzt.facharzttitel && (
              <div>
                <span className="text-[var(--muted)] text-xs">Facharzttitel</span>
                <p className="text-[var(--text)]">{arzt.facharzttitel}</p>
              </div>
            )}
            {landLabel && (
              <div>
                <span className="text-[var(--muted)] text-xs">Land</span>
                <p className="text-[var(--text)]">{landLabel}</p>
              </div>
            )}
            {arzt.facharzt_seit_jahr && (
              <div>
                <span className="text-[var(--muted)] text-xs">Facharzt seit</span>
                <p className="text-[var(--text)]">{arzt.facharzt_seit_jahr}</p>
              </div>
            )}
            {arzt.approbation_jahr && (
              <div>
                <span className="text-[var(--muted)] text-xs">Approbation</span>
                <p className="text-[var(--text)]">{arzt.approbation_jahr}</p>
              </div>
            )}
            {arzt.kammer_id && (
              <div>
                <span className="text-[var(--muted)] text-xs">Kammer-ID</span>
                <p className="text-[var(--text)]">{arzt.kammer_id}</p>
              </div>
            )}
            {arzt.position && (
              <div>
                <span className="text-[var(--muted)] text-xs">Position</span>
                <p className="text-[var(--text)]">{arzt.position}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info note when limited data */}
        {!hasDetailedData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800">
            Für diesen Eintrag liegen derzeit nur Basisdaten vor. Weitere Informationen werden ergänzt, sobald sie aus offiziellen Quellen verfügbar sind.
          </div>
        )}

        {/* Spezialisierungen */}
        {spezialisierungen.length > 0 && (
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold text-[var(--text)] mb-4">Spezialisierungen</h2>
            <div className="space-y-4">
              {Object.entries(spezGrouped).map(([kat, items]) => (
                <div key={kat}>
                  <h3 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
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
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold text-[var(--text)] mb-4">Werdegang</h2>
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
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold text-[var(--text)] mb-4">Fachgesellschaften</h2>
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
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold text-[var(--text)] mb-3">Promotion</h2>
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
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold text-[var(--text)] mb-4">Preise (Richtwerte)</h2>
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
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold text-[var(--text)] mb-3">Klinik</h2>
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
    </main>
  );
}
