const SOURCE_LABELS: Record<string, string> = {
  aerztekammer_de: "Ärztekammer",
  kbv: "KBV (116117)",
  medreg: "MedReg",
  oegk: "OEGK",
  arztauskunft_de: "Arzt-Auskunft",
};

const AVATAR_COLORS = [
  "#1a3050", "#2d4a6b", "#0d7c66", "#1e4d7b", "#3d5a80", "#0a5c4f",
];

interface ArztCardProps {
  arzt: {
    id: number;
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
  const initials = `${arzt.vorname?.[0] || ""}${arzt.nachname?.[0] || ""}`;
  const fullName = [arzt.titel, arzt.vorname, arzt.nachname].filter(Boolean).join(" ");
  const avatarColor = AVATAR_COLORS[(arzt.id || 0) % AVATAR_COLORS.length];
  const landFlag = arzt.land === "DE" ? "DE" : arzt.land === "AT" ? "AT" : arzt.land === "CH" ? "CH" : arzt.land;

  return (
    <div
      className="bg-white border border-[var(--border)] rounded-lg p-4 flex flex-col gap-3 transition-all duration-200 hover:border-[var(--teal-mid)] hover:shadow-[0_4px_16px_rgba(13,124,102,0.08)] hover:-translate-y-0.5 h-full"
    >
      {/* Header: Avatar + Name */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg text-white font-['Fraunces',serif] text-xs font-semibold flex items-center justify-center shrink-0"
          style={{ background: avatarColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-['Fraunces',serif] text-[13px] font-semibold text-[var(--text)] leading-snug">
            {fullName}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
            {arzt.stadt}{arzt.stadt && landFlag ? ` · ${landFlag}` : landFlag}
          </div>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {arzt.verified && (
          <span className="inline-flex items-center gap-1 bg-[var(--verified-bg)] text-[var(--verified)] text-[10px] font-medium py-0.5 px-2 rounded">
            <svg viewBox="0 0 12 12" fill="none" className="w-[10px] h-[10px]">
              <path d="M10 3L5 9 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Verifiziert
          </span>
        )}
        {arzt.ist_facharzt && (
          <span className="inline-flex items-center text-[10px] font-medium py-0.5 px-2 rounded bg-blue-50 text-blue-700">
            Facharzt
          </span>
        )}
        {arzt.gkv_zugelassen && (
          <span className="inline-flex items-center text-[10px] font-medium py-0.5 px-2 rounded bg-amber-50 text-amber-700">
            GKV
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="text-[11px] text-[var(--muted)] pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 mt-auto">
        <span className="truncate">{arzt.facharzttitel || arzt.selbstbezeichnung || "Plastische Chirurgie"}</span>
        {arzt.source && (
          <span className="flex items-center gap-1 shrink-0">
            <span className="w-1 h-1 rounded-full bg-[var(--teal)] inline-block" />
            <span className="text-[10px]">{SOURCE_LABELS[arzt.source] || arzt.source}</span>
          </span>
        )}
      </div>
    </div>
  );
}
