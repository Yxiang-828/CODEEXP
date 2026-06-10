// Host /host nearest aed|hospital — map focus + ranked pins for every role.

export interface HostMapPin {
  kind: 'aed' | 'hospital';
  label: string;
  lng: number;
  lat: number;
  km: number;
  best?: boolean;
}

export interface HostMapFocusRequest {
  layerId: 'aeds' | 'hospitals';
  origin: { lng: number; lat: number };
  pins: HostMapPin[];
}

let _req: HostMapFocusRequest | null = null;
const subs = new Set<() => void>();
const emit = () => { for (const f of subs) f(); };

export const hostMapFocus = {
  subscribe(f: () => void): () => void {
    subs.add(f);
    return () => subs.delete(f);
  },
  snapshot(): string {
    if (!_req) return '';
    return `${_req.layerId}:${_req.pins.map((p) => `${p.lng.toFixed(4)},${p.lat.toFixed(4)}`).join('|')}`;
  },
  get(): HostMapFocusRequest | null {
    return _req;
  },
  set(req: HostMapFocusRequest): void {
    _req = req;
    emit();
  },
  clear(): void {
    _req = null;
    emit();
  },
};
