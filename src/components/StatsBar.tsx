interface StatsBarProps {
  stats: {
    gesamt: number;
    fachaezte: number;
    ohne_facharzttitel: number;
    staedte: number;
    laender: number;
  };
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="bg-[var(--white)] border-b border-[var(--border)] px-4 sm:px-6 overflow-x-auto">
      <div className="max-w-[1340px] mx-auto flex items-center h-11 min-w-max">
        <div className="flex items-center gap-2 px-3 sm:px-5 border-r border-[var(--border)] first:pl-0">
          <span className="font-['Fraunces',serif] text-lg font-semibold text-[var(--teal)] tracking-tight">
            {stats.gesamt.toLocaleString("de-DE")}
          </span>
          <span className="text-xs text-[var(--muted)]">Ärzte</span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-5 border-r border-[var(--border)]">
          <span className="font-['Fraunces',serif] text-lg font-semibold text-[var(--teal)] tracking-tight">
            {stats.fachaezte.toLocaleString("de-DE")}
          </span>
          <span className="text-xs text-[var(--muted)]">Fachärzte</span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-5 border-r border-[var(--border)]">
          <span className="font-['Fraunces',serif] text-lg font-semibold text-[var(--teal)] tracking-tight">
            {stats.staedte.toLocaleString("de-DE")}
          </span>
          <span className="text-xs text-[var(--muted)]">Städte</span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-5">
          <span className="font-['Fraunces',serif] text-lg font-semibold text-[var(--teal)] tracking-tight">
            {stats.laender}
          </span>
          <span className="text-xs text-[var(--muted)]">Länder</span>
        </div>
      </div>
    </div>
  );
}
