const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787';
const WS_BASE = BASE.replace(/^http/, 'ws');

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getState: () => req<AppStatePayload>('GET', '/api/state'),

  patchResponder: (id: string, patch: ResponderPatch) =>
    req('PATCH', `/api/responders/${id}`, patch),

  createEvent: (body: CreateEventBody) =>
    req('POST', '/api/events', body),
  patchEvent: (id: string, patch: EventPatch) =>
    req('PATCH', `/api/events/${id}`, patch),
  assignEvent: (id: string, responderId: string) =>
    req('POST', `/api/events/${id}/assign`, { responderId }),

  createSos: (body: CreateSosBody) =>
    req('POST', '/api/sos', body),
  patchSos: (id: string, patch: SosPatch) =>
    req('PATCH', `/api/sos/${id}`, patch),

  createReport: (body: CreateReportBody) =>
    req('POST', '/api/reports', body),
  patchReport: (id: string, status: string, claimedBy?: string) =>
    req('PATCH', `/api/reports/${id}`, { status, claimedBy }),

  createCase: (body: CreateCaseBody) =>
    req('POST', '/api/cases', body),
  patchCase: (id: string, patch: CasePatch) =>
    req('PATCH', `/api/cases/${id}`, patch),
  postChat: (caseId: string, body: PostChatBody) =>
    req('POST', `/api/cases/${caseId}/chat`, body),
  getCaseChat: (caseId: string) =>
    req<unknown[]>('GET', `/api/cases/${caseId}/chat`),
};

export type WsHandler = (type: string, payload: unknown) => void;

export function connectWs(onMessage: WsHandler): () => void {
  let ws: WebSocket | null = null;
  let dead = false;
  let pingInterval: ReturnType<typeof setInterval>;

  const connect = () => {
    ws = new WebSocket(`${WS_BASE}/ws`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { type: string; payload: unknown };
        onMessage(msg.type, msg.payload);
      } catch {}
    };
    ws.onclose = () => {
      if (!dead) setTimeout(connect, 3000);
    };
    ws.onerror = () => ws?.close();
    pingInterval = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);
  };

  connect();
  return () => {
    dead = true;
    clearInterval(pingInterval);
    ws?.close();
  };
}

export interface AppStatePayload {
  responders: unknown[];
  events: unknown[];
  sosSessions: unknown[];
  reports: unknown[];
  cases: unknown[];
  chat: unknown[];
}
interface ResponderPatch { status?: string; location?: object; assignedSosId?: string | null; assignedEventId?: string | null; }
interface CreateEventBody { kind: string; title: string; severity: number; location: object; area?: object[]; source?: string; }
interface EventPatch { status?: string; title?: string; severity?: number; assignedResponderIds?: string[]; }
interface CreateSosBody { citizenName: string; category: string; location: object; }
interface SosPatch { status?: string; assignedResponderId?: string; }
interface CreateReportBody { kind: string; title: string; body: string; location: object; reporterId?: string; }
interface CreateCaseBody { name: string; severity: number; restricted?: boolean; source?: string; }
interface CasePatch { state?: string; members?: string[]; }
interface PostChatBody { authorId: string; authorName: string; text: string; isHost?: boolean; }
