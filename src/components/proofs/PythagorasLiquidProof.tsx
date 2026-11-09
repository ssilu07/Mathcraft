// src/components/proofs/PythagorasLiquidProof.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import katex from 'katex';
import { MathAudioSynth } from '../../engines/MathAudioSynth';
import { ThemeMode } from '../../types/math';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  source: 'a' | 'b';
}

interface PythagorasLiquidProofProps {
  theme?: ThemeMode;
}

export const PythagorasLiquidProof: React.FC<PythagorasLiquidProofProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0); // 0 to Math.PI (180 deg)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [aSide, setASide] = useState<number>(3);
  const [bSide, setBSide] = useState<number>(4);
  const [particleCount, setParticleCount] = useState<number>(600);

  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const rotationAngleRef = useRef<number>(0);
  rotationAngleRef.current = rotationAngle;

  // Compute c side
  const cSide = Math.hypot(aSide, bSide);

  // Initialize particles inside squares A and B
  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    const totalA = Math.round((aSide * aSide) / (aSide * aSide + bSide * bSide) * particleCount);
    const totalB = particleCount - totalA;

    const colorA = isDark ? '#00f0ff' : '#0284c7';
    const colorB = isDark ? '#ff007f' : '#db2777';

    // Square A particles
    for (let i = 0; i < totalA; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 0.85,
        y: (Math.random() - 0.5) * 0.85,
        vx: 0,
        vy: 0,
        color: colorA,
        source: 'a',
      });
    }

    // Square B particles
    for (let i = 0; i < totalB; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 0.85,
        y: (Math.random() - 0.5) * 0.85,
        vx: 0,
        vy: 0,
        color: colorB,
        source: 'b',
      });
    }

    particlesRef.current = particles;
  }, [aSide, bSide, particleCount, isDark]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.032, (time - lastTime) / 1000);
      lastTime = time;

      // Handle auto playback
      if (isPlaying) {
        setRotationAngle((prev) => {
          const next = prev + dt * 0.6;
          if (next >= Math.PI) {
            setIsPlaying(false);
            MathAudioSynth.getInstance().playVictoryChord();
            return Math.PI;
          }
          if (Math.random() < 0.1) {
            MathAudioSynth.getInstance().playLiquidDrip();
          }
          return next;
        });
      }

      // Canvas sizing
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

      // Center origin
      const cx = width / 2;
      const cy = height / 2 + 20;
      const scale = Math.min(width, height) / 13;

      ctx.save();
      ctx.translate(cx, cy);

      const rot = rotationAngleRef.current;
      ctx.rotate(rot);

      // Geometry setup: Triangle vertices
      const a = aSide * scale;
      const b = bSide * scale;
      const c = cSide * scale;

      // Triangle coordinates: Right angle at (0,0)
      const pRight = { x: 0, y: 0 };
      const pTop = { x: 0, y: -a };
      const pLeft = { x: -b, y: 0 };

      // Draw Right Triangle
      ctx.beginPath();
      ctx.moveTo(pRight.x, pRight.y);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Right angle marker
      const sqSize = 14;
      ctx.strokeStyle = isDark ? '#39ff14' : '#16a34a';
      ctx.strokeRect(-sqSize, -sqSize, sqSize, sqSize);

      // Draw Square A (on side a, height -a)
      const sqACenter = { x: a / 2, y: -a / 2 };
      ctx.save();
      ctx.translate(sqACenter.x, sqACenter.y);
      ctx.fillStyle = isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(2, 132, 199, 0.1)';
      ctx.fillRect(-a / 2, -a / 2, a, a);
      ctx.strokeStyle = isDark ? '#00f0ff' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-a / 2, -a / 2, a, a);
      ctx.fillStyle = isDark ? '#00f0ff' : '#0284c7';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`a² = ${aSide * aSide}`, 0, 5);
      ctx.restore();

      // Draw Square B (on side b, width -b)
      const sqBCenter = { x: -b / 2, y: b / 2 };
      ctx.save();
      ctx.translate(sqBCenter.x, sqBCenter.y);
      ctx.fillStyle = isDark ? 'rgba(255, 0, 127, 0.08)' : 'rgba(225, 29, 72, 0.1)';
      ctx.fillRect(-b / 2, -b / 2, b, b);
      ctx.strokeStyle = isDark ? '#ff007f' : '#db2777';
      ctx.lineWidth = 2;
      ctx.strokeRect(-b / 2, -b / 2, b, b);
      ctx.fillStyle = isDark ? '#ff007f' : '#db2777';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`b² = ${bSide * bSide}`, 0, 5);
      ctx.restore();

      // Draw Square C (on hypotenuse)
      const hypAngle = Math.atan2(pLeft.y - pTop.y, pLeft.x - pTop.x);
      const hypMid = { x: (pTop.x + pLeft.x) / 2, y: (pTop.y + pLeft.y) / 2 };
      const nx = -(pLeft.y - pTop.y) / c;
      const ny = (pLeft.x - pTop.x) / c;

      const sqCCenter = { x: hypMid.x + (nx * c) / 2, y: hypMid.y + (ny * c) / 2 };

      ctx.save();
      ctx.translate(sqCCenter.x, sqCCenter.y);
      ctx.rotate(hypAngle);
      ctx.fillStyle = isDark ? 'rgba(57, 255, 20, 0.08)' : 'rgba(22, 163, 74, 0.1)';
      ctx.fillRect(-c / 2, -c / 2, c, c);
      ctx.strokeStyle = isDark ? '#39ff14' : '#16a34a';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-c / 2, -c / 2, c, c);
      ctx.fillStyle = isDark ? '#39ff14' : '#15803d';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`c² = ${cSide * cSide}`, 0, 5);
      ctx.restore();

      // Progress of fluid transition based on rotation [0 -> PI]
      const progress = Math.min(1, Math.max(0, rot / Math.PI));

      // Draw simulated particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        let targetX = 0;
        let targetY = 0;

        if (p.source === 'a') {
          const origX = sqACenter.x + p.x * a;
          const origY = sqACenter.y + p.y * a;
          const hypOffX = p.x * c * 0.9;
          const hypOffY = (p.y - 0.5 * (1 - progress)) * c * 0.85;
          const finalX = sqCCenter.x + Math.cos(hypAngle) * hypOffX - Math.sin(hypAngle) * hypOffY;
          const finalY = sqCCenter.y + Math.sin(hypAngle) * hypOffX + Math.cos(hypAngle) * hypOffY;

          targetX = origX * (1 - progress) + finalX * progress;
          targetY = origY * (1 - progress) + finalY * progress;
        } else {
          const origX = sqBCenter.x + p.x * b;
          const origY = sqBCenter.y + p.y * b;
          const hypOffX = p.x * c * 0.9;
          const hypOffY = (p.y - 0.5 * (1 - progress)) * c * 0.85;
          const finalX = sqCCenter.x + Math.cos(hypAngle) * hypOffX - Math.sin(hypAngle) * hypOffY;
          const finalY = sqCCenter.y + Math.sin(hypAngle) * hypOffX + Math.cos(hypAngle) * hypOffY;

          targetX = origX * (1 - progress) + finalX * progress;
          targetY = origY * (1 - progress) + finalY * progress;
        }

        const jitterX = (Math.sin(time * 0.005 + i) * 1.5) * (1 - Math.abs(progress - 0.5) * 1.5);
        const jitterY = (Math.cos(time * 0.005 + i) * 1.5) * (1 - Math.abs(progress - 0.5) * 1.5);

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(targetX + jitterX, targetY + jitterY, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // restore translated origin
      ctx.restore(); // restore dpr scale

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, aSide, bSide, cSide, isDark]);

  const dragStartAngleRef = useRef<{ isDragging: boolean; startAngle: number; initialRotation: number }>({
    isDragging: false,
    startAngle: 0,
    initialRotation: 0,
  });

  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2 + 20;
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;
    const angle = Math.atan2(y, x);
    dragStartAngleRef.current = {
      isDragging: true,
      startAngle: angle,
      initialRotation: rotationAngleRef.current,
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragStartAngleRef.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2 + 20;
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;
    const currentAngle = Math.atan2(y, x);
    const delta = currentAngle - dragStartAngleRef.current.startAngle;
    let newRot = dragStartAngleRef.current.initialRotation + delta;
    if (newRot < 0) newRot = 0;
    if (newRot > Math.PI) newRot = Math.PI;
    setRotationAngle(newRot);
    if (Math.random() < 0.1) MathAudioSynth.getInstance().playLiquidDrip();
  };

  const handlePointerUp = () => {
    dragStartAngleRef.current.isDragging = false;
  };

  // LaTeX equation HTML
  const formulaLatex = katex.renderToString(
    `a^2 + b^2 = c^2 \\iff ${aSide}^2 + ${bSide}^2 = ${aSide * aSide} + ${bSide * bSide} = ${cSide * cSide} = ${cSide}^2`,
    { displayMode: true, throwOnError: false }
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#080c16] text-slate-800 dark:text-slate-100 p-4 gap-4 overflow-y-auto transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 rounded-full">
              PROOF 01
            </span>
            <h2 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">
              Pythagorean Theorem: Liquid Sand Pour Proof
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Rotate the wheel to watch fluid particles from squares <span className="text-cyan-700 dark:text-cyan-400 font-semibold">a²</span> and <span className="text-pink-700 dark:text-pink-400 font-semibold">b²</span> completely fill square <span className="text-emerald-700 dark:text-emerald-400 font-semibold">c²</span>.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              MathAudioSynth.getInstance().playTactileSnap();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white dark:text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause Pour' : 'Auto Pour Liquid'}
          </button>

          <button
            onClick={() => {
              setRotationAngle(0);
              setIsPlaying(false);
              initParticles();
              MathAudioSynth.getInstance().playTactileSnap(800);
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-all active:scale-95 shadow-xs"
            title="Reset Simulation"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Main Canvas + Interactive Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[460px]">
        {/* Canvas Display */}
        <div className="lg:col-span-3 relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-lg flex flex-col">
          <canvas
            ref={canvasRef}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => {
              if (e.touches.length > 0) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handlePointerUp}
            onTouchCancel={handlePointerUp}
            style={{ touchAction: 'none' }}
            className="w-full h-full block cursor-grab active:cursor-grabbing"
          />

          {/* Floating Angle HUD */}
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-cyan-800 dark:text-cyan-300 shadow-md">
            Wheel Angle: {Math.round((rotationAngle * 180) / Math.PI)}° / 180°
          </div>

          <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/85 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[200px] flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tilt Rotation</span>
              <input
                type="range"
                min={0}
                max={Math.PI}
                step={0.01}
                value={rotationAngle}
                onChange={(e) => {
                  setRotationAngle(parseFloat(e.target.value));
                  if (Math.random() < 0.2) MathAudioSynth.getInstance().playLiquidDrip();
                }}
                className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="text-xs font-mono text-cyan-800 dark:text-cyan-400 font-bold min-w-[45px]">
                {Math.round((rotationAngle / Math.PI) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Info & Parameters */}
        <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Sparkles size={14} className="text-cyan-600 dark:text-cyan-400" /> Mathematical Analysis
          </div>

          <div
            className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-slate-800 dark:text-cyan-200 shadow-xs"
            dangerouslySetInnerHTML={{ __html: formulaLatex }}
          />

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Side a Length:</span>
                <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">{aSide} units</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={aSide}
                onChange={(e) => setASide(parseInt(e.target.value))}
                className="accent-cyan-600 dark:accent-cyan-400 cursor-pointer bg-slate-200 dark:bg-slate-700 rounded h-1.5"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Side b Length:</span>
                <span className="font-mono text-pink-700 dark:text-pink-400 font-bold">{bSide} units</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={bSide}
                onChange={(e) => setBSide(parseInt(e.target.value))}
                className="accent-pink-600 dark:accent-pink-400 cursor-pointer bg-slate-200 dark:bg-slate-700 rounded h-1.5"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Particle Density:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{particleCount} fluid drops</span>
              </div>
              <input
                type="range"
                min={200}
                max={1200}
                step={100}
                value={particleCount}
                onChange={(e) => setParticleCount(parseInt(e.target.value))}
                className="accent-emerald-600 dark:accent-emerald-400 cursor-pointer bg-slate-200 dark:bg-slate-700 rounded h-1.5"
              />
            </label>
          </div>

          <div className="mt-auto p-3 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/20 rounded-lg text-xs text-cyan-950 dark:text-cyan-300/90 leading-relaxed shadow-xs">
            <strong className="text-cyan-800 dark:text-cyan-300 block mb-1">AHA! Intuition:</strong>
            Because the fluid volume is strictly conserved, completely emptying squares <span className="text-cyan-700 dark:text-cyan-400 font-semibold">a²</span> and <span className="text-pink-700 dark:text-pink-400 font-semibold">b²</span> to fill square <span className="text-emerald-700 dark:text-emerald-400 font-semibold">c²</span> directly proves that the sum of the areas of the two smaller squares equals the area of the hypotenuse square!
          </div>
        </div>
      </div>
    </div>
  );
};
