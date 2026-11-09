// src/components/proofs/CircleAreaProof.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import katex from 'katex';
import { MathAudioSynth } from '../../engines/MathAudioSynth';
import { ThemeMode } from '../../types/math';

interface CircleAreaProofProps {
  theme?: ThemeMode;
}

export const CircleAreaProof: React.FC<CircleAreaProofProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [unrollProgress, setUnrollProgress] = useState<number>(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [wedgesCount, setWedgesCount] = useState<number>(16); // 8, 16, 32, 64
  const [radius, setRadius] = useState<number>(120);

  const animFrameRef = useRef<number | null>(null);
  const unrollProgressRef = useRef<number>(0);
  unrollProgressRef.current = unrollProgress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.032, (time - lastTime) / 1000);
      lastTime = time;

      if (isPlaying) {
        setUnrollProgress((prev) => {
          const next = prev + dt * 0.45;
          if (next >= 1) {
            setIsPlaying(false);
            MathAudioSynth.getInstance().playVictoryChord();
            return 1;
          }
          if (Math.random() < 0.15) {
            MathAudioSynth.getInstance().playTactileSnap(1200);
          }
          return next;
        });
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = isDark ? '#080c16' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      const progress = unrollProgressRef.current;
      const totalSlices = wedgesCount;
      const sliceAngle = (2 * Math.PI) / totalSlices;
      const halfSlices = totalSlices / 2;

      // Circle initial center
      const circleCenter = { x: width * 0.28, y: height * 0.5 };
      // Rectangle center
      const rectCenter = { x: width * 0.62, y: height * 0.5 };

      // Total arc length of one slice
      const arcWidth = sliceAngle * radius;
      // Width of the unfolded rectangle
      const rectWidth = halfSlices * arcWidth; // ~ pi * r

      // Draw each wedge
      for (let i = 0; i < totalSlices; i++) {
        const startTheta = i * sliceAngle;
        const midTheta = startTheta + sliceAngle / 2;

        const isTop = i % 2 === 0; // Alternating slices
        const indexInRow = Math.floor(i / 2);

        // Initial position in circle
        const circleApex = { x: circleCenter.x, y: circleCenter.y };

        let rectApexX = 0;
        let rectApexY = 0;
        let targetAngle = 0;

        if (isTop) {
          // Pointing down from top baseline
          rectApexX = rectCenter.x - rectWidth / 2 + indexInRow * arcWidth + arcWidth / 2;
          rectApexY = rectCenter.y - radius / 2;
          targetAngle = Math.PI / 2;
        } else {
          // Pointing up from bottom baseline
          rectApexX = rectCenter.x - rectWidth / 2 + indexInRow * arcWidth + arcWidth;
          rectApexY = rectCenter.y + radius / 2;
          targetAngle = -Math.PI / 2;
        }

        // Interpolate apex position
        const currentApexX = circleApex.x * (1 - progress) + rectApexX * progress;
        const currentApexY = circleApex.y * (1 - progress) + rectApexY * progress;

        // Interpolate angle
        let angleDiff = targetAngle - midTheta;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        const currentAngle = midTheta + angleDiff * progress;

        ctx.save();
        ctx.translate(currentApexX, currentApexY);
        ctx.rotate(currentAngle);

        // Draw Wedge shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, -sliceAngle / 2, sliceAngle / 2, false);
        ctx.closePath();

        // Alternating colors
        if (isTop) {
          ctx.fillStyle = isDark ? 'rgba(0, 240, 255, 0.28)' : 'rgba(2, 132, 199, 0.22)';
          ctx.strokeStyle = isDark ? '#00f0ff' : '#0284c7';
        } else {
          ctx.fillStyle = isDark ? 'rgba(255, 0, 127, 0.28)' : 'rgba(225, 29, 72, 0.22)';
          ctx.strokeStyle = isDark ? '#ff007f' : '#db2777';
        }

        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // Draw dimension lines when unfolded
      if (progress > 0.4) {
        const opacity = (progress - 0.4) / 0.6;
        ctx.save();
        ctx.globalAlpha = opacity;

        const dimColor = isDark ? '#ffd700' : '#b45309';

        // Base dimension (pi * r)
        const leftX = rectCenter.x - rectWidth / 2;
        const rightX = rectCenter.x + rectWidth / 2;
        const bottomY = rectCenter.y + radius / 2 + 35;

        ctx.strokeStyle = dimColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftX, bottomY);
        ctx.lineTo(rightX, bottomY);
        ctx.stroke();

        // Markers
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(leftX, bottomY - 6);
        ctx.lineTo(leftX, bottomY + 6);
        ctx.moveTo(rightX, bottomY - 6);
        ctx.lineTo(rightX, bottomY + 6);
        ctx.stroke();

        ctx.fillStyle = dimColor;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Base ≈ π · r (${(Math.PI * radius).toFixed(1)} px)`, rectCenter.x, bottomY + 22);

        // Height dimension (r)
        const heightX = rightX + 30;
        const topY = rectCenter.y - radius / 2;
        const botY = rectCenter.y + radius / 2;

        ctx.beginPath();
        ctx.moveTo(heightX, topY);
        ctx.lineTo(heightX, botY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(heightX - 6, topY);
        ctx.lineTo(heightX + 6, topY);
        ctx.moveTo(heightX - 6, botY);
        ctx.lineTo(heightX + 6, botY);
        ctx.stroke();

        ctx.fillText(`Height = r (${radius} px)`, heightX + 75, rectCenter.y + 5);

        ctx.restore();
      }

      // Title & Labels
      ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      if (progress < 0.3) {
        ctx.fillText('Original Circle (Radius = r)', circleCenter.x, circleCenter.y + radius + 30);
      } else {
        ctx.fillText('Circle Unfolding into Interlocking Wedges...', circleCenter.x, circleCenter.y + radius + 30);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, wedgesCount, radius, isDark]);

  const latexFormula = katex.renderToString(
    `\\begin{aligned}
      \\text{Circumference } C &= 2\\pi r \\\\
      \\text{Half Circumference } &= \\pi r \\\\
      \\text{As } n \\to \\infty, \\; \\text{Shape} &\\to \\text{Rectangle of } (\\pi r \\times r) \\\\
      \\therefore \\text{Area} &= \\text{Base} \\times \\text{Height} = (\\pi r) \\cdot r = \\mathbf{\\pi r^2}
    \\end{aligned}`,
    { displayMode: true, throwOnError: false }
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#080c16] text-slate-800 dark:text-slate-100 p-4 gap-4 overflow-y-auto transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 border border-pink-300 dark:border-pink-500/30 rounded-full">
              PROOF 02
            </span>
            <h2 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">
              Circle Area Transformation: Wedges to Rectangle (πr²)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Unroll the pie slices of a circle and watch them interlock into a rectangle of base <span className="text-amber-700 dark:text-amber-400 font-semibold">πr</span> and height <span className="text-cyan-700 dark:text-cyan-400 font-semibold">r</span>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              MathAudioSynth.getInstance().playTactileSnap();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-500 dark:to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white dark:text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-pink-500/20 transition-all active:scale-95"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause Transformation' : 'Animate Unrolling'}
          </button>

          <button
            onClick={() => {
              setUnrollProgress(0);
              setIsPlaying(false);
              MathAudioSynth.getInstance().playTactileSnap(800);
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-all active:scale-95 shadow-xs"
            title="Reset Unrolling"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Main Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[460px]">
        {/* Canvas */}
        <div className="lg:col-span-3 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-lg flex flex-col">
          <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

          {/* Interactive Progress Bar */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/85 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[200px] flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Unroll Wedge Teeth</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={unrollProgress}
                onChange={(e) => {
                  setUnrollProgress(parseFloat(e.target.value));
                  if (Math.random() < 0.2) MathAudioSynth.getInstance().playTactileSnap(1200);
                }}
                className="w-full accent-pink-600 dark:accent-pink-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="text-xs font-mono text-pink-700 dark:text-pink-400 font-bold min-w-[45px]">
                {Math.round(unrollProgress * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Math Details */}
        <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Sparkles size={14} className="text-pink-600 dark:text-pink-400" /> Mathematical Proof
          </div>

          <div
            className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-slate-800 dark:text-cyan-200 text-xs shadow-xs"
            dangerouslySetInnerHTML={{ __html: latexFormula }}
          />

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Wedge Partitions (2n):</span>
                <span className="font-mono text-pink-700 dark:text-pink-400 font-bold">{wedgesCount} slices</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {[8, 16, 32, 64].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setWedgesCount(count);
                      MathAudioSynth.getInstance().playTactileSnap(count * 20);
                    }}
                    className={`py-1 text-xs font-mono font-bold rounded border transition-all ${
                      wedgesCount === count
                        ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-500/50'
                        : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-300 mt-2">
              <div className="flex justify-between">
                <span>Circle Radius r:</span>
                <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">{radius} px</span>
              </div>
              <input
                type="range"
                min={70}
                max={160}
                step={5}
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="accent-cyan-600 dark:accent-cyan-400 cursor-pointer bg-slate-200 dark:bg-slate-700 rounded h-1.5"
              />
            </label>
          </div>

          <div className="mt-auto p-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-500/20 rounded-lg text-xs text-pink-950 dark:text-pink-300/90 leading-relaxed shadow-xs">
            <strong className="text-pink-800 dark:text-pink-300 block mb-1">AHA! Intuition:</strong>
            As the number of wedges increases toward infinity, the scalloped arc edge flattens into a straight base of length <span className="text-pink-700 dark:text-pink-400 font-semibold">πr</span>, and the side becomes exactly <span className="text-cyan-700 dark:text-cyan-400 font-semibold">r</span>, yielding the exact rectangle area <span className="text-amber-700 dark:text-amber-300 font-semibold">πr²</span>!
          </div>
        </div>
      </div>
    </div>
  );
};
