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
    <form method="GET" className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border)] text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">
        Filter
      </div>

      {/* Preserve search params */}
      {currentParams.q && <input type="hidden" name="q" value={currentParams.q} />}
      {currentParams.eingriff && <input type="hidden" name="eingriff" value={currentParams.eingriff} />}
      {currentParams.stadt && <input type="hidden" name="stadt" value={currentParams.stadt} />}

      {/* Land */}
      <div className="p-3.5 border-b border-[var(--border)]">
        <div className="text-[11px] font-medium text-[var(--text)] mb-2">Land</div>
        <div className="flex flex-col gap-1">
          {[
            { value: "", label: "Alle" },
            { value: "DE", label: "Deutschland" },
            { value: "AT", label: "Österreich" },
            { value: "CH", label: "Schweiz" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-[12px] text-[var(--text)] cursor-pointer py-0.5">
              <input
                type="radio"
                name="land"
                value={opt.value}
                defaultChecked={(currentParams.land || "") === opt.value}
                className="accent-[var(--teal)] w-3 h-3"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Bundesland */}
      {bundeslaender.length > 0 && (
        <div className="p-3.5 border-b border-[var(--border)]">
          <div className="text-[11px] font-medium text-[var(--text)] mb-2">Bundesland</div>
          <select
            name="bundesland"
            defaultValue={currentParams.bundesland || ""}
            className="w-full py-1.5 px-2.5 border border-[var(--border)] rounded text-[12px] font-['DM_Sans',sans-serif] text-[var(--text)] outline-none bg-white"
          >
            <option value="">Alle</option>
            {bundeslaender.map((bl) => (
              <option key={bl} value={bl}>{bl}</option>
            ))}
          </select>
        </div>
      )}

      {/* Nur Fachärzte */}
      <div className="p-3.5 border-b border-[var(--border)]">
        <label className="flex items-center gap-2 text-[12px] text-[var(--text)] cursor-pointer">
          <input
            type="checkbox"
            name="nur_fachaezte"
            value="1"
            defaultChecked={currentParams.nur_fachaezte === "1"}
            className="accent-[var(--teal)] w-3 h-3"
          />
          Nur Fachärzte
        </label>
      </div>

      {/* Sortierung */}
      <div className="p-3.5">
        <div className="text-[11px] font-medium text-[var(--text)] mb-2">Sortierung</div>
        <div className="flex flex-col gap-1">
          {[
            { value: "name", label: "Name (A-Z)" },
            { value: "neu", label: "Neueste zuerst" },
            { value: "stadt", label: "Stadt" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-[12px] text-[var(--text)] cursor-pointer py-0.5">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                defaultChecked={(currentParams.sort || "name") === opt.value}
                className="accent-[var(--teal)] w-3 h-3"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="px-3.5 pb-3.5">
        <button
          type="submit"
          className="w-full py-2 bg-[var(--teal)] text-white text-[12px] font-medium rounded hover:bg-[#0a6855] transition-colors"
        >
          Anwenden
        </button>
      </div>
    </form>
  );
}
