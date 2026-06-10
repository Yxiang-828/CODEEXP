// Server-side Host tool lookups. PSI/rainfall hit live gov APIs; hospitals and
// AEDs read the SAME bundled geojson as the map layer and Bekal skills — not
// OneMap themes (different dataset, generic AED labels, hospitals absent from map).

import { aeds, hospitals, nearestFeatures } from '../ai/_data.mjs';

const FETCH_TIMEOUT_MS = 4500;

async function timedFetch(url, init) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...(init ?? {}), signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function haversineKm(a, b) {
  if (!a || !b || ![a.lng, a.lat, b.lng, b.lat].every(Number.isFinite)) return Infinity;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// ───────── PSI ─────────
export async function getLivePsi() {
  try {
    const res = await timedFetch('https://api.data.gov.sg/v1/environment/psi');
    if (!res.ok) return { state: 'unavailable', note: `HTTP ${res.status}` };
    const json = await res.json();
    const readings = json.items?.[0]?.readings?.psi_twenty_four_hourly ?? {};
    return {
      state: 'live',
      fetchedAt: Date.now(),
      psi24h: {
        national: readings.national ?? null,
        north: readings.north ?? null,
        south: readings.south ?? null,
        east: readings.east ?? null,
        west: readings.west ?? null,
        central: readings.central ?? null,
      },
    };
  } catch (error) {
    return { state: 'unavailable', note: error?.message ?? 'fetch failed' };
  }
}

// ───────── Rainfall (optionally bounded by user location) ─────────
export async function getLiveRainfall(near) {
  try {
    const res = await timedFetch('https://api.data.gov.sg/v1/environment/rainfall');
    if (!res.ok) return { state: 'unavailable', note: `HTTP ${res.status}` };
    const json = await res.json();
    const stations = json.metadata?.stations ?? [];
    const readings = json.items?.[0]?.readings ?? [];
    const byStation = new Map(readings.map((r) => [r.station_id, r.value]));
    const all = stations.map((s) => ({
      stationId: s.id,
      name: s.name,
      lng: s.location.longitude,
      lat: s.location.latitude,
      mm: byStation.get(s.id) ?? 0,
    }));
    if (!near) return { state: 'live', fetchedAt: Date.now(), stations: all.slice(0, 10) };
    const nearest = all
      .map((station) => ({ station, distanceKm: haversineKm(near, station) }))
      .filter((entry) => Number.isFinite(entry.distanceKm))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3)
      .map((entry) => ({ ...entry.station, distanceKm: Number(entry.distanceKm.toFixed(2)) }));
    return { state: 'live', fetchedAt: Date.now(), nearest };
  } catch (error) {
    return { state: 'unavailable', note: error?.message ?? 'fetch failed' };
  }
}

function rankedFromBundled(fc, loc, limit = 3) {
  return nearestFeatures(fc, loc, limit).map((entry) => ({
    name: entry.name,
    lng: entry.lng,
    lat: entry.lat,
    distanceKm: Number(entry.km.toFixed(2)),
    hours: entry.props?.hours ?? null,
  }));
}

export async function getNearestAed(loc) {
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
    return { state: 'unavailable', note: 'No origin location supplied.' };
  }
  try {
    const fc = await aeds();
    const nearest = rankedFromBundled(fc, loc, 3);
    if (!nearest.length) return { state: 'unavailable', note: 'Bundled AED dataset is empty.' };
    return { state: 'live', source: 'bundled', fetchedAt: Date.now(), nearest };
  } catch (error) {
    return { state: 'unavailable', note: error?.message ?? 'read failed' };
  }
}

export async function getNearestHospital(loc) {
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
    return { state: 'unavailable', note: 'No origin location supplied.' };
  }
  try {
    const fc = await hospitals();
    const nearest = rankedFromBundled(fc, loc, 3);
    if (!nearest.length) return { state: 'unavailable', note: 'Bundled hospital dataset is empty.' };
    return { state: 'live', source: 'bundled', fetchedAt: Date.now(), nearest };
  } catch (error) {
    return { state: 'unavailable', note: error?.message ?? 'read failed' };
  }
}

// ───────── Tool runner: resolve a workspace's tool list in parallel ─────────
export async function runTools(toolNames, args) {
  const wanted = new Set(toolNames ?? []);
  const tasks = [];
  if (wanted.has('psi')) tasks.push(['psi', getLivePsi()]);
  if (wanted.has('rainfall')) tasks.push(['rainfall', getLiveRainfall(args.origin)]);
  if (wanted.has('nearestAed')) tasks.push(['nearestAed', getNearestAed(args.origin)]);
  if (wanted.has('nearestHospital'))
    tasks.push(['nearestHospital', getNearestHospital(args.origin)]);
  const out = {};
  const results = await Promise.allSettled(tasks.map((t) => t[1]));
  results.forEach((r, i) => {
    out[tasks[i][0]] = r.status === 'fulfilled' ? r.value : { state: 'unavailable', note: 'task rejected' };
  });
  return out;
}
