// src/components/BottomControlBar.tsx

import React from 'react';
import { Play, Pause, RotateCcw, Sliders, Activity } from 'lucide-react';
import { SandboxState } from '../types/math';
import { MathAudioSynth } from '../engines/MathAudioSynth';

interface BottomControlBarProps {
  state: SandboxState;
  setState: (updater: (prev: SandboxState) => SandboxState, record?: boolean) => void;
}

export const BottomControlBar: React.FC<BottomControlBarProps> = ({ state, setState }) => {
  const { parameters, isPlaying, activeTool, activeCurveType, riemannType } = state;

  const handlePlayToggle = () => {
    const nextPlayState = !isPlaying;
    setState((prev) => {
      if (nextPlayState && prev.activeTool === 'unit_circle') {
        MathAudioSynth.getInstance().startContinuousHarmonizer(prev.parameters.theta);
      } else {
        MathAudioSynth.getInstance().stopContinuousHarmonizer();
      }
      return { ...prev, isPlaying: nextPlayState };
    }, false);
    MathAudioSynth.getInstance().playTactileSnap(nextPlayState ? 1400 : 900);
  };

  const handleResetParameters = () => {
    setState((prev) => ({
      ...prev,
      parameters: { t: 0, theta: 0, n: 16, k: 1 },
      isPlaying: false,
    }));
    MathAudioSynth.getInstance().stopContinuousHarmonizer();
    MathAudioSynth.getInstance().playTactileSnap(800);
  };

  const curveOptions: ('parabola' | 'sine' | 'cubic' | 'gaussian')[] = ['parabola', 'sine', 'cubic', 'gaussian'];

  return (
    <div className="h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4 select-none shrink-0 z-10 overflow-x-auto transition-colors duration-200 shadow-xs">
      {/* Play/Pause & Reset Animation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
          }`}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Pause' : 'Animate'}</span>
        </button>

        <button
          onClick={handleResetParameters}
          title="Reset Parameters"
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 transition-all shadow-xs"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Mode Specific Controls: Calculus Function & Riemann Type Switchers */}
      {activeTool === 'tangent_roller' && (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <Activity size={14} className="text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Curve f(x):</span>
          {curveOptions.map((c) => (
            <button
              key={c}
              onClick={() => {
                setState((prev) => ({ ...prev, activeCurveType: c }));
                MathAudioSynth.getInstance().playTactileSnap(1200);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-all ${
                activeCurveType === c
                  ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {activeTool === 'riemann_sum' && (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <Sliders size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Method:</span>
          {(['left', 'right', 'midpoint', 'trapezoid'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setState((prev) => ({ ...prev, riemannType: m }));
                MathAudioSynth.getInstance().playTactileSnap(1200);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-all ${
                riemannType === m
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Active Variable Sliders */}
      <div className="flex items-center gap-6">
        {/* Theta Slider (Unit Circle / Angles) */}
        <div className="flex items-center gap-2 min-w-[170px]">
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-yellow-400">θ:</span>
          <input
            type="range"
            min={0}
            max={Math.PI * 2}
            step={0.02}
            value={parameters.theta}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setState(
                (prev) => ({
                  ...prev,
                  parameters: { ...prev.parameters, theta: val },
                }),
                false
              );
              if (activeTool === 'unit_circle') {
                MathAudioSynth.getInstance().updateContinuousHarmonizer(val);
              }
            }}
            className="w-24 accent-amber-500 dark:accent-yellow-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded"
          />
          <span className="text-xs font-mono text-amber-700 dark:text-yellow-400 min-w-[45px] font-semibold">
            {Math.round((parameters.theta * 180) / Math.PI)}°
          </span>
        </div>

        {/* Parameter t Slider (Rollercoaster / General animation) */}
        <div className="flex items-center gap-2 min-w-[150px]">
          <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">t:</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={parameters.t}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setState(
                (prev) => ({
                  ...prev,
                  parameters: { ...prev.parameters, t: val },
                }),
                false
              );
            }}
            className="w-24 accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded"
          />
          <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 min-w-[35px] font-semibold">
            {parameters.t.toFixed(2)}
          </span>
        </div>

        {/* Partitions n Slider (Riemann rectangles / Polygon sides) */}
        <div className="flex items-center gap-2 min-w-[160px]">
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">n:</span>
          <input
            type="range"
            min={2}
            max={100}
            step={1}
            value={parameters.n}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setState(
                (prev) => ({
                  ...prev,
                  parameters: { ...prev.parameters, n: val },
                }),
                false
              );
            }}
            className="w-24 accent-emerald-600 dark:accent-emerald-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded"
          />
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 min-w-[30px] font-semibold">
            {parameters.n}
          </span>
        </div>
      </div>
    </div>
  );
};
