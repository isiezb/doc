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
}

const KATEGORIE_LABELS: Record<string, string> = {
  brust: "Brust",
  gesicht: "Gesicht",
  koerper: "Koerper",
  minimal_invasiv: "Minimal-invasiv",
};

const LEVEL_COLORS: Record<string, string> = {
  spezialist: "bg-green-100 text-green-800",
  fortgeschritten: "bg-blue-100 text-blue-800",
  basis: "bg-gray-100 text-gray-600",
};

const TYP_LABELS: Record<string, string> = {
  studium: "Studium",
  klinik: "Klinische Taetigkeit",
  weiterbildung: "Weiterbildung",
  promotion: "Promotion",
  zertifikat: "Zertifikat",
};

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

  // Group specializations by category
  const spezGrouped: Record<string, Spezialisierung[]> = {};
  for (const s of spezialisierungen) {
    if (!spezGrouped[s.kategorie]) spezGrouped[s.kategorie] = [];
    spezGrouped[s.kategorie].push(s);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Back link */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Zurueck zur Suche
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ${
                arzt.ist_facharzt ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              {arzt.vorname[0]}{arzt.nachname[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-gray-600">{arzt.selbstbezeichnung}</p>
              {arzt.schwerpunkte && (
                <p className="text-sm text-gray-500 mt-0.5">{arzt.schwerpunkte}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                {arzt.strasse && <span>{arzt.strasse}</span>}
                <span>{[arzt.plz, arzt.stadt, arzt.bundesland].filter(Boolean).join(", ")}</span>
                {arzt.klinik_name && <span>{arzt.klinik_name}</span>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                {arzt.telefon && (
                  <a href={`tel:${arzt.telefon}`} className="text-blue-600 hover:underline">
                    Tel: {arzt.telefon}
                  </a>
                )}
                {arzt.email && (
                  <a href={`mailto:${arzt.email}`} className="text-blue-600 hover:underline">
                    {arzt.email}
                  </a>
                )}
                {arzt.website_url && (
                  <a href={arzt.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spezialisierungen */}
        {spezialisierungen.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Spezialisierungen</h2>
            <div className="space-y-4">
              {Object.entries(spezGrouped).map(([kat, items]) => (
                <div key={kat}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {KATEGORIE_LABELS[kat] || kat}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => (
                      <span
                        key={s.eingriff}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                          LEVEL_COLORS[s.erfahrungslevel] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.eingriff}
                        <span className="ml-1.5 text-xs opacity-70">
                          ({s.erfahrungslevel})
                        </span>
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Werdegang</h2>
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {werdegang.map((w, i) => (
                  <div key={i} className="relative pl-8">
                    <div
                      className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                        w.verifiziert
                          ? "bg-green-500 border-green-500"
                          : "bg-white border-gray-300"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {TYP_LABELS[w.typ] || w.typ}
                        </span>
                        <span className="text-xs text-gray-400">
                          {w.von_jahr}{w.bis_jahr ? `–${w.bis_jahr}` : "–heute"}
                        </span>
                        {w.verifiziert && (
                          <span className="text-xs text-green-600">verifiziert</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {w.institution}, {w.stadt}
                      </p>
                      {w.beschreibung && (
                        <p className="text-xs text-gray-500 mt-0.5">{w.beschreibung}</p>
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fachgesellschaften</h2>
            <div className="space-y-3">
              {mitgliedschaften.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{m.gesellschaft}</span>
                    {m.verifiziert && (
                      <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        verifiziert
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {m.mitgliedsstatus} seit {m.mitglied_seit_jahr}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promotion */}
        {promotion && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Promotion</h2>
            <p className="text-sm text-gray-900 font-medium">{promotion.titel} ({promotion.jahr})</p>
            <p className="text-sm text-gray-600 mt-1">{promotion.thema}</p>
            <p className="text-sm text-gray-500">{promotion.universitaet}</p>
            {promotion.verifiziert && (
              <span className="inline-block mt-2 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                verifiziert
              </span>
            )}
          </div>
        )}

        {/* Preise */}
        {preise.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preise (Richtwerte)</h2>
            <div className="space-y-2">
              {preise.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{p.eingriff}</span>
                  <span className="text-gray-900 font-medium">
                    {p.preis_von.toLocaleString("de-DE")}–{p.preis_bis.toLocaleString("de-DE")} {p.waehrung}
                  </span>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">
                Quelle: {[...new Set(preise.map((p) => p.quelle))].join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Klinik-Info */}
        {arzt.klinik_name && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Klinik</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{arzt.klinik_name}</p>
              <p className="text-gray-600">Typ: {arzt.klinik_typ?.replace(/_/g, " ")}</p>
              {arzt.klinik_tuev && (
                <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded">
                  TUEV-zertifiziert
                </span>
              )}
              {arzt.klinik_fallzahlen && (
                <p className="text-gray-600">
                  Fallzahlen Plastische Chirurgie: {arzt.klinik_fallzahlen}
                </p>
              )}
              {arzt.klinik_gmbh && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2">
                  <p className="text-sm text-amber-800">
                    <strong>Hinweis:</strong> Diese Klinik ist als GmbH organisiert.
                    Der Arzt ist moeglicherweise angestellt und nicht selbst haftend.
                  </p>
                </div>
              )}
              {arzt.klinik_website && (
                <a
                  href={arzt.klinik_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Klinik-Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Beratungstermin anfragen
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Kontaktieren Sie {fullName} fuer ein unverbindliches Beratungsgespraech.
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Beratung anfragen
          </button>
        </div>
      </div>
    </main>
  );
}
