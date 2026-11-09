// src/components/LeftToolbar.tsx

import React from 'react';
import {
  MousePointer,
  Hand,
  Dot,
  Minus,
  Spline,
  Circle,
  Hexagon,
  CornerDownRight,
  Split,
  Activity,
  Waves,
  Sliders,
  Trash2,
} from 'lucide-react';
import { ToolType } from '../types/math';
import { MathAudioSynth } from '../engines/MathAudioSynth';

interface ToolItem {
  id: ToolType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  key?: string;
}

interface LeftToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onClearCanvas: () => void;
  onLoadPreset: (presetName: string) => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onSelectTool,
  onClearCanvas,
  onLoadPreset,
}) => {
  const handleToolClick = (tool: ToolType) => {
    onSelectTool(tool);
    MathAudioSynth.getInstance().playTactileSnap(1200);

    // If unit circle, trigger audio harmonizer start
    if (tool === 'unit_circle') {
      MathAudioSynth.getInstance().startContinuousHarmonizer(0);
    } else {
      MathAudioSynth.getInstance().stopContinuousHarmonizer();
    }
  };

  const toolSections: { title: string; tools: ToolItem[] }[] = [
    {
      title: 'Primitives',
      tools: [
        { id: 'select' as ToolType, label: 'Select / Drag', icon: MousePointer, key: 'V' },
        { id: 'pan' as ToolType, label: 'Pan Canvas', icon: Hand, key: 'H' },
        { id: 'point' as ToolType, label: 'Point', icon: Dot, key: 'P' },
        { id: 'segment' as ToolType, label: 'Line Segment', icon: Minus, key: 'S' },
        { id: 'line' as ToolType, label: 'Infinite Line', icon: Spline, key: 'L' },
        { id: 'circle' as ToolType, label: 'Circle (Center + Point)', icon: Circle, key: 'C' },
        { id: 'polygon' as ToolType, label: 'Polygon (N-Vertices)', icon: Hexagon, key: 'G' },
      ],
    },
    {
      title: 'Constructions',
      tools: [
        { id: 'perpendicular_bisector' as ToolType, label: 'Perp. Bisector', icon: Split },
        { id: 'angle_bisector' as ToolType, label: 'Angle Bisector (3 Pts)', icon: CornerDownRight },
      ],
    },
    {
      title: 'Interactive Math',
      tools: [
        { id: 'unit_circle' as ToolType, label: 'Unit Circle & Sound', icon: Waves },
        { id: 'tangent_roller' as ToolType, label: 'Tangent Roller (Slope)', icon: Activity },
        { id: 'riemann_sum' as ToolType, label: 'Liquid Riemann Sum', icon: Sliders },
      ],
    },
  ];

  return (
    <aside className="w-16 md:w-20 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 gap-4 select-none z-10 shrink-0 transition-colors duration-200 shadow-xs">
      <div className="flex-1 w-full flex flex-col items-center gap-4 overflow-y-auto overflow-x-hidden px-1">
        {toolSections.map((sec, secIdx) => (
          <div key={secIdx} className="w-full flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider mb-0.5">
              {sec.title}
            </span>
            {sec.tools.map((t) => {
              const Icon = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleToolClick(t.id)}
                  title={`${t.label} ${t.key ? `(${t.key})` : ''}`}
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all relative group ${
                    isActive
                      ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-md shadow-cyan-500/30 scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 text-slate-700 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[8px] font-mono mt-0.5 max-w-[42px] truncate leading-tight">
                    {t.id.split('_')[0]}
                  </span>

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 dark:bg-slate-900 border border-slate-700 text-white text-[11px] font-mono rounded shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
                    {t.label}
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        {/* Preset Templates */}
        <div className="w-full flex flex-col items-center gap-1 border-t border-slate-200 dark:border-slate-800/80 pt-2">
          <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">
            Presets
          </span>
          <button
            onClick={() => {
              onLoadPreset('triangle');
              MathAudioSynth.getInstance().playPointNote(1);
            }}
            title="Load Triangle & Circumcircle"
            className="w-11 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-[10px] font-mono flex items-center justify-center transition-all"
          >
            △ Circ
          </button>
          <button
            onClick={() => {
              onLoadPreset('tangent_circle');
              MathAudioSynth.getInstance().playPointNote(2);
            }}
            title="Load Circle & Tangents"
            className="w-11 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-[10px] font-mono flex items-center justify-center transition-all"
          >
            ◯ Tang
          </button>
        </div>
      </div>

      {/* Clear Canvas Button */}
      <button
        onClick={() => {
          onClearCanvas();
          MathAudioSynth.getInstance().playTactileSnap(600);
        }}
        title="Clear Canvas"
        className="w-11 h-11 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-center justify-center transition-all active:scale-95 shadow-xs"
      >
        <Trash2 size={16} />
      </button>
    </aside>
  );
};
