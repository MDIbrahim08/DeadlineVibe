import React from 'react';
import { Activity } from 'lucide-react';

interface ActivityChartCardProps {
  title: string;
  totalValue: string;
  data: { day: string; value: number }[];
}

export function ActivityChartCard({ title, totalValue, data }: ActivityChartCardProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl flex flex-col h-full w-full relative overflow-hidden group hover:border-white/10 transition-colors">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>
      
      <div className="flex items-center justify-between mb-8 z-10">
        <div>
          <h3 className="text-slate-400 font-mono text-[10px] tracking-widest uppercase flex items-center gap-1.5 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> {title}
          </h3>
          <p className="text-4xl font-serif text-slate-100">{totalValue}</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 h-32 mt-auto z-10 px-2">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-3 flex-1 h-full group/bar">
            <div className="w-full relative flex items-end h-full bg-slate-950/50 rounded-t-lg overflow-hidden border-b border-white/5">
              <div 
                className="w-full bg-gradient-to-t from-blue-600/80 to-blue-400 rounded-t-lg transition-all duration-700 group-hover/bar:from-blue-500 group-hover/bar:to-blue-300 relative shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                style={{ height: `${(d.value / maxVal) * 100}%` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 group-hover/bar:text-slate-300 transition-colors">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
