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
    <div className="bg-[var(--white)] border-b border-[var(--border)] px-6">
      <div className="max-w-[1340px] mx-auto flex items-center h-11">
        <div className="flex items-center gap-2 px-5 border-r border-[var(--border)] first:pl-0">
          <span className="font-['Fraunces',serif] text-lg font-semibold text-[var(--teal)] tracking-tight">
            {stats.gesamt}
          </span>
          <span className="text-xs text-[var(--muted)]">Fachärzte</span>
        </div>
        <div className="flex items-center gap-2 px-5 border-r border-[var(--border)]">
          <span className="font-['Fraunces',serif] text-lg font-semibold text-[var(--teal)] tracking-tight">
            {stats.staedte}
          </span>
          <span className="text-xs text-[var(--muted)]">Städte</span>
        </div>
        <div className="flex items-center gap-2 px-5 border-r border-[var(--border)]">
          <span className="font-['Fraunces',serif] text-lg font-semibold text-[var(--teal)] tracking-tight">
            3
          </span>
          <span className="text-xs text-[var(--muted)]">Länder</span>
        </div>
        <div className="flex items-center gap-2 px-5">
          <span className="font-['Fraunces',serif] text-lg font-semibold text-[var(--teal)] tracking-tight">
            0
          </span>
          <span className="text-xs text-[var(--muted)]">Unbewiesene Titel</span>
        </div>
      </div>
    </div>
  );
}
