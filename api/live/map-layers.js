const CACHE_MS = 5 * 60_000;
const MIN_PROVIDER_INTERVAL_MS = 30_000;
const MAX_CALLS_PER_HOUR = {
  onemap: 12,
  datamall: 12,
};

let cache = null;
let quota = {
  onemap: [],
  datamall: [],
};

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 's-maxage=120, stale-while-revalidate=300');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_MS) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ...cache, cached: true }));
    return;
  }

  const response = {
    fetchedAt: now,
    cached: false,
    hospitals: [],
    aeds: [],
    traffic: [],
    speedBands: [],
    mrt: mrtStatus(),
    sources: [],
  };

  const [oneMapResult, dataMallResult] = await Promise.allSettled([
    fetchOneMapLayers(now),
    fetchDataMallLayers(now),
  ]);

  if (oneMapResult.status === 'fulfilled') {
    response.hospitals = oneMapResult.value.hospitals;
    response.aeds = oneMapResult.value.aeds;
    response.sources.push(...oneMapResult.value.sources);
  } else {
    response.sources.push(source('OneMap', 'down', oneMapResult.reason?.message ?? 'OneMap fetch failed'));
  }

  if (dataMallResult.status === 'fulfilled') {
    response.traffic = dataMallResult.value.traffic;
    response.speedBands = dataMallResult.value.speedBands;
    response.sources.push(...dataMallResult.value.sources);
  } else {
    response.sources.push(source('LTA DataMall', 'down', dataMallResult.reason?.message ?? 'DataMall fetch failed'));
  }

  cache = response;
  res.statusCode = 200;
  res.end(JSON.stringify(response));
}

async function fetchOneMapLayers(now) {
  if (!process.env.ONEMAP_API_KEY) {
    return {
      hospitals: [],
      aeds: [],
      sources: [source('OneMap POIs', 'not_configured', 'ONEMAP_API_KEY is not set on this deployment.')],
    };
  }
  guardProvider('onemap', now, 'OneMap hospitals/AED map layer');
  const headers = { Authorization: process.env.ONEMAP_API_KEY, accept: 'application/json' };
  const base = 'https://www.onemap.gov.sg/api/public/themesvc/retrieveTheme';
  const [hospitalResponse, aedResponse] = await Promise.all([
    fetch(`${base}?queryName=moh_hospitals`, { headers }),
    fetch(`${base}?queryName=aed_locations&extents=1.20,103.60,1.48,104.05`, { headers }),
  ]);
  const sources = [];
  const hospitals = [];
  const aeds = [];

  if (hospitalResponse.ok) {
    const data = await hospitalResponse.json();
    hospitals.push(...themeRows(data).map((row, i) => toPoi(row, `H-LIVE-${i}`, 'hospital')).filter(Boolean));
    sources.push(source('OneMap moh_hospitals', 'fresh', `${hospitals.length} hospital POIs returned.`));
  } else {
    sources.push(source('OneMap moh_hospitals', 'down', await shortText(hospitalResponse)));
  }

  if (aedResponse.ok) {
    const data = await aedResponse.json();
    const sampled = spatialSample(themeRows(data), 400);
    aeds.push(...sampled.map((row, i) => toPoi(row, `AED-LIVE-${i}`, 'aed')).filter(Boolean));
    sources.push(source('OneMap aed_locations', 'fresh', `${aeds.length} AED POIs returned (spatially sampled island-wide).`));
  } else {
    sources.push(source('OneMap aed_locations', 'down', await shortText(aedResponse)));
  }

  return { hospitals, aeds, sources };
}

async function fetchDataMallLayers(now) {
  if (!process.env.DATAMALL_ACCOUNT_KEY) {
    return {
      traffic: [],
      speedBands: [],
      sources: [source('LTA DataMall', 'not_configured', 'DATAMALL_ACCOUNT_KEY is not set on this deployment.')],
    };
  }
  guardProvider('datamall', now, 'DataMall traffic map layer');
  const headers = { AccountKey: process.env.DATAMALL_ACCOUNT_KEY, accept: 'application/json' };
  const base = 'https://datamall2.mytransport.sg/ltaodataservice';
  const [incidentResponse, speedResponse] = await Promise.all([
    fetch(`${base}/TrafficIncidents`, { headers }),
    fetch(`${base}/v4/TrafficSpeedBands?$top=80`, { headers }),
  ]);
  const sources = [];
  const traffic = [];
  const speedBands = [];

  if (incidentResponse.ok) {
    const data = await incidentResponse.json();
    traffic.push(...(Array.isArray(data?.value) ? data.value : []).map(toTrafficIncident).filter(Boolean));
    sources.push(source('DataMall TrafficIncidents', 'fresh', `${traffic.length} live traffic incidents returned.`));
  } else {
    sources.push(source('DataMall TrafficIncidents', 'down', await shortText(incidentResponse)));
  }

  if (speedResponse.ok) {
    const data = await speedResponse.json();
    speedBands.push(...(Array.isArray(data?.value) ? data.value : []).map(toSpeedBand).filter(Boolean).slice(0, 80));
    sources.push(source('DataMall TrafficSpeedBands', 'fresh', `${speedBands.length} speed-band rows returned; capped at 80.`));
  } else {
    sources.push(source('DataMall TrafficSpeedBands', 'down', await shortText(speedResponse)));
  }

  return { traffic, speedBands, sources };
}

function guardProvider(provider, now, reason) {
  const hits = quota[provider].filter((hit) => now - hit.at < 60 * 60_000);
  const previous = hits.at(-1);
  if (previous && now - previous.at < MIN_PROVIDER_INTERVAL_MS) {
    throw new Error(`${provider} rate_limited: ${reason}. Blocked to protect API quota.`);
  }
  if (hits.length >= MAX_CALLS_PER_HOUR[provider]) {
    throw new Error(`${provider} rate_limited: ${reason}. Hourly cap reached to protect API quota.`);
  }
  hits.push({ at: now, reason });
  quota[provider] = hits;
}

function spatialSample(rows, maxTotal) {
  const BINS = 20;
  const lngMin = 103.60, lngMax = 104.07;
  const buckets = Array.from({ length: BINS }, () => []);
  for (const row of rows) {
    const point = parseLatLng(row.LatLng);
    if (!point) continue;
    const bin = Math.min(BINS - 1, Math.floor((point.lng - lngMin) / (lngMax - lngMin) * BINS));
    buckets[bin].push(row);
  }
  const perBin = Math.ceil(maxTotal / BINS);
  const result = [];
  for (const bucket of buckets) result.push(...bucket.slice(0, perBin));
  return result.slice(0, maxTotal);
}

function themeRows(data) {
  const rows = Array.isArray(data?.SrchResults) ? data.SrchResults : [];
  return rows.filter((row) => row && !('FeatCount' in row));
}

function toPoi(row, id, kind) {
  const point = parseLatLng(row.LatLng);
  if (!point) return null;
  const name =
    row.NAME ||
    row.DESCRIPTION ||
    row.HCI_NAME ||
    row.MAPTIP ||
    (kind === 'hospital' ? 'Hospital' : 'AED');
  return {
    id,
    kind,
    name: String(name).slice(0, 42),
    detail: `${kind === 'hospital' ? 'Hospital' : 'Public AED'} · LIVE OneMap`,
    lng: point.lng,
    lat: point.lat,
    source: 'live',
  };
}

function toTrafficIncident(row, index) {
  const lat = Number(row.Latitude);
  const lng = Number(row.Longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const type = row.Type || 'Traffic incident';
  return {
    id: `TR-LIVE-${index}`,
    kind: 'traffic',
    name: String(type).slice(0, 32),
    detail: `${row.Message || type} · LIVE DataMall`.slice(0, 120),
    lng,
    lat,
    tone: trafficTone(type, row.Message),
    source: 'live',
  };
}

function toSpeedBand(row, index) {
  const startLat = Number(row.StartLat);
  const startLng = Number(row.StartLon);
  const endLat = Number(row.EndLat);
  const endLng = Number(row.EndLon);
  if (![startLat, startLng, endLat, endLng].every(Number.isFinite)) return null;
  const speedBand = Number(row.SpeedBand);
  return {
    id: `SB-LIVE-${index}`,
    name: row.RoadName || row.LinkID || 'Road speed',
    detail: `Speed band ${row.SpeedBand}; ${row.MinimumSpeed ?? '?'}-${row.MaximumSpeed ?? '?'} km/h · LIVE DataMall`,
    lng: (startLng + endLng) / 2,
    lat: (startLat + endLat) / 2,
    tone: speedBand <= 2 ? 'critical' : speedBand <= 4 ? 'warning' : 'ok',
    source: 'live',
  };
}

function trafficTone(type = '', message = '') {
  const text = `${type} ${message}`.toLowerCase();
  if (text.match(/accident|road block|roadwork|vehicle breakdown|obstacle/)) return 'critical';
  if (text.match(/heavy|slow|congestion|jam/)) return 'warning';
  return 'warning';
}

function parseLatLng(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const [a, b] = match[0].split(',').map((v) => Number(v.trim()));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a > 90) return { lng: a, lat: b };
  return { lng: b, lat: a };
}

function mrtStatus() {
  return [
    {
      id: 'MRT-EW',
      name: 'EWL crowding',
      detail: 'MRT congestion · no live source wired',
      tone: 'warning',
      source: 'demo',
      path: [
        [103.7423, 1.3331],
        [103.772, 1.317],
        [103.8198, 1.307],
        [103.8521, 1.2931],
        [103.9493, 1.3401],
      ],
    },
    {
      id: 'MRT-NS',
      name: 'NSL normal',
      detail: 'MRT congestion · no live source wired',
      tone: 'ok',
      source: 'demo',
      path: [
        [103.8386, 1.4245],
        [103.8469, 1.3214],
        [103.8521, 1.2931],
      ],
    },
  ];
}

function source(name, state, note) {
  return { name, state, note, checkedAt: Date.now() };
}

async function shortText(response) {
  const text = await response.text();
  return `HTTP ${response.status}: ${text.slice(0, 180)}`;
}
