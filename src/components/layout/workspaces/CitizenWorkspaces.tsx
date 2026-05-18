import React, { useState } from 'react';
import { Search, MapPin, Clock, FileText, CheckCircle, Radio } from 'lucide-react';
import { useAppContext } from '../../../AppContext';

export function LocalAlertDetail() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-150 relative">
      <div className="absolute left-[24px] top-0 bottom-0 w-[1px] bg-border-strong opacity-20 z-0"></div>
      <div className="flex gap-4 items-start relative z-10">
        <div className="bg-accent-warning text-surface-3 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(26,26,26,1)] border border-border-strong mt-1 leading-none">
          Warning
        </div>
        <h2 className="flex-1 text-2xl font-serif italic text-text-primary leading-tight font-black">Flooding reported at Main St Intersection</h2>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-bold text-text-secondary pb-4 uppercase tracking-widest">
        <div className="flex items-center gap-1"><Search className="w-3 h-3" /> Public Report</div>
        <span className="opacity-40">/</span>
        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 300m away</div>
        <span className="opacity-40">/</span>
        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> 2m ago</div>
      </div>
      <p className="text-sm text-text-primary leading-relaxed relative z-10 bg-surface-0 p-4 border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)]">
        Multiple citizens have reported rising water levels blocking both lanes. Vehicles are turning around. Avoid area if possible.
      </p>
      <div className="mt-8 flex flex-col gap-3 relative z-10 border-t border-border-strong pt-6">
        <button onClick={() => setDrawerContent('incident_guidance')} className="w-full bg-accent-info text-surface-0 py-3 text-[10px] uppercase font-bold tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] cursor-pointer">
          What should I do
        </button>
        <button onClick={() => setDrawerContent(null)} className="w-full bg-surface-0 text-text-primary py-3 text-[10px] uppercase font-bold tracking-widest transition-all border border-border-strong hover:bg-surface-2 cursor-pointer shadow-[2px_2px_0px_rgba(26,26,26,1)]">
          Share location with friend
        </button>
      </div>
      <div className="mt-8 pt-6 flex items-center justify-between text-[9px] text-text-muted font-mono uppercase border-t border-border-strong relative z-10 font-bold tracking-widest">
        <span>Ref: 8A4B-992F</span>
        <span>Fresh as of 14:02</span>
      </div>
    </div>
  );
}

export function IncidentGuidance() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-150 relative">
       <div className="flex border-b border-border-strong">
         <div className="flex-1 text-center py-3 text-[10px] font-black uppercase tracking-widest border-r border-border-strong bg-surface-3 text-text-inverse">Assess</div>
         <div className="flex-1 text-center py-3 text-[10px] font-black uppercase tracking-widest border-r border-border-strong hover:bg-surface-2 cursor-pointer text-text-primary opacity-50">Act</div>
         <div className="flex-1 text-center py-3 text-[10px] font-black uppercase tracking-widest hover:bg-surface-2 cursor-pointer text-text-primary opacity-50">After</div>
       </div>
       <div className="p-6 flex-1 bg-surface-0 flex flex-col gap-6">
         <h2 className="text-xl font-serif font-black italic">1. Move to higher ground</h2>
         <div className="border border-border-strong p-4 bg-surface-2 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex items-start gap-4">
            <div className="w-6 h-6 border-2 border-border-strong rounded-none flex items-center justify-center bg-surface-0 shrink-0 mt-0.5"></div>
            <p className="text-sm font-medium leading-relaxed">Do not walk through moving water. Six inches of moving water can make you fall.</p>
         </div>
         <div className="border border-border-strong p-4 bg-surface-2 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex items-start gap-4 opacity-70">
            <div className="w-6 h-6 border-2 border-border-strong rounded-none flex items-center justify-center bg-surface-0 shrink-0 mt-0.5"></div>
            <p className="text-sm font-medium leading-relaxed">Do not drive into flooded areas. If floodwaters rise around your car, abandon the car and move to higher ground.</p>
         </div>
       </div>
       <div className="p-6 border-t border-border-strong flex flex-col gap-3 bg-surface-0">
          <button onClick={() => setDrawerContent('local_alert')} className="w-full bg-surface-0 text-text-primary border border-border-strong py-3 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_rgba(26,26,26,1)] cursor-pointer">I am safe</button>
          <button onClick={() => setDrawerContent('sos_draft')} className="w-full bg-accent-critical text-text-inverse border border-border-strong py-3 text-[10px] font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">I need help here</button>
       </div>
    </div>
  )
}

export function ReportCompose() {
  const [step, setStep] = useState(1);
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-150">
      <div className="px-6 py-4 border-b border-border-strong flex gap-2 bg-surface-0">
         <div className={`flex-1 h-2 border border-border-strong ${step >= 1 ? 'bg-text-primary' : 'bg-surface-2'}`}></div>
         <div className={`flex-1 h-2 border border-border-strong ${step >= 2 ? 'bg-text-primary' : 'bg-surface-2'}`}></div>
         <div className={`flex-1 h-2 border border-border-strong ${step >= 3 ? 'bg-text-primary' : 'bg-surface-2'}`}></div>
         <div className={`flex-1 h-2 border border-border-strong ${step >= 4 ? 'bg-text-primary' : 'bg-surface-2'}`}></div>
      </div>
      <div className="p-6 flex-1 flex flex-col bg-surface-0 relative">
        <div className="absolute left-[24px] top-0 bottom-0 w-[1px] bg-border-strong opacity-20 z-0"></div>
        <h2 className="text-xl font-serif italic text-text-primary mb-6 relative z-10 font-black">
          {step === 1 ? 'Select Category' : step === 2 ? 'Location' : step === 3 ? 'Detail' : 'Review'}
        </h2>
        
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
            {['Fire', 'Medical', 'Security', 'Infrastructure'].map(cat => (
              <button key={cat} onClick={() => setStep(2)} className="p-6 border border-border-strong bg-surface-2 flex flex-col items-center gap-3 hover:bg-surface-3 hover:text-text-inverse transition-all rounded-none shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer text-text-primary">
                <span className="text-[10px] font-bold uppercase tracking-widest">{cat}</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="relative z-10 flex flex-col gap-4 flex-1">
             <div className="flex-1 bg-surface-2 border border-border-strong shadow-[inset_4px_4px_0px_rgba(26,26,26,0.05)] relative overflow-hidden flex items-center justify-center font-mono text-[10px] text-text-secondary font-bold uppercase tracking-widest min-h-[200px]">
               [ Interactive Map Pin Selection ]
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Address: 123 Main St (Approximate)</p>
          </div>
        )}
        
        {step >= 3 && (
           <div className="relative z-10 flex flex-col gap-4">
              <textarea placeholder="Describe the hazard (mandatory)" className="w-full bg-surface-1 border border-border-strong shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)] p-4 text-sm resize-none h-32 outline-none font-medium" />
              <div className="border-t border-border-strong pt-4 mt-2 border-dashed">
                 <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-2 block">Upload Media (Optional)</span>
                 <button className="border border-border-strong bg-surface-2 px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0px_rgba(26,26,26,1)]">+ Photo / Video</button>
              </div>
           </div>
        )}

        <div className="mt-auto flex gap-4 relative z-10 border-t border-border-strong pt-6">
           {step > 1 && <button onClick={() => setStep(step-1)} className="flex-1 px-4 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong text-text-primary hover:bg-surface-2 bg-surface-0 shadow-[2px_2px_0px_rgba(26,26,26,1)] cursor-pointer">Back</button>}
           <button onClick={() => step < 4 ? setStep(step + 1) : setDrawerContent(null)} className="flex-1 py-3 text-[10px] uppercase font-bold tracking-widest bg-surface-3 text-text-inverse border border-border-strong hover:brightness-110 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer transition-all">
             {step < 4 ? 'Next' : 'Submit'}
           </button>
        </div>
      </div>
    </div>
  );
}

export function NeedHelpSOS() {
  const { setShellState, setTrackingState } = useAppContext();
  return (
    <div className="flex flex-col h-full animate-in fade-in border-t-[12px] border-accent-critical bg-surface-0">
      <div className="p-6 flex flex-col items-center justify-center text-center gap-6 h-full pb-12">
         <div className="w-24 h-24 rounded-full border-4 border-accent-critical flex items-center justify-center bg-surface-0 relative shadow-[8px_8px_0px_max(rgba(26,26,26,1),rgba(239,68,68,1))] animate-pulse my-4">
            <Radio className="w-12 h-12 text-accent-critical" />
         </div>
         <div className="mt-4">
           <h2 className="text-4xl font-serif font-black italic mb-2 tracking-tighter text-text-primary">EMERGENCY SOS</h2>
           <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Your location will be securely shared with nearby responders.</p>
         </div>
         <div className="w-full mt-auto flex flex-col gap-6">
            <button onClick={() => { setShellState('S9'); setTrackingState('sos'); }} className="w-full bg-accent-critical text-surface-0 py-5 text-sm font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_rgba(26,26,26,1)] border-2 border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">
               ACTIVATE NOW<br/><span className="text-[9px] opacity-80">(Hold 3s)</span>
            </button>
            <div className="grid grid-cols-2 gap-3 mt-2 pt-6 border-t border-border-strong">
               <button className="border border-border-strong bg-surface-2 py-3 text-[10px] uppercase font-bold shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:bg-surface-3 hover:text-text-inverse transition-colors">Medical</button>
               <button className="border border-border-strong bg-surface-2 py-3 text-[10px] uppercase font-bold shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:bg-surface-3 hover:text-text-inverse transition-colors">Fire</button>
               <button className="border border-border-strong bg-surface-2 py-3 text-[10px] uppercase font-bold shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:bg-surface-3 hover:text-text-inverse transition-colors">Security</button>
               <button className="border border-border-strong bg-surface-2 py-3 text-[10px] uppercase font-bold shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:bg-surface-3 hover:text-text-inverse transition-colors">Other</button>
            </div>
         </div>
      </div>
    </div>
  )
}

export function BriefingSpace() {
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="flex border-b border-border-strong bg-surface-1">
         <div className="px-6 py-4 border-r border-border-strong text-[10px] font-black uppercase tracking-widest bg-surface-3 text-text-inverse flex-1 text-center">For Me</div>
         <div className="px-6 py-4 border-r border-border-strong text-[10px] font-bold uppercase tracking-widest text-text-secondary flex-1 text-center opacity-60">Sources</div>
      </div>
      <div className="p-6 border-b border-border-strong bg-surface-2 flex items-center justify-between">
         <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">In View Only</span>
         <div className="w-8 h-4 rounded-full border border-border-strong bg-text-secondary relative shadow-[2px_2px_0px_rgba(26,26,26,1)]">
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-surface-3 border-r border-border-strong"></div>
         </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
         <div className="border border-border-strong bg-surface-0 p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all cursor-pointer flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-border-strong">
               <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 bg-accent-info border border-border-strong"></span>
                  Channel News Asia
               </div>
               <span className="text-[9px] font-bold opacity-50 uppercase">10m ago</span>
            </div>
            <h3 className="font-serif italic font-black text-lg leading-tight">Major Traffic Disruption on AYE</h3>
            <p className="text-xs font-medium text-text-secondary leading-relaxed line-clamp-2">Lanes 1 and 2 blocked due to multi-vehicle accident. SCDF and Traffic Police on scene.</p>
         </div>
         
         <div className="border border-border-strong bg-surface-0 p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all cursor-pointer flex flex-col gap-2 opacity-80">
            <div className="flex items-center justify-between pb-2 border-b border-border-strong">
               <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 bg-accent-warning border border-border-strong"></span>
                  Mothership SG
               </div>
               <span className="text-[9px] font-bold opacity-50 uppercase">1h ago</span>
            </div>
            <h3 className="font-serif italic font-black text-lg leading-tight">Ponding reported outside MRT</h3>
            <p className="text-xs font-medium text-text-secondary leading-relaxed line-clamp-2">Flash floods observed at Jurong East MRT exit B following heavy torrential rain.</p>
         </div>
      </div>
    </div>
  )
}

export function AlertsState() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="flex border-b border-border-strong bg-surface-1">
         <div className="px-4 py-3 border-r border-border-strong text-[10px] font-black uppercase tracking-widest bg-surface-3 text-text-inverse flex-1 text-center">Cells</div>
         <div className="px-4 py-3 border-r border-border-strong text-[10px] font-bold uppercase tracking-widest text-text-secondary flex-1 text-center opacity-60">Silence</div>
         <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary flex-1 text-center opacity-60">Perms</div>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-4">
         <div className="border border-border-strong p-4 bg-surface-2 shadow-[2px_2px_0px_rgba(26,26,26,1)] flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-xs font-black uppercase tracking-widest text-text-primary">Cell: W21Z</span>
               <span className="text-[9px] font-bold uppercase text-text-secondary mt-1 tracking-widest">Jurong East (0 alerts/24h)</span>
            </div>
            <button onClick={() => setDrawerContent(null)} className="border border-border-strong px-4 py-2 bg-surface-0 text-[9px] font-bold uppercase hover:bg-surface-3 hover:text-text-inverse transition-colors cursor-pointer shadow-[2px_2px_0px_rgba(26,26,26,1)]">Remove</button>
         </div>
         <button onClick={() => setDrawerContent(null)} className="mt-4 border-2 border-dashed border-border-strong py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-solid hover:bg-surface-2 transition-all cursor-pointer">
            + Add Geohash Cell
         </button>
      </div>
    </div>
  )
}
