// src/components/puzzles/PuzzleManager.tsx

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ChevronRight,
  RotateCcw,
  Zap,
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import katex from 'katex';
import { MathAudioSynth } from '../../engines/MathAudioSynth';
import { ThemeMode } from '../../types/math';

export const PuzzleManager: React.FC<{ initialLevel?: number; theme?: ThemeMode }> = ({ initialLevel = 1, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [currentLevel, setCurrentLevel] = useState<number>(initialLevel);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Level 1: Laser Mirror State
  const [l1Mirrors, setL1Mirrors] = useState([
    { x: 260, y: 160, angle: -Math.PI / 4, len: 90 },
    { x: 480, y: 340, angle: Math.PI / 4, len: 90 },
  ]);
  const [l1Target] = useState({ x: 620, y: 120, radius: 24 });
  const [l1Emitter] = useState({ x: 80, y: 340, dir: 0 }); // shooting right

  // Level 2: Rollercoaster Curvature State
  const [l2P1, setL2P1] = useState({ x: 240, y: 140 });
  const [l2P2, setL2P2] = useState({ x: 440, y: 360 });
  const [l2CartT, setL2CartT] = useState<number>(0);
  const [l2IsRiding, setL2IsRiding] = useState<boolean>(false);
  const [l2Derailed, setL2Derailed] = useState<boolean>(false);
  const [l2MaxCurvature, setL2MaxCurvature] = useState<number>(0);

  // Level 3: Max Area Pasture State
  const [l3FenceX, setL3FenceX] = useState<number>(15); // width x, length y = 100 - 2x

  // Level 4: Parabolic Cannon State
  const [l4Angle, setL4Angle] = useState<number>(45); // degrees
  const [l4Velocity, setL4Velocity] = useState<number>(75); // m/s
  const [l4IsFiring, setL4IsFiring] = useState<boolean>(false);
  const [l4BallPos, setL4BallPos] = useState<{ x: number; y: number } | null>(null);
  const [l4HoopsPassed, setL4HoopsPassed] = useState<number[]>([]);

  // Level 5: Circumcenter Rescue State
  const [l5Beacon, setL5Beacon] = useState({ x: 300, y: 240 });
  const [l5Ships] = useState([
    { id: 1, x: 180, y: 120, name: 'S.S. Archimedes' },
    { id: 2, x: 460, y: 150, name: 'S.S. Euler' },
    { id: 3, x: 320, y: 380, name: 'S.S. Hypatia' },
  ]);
  const [l5ShowBisectors, setL5ShowBisectors] = useState<boolean>(false);

  // Dragging states
  const [draggingItem, setDraggingItem] = useState<{
    type: 'mirror-pos' | 'mirror-rot' | 'bezier-p1' | 'bezier-p2' | 'pasture-x' | 'beacon';
    index?: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Trigger win condition
  const triggerVictory = () => {
    if (isVictory) return;
    setIsVictory(true);
    setCompletedLevels((prev) => (prev.includes(currentLevel) ? prev : [...prev, currentLevel]));
    MathAudioSynth.getInstance().playVictoryChord();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#ff007f', '#39ff14', '#ffd700'],
    });
  };

  // Next level handler
  const handleNextLevel = () => {
    setIsVictory(false);
    setShowHint(false);
    setCurrentLevel((prev) => Math.min(5, prev + 1));
    MathAudioSynth.getInstance().playTactileSnap(1200);
  };

  // Restart current level
  const handleResetLevel = () => {
    setIsVictory(false);
    setShowHint(false);
    MathAudioSynth.getInstance().playTactileSnap(800);

    if (currentLevel === 1) {
      setL1Mirrors([
        { x: 260, y: 160, angle: -Math.PI / 4, len: 90 },
        { x: 480, y: 340, angle: Math.PI / 4, len: 90 },
      ]);
    } else if (currentLevel === 2) {
      setL2P1({ x: 240, y: 140 });
      setL2P2({ x: 440, y: 360 });
      setL2CartT(0);
      setL2IsRiding(false);
      setL2Derailed(false);
    } else if (currentLevel === 3) {
      setL3FenceX(15);
    } else if (currentLevel === 4) {
      setL4Angle(45);
      setL4Velocity(75);
      setL4IsFiring(false);
      setL4BallPos(null);
      setL4HoopsPassed([]);
    } else if (currentLevel === 5) {
      setL5Beacon({ x: 300, y: 240 });
    }
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.032, (time - lastTime) / 1000);
      lastTime = time;

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

      // Blueprint grid background
      ctx.fillStyle = isDark ? '#080c16' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ==========================================
      // LEVEL 1: LASER MIRROR
      // ==========================================
      if (currentLevel === 1) {
        // Draw Target Star
        ctx.save();
        ctx.translate(l1Target.x, l1Target.y);
        ctx.fillStyle = isVictory
          ? (isDark ? 'rgba(255, 215, 0, 0.4)' : 'rgba(217, 119, 6, 0.35)')
          : (isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(217, 119, 6, 0.15)');
        ctx.beginPath();
        ctx.arc(0, 0, l1Target.radius + Math.sin(time * 0.006) * 4, 0, Math.PI * 2);
        ctx.fill();

        const starColor = isDark ? '#ffd700' : '#d97706';
        ctx.strokeStyle = starColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const rOuter = l1Target.radius;
          const rInner = l1Target.radius * 0.45;
          const aOuter = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const aInner = aOuter + Math.PI / 5;
          if (i === 0) ctx.moveTo(Math.cos(aOuter) * rOuter, Math.sin(aOuter) * rOuter);
          else ctx.lineTo(Math.cos(aOuter) * rOuter, Math.sin(aOuter) * rOuter);
          ctx.lineTo(Math.cos(aInner) * rInner, Math.sin(aInner) * rInner);
        }
        ctx.closePath();
        ctx.fillStyle = starColor;
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw Emitter
        ctx.fillStyle = isDark ? '#00f0ff' : '#0284c7';
        ctx.beginPath();
        ctx.arc(l1Emitter.x, l1Emitter.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('LASER SOURCE', l1Emitter.x - 35, l1Emitter.y - 18);

        // Raycast Laser
        let currentRay = { x: l1Emitter.x, y: l1Emitter.y, dx: 1, dy: 0 };
        const raySegments: { x1: number; y1: number; x2: number; y2: number }[] = [];
        let hitTarget = false;

        for (let bounce = 0; bounce < 3; bounce++) {
          let closestDist = 800;
          let hitInfo: { x: number; y: number; normalX: number; normalY: number; mirrorIdx: number } | null = null;

          // Check target collision
          const toTargetX = l1Target.x - currentRay.x;
          const toTargetY = l1Target.y - currentRay.y;
          const proj = toTargetX * currentRay.dx + toTargetY * currentRay.dy;
          if (proj > 0) {
            const perpDistSq = toTargetX * toTargetX + toTargetY * toTargetY - proj * proj;
            if (perpDistSq < l1Target.radius * l1Target.radius) {
              closestDist = proj;
              hitTarget = true;
            }
          }

          // Check mirror collisions
          for (let mIdx = 0; mIdx < l1Mirrors.length; mIdx++) {
            const m = l1Mirrors[mIdx];
            const p1 = {
              x: m.x - Math.cos(m.angle) * (m.len / 2),
              y: m.y - Math.sin(m.angle) * (m.len / 2),
            };
            const p2 = {
              x: m.x + Math.cos(m.angle) * (m.len / 2),
              y: m.y + Math.sin(m.angle) * (m.len / 2),
            };

            const segDx = p2.x - p1.x;
            const segDy = p2.y - p1.y;
            const rayDx = currentRay.dx;
            const rayDy = currentRay.dy;

            const denom = rayDx * segDy - rayDy * segDx;
            if (Math.abs(denom) > 1e-5) {
              const tRay = ((p1.x - currentRay.x) * segDy - (p1.y - currentRay.y) * segDx) / denom;
              const uSeg = ((p1.x - currentRay.x) * rayDy - (p1.y - currentRay.y) * rayDx) / denom;

              if (tRay > 2 && tRay < closestDist && uSeg >= 0 && uSeg <= 1) {
                closestDist = tRay;
                let nx = -segDy;
                let ny = segDx;
                const nLen = Math.hypot(nx, ny) || 1;
                nx /= nLen;
                ny /= nLen;
                if (rayDx * nx + rayDy * ny > 0) {
                  nx = -nx;
                  ny = -ny;
                }
                hitInfo = {
                  x: currentRay.x + rayDx * tRay,
                  y: currentRay.y + rayDy * tRay,
                  normalX: nx,
                  normalY: ny,
                  mirrorIdx: mIdx,
                };
                hitTarget = false;
              }
            }
          }

          const endX = currentRay.x + currentRay.dx * closestDist;
          const endY = currentRay.y + currentRay.dy * closestDist;
          raySegments.push({ x1: currentRay.x, y1: currentRay.y, x2: endX, y2: endY });

          if (hitTarget) {
            triggerVictory();
            break;
          }

          if (hitInfo) {
            const dot = currentRay.dx * hitInfo.normalX + currentRay.dy * hitInfo.normalY;
            const rx = currentRay.dx - 2 * dot * hitInfo.normalX;
            const ry = currentRay.dy - 2 * dot * hitInfo.normalY;
            const rLen = Math.hypot(rx, ry);
            currentRay = { x: hitInfo.x, y: hitInfo.y, dx: rx / rLen, dy: ry / rLen };
          } else {
            break;
          }
        }

        // Draw Laser Beam
        ctx.save();
        ctx.strokeStyle = isDark ? '#00f0ff' : '#0284c7';
        ctx.lineWidth = 3;
        if (isDark) {
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        for (const seg of raySegments) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();
        ctx.restore();

        // Draw Mirrors
        l1Mirrors.forEach((m, idx) => {
          const mx1 = m.x - Math.cos(m.angle) * (m.len / 2);
          const my1 = m.y - Math.sin(m.angle) * (m.len / 2);
          const mx2 = m.x + Math.cos(m.angle) * (m.len / 2);
          const my2 = m.y + Math.sin(m.angle) * (m.len / 2);

          // Mirror backing
          ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(mx1, my1);
          ctx.lineTo(mx2, my2);
          ctx.stroke();

          // Reflective surface
          ctx.strokeStyle = isDark ? '#e2e8f0' : '#334155';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(mx1, my1);
          ctx.lineTo(mx2, my2);
          ctx.stroke();

          // Center handle
          ctx.fillStyle = isDark ? '#ff007f' : '#db2777';
          ctx.beginPath();
          ctx.arc(m.x, m.y, 7, 0, Math.PI * 2);
          ctx.fill();

          // Rotation handle
          ctx.fillStyle = isDark ? '#39ff14' : '#16a34a';
          ctx.beginPath();
          ctx.arc(mx2, my2, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isDark ? '#94a3b8' : '#334155';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`Mirror ${idx + 1} (${Math.round((m.angle * 180) / Math.PI)}°)`, m.x - 30, m.y - 14);
        });
      }

      // ==========================================
      // LEVEL 2: ROLLERCOASTER CURVATURE
      // ==========================================
      else if (currentLevel === 2) {
        const startCliff = { x: 80, y: 140 };
        const endCliff = { x: 620, y: 380 };

        // Draw Cliffs
        ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.fillRect(0, startCliff.y, startCliff.x, height - startCliff.y);
        ctx.fillRect(endCliff.x, endCliff.y, width - endCliff.x, height - endCliff.y);

        ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, startCliff.y);
        ctx.lineTo(startCliff.x, startCliff.y);
        ctx.moveTo(endCliff.x, endCliff.y);
        ctx.lineTo(width, endCliff.y);
        ctx.stroke();

        // Cubic Bezier Track
        const p0 = startCliff;
        const p1 = l2P1;
        const p2 = l2P2;
        const p3 = endCliff;

        // Sample Bezier and compute curvature along path
        const samples = 100;
        let maxCurv = 0;
        const curvePoints: { x: number; y: number; k: number }[] = [];

        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          const omt = 1 - t;

          const x = omt * omt * omt * p0.x + 3 * omt * omt * t * p1.x + 3 * omt * t * t * p2.x + t * t * t * p3.x;
          const y = omt * omt * omt * p0.y + 3 * omt * omt * t * p1.y + 3 * omt * t * t * p2.y + t * t * t * p3.y;

          const dx = 3 * omt * omt * (p1.x - p0.x) + 6 * omt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
          const dy = 3 * omt * omt * (p1.y - p0.y) + 6 * omt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);

          const d2x = 6 * omt * (p2.x - 2 * p1.x + p0.x) + 6 * t * (p3.x - 2 * p2.x + p1.x);
          const d2y = 6 * omt * (p2.y - 2 * p1.y + p0.y) + 6 * t * (p3.y - 2 * p2.y + p1.y);

          const num = Math.abs(dx * d2y - dy * d2x);
          const denom = Math.pow(dx * dx + dy * dy, 1.5) || 1e-6;
          const k = num / denom;

          if (k > maxCurv) maxCurv = k;
          curvePoints.push({ x, y, k });
        }

        setL2MaxCurvature(maxCurv);
        const CURVATURE_THRESHOLD = 0.007;

        // Draw Heatmap Track
        for (let i = 0; i < curvePoints.length - 1; i++) {
          const pt1 = curvePoints[i];
          const pt2 = curvePoints[i + 1];

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);

          const kNorm = Math.min(1, pt1.k / CURVATURE_THRESHOLD);
          if (kNorm > 0.85) {
            ctx.strokeStyle = isDark ? '#ef4444' : '#dc2626';
          } else if (kNorm > 0.6) {
            ctx.strokeStyle = isDark ? '#f59e0b' : '#d97706';
          } else {
            ctx.strokeStyle = isDark ? '#00f0ff' : '#0284c7';
          }
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Draw Control Handles
        ctx.strokeStyle = isDark ? 'rgba(255, 0, 127, 0.4)' : 'rgba(225, 29, 72, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Handle P1
        ctx.fillStyle = isDark ? '#ff007f' : '#db2777';
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('Handle 1', p1.x - 22, p1.y - 12);

        // Handle P2
        ctx.fillStyle = isDark ? '#39ff14' : '#16a34a';
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('Handle 2', p2.x - 22, p2.y - 12);

        // Animate Cart Ride
        if (l2IsRiding && !l2Derailed) {
          const nextT = l2CartT + dt * 0.45;
          if (nextT >= 1) {
            setL2IsRiding(false);
            setL2CartT(1);
            triggerVictory();
          } else {
            setL2CartT(nextT);
            const sampleIdx = Math.round(nextT * samples);
            const currK = curvePoints[sampleIdx]?.k || 0;
            if (currK > CURVATURE_THRESHOLD) {
              setL2Derailed(true);
              setL2IsRiding(false);
              MathAudioSynth.getInstance().playCannonBoom();
            } else {
              if (Math.random() < 0.2) {
                MathAudioSynth.getInstance().playCartSwoosh(currK / CURVATURE_THRESHOLD);
              }
            }
          }
        }

        // Draw Cart
        const t = l2CartT;
        const omt = 1 - t;
        const cartX = omt * omt * omt * p0.x + 3 * omt * omt * t * p1.x + 3 * omt * t * t * p2.x + t * t * t * p3.x;
        const cartY = omt * omt * omt * p0.y + 3 * omt * omt * t * p1.y + 3 * omt * t * t * p2.y + t * t * t * p3.y;

        ctx.save();
        ctx.translate(cartX, cartY);
        if (l2Derailed) {
          ctx.rotate(time * 0.02);
          ctx.fillStyle = isDark ? '#ef4444' : '#dc2626';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('💥 CART DERAILED! G-FORCE EXCEEDED', -140, -30);
        }

        ctx.fillStyle = l2Derailed ? (isDark ? '#ef4444' : '#dc2626') : (isDark ? '#ffd700' : '#d97706');
        ctx.fillRect(-12, -14, 24, 14);
        ctx.fillStyle = isDark ? '#1e293b' : '#334155';
        ctx.beginPath();
        ctx.arc(-8, 2, 4, 0, Math.PI * 2);
        ctx.arc(8, 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ==========================================
      // LEVEL 3: MAX AREA PASTURE
      // ==========================================
      else if (currentLevel === 3) {
        const x = l3FenceX;
        const y = 100 - 2 * x;

        // River at top
        ctx.fillStyle = isDark ? 'rgba(0, 240, 255, 0.15)' : 'rgba(2, 132, 199, 0.18)';
        ctx.fillRect(0, 60, width, 50);
        ctx.fillStyle = isDark ? '#00f0ff' : '#0369a1';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('RIVER BANK (Natural Boundary - 0m fence needed)', 40, 92);

        // Pasture Rectangle
        const originX = 140;
        const originY = 110;
        const pxScale = 3.8;
        const rectWidth = y * pxScale;
        const rectHeight = x * pxScale;

        ctx.fillStyle = isDark ? 'rgba(57, 255, 20, 0.15)' : 'rgba(22, 163, 74, 0.18)';
        ctx.fillRect(originX, originY, rectWidth, rectHeight);

        // Fence lines
        ctx.strokeStyle = isDark ? '#39ff14' : '#16a34a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX, originY + rectHeight);
        ctx.lineTo(originX + rectWidth, originY + rectHeight);
        ctx.lineTo(originX + rectWidth, originY);
        ctx.stroke();

        // Dimension labels
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`Width x = ${x.toFixed(1)}m`, originX - 95, originY + rectHeight / 2);
        ctx.fillText(`Length y = (100 - 2x) = ${y.toFixed(1)}m`, originX + rectWidth / 2 - 90, originY + rectHeight + 24);

        // Draggable resizing corner
        ctx.fillStyle = isDark ? '#ffd700' : '#d97706';
        ctx.beginPath();
        ctx.arc(originX + rectWidth, originY + rectHeight, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cute grazing sheep
        if (Math.abs(x - 25) < 0.8) {
          triggerVictory();
          for (let s = 0; s < 4; s++) {
            const sx = originX + 30 + s * (rectWidth / 4.8);
            const sy = originY + rectHeight * 0.45;
            ctx.fillStyle = isDark ? '#ffffff' : '#f1f5f9';
            ctx.beginPath();
            ctx.arc(sx, sy, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = isDark ? '#1e293b' : '#334155';
            ctx.beginPath();
            ctx.arc(sx + 8, sy - 3, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ==========================================
      // LEVEL 4: PARABOLIC CANNON
      // ==========================================
      else if (currentLevel === 4) {
        const cannon = { x: 80, y: 380 };
        const g = 9.81;
        const rad = (l4Angle * Math.PI) / 180;
        const v0 = l4Velocity;

        // Draw Ground
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cannon.y);
        ctx.lineTo(width, cannon.y);
        ctx.stroke();

        // Hoops targets
        const hoops = [
          { id: 1, x: 300, y: 220, r: 24 },
          { id: 2, x: 540, y: 300, r: 24 },
        ];

        hoops.forEach((hoop) => {
          const isPassed = l4HoopsPassed.includes(hoop.id);
          const hoopColor = isPassed
            ? (isDark ? '#39ff14' : '#16a34a')
            : (isDark ? '#ffd700' : '#d97706');
          ctx.strokeStyle = hoopColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(hoop.x, hoop.y, hoop.r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = isPassed
            ? (isDark ? 'rgba(57, 255, 20, 0.3)' : 'rgba(22, 163, 74, 0.25)')
            : (isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(217, 119, 6, 0.15)');
          ctx.fill();

          ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`HOOP ${hoop.id}`, hoop.x - 20, hoop.y - hoop.r - 8);
        });

        // Predictive Trajectory Guide
        ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.35)' : 'rgba(2, 132, 199, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cannon.x, cannon.y);
        for (let px = 0; px < width - cannon.x; px += 8) {
          const meterX = px / 6;
          const meterY = meterX * Math.tan(rad) - (g * meterX * meterX) / (2 * v0 * v0 * Math.cos(rad) * Math.cos(rad));
          const screenY = cannon.y - meterY * 6;
          if (screenY > cannon.y) break;
          ctx.lineTo(cannon.x + px, screenY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Animate Flying Cannonball
        if (l4IsFiring && l4BallPos) {
          const speed = dt * 140;
          const nextDistX = (l4BallPos.x - cannon.x) / 6 + speed / 6;
          const meterX = nextDistX;
          const meterY = meterX * Math.tan(rad) - (g * meterX * meterX) / (2 * v0 * v0 * Math.cos(rad) * Math.cos(rad));
          const nextX = cannon.x + meterX * 6;
          const nextY = cannon.y - meterY * 6;

          if (nextY >= cannon.y || nextX >= width) {
            setL4IsFiring(false);
            setL4BallPos(null);
          } else {
            setL4BallPos({ x: nextX, y: nextY });

            hoops.forEach((hoop) => {
              if (!l4HoopsPassed.includes(hoop.id)) {
                if (Math.hypot(nextX - hoop.x, nextY - hoop.y) < hoop.r) {
                  setL4HoopsPassed((prev) => {
                    const updated = [...prev, hoop.id];
                    MathAudioSynth.getInstance().playHoopChime(hoop.id);
                    if (updated.length === hoops.length) {
                      triggerVictory();
                    }
                    return updated;
                  });
                }
              }
            });
          }

          // Draw Cannonball
          ctx.fillStyle = isDark ? '#ff007f' : '#db2777';
          ctx.beginPath();
          ctx.arc(nextX, nextY, 7, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Cannon Barrel
        ctx.save();
        ctx.translate(cannon.x, cannon.y);
        ctx.rotate(-rad);
        ctx.fillStyle = isDark ? '#00f0ff' : '#0284c7';
        ctx.fillRect(0, -6, 36, 12);
        ctx.restore();

        // Cannon Base
        ctx.fillStyle = isDark ? '#475569' : '#64748b';
        ctx.beginPath();
        ctx.arc(cannon.x, cannon.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // ==========================================
      // LEVEL 5: CIRCUMCENTER RESCUE
      // ==========================================
      else if (currentLevel === 5) {
        const [S1, S2, S3] = l5Ships;

        // Draw Triangle between ships
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(S1.x, S1.y);
        ctx.lineTo(S2.x, S2.y);
        ctx.lineTo(S3.x, S3.y);
        ctx.closePath();
        ctx.stroke();

        // Ships
        l5Ships.forEach((s) => {
          ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`🚢 ${s.name}`, s.x - 30, s.y - 14);
        });

        // Distances from beacon to each ship
        const d1 = Math.hypot(l5Beacon.x - S1.x, l5Beacon.y - S1.y);
        const d2 = Math.hypot(l5Beacon.x - S2.x, l5Beacon.y - S2.y);
        const d3 = Math.hypot(l5Beacon.x - S3.x, l5Beacon.y - S3.y);

        // Circumcenter calculation
        const d = 2 * (S1.x * (S2.y - S3.y) + S2.x * (S3.y - S1.y) + S3.x * (S1.y - S2.y));
        const a2 = S1.x * S1.x + S1.y * S1.y;
        const b2 = S2.x * S2.x + S2.y * S2.y;
        const c2 = S3.x * S3.x + S3.y * S3.y;
        const trueUx = (a2 * (S2.y - S3.y) + b2 * (S3.y - S1.y) + c2 * (S1.y - S2.y)) / d;
        const trueUy = (a2 * (S3.x - S2.x) + b2 * (S1.x - S3.x) + c2 * (S2.x - S1.x)) / d;

        const errorDist = Math.hypot(l5Beacon.x - trueUx, l5Beacon.y - trueUy);

        // Bisector guides
        if (l5ShowBisectors) {
          ctx.strokeStyle = isDark ? 'rgba(57, 255, 20, 0.4)' : 'rgba(22, 163, 74, 0.5)';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.5;

          const m12 = { x: (S1.x + S2.x) / 2, y: (S1.y + S2.y) / 2 };
          const dx12 = S2.x - S1.x;
          const dy12 = S2.y - S1.y;
          ctx.beginPath();
          ctx.moveTo(m12.x - dy12 * 2, m12.y + dx12 * 2);
          ctx.lineTo(m12.x + dy12 * 2, m12.y - dx12 * 2);
          ctx.stroke();

          const m23 = { x: (S2.x + S3.x) / 2, y: (S2.y + S3.y) / 2 };
          const dx23 = S3.x - S2.x;
          const dy23 = S3.y - S2.y;
          ctx.beginPath();
          ctx.moveTo(m23.x - dy23 * 2, m23.y + dx23 * 2);
          ctx.lineTo(m23.x + dy23 * 2, m23.y - dx23 * 2);
          ctx.stroke();

          ctx.setLineDash([]);
        }

        // Draw Lighthouse Beacon
        const avgR = (d1 + d2 + d3) / 3;
        ctx.strokeStyle = errorDist < 6
          ? (isDark ? '#39ff14' : '#16a34a')
          : (isDark ? 'rgba(255, 215, 0, 0.5)' : 'rgba(217, 119, 6, 0.5)');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(l5Beacon.x, l5Beacon.y, avgR, 0, Math.PI * 2);
        ctx.stroke();

        // Lighthouse Rotating Spotlight
        ctx.save();
        ctx.translate(l5Beacon.x, l5Beacon.y);
        ctx.rotate(time * 0.003);
        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, avgR);
        if (isDark) {
          grad.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
          grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        } else {
          grad.addColorStop(0, 'rgba(217, 119, 6, 0.6)');
          grad.addColorStop(1, 'rgba(217, 119, 6, 0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, avgR, -0.3, 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Beacon Center Handle
        ctx.fillStyle = errorDist < 6
          ? (isDark ? '#39ff14' : '#16a34a')
          : (isDark ? '#ffd700' : '#d97706');
        ctx.beginPath();
        ctx.arc(l5Beacon.x, l5Beacon.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('LIGHTHOUSE BEACON (Drag me)', l5Beacon.x - 70, l5Beacon.y - 18);

        // Win check
        if (errorDist < 6) {
          triggerVictory();
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    currentLevel,
    l1Mirrors,
    l1Target,
    l1Emitter,
    l2P1,
    l2P2,
    l2IsRiding,
    l2CartT,
    l2Derailed,
    l3FenceX,
    l4Angle,
    l4Velocity,
    l4IsFiring,
    l4BallPos,
    l4HoopsPassed,
    l5Beacon,
    l5ShowBisectors,
    isVictory,
    isDark,
  ]);

  // Mouse interaction for dragging puzzle elements
  const handleMouseDown = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentLevel === 1) {
      for (let i = 0; i < l1Mirrors.length; i++) {
        const m = l1Mirrors[i];
        if (Math.hypot(m.x - x, m.y - y) < 26) {
          setDraggingItem({ type: 'mirror-pos', index: i });
          MathAudioSynth.getInstance().playTactileSnap(1000);
          return;
        }
        const rotX = m.x + Math.cos(m.angle) * (m.len / 2);
        const rotY = m.y + Math.sin(m.angle) * (m.len / 2);
        if (Math.hypot(rotX - x, rotY - y) < 26) {
          setDraggingItem({ type: 'mirror-rot', index: i });
          MathAudioSynth.getInstance().playTactileSnap(1400);
          return;
        }
      }
    } else if (currentLevel === 2) {
      if (Math.hypot(l2P1.x - x, l2P1.y - y) < 28) {
        setDraggingItem({ type: 'bezier-p1' });
        MathAudioSynth.getInstance().playTactileSnap(1000);
      } else if (Math.hypot(l2P2.x - x, l2P2.y - y) < 28) {
        setDraggingItem({ type: 'bezier-p2' });
        MathAudioSynth.getInstance().playTactileSnap(1200);
      }
    } else if (currentLevel === 3) {
      const originX = 140;
      const originY = 110;
      const pxScale = 3.8;
      const cornerX = originX + (100 - 2 * l3FenceX) * pxScale;
      const cornerY = originY + l3FenceX * pxScale;
      if (Math.hypot(cornerX - x, cornerY - y) < 28) {
        setDraggingItem({ type: 'pasture-x' });
        MathAudioSynth.getInstance().playTactileSnap(1100);
      }
    } else if (currentLevel === 5) {
      if (Math.hypot(l5Beacon.x - x, l5Beacon.y - y) < 30) {
        setDraggingItem({ type: 'beacon' });
        MathAudioSynth.getInstance().playTactileSnap(1200);
      }
    }
  };

  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!draggingItem) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(30, Math.min(canvas.clientWidth - 30, e.clientX - rect.left));
    const y = Math.max(30, Math.min(canvas.clientHeight - 30, e.clientY - rect.top));

    if (draggingItem.type === 'mirror-pos' && draggingItem.index !== undefined) {
      setL1Mirrors((prev) => {
        const next = [...prev];
        next[draggingItem.index!] = { ...next[draggingItem.index!], x, y };
        return next;
      });
    } else if (draggingItem.type === 'mirror-rot' && draggingItem.index !== undefined) {
      const m = l1Mirrors[draggingItem.index!];
      const angle = Math.atan2(y - m.y, x - m.x);
      setL1Mirrors((prev) => {
        const next = [...prev];
        next[draggingItem.index!] = { ...next[draggingItem.index!], angle };
        return next;
      });
    } else if (draggingItem.type === 'bezier-p1') {
      setL2P1({ x, y });
    } else if (draggingItem.type === 'bezier-p2') {
      setL2P2({ x, y });
    } else if (draggingItem.type === 'pasture-x') {
      const pxScale = 3.8;
      const newX = Math.max(5, Math.min(45, (y - 110) / pxScale));
      setL3FenceX(newX);
    } else if (draggingItem.type === 'beacon') {
      setL5Beacon({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (draggingItem) {
      setDraggingItem(null);
      MathAudioSynth.getInstance().playTactileSnap(1300);
    }
  };

  const levels = [
    {
      num: 1,
      title: 'Laser Mirror Angle Alignment',
      concept: 'Law of Reflection: θ_in = θ_out',
      desc: 'Drag the mirrors by their center handles and rotate them to bounce the laser into the golden target star!',
      hint: 'The angle of incidence equals the angle of reflection. Use two mirrors to create 90° bends!',
      formula: '\\theta_{\\text{inc}} = \\theta_{\\text{refl}} \\implies \\mathbf{r} = \\mathbf{d} - 2(\\mathbf{d} \\cdot \\mathbf{n})\\mathbf{n}',
    },
    {
      num: 2,
      title: 'Rollercoaster Curvature Limit',
      concept: 'Centrifugal Acceleration & Curvature κ',
      desc: 'Connect the two cliffs using control handles. If curvature κ exceeds 0.0070, extreme G-forces will derail the cart!',
      hint: 'Smooth out sharp kinks by pulling the control handles closer to the cliff baselines.',
      formula: '\\kappa(t) = \\frac{|x\' y\'\' - y\' x\'\'|}{(x\'^2 + y\'^2)^{3/2}} \\le 0.0070',
    },
    {
      num: 3,
      title: 'Max Pasture Area with 100m Fence',
      concept: 'Quadratic Optimization & Calculus Extremum',
      desc: 'Find width x to maximize the pasture area against the river boundary. Total fence available: 2x + y = 100m.',
      hint: 'Area A(x) = x(100 - 2x) = 100x - 2x². Setting the derivative A\'(x) = 100 - 4x = 0 gives optimal x = 25m!',
      formula: 'A(x) = x(100 - 2x), \\quad A\'(x) = 100 - 4x = 0 \\implies x^* = 25\\text{m}',
    },
    {
      num: 4,
      title: 'Kinematic Parabolic Cannon',
      concept: 'Ballistic Projectile Trajectory',
      desc: 'Adjust launch angle θ and initial velocity v₀ to fire a projectile cleanly through both aerial target hoops!',
      hint: 'Higher angle gives height, higher velocity gives horizontal distance. Try θ ≈ 54° and v₀ ≈ 76 m/s.',
      formula: 'y(x) = x\\tan\\theta - \\frac{g x^2}{2 v_0^2 \\cos^2\\theta}',
    },
    {
      num: 5,
      title: 'Circumcenter Rescue Mission',
      concept: 'Triangle Circumcenter & Bisectors',
      desc: 'Place the rescue lighthouse beacon at the exact circumcenter so it is equidistant from all 3 stranded ships!',
      hint: 'The circumcenter lies at the intersection of the perpendicular bisectors of the 3 sides. Toggle the bisector guides for help!',
      formula: 'R = d(C, S_1) = d(C, S_2) = d(C, S_3) = \\frac{abc}{4\\text{Area}}',
    },
  ];

  const currentLevelData = levels[currentLevel - 1];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#080c16] text-slate-800 dark:text-slate-100 p-4 gap-4 overflow-y-auto transition-colors duration-200">
      {/* Top Level Progression Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/20 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-700 dark:text-yellow-400 uppercase tracking-widest px-3 py-1 bg-amber-100 dark:bg-yellow-500/10 border border-amber-300 dark:border-yellow-500/30 rounded-full">
            <Trophy size={14} /> LEVEL {currentLevel} of 5
          </div>
          <h2 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">{currentLevelData.title}</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-mono border border-slate-200 dark:border-transparent">
            {currentLevelData.concept}
          </span>
        </div>

        {/* Level Switcher Buttons */}
        <div className="flex items-center gap-2">
          {levels.map((lvl) => {
            const isDone = completedLevels.includes(lvl.num);
            const isCur = currentLevel === lvl.num;
            return (
              <button
                key={lvl.num}
                onClick={() => {
                  setCurrentLevel(lvl.num);
                  setIsVictory(false);
                  setShowHint(false);
                  MathAudioSynth.getInstance().playTactileSnap(1000 + lvl.num * 100);
                }}
                className={`w-9 h-9 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all ${
                  isCur
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                    : isDone
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isDone ? <CheckCircle size={14} /> : lvl.num}
              </button>
            );
          })}
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
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handleMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length > 0) {
                handleMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
              }
            }}
            onTouchEnd={handleMouseUp}
            onTouchCancel={handleMouseUp}
            style={{ touchAction: 'none' }}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Victory Overlay Modal */}
          {isVictory && (
            <div className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-20">
              <div className="bg-white dark:bg-slate-900 border border-cyan-400 dark:border-cyan-500/40 p-6 rounded-2xl max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shadow-md shadow-cyan-500/30">
                  <Trophy size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">LEVEL SOLVED!</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Brilliant mathematical intuition! You mastered <span className="text-cyan-700 dark:text-cyan-400 font-bold">{currentLevelData.title}</span>.
                </p>

                <div className="flex items-center gap-3 w-full mt-2">
                  <button
                    onClick={handleResetLevel}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                  >
                    Replay Level
                  </button>
                  {currentLevel < 5 && (
                    <button
                      onClick={handleNextLevel}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      Next Level <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Control Overlays based on Level */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/85 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-lg flex flex-wrap items-center justify-between gap-4">
            {currentLevel === 2 && (
              <div className="flex items-center gap-4 w-full justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Curvature:</span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      l2MaxCurvature > 0.007 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    κ = {l2MaxCurvature.toFixed(4)} (Threshold: 0.0070)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setL2CartT(0);
                    setL2Derailed(false);
                    setL2IsRiding(true);
                    MathAudioSynth.getInstance().playTactileSnap();
                  }}
                  disabled={l2IsRiding}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 text-white dark:text-slate-950 font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {l2IsRiding ? 'Cart In Motion...' : 'Test Ride Rollercoaster!'}
                </button>
              </div>
            )}

            {currentLevel === 4 && (
              <div className="flex flex-wrap items-center gap-4 w-full justify-between">
                <label className="flex items-center gap-2 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">Angle θ:</span>
                  <input
                    type="range"
                    min={15}
                    max={85}
                    step={1}
                    value={l4Angle}
                    onChange={(e) => setL4Angle(parseInt(e.target.value))}
                    className="accent-cyan-600 dark:accent-cyan-400 cursor-pointer w-24 bg-slate-200 dark:bg-slate-700 rounded"
                  />
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">{l4Angle}°</span>
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">Velocity v₀:</span>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={1}
                    value={l4Velocity}
                    onChange={(e) => setL4Velocity(parseInt(e.target.value))}
                    className="accent-pink-600 dark:accent-pink-400 cursor-pointer w-24 bg-slate-200 dark:bg-slate-700 rounded"
                  />
                  <span className="font-mono text-pink-700 dark:text-pink-400 font-bold">{l4Velocity} m/s</span>
                </label>

                <button
                  onClick={() => {
                    setL4HoopsPassed([]);
                    setL4BallPos({ x: 80, y: 380 });
                    setL4IsFiring(true);
                    MathAudioSynth.getInstance().playCannonBoom();
                  }}
                  disabled={l4IsFiring}
                  className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-500 dark:to-rose-600 text-white dark:text-slate-950 font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {l4IsFiring ? 'Firing...' : 'Fire Cannon!'}
                </button>
              </div>
            )}

            {currentLevel === 5 && (
              <div className="flex items-center justify-between w-full">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={l5ShowBisectors}
                    onChange={(e) => setL5ShowBisectors(e.target.checked)}
                    className="accent-cyan-600 dark:accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Show Perpendicular Bisector Guides</span>
                </label>
                <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400">Drag lighthouse until spotlight locks onto all ships</span>
              </div>
            )}

            {currentLevel === 1 && (
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                Click & drag pink handle to move mirror, green handle to rotate.
              </div>
            )}

            {currentLevel === 3 && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Current Area: <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{(l3FenceX * (100 - 2 * l3FenceX)).toFixed(1)} m²</span> / Max Target: 1250 m²
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Drag bottom-right corner of pasture</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Info Column */}
        <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap size={14} className="text-amber-600 dark:text-yellow-400" /> Challenge Objective
            </span>
            <button
              onClick={handleResetLevel}
              className="p-1 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 transition-colors"
              title="Reset Level"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{currentLevelData.desc}</p>

          {/* Mathematical Formula */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-slate-800 dark:text-cyan-300 text-xs shadow-xs">
            <div
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(currentLevelData.formula, {
                  displayMode: true,
                  throwOnError: false,
                }),
              }}
            />
          </div>

          {/* Hint Accordion */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShowHint(!showHint);
                MathAudioSynth.getInstance().playTactileSnap();
              }}
              className="flex items-center justify-between p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700/60 transition-all shadow-xs"
            >
              <span className="flex items-center gap-2">
                <HelpCircle size={14} className="text-amber-600 dark:text-amber-400" />
                {showHint ? 'Hide Mathematical Hint' : 'Need a Mathematical Hint?'}
              </span>
              <ChevronRight size={14} className={`transform transition-transform ${showHint ? 'rotate-90' : ''}`} />
            </button>

            {showHint && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-lg text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed animate-in fade-in duration-200 shadow-xs">
                {currentLevelData.hint}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-auto p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shadow-xs">
            <span className="text-xs text-slate-600 dark:text-slate-400">Level Status:</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                completedLevels.includes(currentLevel)
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-amber-100 dark:bg-yellow-500/10 text-amber-800 dark:text-yellow-400 border border-amber-300 dark:border-yellow-500/30'
              }`}
            >
              {completedLevels.includes(currentLevel) ? 'SOLVED ✓' : 'IN PROGRESS'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
