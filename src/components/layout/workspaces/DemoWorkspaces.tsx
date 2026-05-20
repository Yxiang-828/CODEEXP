import { useAppContext } from '../../../AppContext';

export function MapLayersWorkspace() {
  const { selectedMapItem } = useAppContext();
  if (!selectedMapItem) {
    return (
      <div className="p-4 text-xs text-text-secondary font-medium">
        Select a map marker to inspect its details.
      </div>
    );
  }
  return (
    <div className="p-4 space-y-4">
      <div className="border-2 border-border-strong bg-surface-0 p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-accent-critical">
            {selectedMapItem.category}
          </p>
          <span className="text-[8px] font-black uppercase tracking-widest bg-accent-warning border border-border-strong px-1.5 py-0.5">
            {selectedMapItem.source}
          </span>
        </div>
        <h2 className="text-lg font-black uppercase mt-2">{selectedMapItem.title}</h2>
        <p className="text-sm font-medium text-text-secondary mt-3 leading-relaxed">
          {selectedMapItem.detail}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Lat" value={Number(selectedMapItem.lat.toFixed(4))} />
        <Metric label="Lng" value={Number(selectedMapItem.lng.toFixed(4))} />
      </div>

      <button
        onClick={() =>
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${selectedMapItem.lat},${selectedMapItem.lng}`,
            '_blank',
            'noopener,noreferrer'
          )
        }
        className="w-full border-2 border-border-strong bg-surface-3 text-text-inverse px-3 py-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_rgba(26,26,26,1)]"
      >
        Open in maps
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border-strong bg-surface-2 p-2">
      <div className="text-[8px] font-black uppercase tracking-widest text-text-secondary">{label}</div>
      <div className="text-lg font-mono font-black">{String(value).padStart(2, '0')}</div>
    </div>
  );
}
