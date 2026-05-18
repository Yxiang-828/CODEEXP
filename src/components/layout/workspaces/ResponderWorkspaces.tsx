import React from 'react';
import { Search, MapPin, Clock, ShieldAlert, CheckCircle, Navigation } from 'lucide-react';
import { useAppContext } from '../../../AppContext';

export function DutyStatus() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0 p-6 gap-6 relative">
      <div className="absolute left-[24px] top-0 bottom-0 w-[1px] bg-border-strong opacity-20 z-0"></div>
      <h2 className="text-xl font-serif italic text-text-primary mb-2 relative z-10 font-black uppercase">My Status</h2>
      <div className="bg-accent-success text-surface-0 py-8 px-4 border border-border-strong shadow-[8px_8px_0px_rgba(26,26,26,1)] flex flex-col items-center justify-center gap-2 relative z-10">
         <span className="text-4xl font-black tracking-widest uppercase">ON PATROL</span>
         <span className="text-[10px] font-bold uppercase tracking-widest border border-border-strong px-3 py-1.5 bg-surface-3 text-text-inverse">Available for Dispatch</span>
      </div>
      
      <div className="mt-4 relative z-10 flex flex-col gap-3">
         <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Capabilities Profile</h3>
         <div className="flex items-center justify-between border border-border-strong bg-surface-2 p-3 shadow-[2px_2px_0px_rgba(26,26,26,1)]">
            <span className="text-[10px] font-bold uppercase tracking-widest">Medical / Trauma</span>
            <div className="w-3 h-3 bg-accent-success border border-border-strong"></div>
         </div>
         <div className="flex items-center justify-between border border-border-strong bg-surface-2 p-3 shadow-[2px_2px_0px_rgba(26,26,26,1)] opacity-50">
            <span className="text-[10px] font-bold uppercase tracking-widest">Fire Suppression</span>
            <div className="w-3 h-3 bg-surface-0 border border-border-strong"></div>
         </div>
         <div className="flex items-center justify-between border border-border-strong bg-surface-2 p-3 shadow-[2px_2px_0px_rgba(26,26,26,1)]">
            <span className="text-[10px] font-bold uppercase tracking-widest">Crowd Control</span>
            <div className="w-3 h-3 bg-accent-success border border-border-strong"></div>
         </div>
      </div>
      
      <div className="mt-auto border-t border-border-strong pt-6 flex gap-4 relative z-10">
         <button onClick={() => setDrawerContent(null)} className="flex-1 bg-accent-warning text-surface-3 border border-border-strong py-4 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">PAUSE</button>
         <button onClick={() => setDrawerContent(null)} className="flex-1 bg-surface-3 text-text-inverse border border-border-strong py-4 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">OFF DUTY</button>
      </div>
    </div>
  )
}

export function VerifyCandidate() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0 overflow-y-auto">
      <div className="p-6 border-b border-border-strong bg-accent-info text-text-inverse shadow-[0px_4px_0px_rgba(26,26,26,1)] z-10">
        <h2 className="text-sm font-black uppercase tracking-widest">Verification Required</h2>
        <p className="font-serif italic opacity-80 mt-1 font-bold">Ref: VER-882</p>
      </div>
      
      <div className="p-6 flex flex-col gap-6 relative">
         <div className="absolute left-[24px] top-0 bottom-0 w-[1px] bg-border-strong opacity-20 z-0"></div>
         
         <div className="relative z-10 bg-surface-2 border border-border-strong p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
           <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 pb-2 border-b border-border-strong">Claims</h3>
           <p className="text-sm font-medium mb-4 leading-relaxed">Strong smell of gas reported near the residential block 4B. Citizen reports hissing sound from utility shed.</p>
           <div className="flex flex-wrap gap-2">
             <span className="px-2 py-1 border border-border-strong bg-surface-0 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"><Search className="w-3 h-3"/> Trust: Medium</span>
             <span className="px-2 py-1 border border-border-strong bg-surface-0 text-[9px] font-bold uppercase tracking-widest">2 Corroborations</span>
           </div>
         </div>
         
         <div className="relative z-10 bg-surface-2 border border-border-strong p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
           <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 pb-2 border-b border-border-strong">Evidence</h3>
           <div className="h-28 bg-surface-1 border border-border-strong flex items-center justify-center cursor-pointer hover:bg-surface-0 transition-colors">
              <span className="text-[9px] font-bold uppercase text-text-secondary tracking-widest flex flex-col items-center gap-2">
                 <ShieldAlert className="w-5 h-5"/>
                 Photo attached (Click to view)
              </span>
           </div>
         </div>
         
         <div className="pt-6 border-t border-border-strong relative z-10 flex flex-col gap-4 mt-4">
            <button onClick={() => setDrawerContent(null)} className="w-full bg-accent-success text-surface-0 py-4 border border-border-strong text-[10px] uppercase font-black tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all cursor-pointer">Verify & Promote</button>
            <button onClick={() => setDrawerContent(null)} className="w-full bg-surface-0 text-text-primary py-4 border border-border-strong text-[10px] uppercase font-bold tracking-widest hover:bg-surface-2 cursor-pointer shadow-[2px_2px_0px_rgba(26,26,26,1)]">Dismiss / False Alarm</button>
            <button onClick={() => setDrawerContent(null)} className="w-full bg-surface-0 text-text-primary py-4 border border-border-strong text-[10px] uppercase font-bold tracking-widest border-dashed opacity-70 hover:opacity-100 transition-opacity cursor-pointer">Request More Info</button>
         </div>
      </div>
    </div>
  )
}

export function ActiveAssignments() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="p-6 border-b border-border-strong bg-surface-1">
        <h2 className="text-xl font-serif font-black uppercase tracking-widest italic text-text-primary">My Assignments</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1">Ops Directed & Joined Missions</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-surface-2 shadow-[inset_4px_4px_0px_rgba(26,26,26,0.05)]">
         <div onClick={() => setDrawerContent('case_lobby')} className="border border-border-strong bg-surface-0 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0_0_0px_rgba(26,26,26,1)] transition-all cursor-pointer group flex flex-col">
            <div className="p-4 border-b border-border-strong flex justify-between items-center bg-surface-1">
               <h4 className="text-[12px] font-black uppercase tracking-widest text-text-primary flex items-center gap-2">
                 <div className="w-2 h-2 bg-accent-success animate-pulse border border-border-strong"></div>
                 ALPHA-09 (Assigned)
               </h4>
               <span className="text-[9px] font-bold opacity-60 uppercase border border-border-strong px-2 py-0.5 bg-surface-0">En Route</span>
            </div>
            <div className="p-4 flex-1">
               <p className="text-xs font-medium text-text-secondary leading-relaxed mb-4">Medical casualty reported at Sector 4. Proceed with caution. You were designated by Ops.</p>
               <button className="w-full border border-border-strong bg-surface-3 text-text-inverse py-3 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(26,26,26,1)] group-hover:bg-text-secondary transition-colors cursor-pointer">
                  Open Comms / Enter Lobby
               </button>
            </div>
         </div>
      </div>
    </div>
  )
}


export function MissionBoard() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="p-6 border-b border-border-strong bg-surface-1">
        <h2 className="text-xl font-serif font-black uppercase tracking-widest italic">Mission Board</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1">Open Incidents & Quests</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-surface-2 shadow-[inset_4px_4px_0px_rgba(26,26,26,0.05)]">
        {/* Urgent - Open Join */}
        <div className="border border-border-strong bg-surface-0 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0_0_0px_rgba(26,26,26,1)] transition-all cursor-pointer group" onClick={() => setDrawerContent('case_lobby')}>
           <div className="p-4 border-b border-border-strong flex justify-between items-start bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.05)_10px,rgba(239,68,68,0.05)_20px)]">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="bg-accent-critical text-surface-0 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)]">CRITICAL</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">ALPHA-09</span>
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-widest">Multi-Vehicle Collision (AYE)</h3>
              </div>
              <div className="border font-mono border-accent-success text-accent-success bg-surface-0 px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(34,197,94,1)]">
                 OPEN JOIN
              </div>
           </div>
           <div className="p-4 bg-surface-0">
              <p className="text-xs font-medium text-text-secondary mb-4 leading-relaxed">Multiple casualties reported. Severe structural damage to vehicles. Immediate medical and hazard suppression needed.</p>
              <div className="flex items-center gap-2">
                 <span className="border border-border-strong bg-surface-2 px-2 py-1 text-[9px] font-bold uppercase tracking-widest">Medics (Need 2)</span>
                 <span className="border border-border-strong bg-surface-2 px-2 py-1 text-[9px] font-bold uppercase tracking-widest">Fire (Need 1)</span>
              </div>
           </div>
        </div>

        {/* High - Request Join */}
        <div className="border border-border-strong bg-surface-0 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0_0_0px_rgba(26,26,26,1)] transition-all cursor-pointer group">
           <div className="p-4 border-b border-border-strong flex justify-between items-start bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(245,158,11,0.05)_10px,rgba(245,158,11,0.05)_20px)]">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="bg-accent-warning text-surface-3 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)]">HIGH</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">BETA-12</span>
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-widest">Flash Flood / Evacuation</h3>
              </div>
              <div className="border font-mono border-accent-warning text-accent-warning bg-surface-0 px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(245,158,11,1)]">
                 REQUEST
              </div>
           </div>
           <div className="p-4 bg-surface-0">
              <p className="text-xs font-medium text-text-secondary mb-4 leading-relaxed">Water levels rising at Jurong East sector. Coordination required for crowd management and routing.</p>
              <div className="flex items-center gap-2">
                 <span className="border border-border-strong bg-surface-2 px-2 py-1 text-[9px] font-bold uppercase tracking-widest">Logistics</span>
                 <span className="border border-border-strong bg-surface-2 px-2 py-1 text-[9px] font-bold uppercase tracking-widest">Crowd Control</span>
              </div>
              <div className="mt-4 pt-4 border-t border-border-strong border-dashed">
                 <button className="w-full bg-surface-3 text-text-inverse py-3 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:bg-text-secondary transition-colors cursor-pointer border border-border-strong">Request to Join Team</button>
              </div>
           </div>
        </div>
        
        {/* Advisory - Invite Only */}
        <div className="border border-border-strong bg-surface-0 shadow-[4px_4px_0px_rgba(26,26,26,1)] opacity-70">
           <div className="p-4 border-b border-border-strong flex justify-between items-start">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="bg-surface-3 text-text-inverse px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border border-border-strong">ADVISORY</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">DELTA-04</span>
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Power Grid Maintenance</h3>
              </div>
              <div className="border font-mono border-border-strong text-text-secondary bg-surface-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(26,26,26,1)]">
                 INVITE ONLY
              </div>
           </div>
           <div className="p-4 bg-surface-1 font-mono text-[9px] uppercase tracking-widest font-bold text-text-secondary">
              (Restricted Team Access)
           </div>
        </div>

      </div>
    </div>
  )
}

export function CaseLobby() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="p-6 border-b border-border-strong bg-accent-critical text-surface-0 shadow-[0_4px_0px_rgba(26,26,26,1)] z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-black italic tracking-tighter">ALPHA-09</h2>
            <div className="border border-surface-0 px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-surface-0/20">Active Operation</div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest mt-2 border border-surface-0 inline-block px-2 py-1 self-start shadow-[2px_2px_0px_rgba(26,26,26,1)]">Multi-Vehicle Collision</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative bg-surface-2 shadow-[inset_4px_4px_0px_rgba(26,26,26,0.05)]">
         <div className="relative z-10 bg-surface-0 border border-border-strong p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
           <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 pb-2 border-b border-border-strong">Operation Briefing</h3>
           <p className="text-sm font-medium mb-4 leading-relaxed text-text-secondary">Multi-vehicle pileup reported on AYE. Multiple casualties expected. Hazmat risk unknown. Priority is perimeter control and triage.</p>
         </div>
         
         <div className="relative z-10 bg-surface-0 border border-border-strong p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
           <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 pb-2 border-b border-border-strong flex justify-between">
              <span>Active Operation Roster</span>
              <span className="opacity-60 bg-surface-2 px-2 py-0.5 border border-border-strong text-text-primary">4 On Scene</span>
           </h3>
           <ul className="flex flex-col gap-4 font-mono text-[10px] font-bold tracking-widest uppercase text-text-secondary mt-2">
              <li className="flex items-center justify-between border-b border-border-strong border-dashed pb-2">
                <div className="flex items-center gap-3"><div className="w-2 h-2 bg-accent-success border border-border-strong"></div> Unit Bravo-9 (Med)</div>
                <span className="opacity-50">Sector A</span>
              </li>
              <li className="flex items-center justify-between border-b border-border-strong border-dashed pb-2">
                <div className="flex items-center gap-3"><div className="w-2 h-2 bg-accent-success border border-border-strong"></div> Unit Charlie-3 (Fire)</div>
                <span className="opacity-50">Sector B</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3 opacity-60"><div className="w-2 h-2 bg-surface-1 border border-border-strong"></div> Support Agent AI</div>
                <span className="opacity-50">Monitoring</span>
              </li>
           </ul>
         </div>
      </div>
      
      <div className="p-6 border-t border-border-strong bg-surface-1">
         <button onClick={() => setDrawerContent('operation_chat')} className="w-full bg-surface-3 text-text-inverse py-4 border border-border-strong text-[10px] uppercase font-black tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">Join Operation Comms</button>
      </div>
    </div>
  )
}

export function OperationChatRoom() {
   const { setDrawerContent } = useAppContext();
   return (
    <div className="flex flex-col h-full bg-surface-0 relative">
      <div className="px-6 py-4 border-b border-border-strong bg-surface-1 flex items-center justify-between z-10 shadow-[0_2px_0px_rgba(26,26,26,1)]">
        <div className="flex flex-col gap-1">
           <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
             <div className="w-2 h-2 bg-accent-success border border-border-strong animate-pulse"></div> COMMS : ALPHA-09
           </h2>
           <span className="text-[9px] font-bold uppercase tracking-widest text-accent-info bg-surface-0 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] px-2 py-0.5">Support AI Agent in Room</span>
        </div>
        <button onClick={() => setDrawerContent('case_lobby')} className="text-[9px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 border border-border-strong px-3 py-1 cursor-pointer bg-surface-0 hover:bg-surface-2 transition-colors">Back Lobby</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 font-mono text-xs font-bold scroll-smooth">
         <div className="bg-surface-2 p-4 border border-border-strong w-4/5 self-start shadow-[4px_4px_0px_rgba(26,26,26,1)]">
            <span className="text-[10px] uppercase text-accent-info block mb-2 border-b border-border-strong pb-1 tracking-widest font-black">Unit Bravo-9 (Med)</span>
            <p className="font-medium tracking-wide leading-relaxed">On scene. 3 casualties safely extracted. Requesting additional trauma supplies.</p>
         </div>
         
         <div className="bg-surface-3 text-text-inverse p-4 border border-border-strong w-5/6 self-start shadow-[4px_4px_0px_rgba(26,26,26,1)]">
            <span className="text-[10px] uppercase text-accent-warning block mb-2 border-b border-surface-0 pb-1 tracking-widest font-black">SYSTEM AI :: OVERSEER</span>
            <p className="font-medium tracking-wide text-[11px] leading-relaxed">Understood Unit Bravo-9. Analyzing logistics routes. Delta-1 is currently 1km away with surplus supplies. I have requested Delta-1 to reroute to you.</p>
         </div>
         
         <div className="bg-accent-success text-surface-0 p-4 border border-border-strong w-4/5 self-end shadow-[4px_4px_0px_rgba(26,26,26,1)] ml-auto">
            <span className="text-[10px] uppercase block mb-2 border-b border-border-strong pb-1 font-black tracking-widest text-surface-0/80">ECHO-1 (YOU)</span>
            <p className="font-medium tracking-wide leading-relaxed">Roger that. En route to provide backup perimeter control. ETA 3 minutes.</p>
         </div>
      </div>
      
      <div className="p-4 border-t border-border-strong bg-surface-1">
         <div className="flex gap-2">
            <input type="text" placeholder="TRANSMIT MESSAGE..." className="flex-1 bg-surface-0 border border-border-strong p-3 text-[10px] font-bold uppercase tracking-widest shadow-[inset_2px_2px_0px_rgba(26,26,26,0.1)] outline-none focus:border-text-primary transition-all" />
            <button className="bg-surface-3 text-text-inverse px-6 border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)] text-[10px] font-black uppercase cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">Send</button>
         </div>
      </div>
    </div>
   )
}

export function FormCase() {
  const { setDrawerContent } = useAppContext();
  return (
     <div className="p-6 flex flex-col h-full bg-surface-0">
        <h2 className="text-xl font-serif italic font-black uppercase mb-6">Formation Sequence</h2>
        
        <div className="h-40 border border-border-strong bg-[repeating-linear-gradient(45deg,var(--color-surface-2),var(--color-surface-2)_10px,var(--color-surface-0)_10px,var(--color-surface-0)_20px)] mb-8 shadow-[inset_4px_4px_0px_rgba(26,26,26,0.1)] flex items-center justify-center p-4 text-center">
           <div className="bg-surface-0 border border-border-strong p-3 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
              <span className="text-[10px] font-bold uppercase tracking-widest">Draw lasso on map to bound case area</span>
           </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-6">
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Case Designation</label>
              <input type="text" className="w-full border border-border-strong bg-surface-1 p-4 text-sm outline-none focus:border-text-primary shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)] font-bold transition-all" placeholder="e.g. ALPHA-XRAY" defaultValue="OPS-299" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Classification</label>
              <select className="w-full border border-border-strong bg-surface-1 font-bold flex-1 p-4 text-sm outline-none focus:border-text-primary shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)] appearance-none cursor-pointer">
                 <option>Hazard Mitigation</option>
                 <option>Search & Rescue</option>
                 <option>Public Order</option>
              </select>
           </div>
        </div>
        
        <div className="pt-6 border-t border-border-strong mt-auto">
           <button onClick={() => setDrawerContent(null)} className="w-full bg-surface-3 text-text-inverse py-4 text-[10px] uppercase font-black tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">Form Case</button>
        </div>
     </div>
  )
}
