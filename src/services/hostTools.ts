import type { LngLat } from '../state/types';
import type { HostMapFocusRequest, HostMapPin } from '../state/hostMapFocus';

export interface HostToolChip {
  label: string;
  ref: string;
}

interface ToolPayload {
  state?: string;
  note?: string;
  source?: string;
  nearest?: Array<{ name: string; distanceKm: number; lat: number; lng: number; hours?: string | null }>;
  psi24h?: { national?: number | null };
}

export interface HostQueryResult {
  ok?: boolean;
  tools?: Record<string, ToolPayload>;
  error?: string;
}

export async function queryHostTools(
  tools: Array<'psi' | 'nearestAed' | 'nearestHospital'>,
  origin: LngLat | null | undefined,
): Promise<HostQueryResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch('/api/host/query', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        tools,
        origin: origin && Number.isFinite(origin.lat) ? { lat: origin.lat, lng: origin.lng } : null,
      }),
      signal: controller.signal,
    });
    return (await response.json().catch(() => ({}))) as HostQueryResult;
  } catch {
    return { ok: false, error: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return '—';
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function pinsFromNearest(
  kind: HostMapPin['kind'],
  nearest: ToolPayload['nearest'],
): HostMapPin[] {
  return (nearest ?? []).slice(0, 3).map((n, i) => ({
    kind,
    label: n.name,
    lng: n.lng,
    lat: n.lat,
    km: n.distanceKm,
    best: i === 0,
  }));
}

export function buildHostMapFocusFromAed(
  result: HostQueryResult,
  origin: LngLat,
): HostMapFocusRequest | null {
  const aed = result.tools?.nearestAed;
  if (aed?.state !== 'live' || !aed.nearest?.length) return null;
  const pins = pinsFromNearest('aed', aed.nearest);
  if (!pins.length) return null;
  return { layerId: 'aeds', origin: { lng: origin.lng, lat: origin.lat }, pins };
}

export function buildHostMapFocusFromHospital(
  result: HostQueryResult,
  origin: LngLat,
): HostMapFocusRequest | null {
  const hospital = result.tools?.nearestHospital;
  if (hospital?.state !== 'live' || !hospital.nearest?.length) return null;
  const pins = pinsFromNearest('hospital', hospital.nearest);
  if (!pins.length) return null;
  return { layerId: 'hospitals', origin: { lng: origin.lng, lat: origin.lat }, pins };
}

export function formatHostAedReply(result: HostQueryResult): { text: string; chips: HostToolChip[] } {
  const aed = result.tools?.nearestAed;
  if (aed?.state === 'live' && aed.nearest?.length) {
    const nearest = aed.nearest[0];
    const header = `Nearest AED · ${formatDistance(nearest.distanceKm)} from case — pinned on your map:`;
    const lines = aed.nearest.slice(0, 3).map((n, i) => {
      const tag = i === 0 ? ' ★ send someone here' : '';
      return `${i + 1}. ${n.name} · ${formatDistance(n.distanceKm)}${tag}`;
    });
    lines.push('AED layer is on. Tap a pin on the map for full details.');
    return {
      text: `${header}\n${lines.join('\n')}`,
      chips: [{ label: 'tool: map_aeds', ref: 'bundled' }],
    };
  }
  return {
    text: `Nearest AED: unavailable${aed?.note ? ` (${aed.note})` : ''}.`,
    chips: [{ label: 'tool: map_aeds', ref: 'unavailable' }],
  };
}

export function formatHostHospitalReply(
  result: HostQueryResult,
  wantsLoad: boolean,
): { text: string; chips: HostToolChip[] } {
  const hospital = result.tools?.nearestHospital;
  if (hospital?.state === 'live' && hospital.nearest?.length) {
    const nearest = hospital.nearest[0];
    const header = `Nearest A&E · ${formatDistance(nearest.distanceKm)} from case — pinned on your map:`;
    const lines = hospital.nearest.slice(0, 3).map((n, i) => {
      const tag = i === 0 ? ' ★ primary escalation' : '';
      return `${i + 1}. ${n.name} · ${formatDistance(n.distanceKm)}${tag}`;
    });
    lines.push('Hospital layer is on. Tap a pin on the map for the exact location.');
    if (wantsLoad) lines.push('A&E load: unavailable (no live MOH load feed).');
    return {
      text: `${header}\n${lines.join('\n')}`,
      chips: [{ label: 'tool: map_hospitals', ref: 'bundled' }],
    };
  }
  if (wantsLoad) {
    return {
      text: 'Hospital A&E load: unavailable (no live MOH load feed). Nearest A&E lookup also failed.',
      chips: [{ label: 'tool: hospital_load', ref: 'unavailable' }],
    };
  }
  return {
    text: `Nearest hospital: unavailable${hospital?.note ? ` (${hospital.note})` : ''}.`,
    chips: [{ label: 'tool: map_hospitals', ref: 'unavailable' }],
  };
}

export function formatHostPsiReply(result: HostQueryResult): { text: string; chips: HostToolChip[] } {
  const psi = result.tools?.psi;
  const nat = psi?.psi24h?.national;
  if (psi?.state === 'live' && nat != null) {
    return {
      text: `PSI national ${nat}. Air quality ${nat < 55 ? 'good' : 'moderate'}. Source: NEA live.`,
      chips: [{ label: 'tool: nea_psi', ref: 'live' }],
    };
  }
  return {
    text: 'NEA PSI: unavailable. Live fetch failed.',
    chips: [{ label: 'tool: nea_psi', ref: 'unavailable' }],
  };
}
