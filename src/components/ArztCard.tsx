const LAND_LABELS: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
};

const SOURCE_LABELS: Record<string, string> = {
  aerztekammer_de: "Ärztekammer",
  kbv: "KBV (116117)",
  medreg: "MedReg",
  oegk: "OEGK",
};

interface ArztCardProps {
  arzt: {
    vorname: string;
    nachname: string;
    titel: string;
    ist_facharzt: boolean;
    facharzttitel: string | null;
    selbstbezeichnung: string;
    land: string;
    stadt: string;
    bundesland: string;
    facharzt_seit_jahr: number | null;
    approbation_jahr: number;
    klinik_name: string | null;
    klinik_typ: string | null;
    klinik_gmbh: boolean;
    eingriffe: string | null;
    source: string | null;
    verified: boolean;
    gkv_zugelassen: boolean | null;
  };
}

export default function ArztCard({ arzt }: ArztCardProps) {
  const initials = `${arzt.vorname[0]}${arzt.nachname[0]}`;
  const fullName = [arzt.titel, arzt.vorname, arzt.nachname].filter(Boolean).join(" ");
  const currentYear = new Date().getFullYear();
  const startYear = arzt.facharzt_seit_jahr || arzt.approbation_jahr;
  const yearsExperience = startYear && startYear > 1950 ? currentYear - startYear : null;
  const eingriffeList = arzt.eingriffe ? arzt.eingriffe.split(",") : [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Avatar */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
            arzt.ist_facharzt ? "bg-green-600" : "bg-gray-400"
          }`}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-gray-900 text-lg">{fullName}</h2>
            {arzt.ist_facharzt ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Facharzt
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Kein Facharzttitel
              </span>
            )}
            {arzt.verified && arzt.source && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                {SOURCE_LABELS[arzt.source] || arzt.source}
              </span>
            )}
            {arzt.gkv_zugelassen && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                GKV
              </span>
            )}
          </div>

          {/* Selbstbezeichnung */}
          <p className="text-sm text-gray-600 mt-0.5">
            {arzt.selbstbezeichnung}
            {arzt.klinik_name && (
              <span className="text-gray-400"> · {arzt.klinik_name}</span>
            )}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
            <span>{arzt.stadt}, {LAND_LABELS[arzt.land] || arzt.land}</span>
            {yearsExperience !== null && (
              <span>{yearsExperience} Jahre Erfahrung</span>
            )}
          </div>

          {/* Eingriff-Tags */}
          {eingriffeList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {eingriffeList.slice(0, 5).map((e) => (
                <span
                  key={e}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {e.trim()}
                </span>
              ))}
              {eingriffeList.length > 5 && (
                <span className="text-xs text-gray-400">
                  +{eingriffeList.length - 5} weitere
                </span>
              )}
            </div>
          )}

          {/* Warnings */}
          {!arzt.ist_facharzt && (
            <p className="text-xs text-red-600 mt-2">
              Kein anerkannter Facharzttitel fuer Plastische und Aesthetische Chirurgie nachweisbar.
            </p>
          )}
          {arzt.klinik_gmbh && arzt.klinik_typ === "schoenheitskette" && (
            <p className="text-xs text-amber-600 mt-1">
              Angestellt in einer Schoenheitskette (GmbH-Struktur)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
