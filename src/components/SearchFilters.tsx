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
    <form method="GET" className="bg-white rounded-xl border border-[var(--border)] overflow-hidden sticky top-[92px]">
      <div className="px-5 py-4 border-b border-[var(--border)] text-[13px] font-medium text-[var(--muted)] uppercase tracking-wider">
        Filter
      </div>

      {/* Preserve search params */}
      {currentParams.q && <input type="hidden" name="q" value={currentParams.q} />}
      {currentParams.eingriff && <input type="hidden" name="eingriff" value={currentParams.eingriff} />}
      {currentParams.stadt && <input type="hidden" name="stadt" value={currentParams.stadt} />}

      {/* Land */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="text-[13px] font-medium text-[var(--text)] mb-2.5">Land</div>
        <div className="flex flex-col gap-1.5">
          {[
            { value: "", label: "Alle Länder" },
            { value: "DE", label: "Deutschland" },
            { value: "AT", label: "Österreich" },
            { value: "CH", label: "Schweiz" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-[13px] text-[var(--text)] cursor-pointer py-1">
              <input
                type="radio"
                name="land"
                value={opt.value}
                defaultChecked={(currentParams.land || "") === opt.value}
                className="accent-[var(--teal)] w-3.5 h-3.5"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Bundesland */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="text-[13px] font-medium text-[var(--text)] mb-2.5">Bundesland</div>
        <select
          name="bundesland"
          defaultValue={currentParams.bundesland || ""}
          className="w-full py-2 px-3 border border-[var(--border)] rounded-lg text-[13px] font-['DM_Sans',sans-serif] text-[var(--text)] outline-none bg-white"
        >
          <option value="">Alle Bundesländer</option>
          {bundeslaender.map((bl) => (
            <option key={bl} value={bl}>{bl}</option>
          ))}
        </select>
      </div>

      {/* Sortierung */}
      <div className="p-5">
        <div className="text-[13px] font-medium text-[var(--text)] mb-2.5">Sortierung</div>
        <div className="flex flex-col gap-1.5">
          {[
            { value: "name", label: "Name (A–Z)" },
            { value: "neu", label: "Neueste zuerst" },
            { value: "stadt", label: "Stadt" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-[13px] text-[var(--text)] cursor-pointer py-1">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                defaultChecked={(currentParams.sort || "name") === opt.value}
                className="accent-[var(--teal)] w-3.5 h-3.5"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="p-5 pt-0">
        <button
          type="submit"
          className="w-full py-2.5 bg-[var(--teal)] text-white text-[13px] font-medium rounded-lg hover:bg-[#0a6855] transition-colors"
        >
          Anwenden
        </button>
      </div>
    </form>
  );
}
