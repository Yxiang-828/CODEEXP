import { useState, useEffect } from 'react';
import { MapPin, Bell, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAppContext } from '../AppContext';

const STORAGE_KEY = 'kk_permissions_prompted';

function getStoredPrefs(): { location: boolean | null; notifications: boolean | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { location: null, notifications: null };
  } catch {
    return { location: null, notifications: null };
  }
}

function saveStoredPrefs(prefs: { location: boolean | null; notifications: boolean | null }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export default function PermissionPrompt() {
  const { role } = useAppContext();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [locStatus, setLocStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    const prefs = getStoredPrefs();
    if (prefs.location === null || prefs.notifications === null) {
      setVisible(true);
    }
  }, [role]);

  if (!visible) return null;

  const requestLocation = async () => {
    try {
      await new Promise<void>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(() => resolve(), reject)
      );
      setLocStatus('granted');
      saveStoredPrefs({ ...getStoredPrefs(), location: true });
    } catch {
      setLocStatus('denied');
      saveStoredPrefs({ ...getStoredPrefs(), location: false });
    }
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setNotifStatus('denied');
      saveStoredPrefs({ ...getStoredPrefs(), notifications: false });
      return;
    }
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setNotifStatus('granted');
      saveStoredPrefs({ ...getStoredPrefs(), notifications: true });
    } else {
      setNotifStatus('denied');
      saveStoredPrefs({ ...getStoredPrefs(), notifications: false });
    }
  };

  const dismiss = () => {
    saveStoredPrefs({ location: false, notifications: false });
    setVisible(false);
  };

  const allDone = locStatus !== 'idle' && notifStatus !== 'idle';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto border-2 border-border-strong bg-surface-0 shadow-[6px_6px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border-strong">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-accent-critical">
              Permissions
            </div>
            <div className="text-sm font-black uppercase mt-0.5">
              Optional device access
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Skip permissions"
            className="p-1.5 border border-border-strong bg-surface-2 hover:bg-surface-3 hover:text-text-inverse transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-4 py-3 flex flex-col gap-2">
          <PermRow
            icon={MapPin}
            label="Location"
            why="Current demo uses a fixed location. Enable for future live SOS accuracy."
            status={locStatus}
            onEnable={requestLocation}
          />
          <PermRow
            icon={Bell}
            label="Notifications"
            why={
              role === 'citizen'
                ? 'Critical alerts (SOS ack, verified reports) can push to your device.'
                : 'Current alerts are in-app. Enable for future browser push delivery.'
            }
            status={notifStatus}
            onEnable={requestNotifications}
          />
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-text-secondary"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Why we need this
          </button>
          {expanded && (
            <p className="mt-2 text-[10px] text-text-secondary leading-relaxed">
              Location is requested only by the browser for this prototype. In-app notifications work
              without device permission. Browser push delivery still needs a backend worker before it
              can send real push notifications.
            </p>
          )}
          {allDone && (
            <button
              onClick={() => setVisible(false)}
              className="mt-3 w-full bg-surface-3 text-text-inverse py-2.5 text-[10px] uppercase font-black tracking-widest border border-border-strong shadow-[3px_3px_0px_rgba(26,26,26,1)]"
            >
              Done
            </button>
          )}
          {!allDone && (
            <button
              onClick={dismiss}
              className="mt-3 w-full py-2.5 text-[10px] uppercase font-bold tracking-widest text-text-secondary border border-border-strong"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PermRow({
  icon: Icon,
  label,
  why,
  status,
  onEnable,
}: {
  icon: typeof MapPin;
  label: string;
  why: string;
  status: 'idle' | 'granted' | 'denied';
  onEnable: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 border border-border-strong bg-surface-2">
      <div className="w-8 h-8 border border-border-strong bg-surface-0 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-black uppercase tracking-widest">{label}</div>
        <div className="text-[9px] text-text-secondary mt-0.5">{why}</div>
      </div>
      <div className="shrink-0">
        {status === 'idle' && (
          <button
            onClick={onEnable}
            className="px-3 py-1.5 bg-surface-3 text-text-inverse text-[9px] font-black uppercase tracking-widest border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            Enable
          </button>
        )}
        {status === 'granted' && (
          <span className="px-2 py-1 bg-accent-success text-surface-3 text-[9px] font-black uppercase tracking-widest border border-border-strong">
            On
          </span>
        )}
        {status === 'denied' && (
          <span className="px-2 py-1 bg-surface-2 text-text-secondary text-[9px] font-black uppercase tracking-widest border border-border-strong">
            Skipped
          </span>
        )}
      </div>
    </div>
  );
}
