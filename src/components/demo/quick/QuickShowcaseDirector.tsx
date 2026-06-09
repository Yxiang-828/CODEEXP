import { useEffect, useMemo, useRef, useState } from 'react';
import { MousePointer2, Pause, Play, Radio, ShieldCheck, Square, Timer, UserRound, X } from 'lucide-react';
import type { DemoWindow } from './domPuppet';
import { cleanText, DemoStopped, INCIDENT_LOCATION } from './domPuppet';
import {
  fadeOutIntroMusic,
  pauseDemoAudio,
  pauseIntroMusic,
  playIntroMusic,
  playQuickVoice,
  playSfx,
  QUICK_VOICE_PLAYBACK_RATE,
  resumeDemoAudio,
  resumeIntroMusic,
  stopIntroMusic,
  stopQwenScene,
  unlockDemoAudio,
  verifyQuickVoicePack,
} from './quickDemoAudio';
import './quickShowcase.css';

type RoleKey = 'resident' | 'responder' | 'ops';
type Camera = RoleKey | 'all';
type Phase = 'idle' | 'preparing' | 'ready' | 'running' | 'cleaning' | 'complete' | 'failed';

interface CutsceneCard { id: number; image: string; title: string; detail: string }
interface PresentationCard { id: number; eyebrow: string; title: string; headline: string; detail: string; image?: string }
interface TransitionStamp { id: number; mark: string; label: string }

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL ?? '';
// Soft target. The user approved ~75–90s; narration always plays in full, only
// optional flourishes are skipped if we drift past the deadline.
const RUN_BUDGET_MS = 84000;

const ACTOR_LOCATIONS: Record<RoleKey, { lng: number; lat: number }> = {
  resident: INCIDENT_LOCATION,
  responder: { lng: 103.8588, lat: 1.3074 },
  ops: { lng: 103.8198, lat: 1.3521 },
};

const actors: Record<RoleKey, { name: string; roleLabel: string; icon: typeof UserRound }> = {
  resident: { name: 'Mei Ling', roleLabel: 'Citizen', icon: UserRound },
  responder: { name: 'Aisha', roleLabel: 'Responder', icon: Radio },
  ops: { name: 'Nadia', roleLabel: 'Ops', icon: ShieldCheck },
};

const speakerProfiles = [
  { match: 'Mei Ling', name: 'Mei Ling', role: 'Citizen', image: '/demo/personas/mei-ling.png', ai: false },
  { match: 'Aisha', name: 'Aisha', role: 'Responder', image: '/demo/personas/aisha.png', ai: false },
  { match: 'Nadia', name: 'Nadia', role: 'Ops', image: '/demo/personas/nadia.png', ai: false },
  { match: 'Pelita', name: 'Pelita', role: 'AI Kaki · conditions', image: null, ai: true },
  { match: 'Bekal', name: 'Bekal', role: 'AI Kaki · SOS companion', image: null, ai: true },
  { match: 'Director', name: 'Director', role: 'Narrator', image: null, ai: true },
];
const speakerProfile = (speaker: string) =>
  speakerProfiles.find((p) => speaker.includes(p.match)) ?? speakerProfiles[speakerProfiles.length - 1];

const rawSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PELITA_PROMPT = 'How is it looking around me right now near the MRT exit?';
const BEKAL_PROMPT =
  'Elderly man collapsed after e-bike smoke at Nicoll Highway MRT Exit B. I am the witness; he is the casualty. Which AED and A&E hospital should bystanders use, and what should I do while Aisha is coming?';

export default function QuickShowcaseDirector({ autostart, onExit }: { autostart: boolean; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<RoleKey>>(new Set());
  const [camera, setCamera] = useState<Camera>('resident');
  const [speaker, setSpeaker] = useState('Director');
  const [caption, setCaption] = useState('A sixty-second live story across three roles on one map.');
  const [chapter, setChapter] = useState('Ready');
  const [mark, setMark] = useState('00:00');
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cutscene, setCutscene] = useState<CutsceneCard | null>(null);
  const [presentationCard, setPresentationCard] = useState<PresentationCard | null>(null);
  const [transitionStamp, setTransitionStamp] = useState<TransitionStamp | null>(null);
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, visible: false, down: false });

  const frameRefs = useRef<Record<RoleKey, HTMLIFrameElement | null>>({ resident: null, responder: null, ops: null });
  const pausedRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const autostartPreparedRef = useRef(false);
  const autostartRunRef = useRef(false);
  const deadlineRef = useRef(0);
  const runStartRef = useRef(0);
  const cutsceneIdRef = useRef(0);
  const cardIdRef = useRef(0);
  const stampIdRef = useRef(0);
  const tickRef = useRef<number | null>(null);

  const fast = useMemo(() => new URLSearchParams(window.location.search).get('pace') === 'fast', []);

  const checkpoint = () => { if (stopRequestedRef.current) throw new DemoStopped(); };
  const remainingMs = () => (deadlineRef.current <= 0 ? Number.MAX_SAFE_INTEGER : Math.max(0, deadlineRef.current - Date.now()));

  // Deadline-aware wait (for optional pacing gaps).
  const wait = async (ms: number) => {
    let remaining = Math.min(ms, remainingMs());
    while (remaining > 0) {
      checkpoint();
      if (pausedRef.current) { await rawSleep(80); continue; }
      const slice = Math.min(remaining, 80);
      await rawSleep(slice);
      remaining -= slice;
    }
    checkpoint();
  };
  // Plain wait that ignores the deadline (used so narration is never cut short).
  const holdWait = async (ms: number) => {
    let remaining = ms;
    while (remaining > 0) {
      checkpoint();
      if (pausedRef.current) { await rawSleep(80); continue; }
      const slice = Math.min(remaining, 80);
      await rawSleep(slice);
      remaining -= slice;
    }
  };

  const frameDocument = (role: RoleKey): Document => {
    const doc = frameRefs.current[role]?.contentDocument;
    if (!doc) throw new Error(`${role} app is not ready`);
    return doc;
  };
  const frameWindow = (role: RoleKey): DemoWindow => {
    const win = frameRefs.current[role]?.contentWindow as DemoWindow | null;
    if (!win) throw new Error(`${role} app window is not ready`);
    return win;
  };

  const visible = <T extends Element>(el: T | null | undefined): T | null => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? el : null;
  };

  const waitFor = async <T,>(read: () => T | null | undefined, label: string, timeout = 15000): Promise<T> => {
    let elapsed = 0;
    while (elapsed < timeout) {
      checkpoint();
      const value = read();
      if (value) return value;
      await rawSleep(120);
      elapsed += 120;
    }
    throw new Error(`Timed out waiting for ${label}`);
  };

  const reveal = async (role: RoleKey, el: Element) => {
    const doc = frameDocument(role);
    const r = el.getBoundingClientRect();
    const vh = doc.documentElement.clientHeight || frameWindow(role).innerHeight;
    const vw = doc.documentElement.clientWidth || frameWindow(role).innerWidth;
    if (r.top < 16 || r.left < 16 || r.bottom > vh - 16 || r.right > vw - 16) {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      await wait(fast ? 30 : 160);
    }
  };

  const button = (role: RoleKey, text: string, exact = false): HTMLButtonElement | null => {
    const target = cleanText(text).toLowerCase();
    return Array.from(frameDocument(role).querySelectorAll('button'))
      .map((el) => visible(el))
      .find((el) => {
        if (!el || el.disabled) return false;
        const content = cleanText(el.textContent).toLowerCase();
        return exact ? content === target : content.includes(target);
      }) ?? null;
  };

  const inputByPlaceholder = (role: RoleKey, text: string): HTMLInputElement | HTMLTextAreaElement | null => {
    const target = text.toLowerCase();
    return Array.from(frameDocument(role).querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'))
      .map((el) => visible(el))
      .find((el) => el?.placeholder.toLowerCase().includes(target)) ?? null;
  };

  const moveCursor = async (role: RoleKey, el: Element) => {
    const frame = frameRefs.current[role];
    if (!frame) return;
    await reveal(role, el);
    const fr = frame.getBoundingClientRect();
    const t = el.getBoundingClientRect();
    const sx = frame.offsetWidth > 0 ? fr.width / frame.offsetWidth : 1;
    const sy = frame.offsetHeight > 0 ? fr.height / frame.offsetHeight : 1;
    setCursor({ x: fr.left + (t.left + t.width / 2) * sx, y: fr.top + (t.top + t.height / 2) * sy, visible: true, down: false });
    await wait(fast ? 60 : 240);
  };

  const moveCursorToFramePoint = async (role: RoleKey, point: { x: number; y: number }) => {
    const frame = frameRefs.current[role];
    if (!frame) return;
    const fr = frame.getBoundingClientRect();
    const sx = frame.offsetWidth > 0 ? fr.width / frame.offsetWidth : 1;
    const sy = frame.offsetHeight > 0 ? fr.height / frame.offsetHeight : 1;
    setCursor({ x: fr.left + point.x * sx, y: fr.top + point.y * sy, visible: true, down: false });
    await wait(fast ? 60 : 360);
  };

  const click = async (role: RoleKey, read: () => HTMLElement | null, label: string) => {
    const el = await waitFor(read, label);
    await moveCursor(role, el);
    setCursor((c) => ({ ...c, down: true }));
    el.click();
    await wait(fast ? 50 : 120);
    setCursor((c) => ({ ...c, down: false }));
    await wait(fast ? 60 : 160);
  };

  const fill = async (role: RoleKey, read: () => HTMLInputElement | HTMLTextAreaElement | null, value: string, label: string) => {
    const el = await waitFor(read, label);
    await moveCursor(role, el);
    el.focus();
    const ownerWindow = el.ownerDocument.defaultView;
    if (!ownerWindow) throw new Error(`${label} has no owning window`);
    const proto = el.tagName === 'TEXTAREA' ? ownerWindow.HTMLTextAreaElement.prototype : ownerWindow.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(fast ? 50 : 140);
  };

  const switchCamera = async (next: Camera, nextChapter: string, nextMark: string) => {
    setCamera(next);
    setChapter(nextChapter);
    setMark(nextMark);
    setCursor((c) => ({ ...c, visible: false }));
    await wait(fast ? 80 : 380);
  };

  const api = async <T,>(path: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${BRIDGE_URL}${path}`, options);
    if (!res.ok) throw new Error(`${path} returned HTTP ${res.status}`);
    return res.json() as Promise<T>;
  };

  // Warm the local model so the demo-time agent replies come back quickly.
  const prewarmAgents = () => {
    for (const agent of ['pelita', 'bekal'] as const) {
      void fetch(`${BRIDGE_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agent, role: 'citizen', location: INCIDENT_LOCATION, message: 'warm up', history: [] }),
      }).catch(() => {});
    }
  };

  // --- Narration: always plays the full Qwen line; never clamped by the deadline. ---
  const voiceFallbackMs = (text: string) =>
    Math.min(8000, Math.max(2600, text.length * 52)) / QUICK_VOICE_PLAYBACK_RATE;

  const narrate = async (sceneId: string, nextSpeaker: string, text: string) => {
    setSpeaker(nextSpeaker);
    setCaption(text);
    if (fast) { await holdWait(180); return; }
    const played = await playQuickVoice(sceneId);
    checkpoint();
    if (!played) await holdWait(voiceFallbackMs(text));
  };

  /** Speak and perform UI at the same time — show, don't tell-then-show. */
  const narrateWith = async (
    sceneId: string,
    nextSpeaker: string,
    text: string,
    action: () => Promise<unknown>,
  ) => {
    setSpeaker(nextSpeaker);
    setCaption(text);
    if (fast) {
      await action();
      await holdWait(180);
      checkpoint();
      return;
    }
    const speak = (async () => {
      const played = await playQuickVoice(sceneId);
      if (!played) await holdWait(voiceFallbackMs(text));
    })();
    await Promise.all([speak, action()]);
    checkpoint();
  };

  // --- Cinematic overlays (cover the iframe region only; the caption bar stays). ---
  const flashTransition = async (nextMark: string, label: string, sfx: Parameters<typeof playSfx>[0]) => {
    const id = ++stampIdRef.current;
    setTransitionStamp({ id, mark: nextMark, label });
    void playSfx(sfx);
    await wait(fast ? 280 : 920);
    setTransitionStamp((c) => (c?.id === id ? null : c));
  };

  const flashCutscene = async (image: string, title: string, detail: string, holdMs: number) => {
    const id = ++cutsceneIdRef.current;
    setCutscene({ id, image, title, detail });
    await holdWait(fast ? 700 : holdMs);
    setCutscene((c) => (c?.id === id ? null : c));
    await wait(fast ? 40 : 140);
  };

  /** Hold a cutscene on screen while async work (usually voice) runs underneath. */
  const flashCutsceneWhile = async (
    image: string,
    title: string,
    detail: string,
    during: () => Promise<unknown>,
  ) => {
    const id = ++cutsceneIdRef.current;
    setCutscene({ id, image, title, detail });
    await during();
    setCutscene((c) => (c?.id === id ? null : c));
    await wait(fast ? 40 : 140);
  };

  const flashPresentationCard = async (eyebrow: string, title: string, headline: string, detail: string, image: string | undefined, holdMs: number) => {
    const id = ++cardIdRef.current;
    setPresentationCard({ id, eyebrow, title, headline, detail, image });
    await holdWait(fast ? 700 : holdMs);
    setPresentationCard((c) => (c?.id === id ? null : c));
    await wait(fast ? 40 : 140);
  };

  const layerPanelOpen = (role: RoleKey) => cleanText(frameDocument(role).body.textContent).includes('Care & rescue');
  const collapseLayerPanel = async (role: RoleKey) => {
    if (layerPanelOpen(role)) {
      const collapse = button(role, 'Layers');
      if (collapse) await click(role, () => collapse, `${role} collapse layers`);
    }
  };

  // Toggle a real data layer on (which activates its live API feed), then isolate
  // the nearest real feature on the map. Returns false when the live feed had
  // nothing near the incident so the caller can skip gracefully.
  const inspectLayer = async (role: RoleKey, layerId: string, toggleLabel: string, spokenLabel: string, holdMs = 1700): Promise<boolean> => {
    const VIEW_ZOOM = 13.7;   // gentle — keeps the neighbourhood in frame, not street-level.
    frameWindow(role).__kkMapDemo?.focusLocation(INCIDENT_LOCATION, VIEW_ZOOM);
    const target = toggleLabel.toLowerCase();
    const read = () => Array.from(frameDocument(role).querySelectorAll<HTMLButtonElement>('button'))
      .map((el) => visible(el))
      .find((el) => cleanText(el?.textContent).toLowerCase().includes(target)) ?? null;
    let layer = read();
    if (!layer) { const panel = button(role, 'Layers'); if (panel) await click(role, () => panel, `${role} layers panel`); }
    try {
      layer = await waitFor(read, `${spokenLabel} toggle`, 8000);
    } catch {
      await collapseLayerPanel(role);
      return false;
    }
    if (!String(layer.className).includes('bg-surface-3')) await click(role, () => layer as HTMLElement, `enable ${spokenLabel}`);
    else await moveCursor(role, layer);
    await collapseLayerPanel(role);
    await wait(fast ? 80 : 260);
    let sample = frameWindow(role).__kkMapDemo?.showLayerSample(layerId, INCIDENT_LOCATION, VIEW_ZOOM) ?? null;
    if (!sample) return false;
    await wait(fast ? 60 : 240);
    sample = frameWindow(role).__kkMapDemo?.showLayerSample(layerId, INCIDENT_LOCATION, VIEW_ZOOM) ?? sample;
    await moveCursorToFramePoint(role, sample);
    await holdWait(fast ? 500 : holdMs);
    frameWindow(role).__kkMapDemo?.clearEvidence();
    return true;
  };

  const aiKakiOpen = (role: RoleKey): boolean => {
    try {
      return Array.from(frameDocument(role).querySelectorAll('div')).some((el) => {
        if (!visible(el)) return false;
        const cls = String(el.className);
        return cls.includes('fixed') && cls.includes('inset-0') && cls.includes('z-30');
      });
    } catch {
      return false;
    }
  };

  // --- AI Kaki, split for the async overlap (ask now, reveal later). ---
  const aiHeader = (role: RoleKey): HTMLElement | null =>
    Array.from(frameDocument(role).querySelectorAll<HTMLElement>('header'))
      .find((node) => ['AI Kaki', 'Pelita', 'Bekal', 'Pondok'].some((n) => cleanText(node.textContent).includes(n))) ?? null;

  const aiBubbleCount = (role: RoleKey) => Array.from(frameDocument(role).querySelectorAll('span'))
    .filter((el) => { const cls = String((el as HTMLElement).className); return cls.includes('rounded-2xl') && cls.includes('px-3.5'); }).length;

  const agentKey = (agentName: 'Pelita' | 'Bekal') => agentName.toLowerCase();
  const agentReplyCount = (role: RoleKey, agentName: 'Pelita' | 'Bekal') =>
    frameWindow(role).__kkAgent?.replyCount(agentKey(agentName)) ?? aiBubbleCount(role);

  // Opens the agent, sends a real question, and returns the assistant-reply count
  // BEFORE the send — our honest baseline for "has it actually answered yet".
  const startAsk = async (role: RoleKey, agentName: 'Pelita' | 'Bekal', prompt: string): Promise<number> => {
    await click(role, () => button(role, 'AI Kaki'), `${role} AI Kaki`);
    await wait(fast ? 40 : 200);
    const header = aiHeader(role);
    const title = cleanText(header?.textContent);
    if (!title.includes(agentName)) {
      if (title && !title.includes('AI Kaki')) {
        const back = header?.querySelector<HTMLButtonElement>('button') ?? null;
        if (back) await click(role, () => back, `${role} AI Kaki back`);
      }
      await click(role, () => button(role, agentName), `${agentName} picker`);
    }
    await fill(role, () => inputByPlaceholder(role, `Ask ${agentName}`), prompt, `${agentName} prompt`);
    const input = await waitFor(() => inputByPlaceholder(role, `Ask ${agentName}`), `${agentName} input`);
    const send = input.parentElement?.querySelector('button') as HTMLButtonElement | null;
    if (!send) throw new Error(`${agentName} send not found`);
    const before = agentReplyCount(role, agentName);
    await click(role, () => send, `${agentName} send`);
    return before;
  };

  // Productive wait: always runs the filler queue first (map layers, narration),
  // then listens for the real reply. Bekal's demo prompt is prerecorded on the
  // server, so the reply is usually already there once fillers finish.
  const waitForAgentReply = async (
    role: RoleKey,
    agentName: 'Pelita' | 'Bekal',
    before: number,
    fillers: Array<() => Promise<unknown>>,
    hardCapMs: number,
  ): Promise<boolean> => {
    const answered = () => agentReplyCount(role, agentName) > before;
    const started = Date.now();
    for (const filler of fillers) {
      try { await filler(); } catch { /* a filler hiccup must not abort the wait */ }
    }
    while (!answered() && Date.now() - started < hardCapMs) {
      checkpoint();
      await rawSleep(fast ? 120 : 350);
    }
    return answered();
  };

  const closeAiKaki = async (role: RoleKey) => {
    const header = aiHeader(role);
    const buttons = header ? Array.from(header.querySelectorAll<HTMLButtonElement>('button')) : [];
    const close = buttons[buttons.length - 1] ?? null;
    if (close) await click(role, () => close, `${role} AI Kaki close`);
  };

  const ensureResponderDuty = async (desired: boolean) => {
    const current = await waitFor(() => button('responder', 'On duty', true) ?? button('responder', 'Off duty', true), 'responder duty state');
    const isOn = cleanText(current.textContent) === 'On duty';
    if (isOn !== desired) {
      await click('responder', () => button('responder', desired ? 'Off duty' : 'On duty', true), desired ? 'go on duty' : 'go off duty');
    } else {
      await moveCursor('responder', current);
    }
  };

  // --- Profile chips (set up matching skills before the clock). ---
  const closeSheet = async (role: RoleKey, heading: string) => {
    const header = Array.from(frameDocument(role).querySelectorAll('header')).find((n) => cleanText(n.textContent).includes(heading));
    const close = header?.querySelector('button') ?? null;
    if (close) await click(role, () => close, `${heading} close`);
  };
  const chipSelected = (el: HTMLElement) => { const cls = String(el.className); return cls.includes('bg-surface-3') || cls.includes('text-text-inverse'); };
  const ensureChip = async (role: RoleKey, label: string) => {
    const chip = await waitFor(() => button(role, label, true), `${role} ${label} chip`);
    if (!chipSelected(chip)) await click(role, () => button(role, label, true), `${role} ${label} chip`);
    else await moveCursor(role, chip);
  };

  const login = async (role: RoleKey, opts?: { quiet?: boolean }) => {
    const actor = actors[role];
    if (!opts?.quiet) await switchCamera(role, `${actor.roleLabel} sign-in`, '00:00');
    await click(role, () => button(role, 'Explore in demo mode'), `${role} demo mode`);
    await waitFor(() => inputByPlaceholder(role, 'Mei Ling'), `${role} role picker`);
    await fill(role, () => inputByPlaceholder(role, 'Mei Ling'), actor.name, `${role} name`);
    const appRole = role === 'resident' ? 'citizen' : role;
    await click(role, () => {
      const choice = frameDocument(role).querySelector<HTMLButtonElement>(`button[data-kk-role="${appRole}"]`);
      return choice && !choice.disabled ? visible(choice) : null;
    }, `${actor.roleLabel} role`);
    await waitFor(() => visible(frameDocument(role).querySelector('button[title="Your profile"]') as HTMLButtonElement), `${role} map ready`, 30000);
  };

  const seedScenario = async () => {
    if (!sessionId) return;
    try { await api(`/api/demo/${sessionId}/seed`, { method: 'POST' }); } catch { /* non-fatal */ }
  };

  const prepare = async () => {
    stopRequestedRef.current = false;
    autostartRunRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    setPhase('preparing');
    setError(null);
    setLoaded(new Set());
    setElapsedMs(0);
    deadlineRef.current = 0;
    setCamera('resident');
    setChapter('Preparing');
    setMark('00:00');
    setCaption('Opening one isolated session and signing in three roles…');
    try {
      const voicesOk = await verifyQuickVoicePack();
      if (!voicesOk) throw new Error('Qwen voice pack missing. Run: npm run demo:quick-voice');
      const start = await api<{ sessionId: string }>('/api/demo/start', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Quick AI Showcase' }),
      });
      setSessionId(start.sessionId);
      prewarmAgents();
      setPhase('ready');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setPhase('failed');
    }
  };

  const cleanup = async () => {
    stopIntroMusic(true);
    if (!sessionId) return;
    setPhase('cleaning');
    setChapter('Teardown');
    (Object.keys(actors) as RoleKey[]).forEach((r) => { try { frameWindow(r).__kkDemo?.shutdown(); } catch { /* noop */ } });
    await rawSleep(fast ? 100 : 400);
    try { await api(`/api/demo/${sessionId}/cleanup`, { method: 'POST' }); } catch { /* non-fatal */ }
    setPhase('complete');
  };

  const run = async () => {
    setPhase('running');
    stopQwenScene();
    try {
      // Setup happens BEFORE the clock starts. A quiet music bed plays under the
      // Director, who explains the setup, the live-AI approach, and the app while
      // three real clients sign in — so there is never dead air.
      void playIntroMusic(0.45);
      setChapter('Setting up the demo');

      // Three short setup lines play while sign-in runs quietly off the resident camera.
      const intro = (async () => {
        await narrate('qs-setup-1', 'Director', 'Signing in a resident, a responder, and operations on one shared map.');
        await narrate('qs-setup-2', 'Director', 'Narration uses Qwen three text-to-speech with custom reference voices.');
        await narrate('qs-setup-3', 'Director', 'Our A I agents run on Ollama cloud MiniMax two point five models, and the stack will scale further.');
      })();

      await login('resident', { quiet: true });
      await login('responder', { quiet: true });
      await click('responder', () => frameDocument('responder').querySelector('button[title="Your profile"]'), 'responder profile');
      await ensureChip('responder', 'Medical');
      await ensureChip('responder', 'Hazard');
      await click('responder', () => button('responder', 'Save', true), 'save responder profile');
      await closeSheet('responder', 'Profile');
      await login('ops', { quiet: true });
      await switchCamera('resident', 'Ready', '00:00');
      prewarmAgents();

      await intro;
      fadeOutIntroMusic(700);

      // Clock starts now.
      deadlineRef.current = Date.now() + RUN_BUDGET_MS;
      runStartRef.current = Date.now();
      tickRef.current = window.setInterval(() => setElapsedMs(Math.min(RUN_BUDGET_MS, Date.now() - runStartRef.current)), 120);

      // 1 — MRT cutscene + intro voice in parallel (no dead air after the stamp).
      await flashTransition('00:00', 'Smoke at Exit B', 'stamp');
      await flashCutsceneWhile(
        '/demo/cutscenes/mrt-ebike-fire.png',
        'Smoke at M R T Exit B',
        'Rain, e-bike smoke, a crowded choke point.',
        () => narrate('qs-intro', 'Director', 'Here is one real KampungKaki session: a medical emergency across three live roles on a single shared map.'),
      );

      // 2 — Pelita + live conditions. Ask while Mei Ling speaks, show NEA/LTA layers
      // during the conditions line, then pop back to the real reply.
      await switchCamera('resident', 'Pelita · live conditions', '00:06');
      await flashTransition('00:06', 'Pelita · live conditions', 'page-flip');
      let pelitaBefore = 0;
      await narrateWith('qs-pelita', 'Mei Ling', 'Before anything escalates, I ask Pelita, our conditions agent, how my area is looking near the M R T exit.', async () => {
        pelitaBefore = await startAsk('resident', 'Pelita', PELITA_PROMPT);
      });
      await closeAiKaki('resident');
      await waitForAgentReply('resident', 'Pelita', pelitaBefore, [
        () => narrateWith('qs-conditions', 'Director', 'While Pelita thinks, the app pulls live readings from N E A and L T A, so rainfall and traffic light up right around Exit B.', async () => {
          await inspectLayer('resident', 'rainfall', 'Rainfall', 'Rainfall · NEA', 1200);
          await inspectLayer('resident', 'incidents', 'Traffic incident', 'Traffic · LTA', 1200);
        }),
        () => inspectLayer('resident', 'forecast2h', '2h forecast', '2h forecast · NEA', 1200),
      ], fast ? 8000 : 48000);
      await click('resident', () => button('resident', 'AI Kaki'), 'reopen AI Kaki');
      await wait(fast ? 120 : 400);
      await narrateWith('qs-pelita-reply', 'Director', 'Pelita turns those cached rain and traffic readings into one clear local answer, with no extra fetch needed.', () => holdWait(fast ? 400 : 900));
      await closeAiKaki('resident');

      // 3 — Responder goes on duty while Aisha introduces herself.
      await switchCamera('responder', 'Responder · on duty', '00:26');
      await flashTransition('00:26', 'Responder · on duty', 'whoosh');
      await narrateWith('qs-responder', 'Aisha', 'I am Aisha, a nearby responder, and I go on duty to declare medical and hazard support.', () => ensureResponderDuty(true));

      // 4 — Medical SOS while Mei Ling narrates the collapse.
      await switchCamera('resident', 'Citizen · Medical SOS', '00:36');
      await flashTransition('00:36', 'Citizen · Medical SOS', 'stamp');
      await narrateWith('qs-sos', 'Mei Ling', 'An elderly man near the smoke collapses, so I send a Medical S O S, and the map locks onto our exact location.', async () => {
        await click('resident', () => button('resident', 'Need help', true), 'need help');
        await click('resident', () => button('resident', 'Medical', true), 'medical SOS');
        await fill('resident', () => inputByPlaceholder('resident', 'friend collapsed'),
          'Nicoll Highway MRT Exit B: e-bike smoke at the covered walkway. Elderly man collapsed; I am the witness, he is the casualty. Need AED and responders.', 'SOS details');
        await click('resident', () => button('resident', 'Send for help', true), 'send SOS');
        frameWindow('resident').__kkMapDemo?.focusLocation(INCIDENT_LOCATION, 14.2);
      });
      void seedScenario();
      await flashCutscene('/demo/cutscenes/train-tunnel.png', 'Medical S O S sent', 'Hospitals, A E Ds, and responders lock to this point.', 1500);

      // 5 — Bekal: show AED/hospital layers during the ask line, then return to pins.
      await switchCamera('resident', 'Bekal · AED + hospital', '00:50');
      await flashTransition('00:50', 'Bekal · AED + hospital', 'chime');
      const bekalBefore = await startAsk('resident', 'Bekal', BEKAL_PROMPT);
      await closeAiKaki('resident');
      await waitForAgentReply('resident', 'Bekal', bekalBefore, [
        () => narrateWith('qs-bekal', 'Director', 'Mei Ling asks Bekal which A E D and hospital to use, while the map confirms the nearest ones around the incident.', async () => {
          await inspectLayer('resident', 'aeds', 'AED', 'Nearest AED', 1200);
          await inspectLayer('resident', 'hospitals', 'Hospital', 'A&E hospital', 1200);
        }),
        () => inspectLayer('resident', 'incidents', 'Traffic incident', 'Route traffic · LTA', 1200),
      ], fast ? 8000 : 48000);
      await click('resident', () => button('resident', 'AI Kaki'), 'reopen AI Kaki');
      await wait(fast ? 120 : 400);
      await narrateWith('qs-bekal-reply', 'Director', 'Bekal returns the nearest A E D, an emergency hospital, and first-aid guidance, dropped onto the map as real pins.', () => holdWait(fast ? 400 : 1000));
      await closeAiKaki('resident');

      // 6 — Ops verifies on the same map while Nadia speaks.
      await switchCamera('ops', 'Ops · verify', '01:06');
      await flashTransition('01:06', 'Ops · verify', 'page-flip');
      await narrateWith('qs-ops', 'Nadia', 'I am Nadia in operations. I verify the same case and map evidence before I decide what to publish.', async () => {
        frameWindow('ops').__kkMapDemo?.focusLocation(INCIDENT_LOCATION, 13.6);
        await holdWait(fast ? 300 : 900);
      });

      // 7 — MQTT one-truth: 3-up view while the finale line plays.
      await switchCamera('all', 'MQTT · one truth', '01:14');
      await flashTransition('01:14', 'MQTT · one truth', 'whoosh');
      await narrateWith('qs-finale', 'Director', 'One incident now lives in three synchronized maps, kept consistent by retained M Q T T topics.', () =>
        flashPresentationCard('MQTT FANOUT', 'One incident', 'Citizen · Responder · Ops', 'Retained topics replay the same truth into every role.', undefined, 1600));

      // 8 — Close.
      await switchCamera('resident', 'Close', '01:22');
      await narrate('qs-outro', 'Director', 'That is KampungKaki: live map evidence, A I Kaki guidance, and coordinated response in about a minute.');

      stopQwenScene();
      await cleanup();
    } catch (caught) {
      const requestedStop = caught instanceof DemoStopped;
      const message = caught instanceof Error ? caught.message : String(caught);
      if (!requestedStop) setError(message);
      try { await cleanup(); if (!requestedStop) setPhase('failed'); } catch { setPhase('failed'); }
    } finally {
      deadlineRef.current = 0;
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    }
  };

  const startShowcase = () => {
    void unlockDemoAudio().then(() => {
      if (phase !== 'ready' || loaded.size < 3) return;
      autostartRunRef.current = true;
      void run();
    });
  };

  const togglePause = () => {
    if (phase !== 'running') return;
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) { pauseDemoAudio(); pauseIntroMusic(); setCursor((c) => ({ ...c, down: false })); }
    else { resumeDemoAudio(); resumeIntroMusic(); }
  };

  const stopShowcase = () => { stopRequestedRef.current = true; stopQwenScene(); stopIntroMusic(true); };

  useEffect(() => {
    if (!autostart || phase !== 'idle' || autostartPreparedRef.current) return;
    autostartPreparedRef.current = true;
    void prepare();
  }, [autostart, phase]);

  // Autostart only kicks off automatically in fast mode (no audio gate). Otherwise
  // the presenter clicks "Start with sound" so browser autoplay is satisfied.
  useEffect(() => {
    if (!autostart || !fast || phase !== 'ready' || loaded.size < 3 || autostartRunRef.current) return;
    autostartRunRef.current = true;
    void run();
  }, [autostart, fast, phase, loaded.size]);

  useEffect(() => () => { if (tickRef.current) window.clearInterval(tickRef.current); stopQwenScene(); stopIntroMusic(true); }, []);

  const frameUrl = (role: RoleKey) => {
    if (!sessionId) return 'about:blank';
    const url = new URL(window.location.origin);
    url.searchParams.set('demoSession', sessionId);
    url.searchParams.set('embedded', '1');
    url.searchParams.set('actor', role);
    url.searchParams.set('demoLng', String(ACTOR_LOCATIONS[role].lng));
    url.searchParams.set('demoLat', String(ACTOR_LOCATIONS[role].lat));
    return url.toString();
  };

  const markFrameReady = async (role: RoleKey) => {
    try {
      await waitFor(() => {
        const win = frameRefs.current[role]?.contentWindow as DemoWindow | null;
        const doc = frameRefs.current[role]?.contentDocument;
        if (!win?.__kkDemo || !doc || doc.readyState !== 'complete') return null;
        const loginReady = button(role, 'Explore in demo mode');
        const mapReady = visible(doc.querySelector('button[title="Your profile"]') as HTMLButtonElement);
        return loginReady || mapReady ? true : null;
      }, `${role} embedded app ready`, 30000);
      setLoaded((c) => new Set(c).add(role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setPhase('failed');
    }
  };

  const progress = Math.min(1, elapsedMs / RUN_BUDGET_MS);
  const ringCirc = 2 * Math.PI * 42;
  const currentSpeaker = speakerProfile(speaker);
  const overlayActive = Boolean(cutscene || presentationCard);
  const focusRole: RoleKey = camera === 'all' ? 'resident' : camera;
  const aiPanelOpen = aiKakiOpen(focusRole);
  const canStart = phase === 'ready' && loaded.size >= 3;

  return (
    <main className="kk-quick-root relative h-screen w-screen overflow-hidden bg-[#12110e] text-[#f4f0e6]"
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
      {/* Iframe region — fills the area ABOVE the caption bar exactly. The iframe
          is never scaled past the region, so the bar can never clip or cover the
          live webapp's own bottom controls. */}
      <div className="absolute inset-x-0 top-0 overflow-hidden bg-[#d8d4ca]" style={{ bottom: 'max(13vh, 104px)' }}>
        {sessionId ? (
          (Object.keys(actors) as RoleKey[]).map((role, index) => {
            const all = camera === 'all';
            const active = camera === role;
            return (
              <div key={role} className="absolute top-0 h-full overflow-hidden bg-white transition-[left,width,opacity] duration-500 ease-out"
                style={{
                  left: all ? `${index * 33.333}%` : 0,
                  width: all ? '33.333%' : '100%',
                  opacity: all || active ? 1 : 0,
                  pointerEvents: active ? 'auto' : 'none',
                  zIndex: active ? 3 : all ? 2 : 1,
                }}>
                <iframe ref={(node) => { frameRefs.current[role] = node; }} title={`${actors[role].roleLabel} demo client`}
                  src={frameUrl(role)} onLoad={() => { void markFrameReady(role); }} allow="geolocation"
                  className="h-full w-full border-0 bg-white" />
                {all && (
                  <div className="pointer-events-none absolute left-3 top-3 z-50 border-2 border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[3px_3px_0_#111]">
                    {actors[role].roleLabel} · {actors[role].name}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.24em] text-[#14120f]/50">Preparing session…</div>
        )}

        {/* Cursor live over the iframe region. */}
        {cursor.visible && !overlayActive && !aiPanelOpen && (
          <MousePointer2 className="pointer-events-none absolute z-[70] h-5 w-5 text-[#14120f] drop-shadow"
            style={{ left: cursor.x - 4, top: cursor.y - 2, transform: cursor.down ? 'scale(0.92)' : 'scale(1)' }} />
        )}

        {/* Transition stamp */}
        {transitionStamp && (
          <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center">
            <div className="kk-quick-stamp-ring absolute h-48 w-48 rounded-full border-2 border-[#e8c547]/70" />
            <div key={transitionStamp.id} className="kk-quick-stamp-enter relative border-4 border-[#14120f] bg-[#f4f0e6] px-8 py-6 text-center shadow-[8px_8px_0_#14120f]">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff6b4a]">{transitionStamp.mark}</div>
              <div className="mt-2 text-lg font-black uppercase tracking-[0.12em] text-[#14120f]">{transitionStamp.label}</div>
            </div>
          </div>
        )}

        {/* Cutscene (covers iframe region only) */}
        {cutscene && (
          <div key={cutscene.id} className="pointer-events-none absolute inset-0 z-[58] overflow-hidden bg-black">
            <img src={cutscene.image} alt="" className="h-full w-full object-cover opacity-90" style={{ animation: 'kkDemoShake 2.4s ease-in-out both' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
            <div className="absolute bottom-10 left-10 max-w-3xl">
              <div className="text-[12px] font-black uppercase tracking-[0.35em] text-[#e8c547]">AI CUTSCENE · STORYBOARD</div>
              <div className="mt-3 text-[clamp(32px,5vw,72px)] font-black uppercase leading-none tracking-[-0.06em] text-white">{cutscene.title}</div>
              <div className="mt-4 text-[clamp(13px,1.6vw,22px)] font-bold uppercase tracking-[0.08em] text-white/75">{cutscene.detail}</div>
            </div>
          </div>
        )}

        {/* Presentation card (covers iframe region only) */}
        {presentationCard && (
          <div className="pointer-events-none absolute inset-0 z-[57] flex items-center justify-center bg-black/75 p-6">
            <div key={presentationCard.id} className="kk-quick-card-enter max-w-lg border-4 border-[#14120f] bg-[#f4f0e6] p-7 text-center shadow-[10px_10px_0_#14120f]">
              {presentationCard.image && (
                <img src={presentationCard.image} alt="" className="mx-auto mb-4 h-20 w-20 border-2 border-[#14120f] object-cover shadow-[4px_4px_0_#14120f]" />
              )}
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ff6b4a]">{presentationCard.eyebrow}</div>
              <div className="mt-2 text-3xl font-black uppercase tracking-[0.06em] text-[#14120f]">{presentationCard.title}</div>
              <div className="mt-3 text-base font-bold uppercase tracking-[0.06em] text-[#14120f]">{presentationCard.headline}</div>
              <div className="mx-auto mt-4 h-1 w-16 bg-[#ff6b4a]" />
              <div className="mt-3 text-[12px] leading-relaxed text-[#14120f]/70">{presentationCard.detail}</div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent caption + control bar (always reserved, fades only behind a full card/cutscene). */}
      <footer className={`absolute inset-x-0 bottom-0 z-[80] border-t-4 border-[#14120f] bg-[#14120f] text-[#f4f0e6] transition-opacity duration-150 ${overlayActive ? 'opacity-0' : 'opacity-100'}`}
        style={{ height: 'max(13vh, 104px)' }}>
        <div className="flex h-full items-center gap-4 px-4 py-3">
          <div className="relative h-[84px] w-[84px] shrink-0">
            <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
              <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(244,240,230,0.12)" strokeWidth="6" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="#e8c547" strokeWidth="6" strokeLinecap="square"
                className="kk-quick-progress-ring" strokeDasharray={ringCirc} strokeDashoffset={ringCirc * (1 - progress)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Timer className="mb-0.5 h-3.5 w-3.5 text-[#e8c547]" />
              <div className="text-[11px] font-black tabular-nums">
                {phase === 'running' ? Math.max(0, Math.ceil((RUN_BUDGET_MS - elapsedMs) / 1000)) : 84}s
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#e8c547]">
              <span>{mark}</span><span className="text-[#f4f0e6]/35">·</span>
              <span>{chapter}</span><span className="text-[#f4f0e6]/35">·</span>
              <span className="text-[#f4f0e6]/60">{phase}{phase === 'preparing' ? ` (${loaded.size}/3)` : ''}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {currentSpeaker.image ? (
                <img src={currentSpeaker.image} alt="" className="h-8 w-8 border border-[#e8c547]/40 object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center border border-[#e8c547]/40 bg-[#e8c547]/10 text-[10px] font-black">AI</div>
              )}
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em]">{currentSpeaker.name}</div>
                <div className="text-[9px] uppercase tracking-[0.12em] text-[#f4f0e6]/55">{currentSpeaker.role}</div>
              </div>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-[#f4f0e6]/90">{caption}</p>
            {error && <p className="mt-1 text-[10px] text-[#ff6b4a]">{error}</p>}
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            {canStart ? (
              <button type="button" onClick={startShowcase}
                className="flex h-9 items-center gap-2 border-2 border-[#e8c547] bg-[#e8c547] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#14120f]">
                <Play className="h-3.5 w-3.5 fill-current" /> Start with sound
              </button>
            ) : phase === 'idle' || phase === 'failed' || phase === 'complete' ? (
              <button type="button" onClick={() => void prepare()}
                className="flex h-9 items-center gap-2 border-2 border-[#e8c547] bg-[#e8c547] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#14120f]">
                <Play className="h-3.5 w-3.5 fill-current" /> {phase === 'complete' ? 'Replay' : 'Start'}
              </button>
            ) : phase === 'running' ? (
              <>
                <button type="button" onClick={togglePause}
                  className="flex h-9 items-center gap-2 border-2 border-[#f4f0e6]/30 px-3 text-[10px] font-black uppercase tracking-[0.14em]">
                  {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />} {paused ? 'Resume' : 'Pause'}
                </button>
                <button type="button" onClick={stopShowcase}
                  className="flex h-9 items-center gap-2 border-2 border-[#ff6b4a] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#ff6b4a]">
                  <Square className="h-3.5 w-3.5 fill-current" /> Stop
                </button>
              </>
            ) : null}
            <button type="button" onClick={() => { stopShowcase(); onExit(); }}
              className="flex h-9 items-center gap-2 border-2 border-[#f4f0e6]/20 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#f4f0e6]/70">
              <X className="h-3.5 w-3.5" /> Exit
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
