// src/components/proofs/TriangleFoldProof.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import katex from 'katex';
import { MathAudioSynth } from '../../engines/MathAudioSynth';
import { ThemeMode } from '../../types/math';

interface Point {
  x: number;
  y: number;
}

interface TriangleFoldProofProps {
  theme?: ThemeMode;
}

export const TriangleFoldProof: React.FC<TriangleFoldProofProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Triangle vertices in local canvas space
  const [points, setPoints] = useState<[Point, Point, Point]>([
    { x: 300, y: 120 }, // Vertex A (Top)
    { x: 160, y: 340 }, // Vertex B (Bottom Left)
    { x: 440, y: 320 }, // Vertex C (Bottom Right)
  ]);

  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [tearProgress, setTearProgress] = useState<number>(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showParallelLine, setShowParallelLine] = useState<boolean>(true);

  const animFrameRef = useRef<number | null>(null);
  const tearProgressRef = useRef<number>(0);
  tearProgressRef.current = tearProgress;
  const pointsRef = useRef(points);
  pointsRef.current = points;

  // Calculate angles
  const calculateAngles = (pts: [Point, Point, Point]) => {
    const [A, B, C] = pts;

    const dist = (p1: Point, p2: Point) => Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const a = dist(B, C);
    const b = dist(A, C);
    const c = dist(A, B);

    const clamp = (val: number) => Math.max(-1, Math.min(1, val));
    const alpha = Math.acos(clamp((b * b + c * c - a * a) / (2 * b * c)));
    const beta = Math.acos(clamp((a * a + c * c - b * b) / (2 * a * c)));
    const gamma = Math.PI - alpha - beta;

    return {
      alphaRad: alpha,
      betaRad: beta,
      gammaRad: gamma,
      alphaDeg: (alpha * 180) / Math.PI,
      betaDeg: (beta * 180) / Math.PI,
      gammaDeg: (gamma * 180) / Math.PI,
    };
  };

  const { alphaDeg, betaDeg, gammaDeg, alphaRad, betaRad, gammaRad } = calculateAngles(points);

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
        setTearProgress((prev) => {
          const next = prev + dt * 0.5;
          if (next >= 1) {
            setIsPlaying(false);
            MathAudioSynth.getInstance().playVictoryChord();
            return 1;
          }
          if (Math.random() < 0.2) {
            MathAudioSynth.getInstance().playTactileSnap(1300);
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

      const [A, B, C] = pointsRef.current;
      const progress = tearProgressRef.current;

      // Draw original triangle
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Parallel auxiliary line through A parallel to BC
      if (showParallelLine) {
        const dx = C.x - B.x;
        const dy = C.y - B.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;

        ctx.strokeStyle = isDark ? 'rgba(57, 255, 20, 0.4)' : 'rgba(22, 163, 74, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(A.x - ux * 250, A.y - uy * 250);
        ctx.lineTo(A.x + ux * 250, A.y + uy * 250);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isDark ? '#39ff14' : '#15803d';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('Line L ∥ BC', A.x - ux * 180, A.y - uy * 180 - 8);
      }

      // Base target line for the assembled angles
      const assembleTarget = { x: width * 0.72, y: height * 0.65 };
      const arcRadius = 55;

      // Draw the straight baseline where angles align
      if (progress > 0.05) {
        ctx.strokeStyle = isDark ? 'rgba(255, 215, 0, 0.5)' : 'rgba(217, 119, 6, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(assembleTarget.x - 140, assembleTarget.y);
        ctx.lineTo(assembleTarget.x + 140, assembleTarget.y);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#ffd700' : '#b45309';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Flat 180° Baseline', assembleTarget.x, assembleTarget.y + 24);
      }

      // Draw the 3 angle sectors
      // 1. Beta Angle (at B)
      const angleBA = Math.atan2(A.y - B.y, A.x - B.x);
      const angleBC = Math.atan2(C.y - B.y, C.x - B.x);
      let bStart = angleBC;
      let bEnd = angleBA;
      if (bEnd < bStart) bEnd += 2 * Math.PI;

      const assembledBetaStart = Math.PI - betaRad;
      const assembledBetaEnd = Math.PI;

      const currBetaPos = {
        x: B.x * (1 - progress) + assembleTarget.x * progress,
        y: B.y * (1 - progress) + assembleTarget.y * progress,
      };

      ctx.save();
      ctx.translate(currBetaPos.x, currBetaPos.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const betaS = bStart * (1 - progress) + assembledBetaStart * progress;
      const betaE = bEnd * (1 - progress) + assembledBetaEnd * progress;
      ctx.arc(0, 0, arcRadius, betaS, betaE);
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(255, 0, 127, 0.35)' : 'rgba(225, 29, 72, 0.25)';
      ctx.strokeStyle = isDark ? '#ff007f' : '#db2777';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 2. Alpha Angle (at A)
      const angleAB = Math.atan2(B.y - A.y, B.x - A.x);
      const angleAC = Math.atan2(C.y - A.y, C.x - A.x);
      let aStart = angleAC;
      let aEnd = angleAB;
      if (aEnd < aStart) aEnd += 2 * Math.PI;

      const assembledAlphaStart = Math.PI - betaRad - alphaRad;
      const assembledAlphaEnd = Math.PI - betaRad;

      const currAlphaPos = {
        x: A.x * (1 - progress) + assembleTarget.x * progress,
        y: A.y * (1 - progress) + assembleTarget.y * progress,
      };

      ctx.save();
      ctx.translate(currAlphaPos.x, currAlphaPos.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const alphaS = aStart * (1 - progress) + assembledAlphaStart * progress;
      const alphaE = aEnd * (1 - progress) + assembledAlphaEnd * progress;
      ctx.arc(0, 0, arcRadius, alphaS, alphaE);
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(0, 240, 255, 0.35)' : 'rgba(2, 132, 199, 0.25)';
      ctx.strokeStyle = isDark ? '#00f0ff' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 3. Gamma Angle (at C)
      const angleCA = Math.atan2(A.y - C.y, A.x - C.x);
      const angleCB = Math.atan2(B.y - C.y, B.x - C.x);
      let cStart = angleCB;
      let cEnd = angleCA;
      if (cEnd < cStart) cEnd += 2 * Math.PI;

      const assembledGammaStart = 0;
      const assembledGammaEnd = gammaRad;

      const currGammaPos = {
        x: C.x * (1 - progress) + assembleTarget.x * progress,
        y: C.y * (1 - progress) + assembleTarget.y * progress,
      };

      ctx.save();
      ctx.translate(currGammaPos.x, currGammaPos.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const gammaS = cStart * (1 - progress) + assembledGammaStart * progress;
      const gammaE = cEnd * (1 - progress) + assembledGammaEnd * progress;
      ctx.arc(0, 0, arcRadius, gammaS, gammaE);
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(57, 255, 20, 0.35)' : 'rgba(22, 163, 74, 0.25)';
      ctx.strokeStyle = isDark ? '#39ff14' : '#16a34a';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw draggable vertex handles
      const labels = ['A', 'B', 'C'];
      const pointColors = isDark
        ? ['#00f0ff', '#ff007f', '#39ff14']
        : ['#0284c7', '#db2777', '#16a34a'];

      [A, B, C].forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = pointColors[idx];
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(labels[idx], pt.x, pt.y - 12);
      });

      // Semicircle arc when fully assembled
      if (progress > 0.85) {
        ctx.strokeStyle = isDark ? '#ffd700' : '#b45309';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(assembleTarget.x, assembleTarget.y, arcRadius + 12, Math.PI, 0, false);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#ffd700' : '#b45309';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('α + β + γ = 180°', assembleTarget.x, assembleTarget.y - arcRadius - 22);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, showParallelLine, isDark]);

  // Handle vertex dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hitIdx = points.findIndex((pt) => Math.hypot(pt.x - mouseX, pt.y - mouseY) < 18);
    if (hitIdx !== -1) {
      setDraggedPointIndex(hitIdx);
      MathAudioSynth.getInstance().playPointNote(hitIdx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedPointIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = Math.max(40, Math.min(canvas.clientWidth - 40, e.clientX - rect.left));
    const mouseY = Math.max(40, Math.min(canvas.clientHeight - 40, e.clientY - rect.top));

    setPoints((prev) => {
      const next = [...prev] as [Point, Point, Point];
      next[draggedPointIndex] = { x: mouseX, y: mouseY };
      return next;
    });
  };

  const handleMouseUp = () => {
    if (draggedPointIndex !== null) {
      MathAudioSynth.getInstance().playTactileSnap(1400);
      setDraggedPointIndex(null);
    }
  };

  const latexFormula = katex.renderToString(
    `\\angle A (\\alpha) + \\angle B (\\beta) + \\angle C (\\gamma) = ${alphaDeg.toFixed(1)}^\\circ + ${betaDeg.toFixed(1)}^\\circ + ${gammaDeg.toFixed(1)}^\\circ = 180.0^\\circ`,
    { displayMode: true, throwOnError: false }
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#080c16] text-slate-800 dark:text-slate-100 p-4 gap-4 overflow-y-auto transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 rounded-full">
              PROOF 03
            </span>
            <h2 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">
              Triangle Angle Sum (180° Tear & Align Proof)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Drag any vertex of the triangle. Notice that no matter how scalene, acute, or obtuse the triangle is, the 3 angles always assemble into a continuous straight line of <span className="text-emerald-700 dark:text-emerald-400 font-semibold">180°</span>.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              MathAudioSynth.getInstance().playTactileSnap();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white dark:text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause Tear' : 'Animate Angle Tear'}
          </button>

          <button
            onClick={() => {
              setTearProgress(0);
              setIsPlaying(false);
              MathAudioSynth.getInstance().playTactileSnap(800);
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-all active:scale-95 shadow-xs"
            title="Reset Angle Tear"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[460px]">
        {/* Canvas Display */}
        <div className="lg:col-span-3 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-lg flex flex-col">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Floating Instructions */}
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-emerald-800 dark:text-emerald-300 shadow-md">
            Interactive: Click and drag vertices A, B, or C anywhere!
          </div>

          {/* Bottom Tear Slider */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/85 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[200px] flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tear & Align Angles</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={tearProgress}
                onChange={(e) => {
                  setTearProgress(parseFloat(e.target.value));
                  if (Math.random() < 0.2) MathAudioSynth.getInstance().playTactileSnap(1300);
                }}
                className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="text-xs font-mono text-emerald-800 dark:text-emerald-400 font-bold min-w-[45px]">
                {Math.round(tearProgress * 100)}%
              </span>
            </div>

            <button
              onClick={() => setShowParallelLine(!showParallelLine)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                showParallelLine
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              Parallel Line L: {showParallelLine ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Right Info Details */}
        <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" /> Angle Measurement
          </div>

          <div
            className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-slate-800 dark:text-cyan-200 text-xs shadow-xs"
            dangerouslySetInnerHTML={{ __html: latexFormula }}
          />

          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 dark:bg-cyan-400" /> ∠A (α Vertex):
              </span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">{alphaDeg.toFixed(1)}°</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-600 dark:bg-pink-400" /> ∠B (β Vertex):
              </span>
              <span className="font-mono text-pink-700 dark:text-pink-400 font-bold">{betaDeg.toFixed(1)}°</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" /> ∠C (γ Vertex):
              </span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{gammaDeg.toFixed(1)}°</span>
            </div>

            <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 font-bold">
              <span>Total Angle Sum:</span>
              <span className="font-mono text-amber-700 dark:text-amber-400 font-extrabold text-sm">
                {(alphaDeg + betaDeg + gammaDeg).toFixed(1)}° (π rad)
              </span>
            </div>
          </div>

          <div className="mt-auto p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs text-emerald-950 dark:text-emerald-300/90 leading-relaxed shadow-xs">
            <strong className="text-emerald-800 dark:text-emerald-300 block mb-1">AHA! Geometric Invariance:</strong>
            By drawing the auxiliary line L through vertex A parallel to base BC, alternate interior angles prove that the 3 angles form a straight angle on a Euclidean plane, exactly equal to <span className="text-emerald-800 dark:text-emerald-300 font-semibold">180°</span>!
          </div>
        </div>
      </div>
    </div>
  );
};
