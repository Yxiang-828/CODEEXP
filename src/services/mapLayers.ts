export type LiveLayerSourceState = 'fresh' | 'down' | 'not_configured' | 'rate_limited' | 'demo';

export interface MapPoi {
  id: string;
  kind?: 'hospital' | 'aed' | 'traffic';
  name: string;
  detail: string;
  lng: number;
  lat: number;
  tone?: 'critical' | 'warning' | 'ok' | 'hospital' | 'aed' | string;
  source?: 'live' | 'demo';
}

export interface MrtStatusLine {
  id: string;
  name: string;
  detail: string;
  tone: 'critical' | 'warning' | 'ok';
  source: 'demo' | 'live';
  path: Array<[number, number]>;
}

export interface MapLayerSource {
  name: string;
  state: LiveLayerSourceState;
  note: string;
  checkedAt: number;
}

export interface LiveMapLayers {
  fetchedAt: number;
  cached: boolean;
  hospitals: MapPoi[];
  aeds: MapPoi[];
  traffic: MapPoi[];
  speedBands: MapPoi[];
  mrt: MrtStatusLine[];
  sources: MapLayerSource[];
}

export async function fetchMapLayers(): Promise<LiveMapLayers | null> {
  const response = await fetch('/api/live/map-layers', {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) return null;
  return response.json();
}
