const MAX_PROMPT_CHARS = 1600;

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
  const context = JSON.stringify(body?.context ?? {}).slice(0, 2400);

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
            content:
              'You are Quick Aid SG Host AI. Give short, role-specific emergency workflow guidance for Singapore. Do not invent live facts, agencies, routes, hospital loads, or device counts. If data is missing, say unavailable and give a safe next step.',
          },
          {
            role: 'user',
            content: `role=${role}\nworkspace=${workspace}\ncontext=${context}\n\nrequest=${prompt}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 220,
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
    const text = data?.choices?.[0]?.message?.content?.trim();
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        state: 'live',
        text: text || 'Host AI returned no usable guidance.',
        chips: [{ label: 'tool: openrouter', ref: 'live' }],
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
