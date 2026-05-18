import { useAppContext } from '../../AppContext';
import { MapPin, AlertTriangle, User, Flame, Navigation2, Hexagon, MousePointer2, PenTool, Eraser } from 'lucide-react';

export default function MapCanvas() {
  const { setDrawerContent, role } = useAppContext();

  return (
    <div className="absolute inset-0 bg-surface-2 overflow-hidden shadow-[inset_16px_16px_0px_rgba(26,26,26,0.05)]">
      {/* Mock Grid Pattern for Map */}
      <div
        className="w-full h-full opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--color-border-strong) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      ></div>

      <div className="absolute top-6 left-6 z-10 bg-surface-3 text-text-inverse px-3 py-1 text-[10px] font-bold tracking-widest uppercase shadow-[4px_4px_0px_rgba(26,26,26,1)]">
         MAPGL_VIEWPORT_PRIMARY
      </div>

      {/* Map Elements / Roads (Mock SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0">
        <path d="M 0 200 Q 300 150 400 0" stroke="var(--color-border-strong)" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />
        <path d="M 200 800 Q 400 400 800 300" stroke="var(--color-border-strong)" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />
        <path d="M 600 0 L 650 800" stroke="var(--color-border-strong)" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />
        
        {/* Ops Drawn Polygon */}
        <polygon points="450,350 600,320 650,450 500,500" fill="var(--color-accent-warning)" fillOpacity="0.2" stroke="var(--color-accent-warning)" strokeWidth="2" strokeDasharray="4,4" className="animate-pulse" />
        <text x="470" y="340" fill="var(--color-text-primary)" fontSize="10" fontWeight="bold" letterSpacing="0.1em" className="uppercase">Area GH-2Z (Active)</text>
      </svg>

      {/* Ops Drawing Toolbar */}
      {role === 'ops' && (
        <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-2 z-10">
          <div className="bg-surface-0 border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)] p-1 flex flex-col gap-1">
            <button className="w-10 h-10 bg-surface-3 text-text-inverse flex items-center justify-center cursor-pointer hover:bg-text-secondary transition-colors group relative" title="Select Tool">
              <MousePointer2 className="w-4 h-4" />
              <span className="absolute right-full mr-3 bg-surface-3 text-text-inverse text-[9px] uppercase font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border-strong after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-[4px] after:border-t-4 after:border-t-transparent after:border-b-4 after:border-b-transparent after:border-l-4 after:border-l-surface-3 pointer-events-none">Select Entity</span>
            </button>
            <button className="w-10 h-10 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Draw Zone">
              <Hexagon className="w-4 h-4" />
              <span className="absolute right-full mr-3 bg-surface-3 text-text-inverse text-[9px] uppercase font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border-strong pointer-events-none">Draw Area Bound</span>
            </button>
            <button className="w-10 h-10 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Drop Pin">
              <MapPin className="w-4 h-4" />
              <span className="absolute right-full mr-3 bg-surface-3 text-text-inverse text-[9px] uppercase font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border-strong pointer-events-none">Plot Incident</span>
            </button>
            <button className="w-10 h-10 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative border-t border-border-strong mt-1 pt-1" title="Erase">
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Pins / Scales of Events */}
      
      {/* SCALE: Minor/Advisory Incident */}
      <div className="absolute top-[20%] left-[25%] group cursor-pointer" onClick={() => setDrawerContent('local_alert')}>
         <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-surface-0 px-2 py-1 border border-border-strong text-[9px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-[2px_2px_0px_rgba(26,26,26,1)] z-20">
           Traffic Delay
         </div>
         <div className="w-6 h-6 -ml-3 -mt-6 bg-surface-2 text-text-primary border border-border-strong rounded-none flex items-center justify-center shadow-[4px_4px_0px_rgba(26,26,26,1)] relative z-10 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
            <Navigation2 className="w-3 h-3 rotate-45" />
         </div>
      </div>

      {/* SCALE: Major/Warning Incident */}
      <div className="absolute top-[30%] left-[45%] group cursor-pointer" onClick={() => setDrawerContent('local_alert')}>
        <div className="w-12 h-12 -ml-6 -mt-12 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-accent-warning opacity-20 scale-150 group-hover:scale-[1.8] transition-transform animate-pulse border border-accent-warning"></div>
          <div className="w-8 h-8 bg-accent-warning text-surface-3 flex items-center justify-center shadow-[4px_4px_0px_rgba(26,26,26,1)] relative z-10 border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all">
             <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* SCALE: Critical/Priority Incident (Fire) */}
      <div className="absolute top-[50%] left-[60%] group cursor-pointer" onClick={() => setDrawerContent('incident_ops')}>
        <div className="absolute top-1/2 left-12 -translate-y-1/2 flex items-center gap-1 z-20">
          <div className="bg-accent-critical text-surface-0 px-2 py-1 border border-border-strong text-[10px] font-black tracking-widest uppercase shadow-[2px_2px_0px_rgba(26,26,26,1)]">
             ALPHA-09
          </div>
        </div>
        <div className="w-10 h-10 -ml-5 -mt-10 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-accent-critical opacity-20 scale-[2.5] group-hover:scale-[3] transition-transform shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>
          <div className="absolute inset-0 border border-accent-critical opacity-50 scale-[3.5] animate-ping"></div>
          <div className="w-8 h-8 bg-accent-critical text-text-inverse flex items-center justify-center shadow-[4px_4px_0px_rgba(26,26,26,1)] relative z-10 border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all">
            <Flame className="w-4 h-4" />
          </div>
        </div>
      </div>

       {/* User Location */}
       <div className="absolute top-[60%] left-[30%]">
         <div className="w-6 h-6 bg-accent-info text-text-inverse rounded-full flex items-center justify-center shadow-[2px_2px_0px_rgba(26,26,26,1)] border border-border-strong z-10 relative">
           <User className="w-3 h-3" />
         </div>
         <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-surface-0 px-2 py-1 text-[10px] uppercase font-bold tracking-widest shadow-[2px_2px_0px_rgba(26,26,26,1)] whitespace-nowrap text-text-primary border border-border-strong z-20">
           {role === 'responder' ? 'ECHO-1 (YOU)' : 'USER_01'}
         </div>
       </div>
    </div>
  );
}
