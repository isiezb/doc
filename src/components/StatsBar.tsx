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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-6 text-sm">
        <div>
          <span className="font-semibold text-gray-900">{stats.gesamt}</span>{" "}
          <span className="text-gray-500">Aerzte gesamt</span>
        </div>
        <div>
          <span className="font-semibold text-green-700">{stats.fachaezte}</span>{" "}
          <span className="text-gray-500">echte Fachaezte</span>
        </div>
        <div>
          <span className="font-semibold text-red-600">{stats.ohne_facharzttitel}</span>{" "}
          <span className="text-gray-500">ohne Facharzttitel</span>
        </div>
        <div>
          <span className="font-semibold text-gray-900">{stats.staedte}</span>{" "}
          <span className="text-gray-500">Staedte</span>
        </div>
      </div>
    </div>
  );
}
