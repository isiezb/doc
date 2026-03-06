interface SearchFiltersProps {
  bundeslaender: string[];
  currentParams: {
    q?: string;
    eingriff?: string;
    stadt?: string;
    bundesland?: string;
    land?: string;
    nur_fachaezte?: string;
    sort?: string;
  };
}

export default function SearchFilters({ bundeslaender, currentParams }: SearchFiltersProps) {
  return (
    <form method="GET" className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm">Filter</h3>

      {/* Preserve search params */}
      {currentParams.q && <input type="hidden" name="q" value={currentParams.q} />}
      {currentParams.eingriff && <input type="hidden" name="eingriff" value={currentParams.eingriff} />}
      {currentParams.stadt && <input type="hidden" name="stadt" value={currentParams.stadt} />}
      {currentParams.sort && <input type="hidden" name="sort" value={currentParams.sort} />}

      {/* Land / Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
        <select
          name="land"
          defaultValue={currentParams.land || ""}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
        >
          <option value="">Alle Länder</option>
          <option value="DE">Deutschland</option>
          <option value="AT">Österreich</option>
          <option value="CH">Schweiz</option>
        </select>
      </div>

      {/* Nur Fachärzte */}
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            name="nur_fachaezte"
            value="1"
            defaultChecked={currentParams.nur_fachaezte === "1"}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Nur echte Fachaezte
        </label>
      </div>

      {/* Bundesland */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bundesland</label>
        <select
          name="bundesland"
          defaultValue={currentParams.bundesland || ""}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
        >
          <option value="">Alle</option>
          {bundeslaender.map((bl) => (
            <option key={bl} value={bl}>
              {bl}
            </option>
          ))}
        </select>
      </div>

      {/* Sortierung */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sortierung</label>
        <select
          name="sort"
          defaultValue={currentParams.sort || "name"}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
        >
          <option value="name">Name</option>
          <option value="erfahrung">Erfahrung</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium"
      >
        Anwenden
      </button>
    </form>
  );
}
