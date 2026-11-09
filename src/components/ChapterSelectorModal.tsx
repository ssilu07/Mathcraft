// src/components/ChapterSelectorModal.tsx

import React from 'react';
import {
  X,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import katex from 'katex';
import { AppMode, ToolType } from '../types/math';
import { MathAudioSynth } from '../engines/MathAudioSynth';

export interface ChapterItem {
  id: string;
  num: number;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  latex: string;
  mode: AppMode;
  tool?: ToolType;
  proofId?: 'pythagoras' | 'circle' | 'triangle';
  puzzleLevel?: number;
  badgeColor: string;
}

interface ChapterSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChapter: (chapter: ChapterItem) => void;
}

export const ChapterSelectorModal: React.FC<ChapterSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectChapter,
}) => {
  if (!isOpen) return null;

  const chapters: ChapterItem[] = [
    {
      id: 'ch1',
      num: 1,
      category: 'Euclidean Foundations',
      title: 'Points, Lines & Euclidean Primitives',
      subtitle: 'Constructing geometry from first principles',
      description: 'Interact with draggable points, calculate live distance formulas, slopes, and relational constraints.',
      latex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}, \\quad m = \\frac{y_2 - y_1}{x_2 - x_1}',
      mode: 'sandbox',
      tool: 'segment',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    },
    {
      id: 'ch2',
      num: 2,
      category: 'Euclidean Foundations',
      title: 'Dynamic Bisectors & Intersections',
      subtitle: 'Perpendicular and angle bisector solvers',
      description: 'Generate dynamic bisectors that automatically pivot and update as control vertices move.',
      latex: 'Ax + By + C = 0, \\quad \\vec{v}_{\\text{bisect}} = \\frac{\\vec{u}_1 + \\vec{u}_2}{\\|\\vec{u}_1 + \\vec{u}_2\\|}',
      mode: 'sandbox',
      tool: 'perpendicular_bisector',
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    },
    {
      id: 'ch3',
      num: 3,
      category: 'Polygons & Coordinates',
      title: 'Shoelace Polygon Area Formula',
      subtitle: 'Gauss surveyor formula for arbitrary N-gons',
      description: 'Draw arbitrary polygons and watch the Shoelace cross-product calculate exact area and perimeter.',
      latex: '\\text{Area} = \\frac{1}{2} \\left| \\sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \\right|',
      mode: 'sandbox',
      tool: 'polygon',
      badgeColor: 'border-teal-500/40 text-teal-400 bg-teal-500/10',
    },
    {
      id: 'ch4',
      num: 4,
      category: 'Trigonometry & Waves',
      title: 'Unit Circle Projections & Sound Synthesizer',
      subtitle: 'Hear the math through procedural harmonic audio',
      description: 'Rotate the unit vector to see sin, cos, and tan projections unroll into continuous traveling sine waves with pitch sonification.',
      latex: 'x = \\cos(\\theta), \\; y = \\sin(\\theta), \\; f = 220 \\cdot 2^{\\theta / \\pi} \\text{ Hz}',
      mode: 'sandbox',
      tool: 'unit_circle',
      badgeColor: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
    },
    {
      id: 'ch5',
      num: 5,
      category: 'Differential Calculus',
      title: 'Tangent Roller (Derivative as Slope)',
      subtitle: 'Central difference slope & curvature roller-car',
      description: 'A skateboarder cruises along curves f(x). Color-coded tangent lines show exact live derivatives and local extrema.',
      latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x-h)}{2h}, \\quad \\text{extrema at } f'(x) = 0",
      mode: 'sandbox',
      tool: 'tangent_roller',
      badgeColor: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
    },
    {
      id: 'ch6',
      num: 6,
      category: 'Integral Calculus',
      title: 'Liquid Riemann Sum (Definite Integration)',
      subtitle: 'Accumulation of area under curves',
      description: 'Partition curves into liquid rectangles. Compare Left, Right, Midpoint, and Trapezoidal sums against exact definite integrals.',
      latex: '\\int_a^b f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^n f(x_i^*) \\Delta x',
      mode: 'sandbox',
      tool: 'riemann_sum',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'ch7',
      num: 7,
      category: 'AHA! Visual Proofs',
      title: 'Pythagorean Theorem: Liquid Sand Pour',
      subtitle: 'Fluid conservation proof of a² + b² = c²',
      description: 'Rotate the hydraulic wheel to watch fluid sand pour out of squares a² and b² to perfectly fill hypotenuse square c².',
      latex: 'a^2 + b^2 = c^2',
      mode: 'proofs',
      proofId: 'pythagoras',
      badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-500/20',
    },
    {
      id: 'ch8',
      num: 8,
      category: 'AHA! Visual Proofs',
      title: 'Circle Area Limit Transformation (πr²)',
      subtitle: 'Unrolling 2n wedges into a rectangle',
      description: 'Unroll circle wedges into alternating interlocking teeth. As n approaches infinity, the scalloped edge becomes flat base πr.',
      latex: '\\lim_{n \\to \\infty} \\text{Shape} = (\\pi r \\times r) = \\pi r^2',
      mode: 'proofs',
      proofId: 'circle',
      badgeColor: 'border-pink-400/50 text-pink-300 bg-pink-500/20',
    },
    {
      id: 'ch9',
      num: 9,
      category: 'AHA! Visual Proofs',
      title: 'Triangle Angle Sum (180° Tear & Fold)',
      subtitle: 'Euclidean angle invariance proof',
      description: 'Drag any arbitrary triangle shape, then tear off the 3 interior angles to align them into a flat 180° straight line.',
      latex: '\\alpha + \\beta + \\gamma = 180^\\circ = \\pi \\text{ radians}',
      mode: 'proofs',
      proofId: 'triangle',
      badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-500/20',
    },
    {
      id: 'ch10',
      num: 10,
      category: 'Arcade Challenges',
      title: 'Level 1: Laser Angle Mirror',
      subtitle: 'Optics & reflection law puzzle',
      description: 'Position and rotate two plane mirrors to guide a high-energy laser beam into the target star.',
      latex: '\\theta_{\\text{inc}} = \\theta_{\\text{refl}} \\implies \\mathbf{r} = \\mathbf{d} - 2(\\mathbf{d} \\cdot \\mathbf{n})\\mathbf{n}',
      mode: 'puzzles',
      puzzleLevel: 1,
      badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-500/20',
    },
    {
      id: 'ch11',
      num: 11,
      category: 'Arcade Challenges',
      title: 'Level 2: Rollercoaster Curvature Survival',
      subtitle: 'Centrifugal acceleration & Bezier smoothing',
      description: 'Smooth out the track connecting two cliffs. If curvature κ > 0.007, excessive G-forces will derail the cart!',
      latex: '\\kappa(t) = \\frac{|x\' y\'\' - y\' x\'\'|}{(x\'^2 + y\'^2)^{3/2}} \\le \\kappa_{\\text{safe}}',
      mode: 'puzzles',
      puzzleLevel: 2,
      badgeColor: 'border-red-400/50 text-red-300 bg-red-500/20',
    },
    {
      id: 'ch12',
      num: 12,
      category: 'Arcade Challenges',
      title: 'Level 3: Max Area Pasture Optimization',
      subtitle: 'Optimization calculus with fencing constraints',
      description: 'Use 100 meters of fencing against a river to maximize the enclosed pasture area for grazing sheep.',
      latex: 'A(x) = 100x - 2x^2 \\implies \\frac{dA}{dx} = 100 - 4x = 0 \\iff x = 25\\text{m}',
      mode: 'puzzles',
      puzzleLevel: 3,
      badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-500/20',
    },
    {
      id: 'ch13',
      num: 13,
      category: 'Arcade Challenges',
      title: 'Level 4: Parabolic Kinematic Cannon',
      subtitle: 'Quadratic ballistics through floating hoops',
      description: 'Adjust launch angle θ and velocity v₀ to fire through multiple aerial hoops using kinematic motion.',
      latex: 'y(x) = x \\tan\\theta - \\frac{g x^2}{2 v_0^2 \\cos^2\\theta}',
      mode: 'puzzles',
      puzzleLevel: 4,
      badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-500/20',
    },
    {
      id: 'ch14',
      num: 14,
      category: 'Arcade Challenges',
      title: 'Level 5: Circumcenter Rescue Mission',
      subtitle: 'Equidistant triangle center positioning',
      description: 'Place the rescue lighthouse beacon at the exact circumcenter to illuminate 3 stranded ships simultaneously.',
      latex: 'R = d(C, S_1) = d(C, S_2) = d(C, S_3) = \\frac{abc}{4\\text{Area}}',
      mode: 'puzzles',
      puzzleLevel: 5,
      badgeColor: 'border-blue-400/50 text-blue-300 bg-blue-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shadow-md shadow-cyan-500/10">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-slate-900 dark:text-white">
                Interactive Mathematics Curriculum
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                14 comprehensive chapters arranged from foundational Euclidean geometry to advanced calculus & arcade challenges.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              MathAudioSynth.getInstance().playTactileSnap(800);
            }}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chapters Grid Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((ch) => (
            <div
              key={ch.id}
              onClick={() => {
                onSelectChapter(ch);
                onClose();
                MathAudioSynth.getInstance().playTactileSnap(1300);
              }}
              className="bg-slate-50 hover:bg-white dark:bg-slate-950/60 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl flex flex-col justify-between gap-3 cursor-pointer group transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${ch.badgeColor}`}>
                    CH {ch.num.toString().padStart(2, '0')} • {ch.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                  {ch.title}
                </h3>
                <h4 className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {ch.subtitle}
                </h4>

                <p className="text-[11px] text-slate-600 dark:text-slate-400/90 leading-relaxed mb-3">
                  {ch.description}
                </p>

                {/* KaTeX formula preview */}
                <div
                  className="p-2 bg-white dark:bg-slate-900/90 rounded border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-800 dark:text-cyan-200 overflow-x-auto shadow-2xs"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(ch.latex, {
                      displayMode: false,
                      throwOnError: false,
                    }),
                  }}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs font-bold text-cyan-700 dark:text-cyan-400 group-hover:text-cyan-800 dark:group-hover:text-cyan-300">
                <span>Launch Chapter Simulator</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
