import React from 'react';
import { Search, MapPin, Clock, RadioTower, Users, ShieldAlert, Activity, FileText } from 'lucide-react';
import { useAppContext } from '../../../AppContext';

export function DeclareIncident() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="p-6 flex flex-col h-full bg-surface-0">
      <div className="border-b border-border-strong pb-4 mb-6 flex items-center justify-between">
         <h2 className="text-sm font-black uppercase tracking-widest text-accent-critical">Manual Declaration</h2>
         <span className="text-[9px] font-bold tracking-widest bg-surface-3 text-text-inverse px-3 py-1.5 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)]">OPS OVERRIDE</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-8">
         <div className="border-l-4 border-accent-critical pl-4">
            <label className="text-[10px] font-black uppercase tracking-widest block mb-3">Severity & Type</label>
            <div className="flex flex-col sm:flex-row gap-2">
               <select className="flex-1 border border-border-strong p-3 text-xs font-bold bg-surface-1 appearance-none cursor-pointer focus:border-text-primary outline-none text-text-primary rounded-none shadow-[2px_2px_0px_rgba(26,26,26,1)]">
                  <option>Critical</option>
                  <option>Warning</option>
                  <option>Advisory</option>
               </select>
               <select className="flex-1 border border-border-strong p-3 text-xs font-bold bg-surface-1 appearance-none cursor-pointer focus:border-text-primary outline-none text-text-primary rounded-none shadow-[2px_2px_0px_rgba(26,26,26,1)]">
                  <option>Fire/Explosion</option>
                  <option>Medical Emergency</option>
                  <option>Kinetic Hazard</option>
               </select>
            </div>
         </div>
                  <div className="border-l-4 border-accent-info pl-4">
            <label className="text-[10px] font-black uppercase tracking-widest block mb-3">Visibility Scope</label>
            <div className="flex flex-col gap-3">
               <label className="flex items-center gap-3 cursor-pointer border border-border-strong p-4 bg-surface-2 hover:bg-surface-1 transition-colors shadow-[2px_2px_0px_rgba(26,26,26,1)] relative group">
                  <div className="w-4 h-4 border border-border-strong bg-surface-3 rounded-none flex items-center justify-center relative">
                      <div className="w-2 h-2 bg-surface-0 border border-border-strong opacity-100"></div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Public (All Citizens)</span>
               </label>
               <div className="ml-8 border-l border-border-strong pl-4 flex flex-col gap-2 -mt-1 mb-1">
                  <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold">Preview As:</span>
                  <div className="flex gap-2">
                    <button className="bg-surface-0 border border-border-strong text-text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1 cursor-pointer hover:bg-surface-2">Citizen App</button>
                    <button className="bg-surface-0 border border-border-strong text-text-secondary opacity-60 text-[9px] font-bold uppercase tracking-widest px-3 py-1 cursor-pointer hover:opacity-100 hover:text-text-primary border-dashed">Media Portal</button>
                  </div>
               </div>
               <label className="flex items-center gap-3 cursor-pointer border border-border-strong p-4 bg-surface-2 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="w-4 h-4 border border-border-strong bg-surface-0 rounded-none"></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Role-Gated (Responders Only)</span>
               </label>
            </div>
         </div>

         <div className="border-l-4 border-border-strong pl-4">
             <label className="text-[10px] font-black uppercase tracking-widest block mb-3">Details</label>
             <textarea className="w-full border border-border-strong p-4 text-xs font-medium bg-surface-1 h-32 outline-none resize-none shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)] focus:border-text-primary" placeholder="Provide tactical summary for the incident..." />
         </div>
      </div>
      
      <div className="pt-6 border-t border-border-strong mt-4">
         <button onClick={() => setDrawerContent(null)} className="w-full bg-accent-critical text-text-inverse py-4 text-[10px] uppercase font-black tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer">
           <ShieldAlert className="w-5 h-5" /> Declare Incident
         </button>
      </div>
    </div>
  )
}

export function DispatchResponder() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="p-6 border-b border-border-strong bg-surface-1">
          <h2 className="text-sm font-black uppercase tracking-widest">Direct Dispatch</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1">Target: Area GH-2Z / Resource: MED-1</p>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-border-strong">
             <span className="text-[10px] font-black uppercase tracking-widest">Candidate Roster</span>
             <span className="text-[9px] border border-border-strong px-2 py-1 font-bold shadow-[2px_2px_0px_rgba(26,26,26,1)] bg-surface-0">Sort: Score</span>
          </div>
          
          <div className="flex flex-col gap-4">
             <div className="border border-border-strong p-4 bg-accent-info text-surface-0 shadow-[4px_4px_0px_rgba(26,26,26,1)] cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-black uppercase tracking-widest">Unit Bravo-9 (SCDF)</h4>
                   <span className="text-[10px] font-bold font-mono border border-surface-0 px-2 flex items-center justify-center h-[20px]">1.2km</span>
                </div>
                <div className="flex gap-3 text-[9px] uppercase font-bold tracking-widest opacity-90 mt-3 border-t border-surface-0/30 pt-3">
                   <span>Score: 0.94</span>
                   <span className="opacity-50">/</span>
                   <span>ETA: 4m</span>
                   <span className="opacity-50">/</span>
                   <span>Available</span>
                </div>
             </div>
             
             <div className="border border-border-strong p-4 bg-surface-2 cursor-pointer hover:bg-surface-3 hover:text-text-inverse transition-all opacity-80 shadow-[2px_2px_0px_rgba(26,26,26,1)]">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-black uppercase tracking-widest text-text-primary">Unit Charlie-3 (Vol)</h4>
                   <span className="text-[10px] font-bold font-mono border border-border-strong px-2 flex items-center justify-center h-[20px]">2.8km</span>
                </div>
                <div className="flex gap-3 text-[9px] uppercase font-bold tracking-widest text-text-secondary mt-3 border-t border-border-strong/20 pt-3">
                   <span>Score: 0.72</span>
                   <span className="opacity-50">/</span>
                   <span>ETA: 11m</span>
                   <span className="opacity-50">/</span>
                   <span>Busy</span>
                </div>
             </div>
          </div>
      </div>
      
      <div className="p-6 border-t border-border-strong bg-surface-1">
         <button onClick={() => setDrawerContent(null)} className="w-full bg-surface-3 text-text-inverse py-4 border border-border-strong text-[10px] uppercase font-black tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">Send Dispatch Order</button>
      </div>
    </div>
  )
}

export function BroadcastComposer() {
  const { setDrawerContent } = useAppContext();
  return (
     <div className="flex flex-col h-full bg-surface-0 relative">
        <div className="p-6 border-b border-border-strong bg-accent-warning text-surface-3 flex items-center gap-4 shadow-[0px_4px_0px_rgba(26,26,26,1)] z-10 relative">
           <RadioTower className="w-8 h-8" />
           <div>
              <h2 className="text-sm font-black uppercase tracking-widest">Geo-Broadcast</h2>
              <p className="text-[10px] font-bold tracking-widest opacity-80 uppercase mt-0.5">Reach: ~1,404 Devices in target polygon</p>
           </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto">
           <div className="relative pl-8">
              <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-border-strong opacity-20"></div>
              
              <div className="relative mb-8 pt-2">
                 <div className="absolute -left-8 w-4 h-4 border border-border-strong bg-surface-3 top-2 rounded-none shadow-[2px_2px_0px_rgba(26,26,26,1)]"></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest mb-3">Audience Scope</h3>
                 <div className="flex gap-3">
                    <button className="flex-1 bg-surface-3 text-text-inverse p-3 text-[10px] font-bold uppercase tracking-widest border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] cursor-pointer">Citizens + Resp</button>
                    <button className="flex-1 bg-surface-1 text-text-primary p-3 text-[10px] font-bold uppercase tracking-widest border border-border-strong opacity-50 hover:opacity-100 transition-opacity cursor-pointer">Citizens Only</button>
                 </div>
              </div>
              
              <div className="relative mb-4 pt-2">
                 <div className="absolute -left-8 w-4 h-4 border border-border-strong bg-accent-critical top-2 shadow-[2px_2px_0px_rgba(26,26,26,1)] rounded-none"></div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest mb-3">Content</h3>
                 <input type="text" placeholder="TITLE (Max 40 chars)" className="w-full bg-surface-1 border border-border-strong p-4 mb-3 text-sm font-bold shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)] outline-none focus:border-text-primary uppercase tracking-wider" />
                 <textarea placeholder="Message body..." className="w-full bg-surface-1 border border-border-strong p-4 h-24 text-sm font-medium shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)] outline-none resize-none mb-4 focus:border-text-primary" />
                 <div className="flex items-center gap-3 bg-surface-2 p-3 border border-border-strong">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Locales:</span>
                    <span className="px-3 py-1 bg-surface-0 border border-border-strong text-[10px] font-bold shadow-[2px_2px_0px_rgba(26,26,26,1)]">EN</span>
                    <span className="px-3 py-1 bg-surface-0 border border-border-strong text-[10px] font-bold border-dashed opacity-60 cursor-pointer hover:opacity-100">+ Add</span>
                 </div>
              </div>
           </div>
        </div>
        
        <div className="p-6 border-t border-border-strong bg-surface-1 gap-4 flex flex-col relative z-20">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest">Target Selection</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-success flex items-center gap-1">
                <span className="w-2 h-2 bg-accent-success border border-border-strong"></span> Valid Polygon
              </span>
           </div>
           <button onClick={() => setDrawerContent(null)} className="w-full py-4 bg-accent-warning text-surface-3 border border-border-strong text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all flex items-center justify-center gap-3 cursor-pointer">
              <RadioTower className="w-5 h-5"/> Issue Broadcast Directive
           </button>
        </div>
     </div>
  )
}

export function OpsGenericList({ title, items }: { title: string, items: any[] }) {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="p-6 border-b border-border-strong bg-surface-3 text-text-inverse">
        <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
         {items.map((item, i) => (
           <div key={i} className="border border-border-strong p-4 bg-surface-0 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer" onClick={() => item.targetId ? setDrawerContent(item.targetId) : null}>
              <div className="flex justify-between items-center mb-2 border-b border-border-strong pb-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-text-primary">{item.title}</h4>
                 <span className="text-[9px] font-bold opacity-60 uppercase">{item.time}</span>
              </div>
              <p className="text-xs font-medium text-text-secondary leading-relaxed mt-2">{item.desc}</p>
           </div>
         ))}
      </div>
    </div>
  )
}
