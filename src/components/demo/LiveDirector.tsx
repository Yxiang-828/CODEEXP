import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, MousePointer2, Pause, Play, Radio, RotateCcw, ShieldCheck, SkipForward, Sparkles, Square, UserRound } from 'lucide-react';
import { missingQwenScenes, pauseDemoAudio, playQwenScene, resumeDemoAudio, stopQwenScene, unlockDemoAudio } from './demoAudio';

// LiveDirector — Qwen3-TTS reference voices only (/demo/voice/<scene>.wav). No browser TTS.

type RoleKey = 'resident' | 'responder' | 'ops';
type Camera = RoleKey | 'all';
type Phase = 'idle' | 'preparing' | 'ready' | 'running' | 'cleaning' | 'complete' | 'failed';
type CaptionKind = 'speech' | 'action';

type DemoWindow = Window & {
  __kkDemo?: {
    identity: () => { userId: string; name: string; role: string } | null;
    topicCount: (prefix: string) => number;
    setTransportOnline: (online: boolean) => void;
    shutdown: () => void;
    quickJoin?: (name: string, role: string) => void;
    quickJoinReady?: () => boolean;
    residentProfileReady?: () => boolean;
    responderProfileReady?: () => boolean;
    configureResidentProfile?: () => void;
    configureResponderProfile?: () => void;
  };
  __kkAgent?: {
    replyCount: (agent: string) => number;
    lastReply: (agent: string) => string;
    busy: () => boolean;
    conditionsReady?: () => boolean;
  };
  __kkMapDemo?: {
    focusLocation: (near: { lng: number; lat: number }, zoom?: number) => void;
    showLayerSample: (
      layerId: string,
      near?: { lng: number; lat: number },
    ) => { x: number; y: number; label: string; distanceKm: number } | null;
    responderMarkerCount: () => number;
    clearEvidence: () => void;
  };
};

interface DemoStatus {
  retainedObjects: number;
  byCluster: Record<string, number>;
}

interface SeedReceipt {
  responders: number;
  reports: number;
  events: number;
}

interface SwarmReceipt {
  responders: number;
  roles: string[];
}

interface PresentationCard {
  id: number;
  eyebrow: string;
  title: string;
  headline: string;
  detail: string;
}

interface CutsceneCard {
  id: number;
  image: string;
  title: string;
  detail: string;
}

interface FocusBox {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL ?? '';
const INCIDENT_LOCATION = { lng: 103.8644, lat: 1.3022 };

type DemoSectionCategory = 'intro' | 'setup' | 'ai' | 'sos' | 'mqtt' | 'case' | 'citizen' | 'ops' | 'resilience' | 'closure';

interface DemoSectionDef {
  id: string;
  category: DemoSectionCategory;
  title: string;
  chapter: string;
}

const DEMO_SECTIONS: DemoSectionDef[] = [
  { id: 'intro', category: 'intro', title: 'Live opening', chapter: 'Intro · live control' },
  { id: 'setup-resident', category: 'setup', title: 'Citizen login & aid card', chapter: 'Setup · citizen' },
  { id: 'setup-responder', category: 'setup', title: 'Responder login & skills', chapter: 'Setup · responder' },
  { id: 'setup-ops', category: 'setup', title: 'Ops login', chapter: 'Setup · operations' },
  { id: 'ai-pelita', category: 'ai', title: 'Pelita · conditions', chapter: 'AI · conditions snapshot' },
  { id: 'responder-duty', category: 'setup', title: 'Responder on duty', chapter: 'Responder · availability' },
  { id: 'sos-bekal', category: 'sos', title: 'Medical SOS + Bekal', chapter: 'SOS · escalation' },
  { id: 'mqtt-fanout', category: 'mqtt', title: 'Seed world + MQTT fan-out', chapter: 'MQTT · one truth' },
  { id: 'case-room', category: 'case', title: 'Join · aid card · Host', chapter: 'Case room · private coordination' },
  { id: 'citizen-relief', category: 'citizen', title: 'Approach markers', chapter: 'Citizen · help visible' },
  { id: 'ops-verify', category: 'ops', title: 'Verify · Pondok · broadcast', chapter: 'Ops · verify & warn' },
  { id: 'resilience', category: 'resilience', title: 'MQTT offline + reconcile', chapter: 'Resilience · honest state' },
  { id: 'closure', category: 'closure', title: 'Alerts · dual ack · teardown', chapter: 'Closure · clean exit' },
];

const SECTION_CATEGORY_LABELS: Record<DemoSectionCategory, string> = {
  intro: 'Intro',
  setup: 'Setup',
  ai: 'AI Kaki',
  sos: 'SOS',
  mqtt: 'MQTT',
  case: 'Case room',
  citizen: 'Citizen',
  ops: 'Operations',
  resilience: 'Resilience',
  closure: 'Closure',
};

type DemoMilestone =
  | 'residentLoggedIn'
  | 'residentProfile'
  | 'responderLoggedIn'
  | 'responderProfile'
  | 'opsLoggedIn'
  | 'responderOnDuty'
  | 'sosSent'
  | 'seedDone'
  | 'responderJoined'
  | 'swarmDone'
  | 'smokeVerified'
  | 'broadcastSent'
  | 'responderOnScene';

const PREREQUISITES_BY_SECTION: Record<string, DemoMilestone[]> = {
  intro: [],
  'setup-resident': [],
  'setup-responder': ['residentLoggedIn', 'residentProfile'],
  'setup-ops': ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile'],
  'ai-pelita': ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn'],
  'responder-duty': ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn'],
  'sos-bekal': ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn', 'responderOnDuty'],
  'mqtt-fanout': ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn', 'responderOnDuty', 'sosSent'],
  'case-room': ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn', 'responderOnDuty', 'sosSent', 'seedDone'],
  'citizen-relief': ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn', 'responderOnDuty', 'sosSent', 'seedDone', 'responderJoined', 'swarmDone'],
  'ops-verify': ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn', 'responderOnDuty', 'sosSent', 'seedDone'],
  resilience: ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn', 'responderOnDuty', 'sosSent', 'seedDone', 'responderJoined', 'swarmDone', 'smokeVerified', 'broadcastSent'],
  closure: ['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn', 'responderOnDuty', 'sosSent', 'seedDone', 'responderJoined', 'swarmDone', 'smokeVerified', 'broadcastSent', 'responderOnScene'],
};
const REQUIRED_VOICE_SCENES = [
  'god-deploy',
  'login-resident',
  'login-responder',
  'login-ops',
  'resident-intro',
  'profile-meiling-asthma',
  'profile-meiling-inhaler',
  'responder-intro',
  'profile-aisha-medical',
  'profile-aisha-hazard',
  'ops-intro',
  'resident-report',
  'map-pelita-rain',
  'pelita-result',
  'responder-duty',
  'resident-sos',
  'focus-resident-sos',
  'map-bekal-aed',
  'bekal-intro',
  'bekal-result',
  'propagation',
  'responder-join',
  'responder-aidcard',
  'responder-host',
  'focus-resident-swarm',
  'resident-relief',
  'pondok-result',
  'ops-broadcast-action',
  'ops-broadcast',
  'resilience-drop',
  'responder-offline',
  'reconciled',
  'resident-alert-action',
  'resident-safe',
  'responder-resolve',
  'outcome',
] as const;

const LOGIN_VOICE: Record<RoleKey, { id: string; text: string }> = {
  resident: {
    id: 'login-resident',
    text: 'Mei Ling signs in as Citizen. The demo waits for each screen and enabled control before moving on.',
  },
  responder: {
    id: 'login-responder',
    text: 'Aisha signs in as Responder. The demo waits for each screen and enabled control before moving on.',
  },
  ops: {
    id: 'login-ops',
    text: 'Nadia signs in as Ops. The demo waits for each screen and enabled control before moving on.',
  },
};
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

// Humans get a portrait; AI agents (Pelita/Bekal/Pondok/Director) are the app's
// voice, not people — they render an AI mark, never a human face.
const speakerProfiles: Array<{ match: string; name: string; role: string; image: string | null; ai: boolean }> = [
  { match: 'Mei Ling', name: 'Mei Ling', role: 'Citizen', image: '/demo/personas/mei-ling.png', ai: false },
  { match: 'Aisha', name: 'Aisha', role: 'Responder', image: '/demo/personas/aisha.png', ai: false },
  { match: 'Nadia', name: 'Nadia', role: 'Ops', image: '/demo/personas/nadia.png', ai: false },
  { match: 'Pelita', name: 'Pelita', role: 'AI Kaki · conditions', image: null, ai: true },
  { match: 'Bekal', name: 'Bekal', role: 'AI Kaki · SOS companion', image: null, ai: true },
  { match: 'Pondok', name: 'Pondok', role: 'AI Kaki · ops lookout', image: null, ai: true },
  { match: 'Director', name: 'Director', role: 'Narrator', image: null, ai: true },
];

function speakerProfile(speaker: string) {
  return speakerProfiles.find((profile) => speaker.includes(profile.match)) ?? speakerProfiles[speakerProfiles.length - 1];
}

const rawSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanText = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

class DemoStopped extends Error {
  constructor() {
    super('Demo stopped by presenter');
  }
}

class DemoSectionSkip extends Error {
  targetIndex: number;

  constructor(targetIndex: number) {
    super(`Demo skipped to section ${targetIndex + 1}`);
    this.targetIndex = targetIndex;
  }
}

export default function LiveDirector({ autostart, onExit }: { autostart: boolean; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<RoleKey>>(new Set());
  const [camera, setCamera] = useState<Camera>('resident');
  const cameraRef = useRef<Camera>('resident');
  cameraRef.current = camera;
  const [speaker, setSpeaker] = useState('AI Director');
  const [caption, setCaption] = useState('A clean, live demo begins with an empty session.');
  const [captionKind, setCaptionKind] = useState<CaptionKind>('action');
  const [chapter, setChapter] = useState('Ready');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [networkState, setNetworkState] = useState<'online' | 'stuttering'>('online');
  const [seedReceipt, setSeedReceipt] = useState<SeedReceipt | null>(null);
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [auditLine, setAuditLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, visible: false, down: false });
  const [framesVisible, setFramesVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [presentationCard, setPresentationCard] = useState<PresentationCard | null>(null);
  const [cutscene, setCutscene] = useState<CutsceneCard | null>(null);
  const [focusBox, setFocusBox] = useState<FocusBox | null>(null);
  const presentationCardIdRef = useRef(0);
  const cutsceneIdRef = useRef(0);
  const focusBoxIdRef = useRef(0);
  const frameRefs = useRef<Record<RoleKey, HTMLIFrameElement | null>>({
    resident: null,
    responder: null,
    ops: null,
  });
  const pausedRef = useRef(false);
  const cancelSpeechRef = useRef<null | (() => void)>(null);
  const stopRequestedRef = useRef(false);
  const skipTargetRef = useRef<number | null>(null);
  const sectionIndexRef = useRef(0);
  const swarmMarkersRef = useRef(5);
  const restartRequestedRef = useRef(false);
  const runAfterPrepareRef = useRef(false);
  const autostartPreparedRef = useRef(false);
  const autostartRunRef = useRef(false);
  const completedMilestonesRef = useRef<Set<DemoMilestone>>(new Set());
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const fast = searchParams.get('pace') === 'fast';
  const silent = searchParams.get('silent') === '1';

  const checkpoint = () => {
    if (stopRequestedRef.current) throw new DemoStopped();
    if (skipTargetRef.current !== null) throw new DemoSectionSkip(skipTargetRef.current);
  };

  const clearPresenterOverlays = () => {
    setPresentationCard(null);
    setCutscene(null);
    setFocusBox(null);
  };

  const wait = async (ms: number) => {
    let remaining = ms;
    while (remaining > 0) {
      checkpoint();
      if (pausedRef.current) {
        await rawSleep(80);
        continue;
      }
      const slice = Math.min(remaining, 80);
      await rawSleep(slice);
      remaining -= slice;
    }
    checkpoint();
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

  const waitFor = async <T,>(read: () => T | null | undefined, label: string, timeout = 15000): Promise<T> => {
    let elapsed = 0;
    while (elapsed < timeout) {
      checkpoint();
      const value = read();
      if (value) return value;
      await wait(120);
      elapsed += 120;
    }
    throw new Error(`Timed out waiting for ${label}`);
  };

  const visible = <T extends Element>(element: T | null | undefined): T | null => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? element : null;
  };

  const reveal = async (role: RoleKey, element: Element) => {
    const doc = frameDocument(role);
    const before = element.getBoundingClientRect();
    const viewportH = doc.documentElement.clientHeight || frameWindow(role).innerHeight;
    const viewportW = doc.documentElement.clientWidth || frameWindow(role).innerWidth;
    const offscreen =
      before.top < 16 ||
      before.left < 16 ||
      before.bottom > viewportH - 16 ||
      before.right > viewportW - 16;
    if (offscreen) {
      element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      await wait(fast ? 30 : 180);
    }
  };

  const button = (role: RoleKey, text: string, exact = false): HTMLButtonElement | null => {
    const target = cleanText(text).toLowerCase();
    const buttons = Array.from(frameDocument(role).querySelectorAll('button'));
    return buttons
      .map((element) => visible(element))
      .find((element) => {
        if (!element || element.disabled) return false;
        const content = cleanText(element.textContent).toLowerCase();
        return exact ? content === target : content.includes(target);
      }) ?? null;
  };

  const inputByPlaceholder = (role: RoleKey, text: string): HTMLInputElement | HTMLTextAreaElement | null => {
    const target = text.toLowerCase();
    const fields = Array.from(frameDocument(role).querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'));
    return fields.map((element) => visible(element)).find((element) => element?.placeholder.toLowerCase().includes(target)) ?? null;
  };

  const inputByLabel = (role: RoleKey, text: string): HTMLInputElement | HTMLTextAreaElement | null => {
    const target = text.toLowerCase();
    const labels = Array.from(frameDocument(role).querySelectorAll('label'));
    const label = labels.find((element) => cleanText(element.textContent).toLowerCase().startsWith(target));
    return label?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea') ?? null;
  };

  const moveCursor = async (role: RoleKey, element: Element) => {
    const frame = frameRefs.current[role];
    if (!frame) return;
    await reveal(role, element);
    const frameRect = frame.getBoundingClientRect();
    const target = element.getBoundingClientRect();
    const scaleX = frame.offsetWidth > 0 ? frameRect.width / frame.offsetWidth : 1;
    const scaleY = frame.offsetHeight > 0 ? frameRect.height / frame.offsetHeight : 1;
    setCursor({
      x: frameRect.left + (target.left + target.width / 2) * scaleX,
      y: frameRect.top + (target.top + target.height / 2) * scaleY,
      visible: true,
      down: false,
    });
    await wait(fast ? 60 : 260);
  };

  const moveCursorToFramePoint = async (role: RoleKey, point: { x: number; y: number }) => {
    const frame = frameRefs.current[role];
    if (!frame) return;
    const frameRect = frame.getBoundingClientRect();
    const scaleX = frame.offsetWidth > 0 ? frameRect.width / frame.offsetWidth : 1;
    const scaleY = frame.offsetHeight > 0 ? frameRect.height / frame.offsetHeight : 1;
    setCursor({
      x: frameRect.left + point.x * scaleX,
      y: frameRect.top + point.y * scaleY,
      visible: true,
      down: false,
    });
    await wait(fast ? 60 : 420);
  };

  const framePointToScreen = (role: RoleKey, point: { x: number; y: number }) => {
    const frame = frameRefs.current[role];
    if (!frame) return null;
    const frameRect = frame.getBoundingClientRect();
    const scaleX = frame.offsetWidth > 0 ? frameRect.width / frame.offsetWidth : 1;
    const scaleY = frame.offsetHeight > 0 ? frameRect.height / frame.offsetHeight : 1;
    return {
      x: frameRect.left + point.x * scaleX,
      y: frameRect.top + point.y * scaleY,
    };
  };

  const frameActive = (role: RoleKey) => cameraRef.current === 'all' || cameraRef.current === role;

  const click = async (role: RoleKey, read: () => HTMLElement | null, label: string) => {
    if (!frameActive(role)) {
      throw new Error(`Cannot puppet ${label} while ${role} map is hidden — switch camera first`);
    }
    const element = await waitFor(read, label);
    await moveCursor(role, element);
    setCursor((current) => ({ ...current, down: true }));
    element.click();
    await wait(fast ? 50 : 130);
    setCursor((current) => ({ ...current, down: false }));
    await wait(fast ? 80 : 220);
  };

  const fill = async (
    role: RoleKey,
    read: () => HTMLInputElement | HTMLTextAreaElement | null,
    value: string,
    label: string,
  ) => {
    const element = await waitFor(read, label);
    await moveCursor(role, element);
    element.focus();
    const ownerWindow = element.ownerDocument.defaultView;
    if (!ownerWindow) throw new Error(`${label} has no owning window`);
    const prototype = element.tagName === 'TEXTAREA'
      ? ownerWindow.HTMLTextAreaElement.prototype
      : ownerWindow.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(fast ? 50 : 180);
  };

  const revealCaseAidCard = async (role: RoleKey) => {
    const block = await waitFor(() => {
      const doc = frameDocument(role);
      return Array.from(doc.querySelectorAll('div')).find((el) => cleanText(el.textContent) === 'Aid card') ?? null;
    }, 'aid card in case room', 15000);
    await reveal(role, block);
    await wait(fast ? 500 : 1800);
  };

  const holdHostReply = async (role: RoleKey) => {
    const bubble = await waitFor(() => {
      const doc = frameDocument(role);
      for (const label of doc.querySelectorAll('span')) {
        if (cleanText(label.textContent) !== 'Host') continue;
        const block = label.parentElement;
        const body = block?.querySelector('span.whitespace-pre-line');
        if (!body || cleanText(body.textContent) === 'Host is checking…') continue;
        return body;
      }
      return null;
    }, 'host reply bubble', 30000);
    await reveal(role, bubble);
    await wait(fast ? 900 : 3200);
    return cleanText(bubble.textContent);
  };

  const switchCamera = async (next: Camera, nextChapter: string) => {
    cameraRef.current = next;
    setCamera(next);
    setChapter(nextChapter);
    setCursor((current) => ({ ...current, visible: false }));
    await wait(fast ? 80 : 420);
  };

  // Qwen3-TTS scene WAV only — reference voices from demo/incident-281.json.
  const narrate = async (id: string, nextSpeaker: string, text: string) => {
    setSpeaker(nextSpeaker);
    setCaption(text);
    setCaptionKind('speech');
    if (fast) { await wait(180); return; }
    if (silent) {
      await wait(Math.min(9000, Math.max(2600, text.length * 48)));
      return;
    }
    cancelSpeechRef.current = () => { stopQwenScene(); };
    const qwenPlayed = await playQwenScene(id);
    cancelSpeechRef.current = null;
    checkpoint();
    if (!qwenPlayed) {
      checkpoint();
      throw new Error(
        `Qwen3-TTS voice missing or invalid for "${id}". Expected /demo/voice/${id}.wav (reference clone). Run: npm run demo:voice`,
      );
    }
    stopQwenScene();
    checkpoint();
  };

  const flashPresentationCard = async (
    eyebrow: string,
    title: string,
    headline: string,
    detail: string,
  ) => {
    const id = ++presentationCardIdRef.current;
    setPresentationCard({ id, eyebrow, title, headline, detail });
    await wait(fast ? 120 : 2200);
    setPresentationCard((current) => current?.id === id ? null : current);
    await wait(fast ? 20 : 120);
  };

  const flashCutscene = async (title: string, detail: string) => {
    const id = ++cutsceneIdRef.current;
    setCutscene({ id, image: '/demo/cutscenes/mrt-ebike-fire.png', title, detail });
    await wait(fast ? 120 : 2000);
    setCutscene((current) => current?.id === id ? null : current);
    await wait(fast ? 20 : 180);
  };

  const flashRoleCard = async (role: RoleKey) => {
    const actor = actors[role];
    setSpeaker(actor.name);
    await flashPresentationCard(
      'NOW JOINING',
      actor.roleLabel.toUpperCase(),
      actor.name.toUpperCase(),
      'One real user on the live map.',
    );
  };

  const ensureLayerOn = async (role: RoleKey, label: string) => {
    const target = label.toLowerCase();
    const read = () => {
      const buttons = Array.from(frameDocument(role).querySelectorAll<HTMLButtonElement>('button'));
      return buttons
        .map((element) => visible(element))
        .find((element) => cleanText(element?.textContent).toLowerCase().includes(target)) ?? null;
    };
    let layer = read();
    if (!layer) {
      const panel = button(role, 'Layers');
      if (panel) await click(role, () => panel, `${role} layers panel`);
    }
    layer = await waitFor(read, `${role} map layer ${label}`, 12000);
    const alreadyOn = String(layer.className).includes('bg-surface-3');
    if (alreadyOn) {
      await moveCursor(role, layer);
      await wait(fast ? 30 : 170);
      return;
    }
    await click(role, () => layer, `enable ${label}`);
  };

  const layerPanelOpen = (role: RoleKey) => cleanText(frameDocument(role).body.textContent).includes('Care & rescue');

  const collapseLayerPanel = async (role: RoleKey) => {
    if (layerPanelOpen(role)) await click(role, () => button(role, 'Layers'), `${role} collapse layers`);
  };

  const ensureLayerOff = async (role: RoleKey, label: string) => {
    const target = label.toLowerCase();
    const read = () => {
      const buttons = Array.from(frameDocument(role).querySelectorAll<HTMLButtonElement>('button'));
      return buttons
        .map((element) => visible(element))
        .find((element) => cleanText(element?.textContent).toLowerCase().includes(target)) ?? null;
    };
    let layer = read();
    if (!layer) await click(role, () => button(role, 'Layers'), `${role} layers panel`);
    layer = await waitFor(read, `${role} map layer ${label}`, 12000);
    const alreadyOn = String(layer.className).includes('bg-surface-3');
    if (alreadyOn) await click(role, () => layer, `disable ${label}`);
  };

  const focusSosArea = async (role: RoleKey, sceneId: string, detail: string) => {
    setChapter(`${actors[role].roleLabel} · SOS area`);
    await collapseLayerPanel(role);
    const mapDemo = await waitFor(
      () => frameWindow(role).__kkMapDemo ?? null,
      `${role} demo map`,
      12000,
    );
    mapDemo.focusLocation(INCIDENT_LOCATION, 15.4);
    await wait(fast ? 80 : 350);
    await narrate(sceneId, 'Director', detail);
  };

  const keepHealthLayerOn = (label: string) => {
    const t = label.toLowerCase();
    return t.includes('hospital') || t.includes('aed');
  };

  const actionBeat = (nextChapter: string, text: string) => {
    setChapter(nextChapter);
    setSpeaker('Director');
    setCaption(text);
    setCaptionKind('action');
  };

  // AI latency is presentation time, not dead time. These previews expose the
  // exact map evidence already available to the agent without adding narration
  // scenes that would need a matching voice asset.
  const previewMapLayer = async (
    role: RoleKey,
    layerId: string,
    toggleLabel: string,
    spokenLabel: string,
    detail: string,
    sceneId: string,
  ): Promise<boolean> => {
    setChapter(`${actors[role].roleLabel} · ${spokenLabel}`);
    await narrate(sceneId, 'Director', detail);
    frameWindow(role).__kkMapDemo?.focusLocation(INCIDENT_LOCATION, 14.2);
    try {
      await ensureLayerOn(role, toggleLabel);
      await collapseLayerPanel(role);
      await wait(fast ? 60 : 240);
      let sample = frameWindow(role).__kkMapDemo?.showLayerSample(layerId, INCIDENT_LOCATION) ?? null;
      if (!sample) {
        await wait(fast ? 100 : 500);
        sample = frameWindow(role).__kkMapDemo?.showLayerSample(layerId, INCIDENT_LOCATION) ?? null;
      }
      if (!sample) return false;
      await moveCursorToFramePoint(role, sample);
      const screenPoint = framePointToScreen(role, sample);
      if (screenPoint) {
        const id = ++focusBoxIdRef.current;
        const w = 196;
        const h = 118;
        setFocusBox({
          id,
          x: Math.min(window.innerWidth - w - 14, Math.max(14, Math.round(screenPoint.x - w / 2))),
          y: Math.min(window.innerHeight - h - 124, Math.max(40, Math.round(screenPoint.y - h * 0.82))),
          w,
          h,
          label: `${spokenLabel}: ${sample.label}`,
        });
        await wait(fast ? 420 : 1500);
        setFocusBox((current) => current?.id === id ? null : current);
      }
      return true;
    } catch {
      return false;
    } finally {
      frameWindow(role).__kkMapDemo?.clearEvidence();
      if (!keepHealthLayerOn(toggleLabel)) {
        try { await ensureLayerOff(role, toggleLabel); } catch { /* optional preview */ }
      }
      try { await collapseLayerPanel(role); } catch { /* optional preview */ }
    }
  };

  const spawnSwarm = async () => {
    if (!sessionId) throw new Error('Demo session has not started');
    return api<SwarmReceipt>(`/api/demo/${sessionId}/swarm`, { method: 'POST' });
  };

  const api = async <T,>(path: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${BRIDGE_URL}${path}`, options);
    if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
    return response.json() as Promise<T>;
  };

  const prepare = async () => {
    stopRequestedRef.current = false;
    restartRequestedRef.current = false;
    autostartRunRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    setPhase('preparing');
    setError(null);
    setAuditLine(null);
    setSeedReceipt(null);
    setStatus(null);
    setNetworkState('online');
    setVoiceReady(false);
    completedMilestonesRef.current = new Set();
    setCamera('resident');
    setCaption('Opening one isolated demo session. Nothing outside it will be reset.');
    setCaptionKind('action');
    try {
      // Fire-and-forget: AudioContext.resume() can hang indefinitely without a
      // user gesture (e.g. autostart from a URL), which would stall the whole
      // demo before it ever starts. Never block prepare on it.
      void unlockDemoAudio().then(() => setVoiceReady(true)).catch(() => {});
      const start = await api<{ sessionId: string }>('/api/demo/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Smoke At Exit B' }),
      });
      setSessionId(start.sessionId);
      setLoaded(new Set());
      setFramesVisible(true);
      setPhase('ready');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setPhase('failed');
    }
  };

  const login = async (role: RoleKey) => {
    const actor = actors[role];
    await switchCamera(role, `${actor.roleLabel} identity`);
    await flashRoleCard(role);
    const loginVoice = LOGIN_VOICE[role];
    await narrate(loginVoice.id, 'Director', loginVoice.text);
    await click(role, () => button(role, 'Explore in demo mode'), 'demo mode button');
    await waitFor(
      () => inputByPlaceholder(role, 'Mei Ling'),
      `${role} role picker`,
    );
    await fill(role, () => inputByPlaceholder(role, 'Mei Ling'), actor.name, `${role} name`);
    await waitFor(
      () => {
        const field = inputByPlaceholder(role, 'Mei Ling');
        return field?.value === actor.name ? field : null;
      },
      `${role} name committed`,
    );
    const appRole = role === 'resident' ? 'citizen' : role;
    await click(role, () => {
      const choice = frameDocument(role).querySelector<HTMLButtonElement>(`button[data-kk-role="${appRole}"]`);
      return choice && !choice.disabled ? visible(choice) : null;
    }, `${actor.roleLabel} role enabled`);
    await waitFor(
      () => {
        const identity = frameWindow(role).__kkDemo?.identity();
        return identity?.name === actor.name && identity.role === actor.roleLabel.toLowerCase()
          ? identity
          : null;
      },
      `${role} identity minted`,
      30000,
    );
    await waitFor(
      () => visible(frameDocument(role).querySelector('button[title="Your profile"]') as HTMLButtonElement),
      `${role} map ready`,
      30000,
    );
  };

  const ensureResponderDuty = async (desired: boolean) => {
    const current = await waitFor(
      () => button('responder', 'On duty', true) ?? button('responder', 'Off duty', true),
      'responder duty state',
    );
    const isOnDuty = cleanText(current.textContent) === 'On duty';
    if (isOnDuty !== desired) {
      await click(
        'responder',
        () => button('responder', desired ? 'Off duty' : 'On duty', true),
        desired ? 'go on duty' : 'go off duty',
      );
    } else {
      await moveCursor('responder', current);
    }
    await waitFor(
      () => button('responder', desired ? 'On duty' : 'Off duty', true),
      desired ? 'confirmed on-duty state' : 'confirmed off-duty state',
    );
  };

  const appRoleFor = (role: RoleKey) => (role === 'resident' ? 'citizen' : role);

  const profileButton = (role: RoleKey) => {
    try {
      return visible(frameDocument(role).querySelector('button[title="Your profile"]') as HTMLButtonElement);
    } catch {
      return null;
    }
  };

  const identityReady = (role: RoleKey) => {
    try {
      const id = frameWindow(role).__kkDemo?.identity();
      return id?.name === actors[role].name && id?.role === appRoleFor(role) ? id : null;
    } catch {
      return null;
    }
  };

  const responderInCaseRoom = () => !!inputByPlaceholder('responder', 'Message the case');
  const residentSosActive = () => !!button('resident', "I'm safe", true);
  const responderPaged = () => !!button('responder', 'Someone nearby needs help');
  const responderOnDutyNow = () => cleanText(button('responder', 'On duty', true)?.textContent ?? '') === 'On duty';
  const broadcastDelivered = () => {
    try {
      return cleanText(frameDocument('resident').body.textContent).includes('Avoid MRT Exit B smoke incident');
    } catch {
      return false;
    }
  };
  const residentSeesOnScene = () => {
    try {
      return cleanText(frameDocument('resident').body.textContent).includes('someone is on scene');
    } catch {
      return false;
    }
  };

  const ensureLogin = async (role: RoleKey) => {
    if (identityReady(role) && profileButton(role)) return;
    const win = frameWindow(role);
    if (win.__kkDemo?.quickJoinReady?.()) {
      win.__kkDemo.quickJoin?.(actors[role].name, appRoleFor(role));
      await waitFor(
        () => (identityReady(role) && profileButton(role) ? true : null),
        `${role} quickJoin`,
        20000,
      );
      return;
    }
    await click(role, () => button(role, 'Explore in demo mode'), `${role} demo mode`);
    await waitFor(() => inputByPlaceholder(role, 'Mei Ling'), `${role} role picker`);
    await fill(role, () => inputByPlaceholder(role, 'Mei Ling'), actors[role].name, `${role} name`);
    await click(role, () => {
      const choice = frameDocument(role).querySelector<HTMLButtonElement>(`button[data-kk-role="${appRoleFor(role)}"]`);
      return choice && !choice.disabled ? visible(choice) : null;
    }, `${actors[role].roleLabel} role`);
    await waitFor(() => (identityReady(role) && profileButton(role) ? true : null), `${role} identity`, 20000);
  };

  const residentProfileReady = () => {
    try {
      return frameWindow('resident').__kkDemo?.residentProfileReady?.() ?? false;
    } catch {
      return false;
    }
  };

  const responderProfileReady = () => {
    try {
      return frameWindow('responder').__kkDemo?.responderProfileReady?.() ?? false;
    } catch {
      return false;
    }
  };

  const ensureResidentProfile = async (options?: { presented?: boolean }) => {
    await ensureLogin('resident');
    if (residentProfileReady()) {
      completedMilestonesRef.current.add('residentProfile');
      return;
    }
    if (!options?.presented) {
      frameWindow('resident').__kkDemo?.configureResidentProfile?.();
      await wait(80);
      completedMilestonesRef.current.add('residentProfile');
      return;
    }
    await click('resident', () => profileButton('resident'), 'resident profile');
    await fill('resident', () => inputByLabel('resident', 'Phone'), '9000 2810', 'resident phone');
    await fill('resident', () => inputByLabel('resident', 'Allergies'), 'No known drug allergies', 'resident allergies');
    await selectProfileChip('resident', 'Asthma');
    await narrate(
      'profile-meiling-asthma',
      'Director',
      'Mei Ling marks asthma so smoke guidance can use her actual aid card.',
    );
    await selectProfileChip('resident', 'Inhaler');
    await narrate(
      'profile-meiling-inhaler',
      'Director',
      'She also records that she carries an inhaler. Only a responder who joins her S O S can see this.',
    );
    await click('resident', () => button('resident', 'Save', true), 'save resident profile');
    await closeSheet('resident', 'Profile');
    completedMilestonesRef.current.add('residentProfile');
  };

  const ensureResponderProfile = async (options?: { presented?: boolean }) => {
    await ensureLogin('responder');
    if (responderProfileReady()) {
      completedMilestonesRef.current.add('responderProfile');
      return;
    }
    if (!options?.presented) {
      frameWindow('responder').__kkDemo?.configureResponderProfile?.();
      await wait(80);
      completedMilestonesRef.current.add('responderProfile');
      return;
    }
    await click('responder', () => profileButton('responder'), 'responder profile');
    await selectProfileChip('responder', 'Medical');
    await narrate(
      'profile-aisha-medical',
      'Director',
      'Aisha marks medical support so the app can match her to a Medical S O S.',
    );
    await selectProfileChip('responder', 'Hazard');
    await narrate(
      'profile-aisha-hazard',
      'Director',
      'She also marks hazard support because smoke and blocked access affect this response.',
    );
    await click('responder', () => button('responder', 'Save', true), 'save responder profile');
    await closeSheet('responder', 'Profile');
    completedMilestonesRef.current.add('responderProfile');
  };

  const ensureSosSent = async () => {
    if (residentSosActive() || responderPaged() || responderInCaseRoom()) return;
    await ensureLogin('resident');
    await click('resident', () => button('resident', 'Need help', true), 'need help');
    await click('resident', () => button('resident', 'Medical', true), 'medical SOS');
    await fill(
      'resident',
      () => inputByPlaceholder('resident', 'friend collapsed'),
      'Nicoll Highway MRT Exit B: e-bike smoke at the covered walkway. Elderly man collapsed; I am the witness, he is the casualty. Need AED and responders.',
      'SOS details',
    );
    await click('resident', () => button('resident', 'Send for help', true), 'send SOS');
    await waitFor(
      () => (residentSosActive() || responderPaged() ? document.body : null),
      'medical SOS live',
      20000,
    );
  };

  const ensureSeedDone = async () => {
    if (seedReceipt) return;
    await seedScenario();
  };

  const ensureResponderJoined = async () => {
    if (responderInCaseRoom()) return;
    await ensureLogin('responder');
    if (button('responder', 'Someone nearby needs help')) {
      await click('responder', () => button('responder', 'Someone nearby needs help'), 'open nearby SOS');
    }
    await click('responder', () => button('responder', 'Join & help'), 'join SOS');
    await waitFor(() => (responderInCaseRoom() ? document.body : null), 'responder in case room', 20000);
  };

  const ensureSwarmDone = async () => {
    const markers = frameWindow('resident').__kkMapDemo?.responderMarkerCount() ?? 0;
    if (swarmMarkersRef.current > 0 && markers >= Math.min(swarmMarkersRef.current, 5)) return;
    const swarm = await spawnSwarm();
    if (!swarm.responders) throw new Error('God Mode swarm did not attach responders to the SOS');
    swarmMarkersRef.current = Math.min(swarm.responders, 5);
    await waitFor(
      () => ((frameWindow('resident').__kkMapDemo?.responderMarkerCount() ?? 0) >= swarmMarkersRef.current ? document.body : null),
      'swarm approach markers',
      30000,
    );
  };

  const ensureSmokeVerified = async () => {
    await ensureLogin('ops');
    if (!button('ops', 'Smoke at MRT Exit B')) return;
    await click('ops', () => button('ops', 'Ops'), 'ops queue');
    await click('ops', () => button('ops', 'Smoke at MRT Exit B'), 'smoke report');
    await click('ops', () => button('ops', 'Verify → publish as incident'), 'verify report');
  };

  const ensureBroadcastSent = async () => {
    if (broadcastDelivered()) return;
    await ensureLogin('ops');
    await click('ops', () => button('ops', 'Broadcast', true), 'broadcast action');
    await click('ops', () => button('ops', 'Everyone', true), 'broadcast audience');
    await click('ops', () => button('ops', 'Emergency', true), 'broadcast urgency');
    await fill('ops', () => inputByPlaceholder('ops', 'Bishan'), 'Nicoll Highway MRT Exit B', 'broadcast area');
    await fill('ops', () => inputByPlaceholder('ops', 'Flash flood'), 'Avoid MRT Exit B smoke incident', 'broadcast message');
    await fill('ops', () => inputByPlaceholder('ops', 'What people should do'), 'Keep the covered walkway and access road clear for responders.', 'broadcast details');
    await click('ops', () => button('ops', 'Send broadcast', true), 'send broadcast');
    await waitFor(() => (broadcastDelivered() ? document.body : null), 'resident broadcast alert', 20000);
  };

  const ensureResponderOnScene = async () => {
    if (residentSeesOnScene()) return;
    frameWindow('responder').__kkDemo?.setTransportOnline(true);
    setNetworkState('online');
    await ensureLogin('responder');
    await ensureResponderJoined();
    if (button('responder', 'On scene', true)) {
      await click('responder', () => button('responder', 'On scene', true), 'mark on scene');
    }
    await waitFor(() => (residentSeesOnScene() ? document.body : null), 'resident sees on scene', 20000);
  };

  const milestoneStillNeeded = (milestone: DemoMilestone): boolean => {
    switch (milestone) {
      case 'residentLoggedIn':
        return !identityReady('resident') || !profileButton('resident');
      case 'residentProfile':
        return !residentProfileReady();
      case 'responderLoggedIn':
        return !identityReady('responder') || !profileButton('responder');
      case 'responderProfile':
        return !responderProfileReady();
      case 'opsLoggedIn':
        return !identityReady('ops') || !profileButton('ops');
      case 'responderOnDuty':
        return !responderOnDutyNow();
      case 'sosSent':
        return !(residentSosActive() || responderPaged() || responderInCaseRoom());
      case 'seedDone':
        return !seedReceipt;
      case 'responderJoined':
        return !responderInCaseRoom();
      case 'swarmDone': {
        const markers = frameWindow('resident').__kkMapDemo?.responderMarkerCount() ?? 0;
        return swarmMarkersRef.current <= 0 || markers < Math.min(swarmMarkersRef.current, 5);
      }
      case 'smokeVerified':
        return !!button('ops', 'Smoke at MRT Exit B');
      case 'broadcastSent':
        return !broadcastDelivered();
      case 'responderOnScene':
        return !residentSeesOnScene();
      default:
        return true;
    }
  };

  const milestoneNeedsCamera = (milestone: DemoMilestone) =>
    !['residentLoggedIn', 'residentProfile', 'responderLoggedIn', 'responderProfile', 'opsLoggedIn', 'seedDone'].includes(milestone);

  const roleForMilestone = (milestone: DemoMilestone): RoleKey | null => {
    if (milestone.startsWith('resident') || milestone === 'sosSent') return 'resident';
    if (milestone.startsWith('responder') || milestone === 'responderOnDuty' || milestone === 'responderOnScene') return 'responder';
    if (milestone.startsWith('ops') || milestone === 'smokeVerified' || milestone === 'broadcastSent') return 'ops';
    if (milestone === 'swarmDone') return 'resident';
    return null;
  };

  const ensurePrerequisitesForSection = async (sectionIndex: number) => {
    const section = DEMO_SECTIONS[sectionIndex];
    if (!section) return;
    const milestones = PREREQUISITES_BY_SECTION[section.id] ?? [];
    const pending = milestones.filter(
      (milestone) => !completedMilestonesRef.current.has(milestone) || milestoneStillNeeded(milestone),
    );
    if (pending.length === 0) return;

    for (const milestone of pending) {
      checkpoint();
      const focusRole = roleForMilestone(milestone);
      if (focusRole && milestoneNeedsCamera(milestone) && !frameActive(focusRole)) {
        await switchCamera(focusRole, section.chapter);
      }
      switch (milestone) {
        case 'residentLoggedIn':
          await ensureLogin('resident');
          completedMilestonesRef.current.add('residentLoggedIn');
          break;
        case 'residentProfile':
          await ensureResidentProfile();
          break;
        case 'responderLoggedIn':
          await ensureLogin('responder');
          completedMilestonesRef.current.add('responderLoggedIn');
          break;
        case 'responderProfile':
          await ensureResponderProfile();
          break;
        case 'opsLoggedIn':
          await ensureLogin('ops');
          completedMilestonesRef.current.add('opsLoggedIn');
          break;
        case 'responderOnDuty':
          if (!responderOnDutyNow()) await ensureResponderDuty(true);
          completedMilestonesRef.current.add('responderOnDuty');
          break;
        case 'sosSent':
          await ensureSosSent();
          completedMilestonesRef.current.add('sosSent');
          break;
        case 'seedDone':
          await ensureSeedDone();
          completedMilestonesRef.current.add('seedDone');
          break;
        case 'responderJoined':
          await ensureResponderJoined();
          completedMilestonesRef.current.add('responderJoined');
          break;
        case 'swarmDone':
          await ensureSwarmDone();
          completedMilestonesRef.current.add('swarmDone');
          break;
        case 'smokeVerified':
          await ensureSmokeVerified();
          completedMilestonesRef.current.add('smokeVerified');
          break;
        case 'broadcastSent':
          await ensureBroadcastSent();
          completedMilestonesRef.current.add('broadcastSent');
          break;
        case 'responderOnScene':
          await ensureResponderOnScene();
          completedMilestonesRef.current.add('responderOnScene');
          break;
        default:
          break;
      }
    }
    await wait(fast ? 40 : 120);
  };

  const closeSheet = async (role: RoleKey, heading: string) => {
    const doc = frameDocument(role);
    const header = Array.from(doc.querySelectorAll('header')).find((node) => cleanText(node.textContent).includes(heading));
    const close = header?.querySelector('button') ?? null;
    if (close) await click(role, () => close, `${heading} close`);
  };

  const chipSelected = (element: HTMLElement) => {
    const cls = String(element.className);
    return cls.includes('bg-surface-3') || cls.includes('text-text-inverse');
  };

  const selectProfileChip = async (role: RoleKey, label: string) => {
    const chip = await waitFor(() => button(role, label, true), `${role} ${label} profile chip`);
    if (chipSelected(chip)) {
      await moveCursor(role, chip);
      await wait(fast ? 20 : 80);
    } else {
      await click(role, () => button(role, label, true), `${role} ${label} profile chip`);
    }
    await waitFor(
      () => {
        const next = button(role, label, true);
        return next && chipSelected(next) ? next : null;
      },
      `${role} ${label} profile chip selected`,
    );
  };

  const aiHeader = (role: RoleKey): HTMLElement | null => {
    const names = ['AI Kaki', 'Pelita', 'Bekal', 'Pondok'];
    return Array.from(frameDocument(role).querySelectorAll<HTMLElement>('header'))
      .find((node) => names.some((name) => cleanText(node.textContent).includes(name))) ?? null;
  };

  const closeAiKaki = async (role: RoleKey) => {
    setFocusBox(null);
    const header = aiHeader(role);
    const buttons = header ? Array.from(header.querySelectorAll<HTMLButtonElement>('button')) : [];
    const close = buttons[buttons.length - 1] ?? null;
    if (close) await click(role, () => close, `${role} AI Kaki close`);
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

  const askAiKaki = async (
    role: RoleKey,
    agentName: 'Pelita' | 'Bekal' | 'Pondok',
    prompt: string,
    answerNeedle: string,
    resultSceneId: string,
    resultCaption: string,
    whileWaiting: () => Promise<void>,
  ) => {
    setFocusBox(null);
    await click(role, () => button(role, 'AI Kaki'), `${role} AI Kaki`);
    await wait(fast ? 40 : 220);
    let header = aiHeader(role);
    let title = cleanText(header?.textContent);
    if (!title.includes(agentName)) {
      if (title && !title.includes('AI Kaki')) {
        const back = header?.querySelector<HTMLButtonElement>('button') ?? null;
        if (back) await click(role, () => back, `${role} AI Kaki back`);
      }
      await click(role, () => button(role, agentName), `${agentName} picker`);
    }
    await fill(role, () => inputByPlaceholder(role, `Ask ${agentName}`), prompt, `${agentName} prompt`);
    const aiInput = await waitFor(() => inputByPlaceholder(role, `Ask ${agentName}`), `${agentName} input`);
    const send = aiInput.parentElement?.querySelector('button') as HTMLButtonElement | null;
    if (!send) throw new Error(`${agentName} send button not found`);
    const agentKey = agentName.toLowerCase();
    await waitFor(
      () => frameWindow(role).__kkAgent ?? null,
      `${agentName} reply observer`,
    );
    const beforeCount = frameWindow(role).__kkAgent?.replyCount(agentKey) ?? 0;
    await click(role, () => send, `${agentName} send`);
    const deadline = Date.now() + 90000;
    const answered = () => {
      const currentAgent = frameWindow(role).__kkAgent;
      if (!currentAgent) return false;
      const reply = currentAgent.lastReply(agentKey);
      return currentAgent.replyCount(agentKey) > beforeCount
        && !currentAgent.busy()
        && new RegExp(answerNeedle, 'i').test(reply);
    };
    await wait(fast ? 80 : 500);
    await closeAiKaki(role);
    while (!answered() && Date.now() < deadline) await whileWaiting();
    await waitFor(
      () => answered() ? document.body : null,
      `${agentName} answer`,
      Math.max(1000, deadline - Date.now()),
    );
    if (!aiKakiOpen(role)) await click(role, () => button(role, 'AI Kaki'), `${role} reopen AI Kaki`);
    await waitFor(
      () => cleanText(aiHeader(role)?.textContent).includes(agentName) ? aiHeader(role) : null,
      `${agentName} reply panel`,
    );
    setChapter(`${actors[role].roleLabel} · ${agentName} reply`);
    await narrate(resultSceneId, 'Director', resultCaption);
    await closeAiKaki(role);
  };

  const seedScenario = async () => {
    if (!sessionId) throw new Error('Demo session has not started');
    setCursor({ x: window.innerWidth / 2, y: window.innerHeight * 0.58, visible: true, down: true });
    await wait(fast ? 70 : 220);
    setCursor((current) => ({ ...current, down: false }));
    const receipt = await api<SeedReceipt>(`/api/demo/${sessionId}/seed`, { method: 'POST' });
    setSeedReceipt(receipt);
    const nextStatus = await api<DemoStatus>(`/api/demo/${sessionId}/status`);
    setStatus(nextStatus);
    return receipt;
  };

  const shutdownActors = () => {
    (Object.keys(actors) as RoleKey[]).forEach((role) => frameWindow(role).__kkDemo?.shutdown());
  };

  const cleanup = async () => {
    if (!sessionId) return;
    setPhase('cleaning');
    setCamera('resident');
    setChapter('Clean teardown');
    setNetworkState('online');
    shutdownActors();
    await rawSleep(fast ? 120 : 650);
    setFramesVisible(false);
    const result = await api<{ removedObjects: number; residue: number; audit: string }>(
      `/api/demo/${sessionId}/cleanup`,
      { method: 'POST' },
    );
    const finalStatus = await api<DemoStatus>(`/api/demo/${sessionId}/status`);
    setStatus(finalStatus);
    if (result.residue !== 0 || finalStatus.retainedObjects !== 0) {
      throw new Error(`Cleanup left ${Math.max(result.residue, finalStatus.retainedObjects)} demo objects`);
    }
    setAuditLine(result.audit);
    setCaption(`${result.removedObjects} session objects were removed. One completion line remains.`);
    setCaptionKind('action');
    setPhase('complete');
  };

  const togglePause = () => {
    if (phase !== 'running') return;
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) {
      pauseDemoAudio();
      setCursor((current) => ({ ...current, down: false }));
    } else {
      resumeDemoAudio();
    }
  };

  const stopActiveNarration = () => {
    stopQwenScene();
    cancelSpeechRef.current?.();
  };

  /** Best-effort synchronous teardown so skip can escape AI waits, sheets, offline MQTT, etc. */
  const stabilizeDemoUiForSkip = () => {
    stopActiveNarration();
    clearPresenterOverlays();
    setNetworkState('online');
    setCursor((current) => ({ ...current, down: false, visible: false }));
    resumeDemoAudio();
    for (const role of ['resident', 'responder', 'ops'] as RoleKey[]) {
      try {
        if (aiKakiOpen(role)) {
          const header = aiHeader(role);
          const buttons = header ? Array.from(header.querySelectorAll<HTMLButtonElement>('button')) : [];
          buttons[buttons.length - 1]?.click();
        }
        const doc = frameDocument(role);
        for (const header of Array.from(doc.querySelectorAll('header'))) {
          const label = cleanText(header.textContent);
          if (/Profile|Alerts|Broadcast|Need help|Medical|Ops|AI Kaki/i.test(label)) {
            header.querySelector('button')?.click();
          }
        }
        if (layerPanelOpen(role)) button(role, 'Layers')?.click();
        frameWindow(role).__kkMapDemo?.clearEvidence();
        if (role === 'responder') frameWindow(role).__kkDemo?.setTransportOnline(true);
      } catch {
        // Embedded frame may still be loading.
      }
    }
  };

  const requestSectionJump = (targetIndex: number) => {
    if (phase !== 'running') return;
    const clamped = Math.max(0, Math.min(DEMO_SECTIONS.length - 1, targetIndex));
    if (clamped === sectionIndexRef.current) return;
    stabilizeDemoUiForSkip();
    skipTargetRef.current = clamped;
    pausedRef.current = false;
    setPaused(false);
    actionBeat(
      DEMO_SECTIONS[clamped].chapter,
      `Skipping to ${SECTION_CATEGORY_LABELS[DEMO_SECTIONS[clamped].category]} · ${DEMO_SECTIONS[clamped].title}.`,
    );
  };

  const skipSectionBack = () => requestSectionJump(sectionIndexRef.current - 1);
  const skipSectionForward = () => requestSectionJump(sectionIndexRef.current + 1);

  const recoverFromStuck = () => {
    if (phase !== 'running') return;
    skipTargetRef.current = null;
    pausedRef.current = false;
    setPaused(false);
    stabilizeDemoUiForSkip();
    actionBeat(chapter, 'Recovered overlays, sheets, and transport. Use skip forward if this section stays stuck.');
  };

  const requestStop = (restart: boolean) => {
    if (phase !== 'running') return;
    restartRequestedRef.current = restart;
    runAfterPrepareRef.current = restart;
    stopRequestedRef.current = true;
    pausedRef.current = false;
    setPaused(false);
    stopActiveNarration();
    setSpeaker('AI Director');
    setCaption(restart ? 'Restart requested. Cleaning this session before opening a new one.' : 'Termination requested. Cleaning every object created by this session.');
    setCaptionKind('action');
  };

  const terminate = async () => {
    if (phase === 'running') {
      requestStop(false);
      return;
    }
    if (phase === 'ready') await cleanup();
  };

  const restart = async () => {
    if (phase === 'running') {
      requestStop(true);
      return;
    }
    if (phase === 'ready') await cleanup();
    runAfterPrepareRef.current = true;
    await prepare();
  };

  const runSection = async (sectionId: string) => {
    switch (sectionId) {
      case 'intro':
        await switchCamera('resident', 'Live setup · Director');
        await flashPresentationCard(
          'LIVE APP CONTROL',
          'SMOKE AT EXIT B',
          'THREE LIVE MAPS',
          'One incident across a citizen, a responder, and ops.',
        );
        await narrate(
          'god-deploy',
          'Director',
          'This is not a video. I am opening three real users on one live map, then driving reports, responders, alerts, and case state through M Q T T.',
        );
        return;
      case 'setup-resident':
        await login('resident');
        await flashCutscene(
          'Smoke at MRT Exit B',
          'Rain, e-bike smoke, a crowded choke point — seconds before someone goes down.',
        );
        await narrate(
          'resident-intro',
          'Mei Ling',
          'In this drill, rain has crowded people under the covered M R T exit while an e bike smokes near the choke point. I am asthmatic, so first I make sure my aid card is set.',
        );
        await ensureResidentProfile({ presented: true });
        return;
      case 'setup-responder':
        await login('responder');
        await narrate(
          'responder-intro',
          'Aisha',
          'I am Aisha, a nearby community responder. I begin in lepak mode: no mission, no private details, and no false urgency until I choose to go on duty.',
        );
        await ensureResponderProfile({ presented: true });
        return;
      case 'setup-ops':
        await login('ops');
        await narrate(
          'ops-intro',
          'Nadia',
          'I am Nadia in ops. I am not here to improvise heroics; I see reports, responders, cases, and map evidence, then decide what to publish and who to send.',
        );
        return;
      case 'ai-pelita':
        await switchCamera('resident', 'Citizen · Pelita reads the map');
        await narrate(
          'resident-report',
          'Director',
          'Pelita is an A I Kaki agent, not another human role. Mei Ling asks one conditions question, and Pelita reads the same map snapshot already refreshed by the app.',
        );
        await askAiKaki(
          'resident',
          'Pelita',
          'How is it looking around me right now near the MRT exit?',
          'rain|traffic|air|PSI|condition',
          'pelita-result',
          'Pelita has turned the cached rain, air, and traffic readings into one useful local answer. No extra upstream fetch was needed.',
          async () => {
            await previewMapLayer(
              'resident',
              'rainfall',
              'Rainfall',
              'rainfall evidence',
              'Pelita is checking the cached rainfall reading already available on Mei Ling’s map.',
              'map-pelita-rain',
            );
          },
        );
        return;
      case 'responder-duty':
        await switchCamera('responder', 'Responder · availability and map');
        await narrate(
          'responder-duty',
          'Aisha',
          'I am nearby, but the system should not page me just because I exist. I go on duty and declare medical plus hazard support.',
        );
        await ensureResponderDuty(true);
        return;
      case 'sos-bekal':
        await switchCamera('resident', 'Citizen · urgent escalation');
        await narrate(
          'resident-sos',
          'Mei Ling',
          'Now it is an emergency. An elderly man near the smoke has collapsed and is not responding properly. I am the witness, he is the casualty, and this needs a Medical S O S.',
        );
        await click('resident', () => button('resident', 'Need help', true), 'need help');
        await click('resident', () => button('resident', 'Medical', true), 'medical SOS');
        await fill('resident', () => inputByPlaceholder('resident', 'friend collapsed'), 'Nicoll Highway MRT Exit B: e-bike smoke at the covered walkway. Elderly man collapsed; I am the witness, he is the casualty. Need AED and responders.', 'SOS details');
        await click('resident', () => button('resident', 'Send for help', true), 'send SOS');
        await focusSosArea(
          'resident',
          'focus-resident-sos',
          'The map zooms into the actual S O S at Exit B. From this point onward, every hospital, A E D, traffic, camera, and weather check is measured from this incident.',
        );
        await narrate(
          'bekal-intro',
          'Director',
          'Bekal is the S O S companion A I. It does not dispatch anyone. It calls the A E D and hospital skills, then gives Mei Ling specific guidance while the response forms.',
        );
        await askAiKaki(
          'resident',
          'Bekal',
          'Elderly man collapsed after e-bike smoke at Nicoll Highway MRT Exit B. I am the witness; he is the casualty. Which AED and A&E hospital should bystanders use, and what should I do while Aisha is coming?',
          'AED|hospital|A&E|CPR|995',
          'bekal-result',
          'Bekal has returned the nearest A E D, an emergency hospital, and immediate safety guidance. Those skill results are also rendered as map pins.',
          async () => {
            await previewMapLayer(
              'resident',
              'aeds',
              'AED',
              'nearest AED',
              'While Bekal checks, the map exposes the nearest bundled A E D around the S O S.',
              'map-bekal-aed',
            );
          },
        );
        await waitFor(() => button('responder', 'Someone nearby needs help'), 'responder page');
        return;
      case 'mqtt-fanout':
        await seedScenario();
        await switchCamera('all', 'MQTT · one truth in three clients');
        await narrate(
          'propagation',
          'Director',
          'The same incident now exists in three maps. Mei Ling sees her S O S. Aisha receives a matched page. Nadia sees smoke reports and the live case forming.',
        );
        await flashPresentationCard(
          'MQTT FANOUT',
          '3 REPORTS → OPS CONTEXT',
          '1 SOS → PRIVATE CASE',
          'Retained topics replay into every role without retyping the story.',
        );
        return;
      case 'case-room':
        await switchCamera('responder', 'Responder · accepts with map evidence');
        await narrate(
          'responder-join',
          'Aisha',
          'Before I join, I see the category and location but not private medical details. Once I commit, the case room opens and the aid card becomes useful.',
        );
        await click('responder', () => button('responder', 'Someone nearby needs help'), 'open nearby SOS');
        await click('responder', () => button('responder', 'Join & help'), 'join SOS');
        await revealCaseAidCard('responder');
        await narrate(
          'responder-aidcard',
          'Aisha',
          'There — Mei Ling’s aid card: asthma, inhaler, no drug allergies. That only appeared because I joined the private case room.',
        );
        {
          const swarm = await spawnSwarm();
          if (!swarm.responders) throw new Error('God Mode swarm did not attach responders to the SOS');
          swarmMarkersRef.current = Math.min(swarm.responders, 5);
        }
        await narrate(
          'responder-host',
          'Aisha',
          'Every case room has Host — slash commands, not another chat bot. I type slash host status; the whole room gets the same structured readout from live case data.',
        );
        await fill('responder', () => inputByPlaceholder('responder', 'Message the case'), '/host status', 'host command');
        const hostCmdInput = await waitFor(() => inputByPlaceholder('responder', 'Message the case'), 'case chat input');
        const sendHostCmd = hostCmdInput.parentElement?.querySelector('button') as HTMLButtonElement | null;
        if (sendHostCmd) await click('responder', () => sendHostCmd, 'send host command');
        await holdHostReply('responder');
        return;
      case 'citizen-relief':
        await switchCamera('resident', 'Citizen · help becomes visible');
        await waitFor(
          () => (frameWindow('resident').__kkMapDemo?.responderMarkerCount() ?? 0) >= swarmMarkersRef.current
            ? document.body
            : null,
          'resident swarm markers',
          30000,
        );
        await focusSosArea(
          'resident',
          'focus-resident-swarm',
          'Mei Ling returns to the S O S area. The close map now shows the casualty point and responder approach markers together.',
        );
        await narrate(
          'resident-relief',
          'Mei Ling',
          'This is the moment that matters. My map does not merely say help is coming. I can see nearby responder approach markers, while the full supporting roster remains in the case room.',
        );
        return;
      case 'ops-verify':
        await switchCamera('ops', 'Ops · verify before broadcast');
        await click('ops', () => button('ops', 'Ops'), 'ops queue');
        await click('ops', () => button('ops', 'Smoke at MRT Exit B'), 'smoke report');
        await click('ops', () => button('ops', 'Verify → publish as incident'), 'verify report');
        await switchCamera('ops', 'Ops · command the whole picture');
        await askAiKaki(
          'ops',
          'Pondok',
          'Ops picture for Exit B: active medical SOS for collapsed elderly casualty, supporting smoke and access reports, on-duty responders. Which responder fits AED support and what facts should I verify before broadcast?',
          'Aisha|Wei Jian|AED|medical|responder|SOS',
          'pondok-result',
          'Pondok has compared the live roster with the case and highlighted skill-fit candidates for medical and A E D support. Nadia still decides every deployment.',
          async () => {},
        );
        setChapter('Ops · public warning');
        await narrate(
          'ops-broadcast-action',
          'Director',
          'Nadia sends the warning to citizens and responders, labels the area Exit B, marks it Emergency, and gives one clear public action: keep the walkway and access road clear.',
        );
        await narrate(
          'ops-broadcast',
          'Nadia',
          'The smoke report is verified, so I warn people away from the station exit without exposing the private case room.',
        );
        await click('ops', () => button('ops', 'Broadcast', true), 'broadcast action');
        await click('ops', () => button('ops', 'Everyone', true), 'broadcast audience');
        await click('ops', () => button('ops', 'Emergency', true), 'broadcast urgency');
        await fill('ops', () => inputByPlaceholder('ops', 'Bishan'), 'Nicoll Highway MRT Exit B', 'broadcast area');
        await fill('ops', () => inputByPlaceholder('ops', 'Flash flood'), 'Avoid MRT Exit B smoke incident', 'broadcast message');
        await fill('ops', () => inputByPlaceholder('ops', 'What people should do'), 'Keep the covered walkway and access road clear for responders.', 'broadcast details');
        await click('ops', () => button('ops', 'Send broadcast', true), 'send broadcast');
        await flashPresentationCard(
          'PUBLIC WARNING SENT',
          'AVOID EXIT B',
          'PRIVATE CASE STAYS PRIVATE',
          'The public receives the hazard and access instruction. Medical details remain inside the S O S room.',
        );
        return;
      case 'resilience':
        await switchCamera('responder', 'Resilience · useful while the link stutters');
        await narrate(
          'resilience-drop',
          'Director',
          "Now I break Aisha's M Q T T link. She marks on scene locally, but Mei Ling must not see a false arrival until the broker delivers it.",
        );
        frameWindow('responder').__kkDemo?.setTransportOnline(false);
        setNetworkState('stuttering');
        await wait(fast ? 100 : 900);
        await click('responder', () => button('responder', 'On scene', true), 'offline on-scene update');
        await narrate(
          'responder-offline',
          'Aisha',
          'I mark myself on scene while the connection is down. My phone keeps the retained update queued instead of lying to Mei Ling.',
        );
        await switchCamera('resident', 'Citizen · no false acknowledgement');
        frameWindow('responder').__kkDemo?.setTransportOnline(true);
        setNetworkState('online');
        await waitFor(
          () => cleanText(frameDocument('resident').body.textContent).includes('someone is on scene') ? document.body : null,
          'queued arrival to reconcile',
          20000,
        );
        await narrate(
          'reconciled',
          'Director',
          "The connection returns. M Q T T flushes the queued retained update, and Mei Ling's map reconciles to someone on scene.",
        );
        return;
      case 'closure':
        await switchCamera('resident', 'Citizen · trusted alert and closure');
        await narrate(
          'resident-alert-action',
          'Director',
          'The ops warning has reached Mei Ling. The demo opens her alerts to show the delivered result before closing the case.',
        );
        await click('resident', () => frameDocument('resident').querySelector('button[title="Alerts"]'), 'resident alerts');
        await waitFor(() => cleanText(frameDocument('resident').body.textContent).includes('Avoid MRT Exit B smoke incident') ? document.body : null, 'resident broadcast');
        await narrate(
          'resident-safe',
          'Mei Ling',
          "The alert tells everyone else what to avoid. In my case room I can see responder presence, and I am now clear of the smoke. So I tap I'm safe.",
        );
        await closeSheet('resident', 'Alerts');
        await click('resident', () => button('resident', "I'm safe", true), 'citizen safe acknowledgement');
        await switchCamera('responder', 'Responder · dual acknowledgement');
        await narrate(
          'responder-resolve',
          'Aisha',
          "The citizen's safe button is not enough by itself, and my field confirmation is not enough alone. The case closes only when both facts exist.",
        );
        await click('responder', () => button('responder', 'Resolved', true), 'responder resolution');
        await flashPresentationCard(
          'DUAL ACKNOWLEDGEMENT',
          'CITIZEN SAFE',
          'RESPONDER RESOLVED',
          'Only both acknowledgements close the live S O S.',
        );
        await switchCamera('all', 'Shared outcome');
        await narrate(
          'outcome',
          'Director',
          'Map evidence, case room, Host, M Q T T, and alerts served one story. This performance is complete — I will now remove everything this session created.',
        );
        await switchCamera('resident', 'Clean teardown · Director');
        {
          const before = await api<DemoStatus>(`/api/demo/${sessionId}/status`);
          setStatus(before);
        }
        await cleanup();
        return;
      default:
        throw new Error(`Unknown demo section: ${sectionId}`);
    }
  };

  const run = async () => {
    if (!sessionId || loaded.size !== 3) return;
    setPhase('running');
    setError(null);
    stopRequestedRef.current = false;
    restartRequestedRef.current = false;
    skipTargetRef.current = null;
    sectionIndexRef.current = 0;
    setCurrentSectionIndex(0);
    if (!silent && !fast) {
      const missingVoice = await missingQwenScenes([...REQUIRED_VOICE_SCENES]);
      if (missingVoice.length) {
        setError(`Missing Qwen3-TTS voice files: ${missingVoice.join(', ')}. Run: npm run demo:voice`);
        setPhase('failed');
        return;
      }
      if (!voiceReady) {
        try {
          await unlockDemoAudio();
          setVoiceReady(true);
        } catch {
          // Play/Run already unlocked from presenter click; continue.
        }
      }
    }
    try {
      let index = 0;
      while (index < DEMO_SECTIONS.length) {
        checkpoint();
        const section = DEMO_SECTIONS[index];
        sectionIndexRef.current = index;
        setCurrentSectionIndex(index);
        setChapter(section.chapter);
        try {
          await ensurePrerequisitesForSection(index);
          await runSection(section.id);
        } catch (caught) {
          if (caught instanceof DemoSectionSkip) {
            stabilizeDemoUiForSkip();
            index = caught.targetIndex;
            skipTargetRef.current = null;
            await wait(fast ? 40 : 180);
            continue;
          }
          throw caught;
        }
        if (skipTargetRef.current !== null) {
          index = skipTargetRef.current;
          skipTargetRef.current = null;
          continue;
        }
        index += 1;
      }
    } catch (caught) {
      const requestedStop = caught instanceof DemoStopped;
      const message = caught instanceof Error ? caught.message : String(caught);
      if (!requestedStop) setError(message);
      try {
        await cleanup();
        if (restartRequestedRef.current) {
          runAfterPrepareRef.current = true;
          await prepare();
        } else if (!requestedStop) {
          setPhase('failed');
        }
      } catch (cleanupError) {
        setError(`${message}. Cleanup also failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
        setPhase('failed');
      }
    }
  };

  useEffect(() => {
    if (!autostart || phase !== 'idle' || autostartPreparedRef.current) return;
    autostartPreparedRef.current = true;
    runAfterPrepareRef.current = true;
    void prepare();
  }, [autostart, phase]);

  useEffect(() => {
    if ((!autostart && !runAfterPrepareRef.current) || phase !== 'ready' || loaded.size !== 3 || autostartRunRef.current) return;
    autostartRunRef.current = true;
    runAfterPrepareRef.current = false;
    void unlockDemoAudio()
      .then(() => {
        setVoiceReady(true);
        return run();
      })
      .catch(() => { void run(); });
  }, [autostart, phase, loaded.size]);

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
      await waitFor(
        () => {
          const win = frameRefs.current[role]?.contentWindow as DemoWindow | null;
          const doc = frameRefs.current[role]?.contentDocument;
          if (!win?.__kkDemo || !doc || doc.readyState !== 'complete') return null;
          const loginReady = button(role, 'Explore in demo mode');
          const mapReady = visible(doc.querySelector('button[title="Your profile"]') as HTMLButtonElement);
          return loginReady || mapReady ? true : null;
        },
        `${role} embedded app ready`,
        30000,
      );
      setLoaded((current) => new Set(current).add(role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setPhase('failed');
    }
  };
  const currentSpeaker = speakerProfile(speaker);
  const focusRole: RoleKey = camera === 'all' ? 'resident' : camera;
  const aiPanelOpen = aiKakiOpen(focusRole);
  const activeSection = DEMO_SECTIONS[currentSectionIndex] ?? DEMO_SECTIONS[0];
  const canSkipBack = phase === 'running' && currentSectionIndex > 0;
  const canSkipForward = phase === 'running' && currentSectionIndex < DEMO_SECTIONS.length - 1;

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-[#171713] text-white"
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
    >
      <div className="absolute inset-x-0 top-0 overflow-hidden bg-[#d8d4ca]" style={{ bottom: 'max(12vh, 96px)' }}>
        <div
          className="absolute left-1/2 top-0 h-screen w-screen origin-top"
          style={{ transform: 'translateX(-50%) scale(0.88)' }}
        >
          {framesVisible && sessionId ? (
            <>
          {(Object.keys(actors) as RoleKey[]).map((role, index) => {
            const all = camera === 'all';
            const active = camera === role;
            return (
              <div
                key={role}
                className="absolute top-0 h-full overflow-hidden bg-white transition-[left,width,opacity,transform] duration-500 ease-out"
                style={{
                  left: all ? `${index * 33.333}%` : 0,
                  width: all ? '33.333%' : '100%',
                  opacity: all || active ? 1 : 0,
                  pointerEvents: active ? 'auto' : 'none',
                  transform: all ? 'scale(0.985)' : 'scale(1)',
                  zIndex: active ? 3 : all ? 2 : 1,
                }}
              >
                <iframe
                  ref={(node) => { frameRefs.current[role] = node; }}
                  title={`${actors[role].roleLabel} demo client`}
                  src={frameUrl(role)}
                  onLoad={() => { void markFrameReady(role); }}
                  allow="geolocation"
                  className="h-full w-full border-0 bg-white"
                />
                {all && (
                  <div className="pointer-events-none absolute left-3 top-3 z-50 border-2 border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[3px_3px_0_#111]">
                    AI {actors[role].roleLabel} · {actors[role].name}
                  </div>
                )}
              </div>
            );
          })}
            </>
          ) : (
            <iframe title="KampungKaki" src="/?embedded=1" className="h-full w-full border-0 bg-white" />
          )}
        </div>
      </div>

      {presentationCard && (
        <div
          key={presentationCard.id}
          className="kk-demo-title-backdrop pointer-events-none absolute inset-x-0 top-0 z-[215] flex items-center justify-center overflow-hidden bg-black/80 px-8 text-center"
          style={{ bottom: 'max(12vh, 96px)' }}
        >
          <div className="kk-demo-title-card max-w-[1180px]">
            <div className="text-[clamp(14px,1.5vw,22px)] font-black uppercase tracking-[0.35em] text-[#f1cf54]">
              {presentationCard.eyebrow}
            </div>
            <div className="mt-5 text-[clamp(58px,9vw,136px)] font-black uppercase leading-[0.82] tracking-[-0.07em] text-white">
              {presentationCard.title}
            </div>
            <div className="mt-7 text-[clamp(28px,4.2vw,64px)] font-black uppercase leading-none tracking-[-0.04em] text-white">
              {presentationCard.headline}
            </div>
            <div className="mx-auto mt-7 h-1 w-28 bg-[#e0001b]" />
            <div className="mt-5 text-[clamp(15px,1.7vw,24px)] font-bold uppercase tracking-[0.12em] text-white/75">
              {presentationCard.detail}
            </div>
          </div>
        </div>
      )}

      {cutscene && (
        <div
          key={cutscene.id}
          className="pointer-events-none absolute inset-x-0 top-0 z-[214] overflow-hidden bg-black"
          style={{ bottom: 'max(12vh, 96px)' }}
        >
          <img
            src={cutscene.image}
            alt=""
            className="h-full w-full object-cover opacity-90"
            style={{ animation: 'kkDemoShake 2.4s ease-in-out both' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
          <div className="absolute bottom-10 left-10 max-w-3xl">
            <div className="text-[12px] font-black uppercase tracking-[0.35em] text-[#f1cf54]">AI CUTSCENE · STORYBOARD</div>
            <div className="mt-3 text-[clamp(38px,6vw,84px)] font-black uppercase leading-none tracking-[-0.06em] text-white">{cutscene.title}</div>
            <div className="mt-4 text-[clamp(14px,1.8vw,24px)] font-bold uppercase tracking-[0.08em] text-white/75">{cutscene.detail}</div>
          </div>
        </div>
      )}

      <footer
        className={`absolute inset-x-0 bottom-0 z-[220] min-h-[96px] border-t-2 border-black bg-[#f7f3e8] text-black transition-opacity duration-150 ${presentationCard || cutscene ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        style={{ height: 'max(12vh, 96px)' }}
      >
        <div className="flex h-6 items-center gap-4 overflow-hidden border-b border-black/20 px-4 text-[8px] font-black uppercase tracking-[0.12em] text-black/60">
          <span className="shrink-0 text-red-700">Live demo</span>
          <span className="truncate">{silent ? 'Silent caption review — no voice playback' : 'Qwen3-TTS reference voices only — no browser TTS'}</span>
          <span className="shrink-0">{sessionId ?? 'session not started'}</span>
          <span className="shrink-0">{status?.retainedObjects ?? 0} session objects</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${silent ? 'bg-black/35' : voiceReady ? 'bg-emerald-600' : 'bg-amber-500'}`} />
            {silent ? 'Voice muted' : `Qwen voice ${voiceReady ? 'ready' : 'checking'}`}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${networkState === 'online' ? 'bg-emerald-600' : 'animate-pulse bg-red-600'}`} />
            MQTT {networkState === 'online' ? 'live' : 'stuttering'}
          </span>
        </div>

        <div className="flex min-h-[70px] items-center gap-4 px-4" style={{ height: 'calc(100% - 24px)' }}>
          <div className="flex w-72 shrink-0 items-center gap-3">
            {currentSpeaker.ai || !currentSpeaker.image ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-black text-[#f1cf54] shadow-[3px_3px_0_#111]">
                <Sparkles className="h-7 w-7" />
              </div>
            ) : (
              <img
                src={currentSpeaker.image}
                alt=""
                className="h-14 w-14 rounded-lg border-2 border-black object-cover shadow-[3px_3px_0_#111]"
              />
            )}
            <div className="min-w-0">
              <div className="text-[8px] font-black uppercase tracking-[0.18em] text-red-700">
                {captionKind === 'speech' ? 'Now speaking' : 'Live action'}
              </div>
              <div className="truncate text-[16px] font-black uppercase leading-tight tracking-[-0.04em] text-black">{currentSpeaker.name}</div>
              <div className="truncate text-[8px] font-bold uppercase tracking-[0.12em] text-black/50">{currentSpeaker.role}</div>
              <div className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-[0.12em] text-black/45">{chapter}</div>
              {phase === 'running' && (
                <div className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-[0.12em] text-red-700/80">
                  {currentSectionIndex + 1}/{DEMO_SECTIONS.length} · {SECTION_CATEGORY_LABELS[activeSection.category]} · {activeSection.title}
                </div>
              )}
              {seedReceipt && <div className="text-[8px] text-black/45">{seedReceipt.responders} agents · {seedReceipt.reports} reports</div>}
            </div>
          </div>

          <p
            className="min-w-0 flex-1 text-[clamp(13px,1.35vw,19px)] font-semibold leading-snug"
            aria-live="polite"
            aria-label={`${speaker}: ${error ? `Demo stopped: ${error}` : auditLine ?? caption}`}
          >
            {error ? `Demo stopped: ${error}` : auditLine ?? caption}
          </p>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {phase === 'running' && (
              <div className="flex items-center gap-1">
                <select
                  value={currentSectionIndex}
                  onChange={(event) => requestSectionJump(Number(event.target.value))}
                  className="h-7 max-w-[220px] border border-black/20 bg-white px-1 text-[8px] font-bold uppercase tracking-[0.08em] text-black"
                  aria-label="Jump to demo section"
                >
                  {DEMO_SECTIONS.map((section, index) => (
                    <option key={section.id} value={index}>
                      {index + 1}. [{SECTION_CATEGORY_LABELS[section.category]}] {section.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={skipSectionBack}
                  disabled={!canSkipBack}
                  title="Skip back one section"
                  className="flex h-7 w-7 items-center justify-center border border-black disabled:opacity-35"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={skipSectionForward}
                  disabled={!canSkipForward}
                  title="Skip forward one section"
                  className="flex h-7 w-7 items-center justify-center border border-black disabled:opacity-35"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={recoverFromStuck}
                  title="Clear overlays and reset transport if stuck"
                  className="flex h-7 items-center gap-1 border border-black px-2 text-[8px] font-black uppercase tracking-widest"
                >
                  <SkipForward className="h-3 w-3" /> Unstick
                </button>
              </div>
            )}
            <div className="flex items-center gap-1">
            {phase === 'idle' && (
              <button
                onClick={() => {
                  void unlockDemoAudio().then(() => {
                    try { window.speechSynthesis?.resume(); } catch { /* no tts */ }
                    runAfterPrepareRef.current = true;
                    void prepare();
                  });
                }}
                className="flex h-9 items-center gap-1.5 bg-[#f1cf54] px-3 text-[9px] font-black uppercase tracking-widest"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Play live demo
              </button>
            )}
            {phase === 'ready' && (
              <button
                onClick={() => {
                  void unlockDemoAudio().then(() => {
                    setVoiceReady(true);
                    void run();
                  });
                }}
                disabled={loaded.size !== 3}
                className="flex h-9 items-center gap-1.5 bg-[#f1cf54] px-3 text-[9px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {loaded.size === 3 ? 'Run' : `Roles ${loaded.size}/3`}
              </button>
            )}
            {phase === 'running' && (
              <button onClick={togglePause} className="flex h-9 items-center gap-1.5 bg-black px-3 text-[9px] font-black uppercase tracking-widest text-white">
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {paused ? 'Resume' : 'Pause'}
              </button>
            )}
            {(phase === 'ready' || phase === 'running' || phase === 'complete' || phase === 'failed') && (
              <button onClick={restart} className="flex h-9 items-center gap-1.5 border border-black px-3 text-[9px] font-black uppercase tracking-widest">
                <RotateCcw className="h-3.5 w-3.5" /> Restart
              </button>
            )}
            {(phase === 'ready' || phase === 'running') && (
              <button onClick={terminate} className="flex h-9 items-center gap-1.5 bg-red-700 px-3 text-[9px] font-black uppercase tracking-widest text-white">
                <Square className="h-3.5 w-3.5 fill-current" /> Terminate
              </button>
            )}
            {(phase === 'complete' || phase === 'failed') && (
              <button onClick={onExit} className="flex h-9 items-center gap-1.5 bg-black px-3 text-[9px] font-black uppercase tracking-widest text-white">
                <Check className="h-3.5 w-3.5" /> Return to app
              </button>
            )}
            </div>
          </div>
        </div>
      </footer>

      {focusBox && !presentationCard && !cutscene && !aiPanelOpen && (
        <div
          key={focusBox.id}
          className="kk-demo-focus-pulse pointer-events-none fixed z-[190] rounded-lg border-2 border-[#f1cf54] bg-[#f1cf54]/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.14),0_0_16px_rgba(241,207,84,0.75)]"
          style={{ left: focusBox.x, top: focusBox.y, width: focusBox.w, height: focusBox.h }}
        >
          <div className="absolute -top-6 left-0 max-w-[190px] truncate rounded border border-black bg-[#f1cf54] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#111]">
            {focusBox.label}
          </div>
        </div>
      )}

      {cursor.visible && (
        <div
          className="pointer-events-none fixed z-[200] transition-[left,top] duration-300 ease-out"
          style={{ left: cursor.x, top: cursor.y, transform: `translate(-4px,-3px) scale(${cursor.down ? 0.82 : 1})` }}
        >
          <MousePointer2 className="h-7 w-7 fill-[#f1cf54] text-black drop-shadow-[2px_2px_0_rgba(255,255,255,0.9)]" strokeWidth={2.4} />
          {cursor.down && <span className="absolute -left-2 -top-2 h-11 w-11 animate-ping rounded-full border-2 border-[#f1cf54]" />}
        </div>
      )}
    </main>
  );
}
