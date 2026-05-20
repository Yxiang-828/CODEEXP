import { Activity, ClipboardCheck, MapPinned, Radio, ShieldCheck, UserRound } from 'lucide-react';
import { useAppContext, type Role } from '../AppContext';

const roles: Array<{
  role: Role;
  title: string;
  description: string;
  icon: typeof UserRound;
  opens: string;
}> = [
  {
    role: 'citizen',
    title: 'Citizen demo',
    description: 'Report incidents, request SOS help, read nearby alerts, and track responder progress.',
    icon: UserRound,
    opens: 'Public-facing mobile workflow',
  },
  {
    role: 'responder',
    title: 'Responder demo',
    description: 'Join missions, handle assignments, use case rooms, update status, and register for events.',
    icon: Radio,
    opens: 'Field responder workspace',
  },
  {
    role: 'ops',
    title: 'Ops demo',
    description: 'Verify reports, dispatch responders, declare zones, broadcast alerts, and inspect readiness.',
    icon: ShieldCheck,
    opens: 'Operations command workspace',
  },
];

export default function DemoLogin() {
  const { demoLogin } = useAppContext();

  return (
    <main className="min-h-screen bg-surface-0 text-text-primary grid lg:grid-cols-[0.95fr_1.05fr]">
      <section className="border-r-2 border-border-strong p-6 sm:p-10 flex flex-col justify-between gap-8 bg-surface-3 text-text-inverse">
        <div>
          <div className="inline-flex items-center gap-2 border-2 border-border-strong bg-accent-warning text-text-primary px-3 py-1 shadow-[3px_3px_0px_rgba(26,26,26,1)]">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Demo shell</span>
          </div>
          <h1 className="mt-8 text-4xl sm:text-6xl font-black uppercase leading-none max-w-[11ch]">
            Kampung Kaki
          </h1>
          <p className="mt-5 max-w-xl text-sm sm:text-base font-medium text-white/80 leading-relaxed">
            Frontend prototype for role workflows. Demo login skips authentication so teammates can start testing the shell immediately.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-text-primary">
          <DemoFact icon={MapPinned} label="Real map" value="OneMap tiles render live" />
          <DemoFact icon={ClipboardCheck} label="Demo data" value="Injected states are labelled" />
        </div>
      </section>

      <section className="p-5 sm:p-8 lg:p-10 flex items-center">
        <div className="w-full max-w-3xl mx-auto">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent-critical">
              Select a demo role
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase mt-1">
              Auto-login workspace
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary font-medium mt-2">
              No password, no backend auth. This is intentionally a demo entry point until real authentication is wired.
            </p>
          </div>

          <div className="grid gap-4">
            {roles.map((item) => (
              <button
                key={item.role}
                onClick={() => demoLogin(item.role)}
                className="text-left border-2 border-border-strong bg-surface-0 p-4 sm:p-5 shadow-[5px_5px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(26,26,26,1)] transition-all"
              >
                <div className="flex gap-4">
                  <div className="w-11 h-11 border-2 border-border-strong bg-surface-2 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black uppercase">{item.title}</h3>
                      <span className="text-[9px] font-black uppercase tracking-widest border border-border-strong px-2 py-0.5 bg-accent-warning">
                        Auto login
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary font-medium mt-1">{item.description}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-text-primary">
                      {item.opens}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function DemoFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPinned;
  label: string;
  value: string;
}) {
  return (
    <div className="border-2 border-border-strong bg-surface-0 p-3 shadow-[3px_3px_0px_rgba(26,26,26,1)]">
      <Icon className="w-4 h-4 mb-2" />
      <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
      <div className="text-xs font-medium text-text-secondary mt-1">{value}</div>
    </div>
  );
}
