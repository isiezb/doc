interface StatsBarProps {
  stats: {
    gesamt: number;
    fachaezte: number;
    ohne_facharzttitel: number;
    staedte: number;
  };
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="bg-[var(--white)] border-b border-[var(--border)]" style={{ padding: "0 40px" }}>
      <div className="max-w-[1100px] mx-auto flex items-center h-14">
        <div className="flex items-center gap-2.5 px-7 border-r border-[var(--border)] first:pl-0">
          <span className="font-['Fraunces',serif] text-[22px] font-semibold text-[var(--teal)] tracking-tight">
            {stats.gesamt}
          </span>
          <span className="text-[13px] text-[var(--muted)]">Verifizierte Fachärzte</span>
        </div>
        <div className="flex items-center gap-2.5 px-7 border-r border-[var(--border)]">
          <span className="font-['Fraunces',serif] text-[22px] font-semibold text-[var(--teal)] tracking-tight">
            {stats.staedte}
          </span>
          <span className="text-[13px] text-[var(--muted)]">Städte</span>
        </div>
        <div className="flex items-center gap-2.5 px-7 border-r border-[var(--border)]">
          <span className="font-['Fraunces',serif] text-[22px] font-semibold text-[var(--teal)] tracking-tight">
            3
          </span>
          <span className="text-[13px] text-[var(--muted)]">Länder (DE / AT / CH)</span>
        </div>
        <div className="flex items-center gap-2.5 px-7">
          <span className="font-['Fraunces',serif] text-[22px] font-semibold text-[var(--teal)] tracking-tight">
            0
          </span>
          <span className="text-[13px] text-[var(--muted)]">Unbewiesene Titel</span>
        </div>
      </div>
    </div>
  );
}
