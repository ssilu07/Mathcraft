// src/components/proofs/VisualProofs.tsx

import React, { useState } from 'react';
import { PythagorasLiquidProof } from './PythagorasLiquidProof';
import { CircleAreaProof } from './CircleAreaProof';
import { TriangleFoldProof } from './TriangleFoldProof';
import { Sparkles, Droplets, Circle, Triangle } from 'lucide-react';
import { MathAudioSynth } from '../../engines/MathAudioSynth';
import { ThemeMode } from '../../types/math';

interface VisualProofsProps {
  initialProof?: 'pythagoras' | 'circle' | 'triangle';
  theme?: ThemeMode;
}

export const VisualProofs: React.FC<VisualProofsProps> = ({ initialProof = 'pythagoras', theme = 'dark' }) => {
  const [activeTab, setActiveTab] = useState<'pythagoras' | 'circle' | 'triangle'>(initialProof);

  const tabs = [
    {
      id: 'pythagoras' as const,
      name: 'Pythagorean Liquid Proof',
      subtitle: 'a² + b² = c² fluid sand pour',
      icon: Droplets,
      color: 'text-cyan-600 dark:text-cyan-400',
      activeBg: 'bg-cyan-100 border-cyan-300 text-cyan-950 dark:bg-cyan-500/20 dark:border-cyan-400 dark:text-white',
    },
    {
      id: 'circle' as const,
      name: 'Circle Area Transformation',
      subtitle: 'Unrolling 2n wedges into πr²',
      icon: Circle,
      color: 'text-pink-600 dark:text-pink-400',
      activeBg: 'bg-pink-100 border-pink-300 text-pink-950 dark:bg-pink-500/20 dark:border-pink-400 dark:text-white',
    },
    {
      id: 'triangle' as const,
      name: 'Triangle 180° Sum',
      subtitle: 'Tear & align angles to straight line',
      icon: Triangle,
      color: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-500/20 dark:border-emerald-400 dark:text-white',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#080c16] overflow-hidden transition-colors duration-200">
      {/* Proof Selector Navigation Bar */}
      <div className="flex items-center gap-2 p-3 bg-white/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest px-3 border-r border-slate-200 dark:border-slate-800">
          <Sparkles size={14} /> Visual Proofs
        </div>

        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  MathAudioSynth.getInstance().playTactileSnap(1300);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-xs ${
                  isActive
                    ? `${tab.activeBg} shadow-md`
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={14} className={tab.color} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Proof Container */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'pythagoras' && <PythagorasLiquidProof theme={theme} />}
        {activeTab === 'circle' && <CircleAreaProof theme={theme} />}
        {activeTab === 'triangle' && <TriangleFoldProof theme={theme} />}
      </div>
    </div>
  );
};
