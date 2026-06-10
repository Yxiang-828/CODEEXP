import type { LngLat } from '../state/types';

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

export function formatHostAedReply(result: HostQueryResult, origin?: LngLat | null): { text: string; chips: HostToolChip[] } {
  const aed = result.tools?.nearestAed;
  if (aed?.state === 'live' && aed.nearest?.length) {
    const header = origin
      ? `Nearest AED from case (${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}) — same pins as map layer:`
      : 'Nearest AED (map layer):';
    const lines = aed.nearest.slice(0, 3).map((n, i) => {
      const hours = n.hours ? ` · ${n.hours}` : '';
      return `${i + 1}. ${n.name} · ${n.distanceKm} km · ${n.lat.toFixed(4)}, ${n.lng.toFixed(4)}${hours}`;
    });
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
  origin?: LngLat | null,
): { text: string; chips: HostToolChip[] } {
  const hospital = result.tools?.nearestHospital;
  if (hospital?.state === 'live' && hospital.nearest?.length) {
    const header = origin
      ? `Nearest A&E from case (${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}) — same pins as map layer:`
      : 'Nearest A&E (map layer):';
    const lines = hospital.nearest.slice(0, 3).map((n, i) =>
      `${i + 1}. ${n.name} · ${n.distanceKm} km · ${n.lat.toFixed(4)}, ${n.lng.toFixed(4)}`,
    );
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
