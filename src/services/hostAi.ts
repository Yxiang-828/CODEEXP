export interface HostAiChip {
  label: string;
  ref: string;
}

export interface HostAiResponse {
  state: 'live' | 'not_configured' | 'unavailable';
  text: string;
  chips?: HostAiChip[];
}

export interface HostAiRequest {
  role: string;
  workspace: string;
  prompt: string;
  context?: unknown;
  /** Skip OpenRouter — run tool prefetch + deterministic fallback text only. */
  toolsOnly?: boolean;
}

export async function askHostAi(request: HostAiRequest): Promise<HostAiResponse> {
  const controller = new AbortController();
  const timeoutMs = request.toolsOnly ? 12_000 : 45_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('/api/host/ask', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({} as HostAiResponse));

    if (!response.ok) {
      return {
        state: 'unavailable',
        text: typeof data.text === 'string' && data.text
          ? data.text
          : `Host AI unavailable: backend returned HTTP ${response.status}.`,
        chips: data.chips ?? [{ label: 'tool: host_ai', ref: 'unavailable' }],
      };
    }

    return {
      state: data.state ?? 'unavailable',
      text: data.text ?? '',
      chips: data.chips,
    };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    return {
      state: 'unavailable',
      text: timedOut
        ? 'Host AI timed out. Try /host help or a shorter command.'
        : 'Host AI unreachable: network error. Try again in a moment.',
      chips: [{ label: 'tool: host_ai', ref: 'unavailable' }],
    };
  } finally {
    clearTimeout(timer);
  }
}
