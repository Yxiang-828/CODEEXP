// Structured Host tool lookup — no LLM. POST { tools, origin } → { tools: {...} }.
import { runTools } from './tools.js';

const ALLOWED = new Set(['psi', 'rainfall', 'nearestAed', 'nearestHospital']);

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : await readJson(req);
  const requested = Array.isArray(body?.tools) ? body.tools : [];
  const tools = requested.filter((name) => ALLOWED.has(String(name)));
  const origin = pickOrigin(body?.origin);

  if (tools.length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'missing_tools', allowed: [...ALLOWED] }));
    return;
  }

  const result = await runTools(tools, { origin });
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, tools: result }));
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 32_000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function pickOrigin(loc) {
  if (!loc || typeof loc !== 'object') return null;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
