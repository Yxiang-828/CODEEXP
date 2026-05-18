import React, { useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppContext } from '../../AppContext';
import { MapPin, AlertTriangle, User, Flame, Navigation2, Hexagon, MousePointer2, Eraser, PenTool, Tent, ArrowRight, Ruler, Type, Undo, Trash, Eye } from 'lucide-react';

const mockOpsZone = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [103.84, 1.33],
            [103.86, 1.34],
            [103.87, 1.31],
            [103.85, 1.30],
            [103.84, 1.33]
          ]
        ]
      }
    }
  ]
};

export default function MapCanvas() {
  const { setDrawerContent, role } = useAppContext();

  const [viewState, setViewState] = useState({
    longitude: 103.8198,
    latitude: 1.3521,
    zoom: 12,
    pitch: 0,
    bearing: 0
  });

  return (
    <div className="absolute inset-0 bg-surface-2 overflow-hidden shadow-[inset_16px_16px_0px_rgba(26,26,26,0.05)]">
      <div className="absolute inset-0 z-0">
         <Map
           {...viewState}
           onMove={evt => setViewState(evt.viewState)}
           mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
         >
            <Source id="ops-zone" type="geojson" data={mockOpsZone}>
              <Layer
                id="ops-zone-fill"
                type="fill"
                paint={{
                  'fill-color': '#eab308', /* warning color approx */
                  'fill-opacity': 0.15
                }}
              />
              <Layer
                id="ops-zone-outline"
                type="line"
                paint={{
                  'line-color': '#eab308',
                  'line-width': 2,
                  'line-dasharray': [2, 2]
                }}
              />
            </Source>

            {/* L1: Advisory */}
            <Marker longitude={103.82} latitude={1.35} anchor="center">
              <div className="group cursor-pointer" onClick={() => setDrawerContent('local_alert')}>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-surface-0 px-2 py-1 border border-border-strong text-[9px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-[2px_2px_0px_rgba(26,26,26,1)] z-20">
                   Traffic Delay
                 </div>
                 <div className="w-6 h-6 bg-surface-2 text-text-primary border border-border-strong rounded-none flex items-center justify-center shadow-[4px_4px_0px_rgba(26,26,26,1)] relative z-10 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                    <span className="text-[10px] font-black font-mono">L1</span>
                 </div>
              </div>
            </Marker>

            {/* L3: Warning */}
            <Marker longitude={103.85} latitude={1.32} anchor="center">
              <div className="group cursor-pointer" onClick={() => setDrawerContent('local_alert')}>
                <div className="w-12 h-12 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-accent-warning opacity-20 scale-150 group-hover:scale-[1.8] transition-transform border border-accent-warning" style={{ animation: 'pulse 2s ease-in-out 3' }}></div>
                  <div className="w-8 h-8 bg-accent-warning text-surface-3 flex items-center justify-center shadow-[4px_4px_0px_rgba(26,26,26,1)] relative z-10 border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all">
                     <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Marker>

            {/* L4/L5: Severe/Emergency */}
            <Marker longitude={103.80} latitude={1.36} anchor="center">
              <div className="group cursor-pointer" onClick={() => setDrawerContent('incident_ops')}>
                <div className="absolute top-1/2 left-12 -translate-y-1/2 flex items-center gap-1 z-20">
                  <div className="bg-accent-critical text-surface-0 px-2 py-1 border border-border-strong text-[10px] font-black tracking-widest uppercase shadow-[2px_2px_0px_rgba(26,26,26,1)] whitespace-nowrap">
                     L5 : ALPHA-09
                  </div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-accent-critical opacity-20 scale-[2.5] group-hover:scale-[3] transition-transform shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>
                  <div className="absolute inset-0 border border-accent-critical opacity-50 scale-[3.5]" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) 3' }}></div>
                  <div className="w-8 h-8 bg-accent-critical text-text-inverse flex items-center justify-center shadow-[4px_4px_0px_rgba(26,26,26,1)] relative z-10 border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Marker>

            {/* User Location */}
            <Marker longitude={103.83} latitude={1.33} anchor="center">
               <div className="">
                 <div className="w-6 h-6 bg-accent-info text-text-inverse rounded-full flex items-center justify-center shadow-[2px_2px_0px_rgba(26,26,26,1)] border border-border-strong z-10 relative">
                   <User className="w-3 h-3" />
                 </div>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-surface-0 px-2 py-1 text-[10px] uppercase font-bold tracking-widest shadow-[2px_2px_0px_rgba(26,26,26,1)] whitespace-nowrap text-text-primary border border-border-strong z-20">
                   {role === 'responder' ? 'ECHO-1 (YOU)' : 'USER_01'}
                 </div>
               </div>
            </Marker>
         </Map>
      </div>

      <div className="absolute top-6 left-6 z-10 bg-surface-0 text-text-primary px-3 py-1 text-[10px] font-bold tracking-widest uppercase shadow-[4px_4px_0px_rgba(26,26,26,1)] pointer-events-none border border-border-strong">
         MAPGL_VIEWPORT_PRIMARY_CHROME
      </div>

      {/* Ops Drawing Toolbar */}
      {role === 'ops' && (
        <div className="absolute top-16 md:top-1/2 right-2 md:right-6 md:-translate-y-1/2 flex flex-col gap-1 md:gap-2 z-10">
          <div className="bg-surface-0 border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)] p-1 flex flex-col gap-1">
            <button className="w-8 h-8 bg-surface-3 text-text-inverse flex items-center justify-center cursor-pointer hover:bg-text-secondary transition-colors group relative" title="Select Tool">
              <MousePointer2 className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Draw Area">
              <Hexagon className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Draw Perimeter">
              <PenTool className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Plot Incident">
              <MapPin className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Staging Area">
              <Tent className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Route/Arrow">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Measuring Tape">
              <Ruler className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Text Label">
              <Type className="w-3.5 h-3.5" />
            </button>

            <div className="w-full h-px bg-border-strong my-1"></div>

            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Eraser">
              <Eraser className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-text-primary flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Undo">
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 bg-surface-0 text-accent-critical flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors group relative" title="Clear All">
              <Trash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Coverage Preview Panel */}
      {role === 'ops' && (
        <div className="absolute hidden md:flex bottom-24 left-1/2 -translate-x-1/2 bg-surface-0 border border-border-strong p-3 gap-6 shadow-[8px_8px_0px_rgba(26,26,26,1)] z-10 w-96 max-w-[90vw]">
           <div className="flex flex-col flex-1">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-text-primary flex items-center gap-2"><Eye className="w-3 h-3"/> Coverage</span>
               <span className="font-mono text-[9px] font-bold text-accent-success">98.2%</span>
             </div>
             <div className="h-2 w-full bg-surface-2 border border-border-strong">
                <div className="h-full bg-accent-success" style={{ width: '98.2%' }}></div>
             </div>
             <span className="text-[9px] font-medium text-text-secondary mt-1">CCTV & Sensors online in active zone</span>
           </div>
        </div>
      )}

    </div>
  );
}
