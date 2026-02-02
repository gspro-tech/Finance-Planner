
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  percentage: number;
  target: number;
  color: string; // 'indigo' | 'cyan' | 'rose'
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, percentage, target, color, icon }) => {
  const isOver = percentage > target * 100 && label.includes('Need');
  const isUnder = percentage < target * 100 && label.includes('Savings');

  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    cyan: 'from-cyan-500 to-cyan-600',
    rose: 'from-rose-500 to-rose-600',
  };

  const textMap: Record<string, string> = {
    indigo: 'text-indigo-400',
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
  };

  const bgMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20',
    cyan: 'bg-cyan-500/10 border-cyan-500/20',
    rose: 'bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className={`glass-effect premium-gradient-border p-6 rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <div className={`p-2.5 rounded-xl ${bgMap[color]} ${textMap[color]} border transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-3xl font-extrabold text-white tracking-tight">${value}</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOver ? 'bg-red-500/20 text-red-400' : isUnder ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${colorMap[color]}`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-3 text-[9px] uppercase tracking-widest text-slate-500 font-extrabold">
        <span>Allocation</span>
        <span className="text-slate-400">Target: {target * 100}%</span>
      </div>
    </div>
  );
};
