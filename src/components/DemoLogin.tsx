import { LockKeyhole, Mail, Radio, ShieldCheck, UserRound } from 'lucide-react';
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
    <main className="min-h-screen bg-surface-0 text-text-primary flex flex-col">
      <section className="bg-surface-3 text-text-inverse px-6 py-8 sm:px-10 sm:py-12 border-b-2 border-border-strong">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-black uppercase leading-none max-w-[11ch]">
            Kampung Kaki
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base font-medium text-white/80 leading-relaxed">
            Secure access for citizens, qualified responders, and operations teams.
          </p>
        </div>
      </section>

      <section className="flex-1 px-5 py-6 sm:px-8 lg:px-10">
        <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-[0.92fr_1.08fr] gap-6 lg:gap-8 items-start">
          <div className="border-2 border-border-strong bg-surface-0 p-5 sm:p-6 shadow-[6px_6px_0px_rgba(26,26,26,1)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent-critical">
              Account login
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase mt-1">
              Sign in
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Email</span>
                <span className="flex items-center gap-2 border border-border-strong bg-surface-0 px-3 py-2">
                  <Mail className="w-4 h-4" />
                  <input className="min-w-0 flex-1 bg-transparent outline-none text-sm font-mono" placeholder="name@example.sg" />
                </span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Password</span>
                <span className="flex items-center gap-2 border border-border-strong bg-surface-0 px-3 py-2">
                  <LockKeyhole className="w-4 h-4" />
                  <input className="min-w-0 flex-1 bg-transparent outline-none text-sm font-mono" type="password" placeholder="********" />
                </span>
              </label>
              <button
                type="button"
                className="mt-2 w-full bg-surface-3 text-text-inverse py-3 text-[10px] uppercase font-black tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
              >
                Sign in
              </button>
            </div>
            <p className="mt-4 text-[10px] uppercase font-bold tracking-widest text-text-secondary leading-relaxed">
              Authentication is not connected in this prototype. Use the labelled demo accounts for hackathon testing.
            </p>
          </div>

          <div>
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-accent-critical">
                Demo accounts
              </p>
              <h2 className="text-2xl sm:text-3xl font-black uppercase mt-1">
                Continue as role
              </h2>
            </div>

            <div className="grid gap-3">
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
                        Demo account
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
        </div>
      </section>
    </main>
  );
}
