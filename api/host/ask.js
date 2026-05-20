const MAX_PROMPT_CHARS = 1600;
const MAX_CONTEXT_CHARS = 4800;

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        state: 'not_configured',
        text: 'Host AI is not configured on this deployment. No AI advice is being invented.',
        chips: [{ label: 'tool: openrouter', ref: 'not_configured' }],
      })
    );
    return;
  }

  const body = await readJson(req);
  const prompt = String(body?.prompt ?? '').slice(0, MAX_PROMPT_CHARS).trim();
  const role = String(body?.role ?? 'unknown');
  const workspace = String(body?.workspace ?? 'unknown');
  const context = JSON.stringify(body?.context ?? {}).slice(0, MAX_CONTEXT_CHARS);

  if (!prompt) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'missing_prompt' }));
    return;
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'http-referer': 'https://quick-aid-sg.vercel.app',
        'x-title': 'Quick Aid SG',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL_DEV || 'minimax/minimax-m2.5',
        messages: [
          {
            role: 'system',
            content: systemPromptFor(role, workspace),
          },
          {
            role: 'user',
            content: `context=${context}\n\nrequest=${prompt}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
    });

    if (!upstream.ok) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          state: 'unavailable',
          text: `Host AI unavailable from provider: HTTP ${upstream.status}.`,
          chips: [{ label: 'tool: openrouter', ref: 'unavailable' }],
        })
      );
      return;
    }

    const data = await upstream.json();
    const rawText = data?.choices?.[0]?.message?.content?.trim();
    const text = normalizeHostText(rawText);
    const fallback = fallbackGuidance(body?.context);
    const usable = text && text.length >= 40 && !looksLikeDump(text);
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        state: 'live',
        text: usable ? text : fallback,
        chips: [
          { label: 'tool: openrouter', ref: 'live' },
          ...(usable ? [] : [{ label: 'tool: safety_fallback', ref: 'ai_output_incomplete' }]),
        ],
      })
    );
  } catch (error) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        state: 'unavailable',
        text: `Host AI unavailable: ${error?.message ?? 'provider request failed'}.`,
        chips: [{ label: 'tool: openrouter', ref: 'unavailable' }],
      })
    );
  }
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 20_000) req.destroy();
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

function systemPromptFor(role, workspace) {
  const NEVER_INVENT = 'Never invent values not present in context. If a value is missing, write exactly: unavailable';
  const SG_EMERGENCY = 'Singapore emergency: 995 fire/ambulance · 999 police threat.';

  if (workspace === 'citizen_ai' || workspace === 'incident_guidance') {
    return [
      'You are the Quick Aid SG safety advisor. Role: citizen during an active Singapore alert.',
      NEVER_INVENT,
      'Output 3 plain-text sections: Situation · Do now · If worse. Max 3 bullets each. No markdown bold, no tables, no raw JSON.',
      SG_EMERGENCY + ' Always include if event severity is 3 or above.',
      'Use currentEvent.title, currentEvent.kind, currentEvent.severity from context. If no event, give generic safe-distance advice.',
    ].join(' ');
  }

  if (workspace === 'case_lobby') {
    return [
      'You are the Quick Aid SG Host AI embedded in a responder case room.',
      'Supported slash commands: /host status · /host nearest aed · /host hospital load · /host weather · /host escalate? · /host help.',
      NEVER_INVENT,
      'Use case.name, case.state, case.severity, and the responders array from context for /host status.',
      'For /host weather use liveSnapshot.psi if present. For /host hospital load always say unavailable — no real source is wired.',
      'For /host nearest aed say unavailable — OneMap theme is not yet wired.',
      'For /host escalate? base your yes/no on case.severity and any sos entries if present in context. No invented facts.',
      'Reply in ≤ 6 terse lines. Plain text only.',
    ].join(' ');
  }

  return [
    'You are the Quick Aid SG Host AI. Role: ' + role + '.',
    NEVER_INVENT,
    'Plain text only. No markdown tables, no raw JSON. ≤ 8 lines.',
    SG_EMERGENCY,
  ].join(' ');
}

function normalizeHostText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function looksLikeDump(text) {
  const tableLines = text.split('\n').filter((line) => line.includes('|')).length;
  return tableLines >= 2 || text.includes('{') || text.includes('```');
}

function fallbackGuidance(context) {
  const current = context?.currentAlert ?? context?.currentEvent ?? context?.nearbyAlerts?.[0] ?? {};
  const user = context?.userStatus ?? {};
  const kind = String(current.kind ?? 'other');
  const title = current.title ? String(current.title) : 'Current alert';
  const severity = current.severity ? String(current.severity) : 'severity unavailable';
  const distance = Number.isFinite(current.distanceKm) ? `${current.distanceKm} km away` : 'distance unavailable';
  const liveValue = current.liveValue && current.liveValue !== 'unavailable' ? String(current.liveValue) : 'unavailable';
  const locationSource = user.location?.source === 'browser_live_gps'
    ? 'your live device location'
    : 'fallback location only; your real location is unavailable';
  const action = actionForKind(kind);

  return [
    'Situation',
    `- ${title} is ${distance}. Severity: ${severity}.`,
    `- Live measurement: ${liveValue}. Location basis: ${locationSource}.`,
    '',
    'Do now',
    `- ${action.primary}`,
    `- ${action.secondary}`,
    '',
    'If worse',
    `- ${action.escalate}`,
    '- Call 995 for fire/ambulance rescue or 999 for immediate police threat.',
  ].join('\n');
}

function actionForKind(kind) {
  if (kind === 'flood') {
    return {
      primary: 'Stay out of floodwater and avoid underpasses, drains, canals, and low roads.',
      secondary: 'Move to higher ground or remain indoors if your route crosses standing or moving water.',
      escalate: 'If water is rising near you or someone is trapped, leave early if safe and request rescue.',
    };
  }
  if (kind === 'crash' || kind === 'traffic') {
    return {
      primary: 'Stay off live lanes and keep behind a barrier or inside a safe building.',
      secondary: 'Do not approach vehicles unless emergency services instruct you and it is safe.',
      escalate: 'If there are injuries, fire, fuel leaks, or blocked traffic creating danger, call emergency services.',
    };
  }
  if (kind === 'fire') {
    return {
      primary: 'Move away from smoke and heat; use stairs, not lifts, if evacuation is safe.',
      secondary: 'Close doors behind you and stay low if smoke is present.',
      escalate: 'If trapped, call 995, state your exact location, and signal from a window if possible.',
    };
  }
  if (kind === 'medical') {
    return {
      primary: 'Check responsiveness and breathing from a safe position.',
      secondary: 'Call 995 and follow dispatcher instructions; start CPR only if trained and safe.',
      escalate: 'Send someone for an AED if cardiac arrest is suspected.',
    };
  }
  if (kind === 'hazard') {
    return {
      primary: 'Move upwind and uphill from smoke, spills, fallen wires, or unstable debris.',
      secondary: 'Do not touch unknown substances, cables, or damaged structures.',
      escalate: 'If people are exposed, trapped, or the hazard is spreading, call 995.',
    };
  }
  return {
    primary: 'Increase distance from the alert area and observe from a safe place.',
    secondary: 'Follow official instructions and avoid entering restricted or unstable areas.',
    escalate: 'If there is immediate danger, injury, fire, or threat, contact emergency services.',
  };
}
