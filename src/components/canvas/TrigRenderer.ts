// src/components/canvas/TrigRenderer.ts

import { ThemeMode } from '../../types/math';

export class TrigRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theta: number,
    time: number,
    isPlaying: boolean,
    theme: ThemeMode = 'dark'
  ) {
    const isDark = theme === 'dark';

    // Layout centers
    const circleCenter = { x: width * 0.28, y: height * 0.5 };
    const radius = Math.min(width, height) * 0.22;

    const cosVal = Math.cos(theta);
    const sinVal = Math.sin(theta);
    const tanVal = Math.abs(cosVal) > 1e-4 ? Math.tan(theta) : null;

    // 1. Draw Unit Circle
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Circle coordinate axes
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(circleCenter.x - radius - 20, circleCenter.y);
    ctx.lineTo(circleCenter.x + radius + 20, circleCenter.y);
    ctx.moveTo(circleCenter.x, circleCenter.y - radius - 20);
    ctx.lineTo(circleCenter.x, circleCenter.y + radius + 20);
    ctx.stroke();

    // Vector point P on circle
    const px = circleCenter.x + cosVal * radius;
    const py = circleCenter.y - sinVal * radius; // inverted y in screen coords

    // Angle Arc
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, 35, 0, -theta, true);
    ctx.strokeStyle = isDark ? '#ffd700' : '#b45309';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Angle label θ
    const midTheta = theta / 2;
    ctx.fillStyle = isDark ? '#ffd700' : '#b45309';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('θ', circleCenter.x + Math.cos(midTheta) * 45, circleCenter.y - Math.sin(midTheta) * 45);

    // 2. Cosine Projection Bar (Horizontal)
    ctx.strokeStyle = isDark ? '#ef4444' : '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(circleCenter.x, circleCenter.y);
    ctx.lineTo(px, circleCenter.y);
    ctx.stroke();

    // 3. Sine Projection Bar (Vertical)
    ctx.strokeStyle = isDark ? '#22c55e' : '#16a34a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px, circleCenter.y);
    ctx.lineTo(px, py);
    ctx.stroke();

    // 4. Vector Hypotenuse
    ctx.strokeStyle = isDark ? '#00f0ff' : '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(circleCenter.x, circleCenter.y);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Vector tip point handle
    ctx.fillStyle = isDark ? '#ffffff' : '#0284c7';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#00f0ff' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Tangent Line projection
    if (tanVal !== null && Math.abs(tanVal) < 8) {
      const tanX = circleCenter.x + radius;
      const tanY = circleCenter.y - tanVal * radius;
      ctx.strokeStyle = isDark ? '#ff007f' : '#db2777';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(circleCenter.x, circleCenter.y);
      ctx.lineTo(tanX, tanY);
      ctx.moveTo(tanX, circleCenter.y);
      ctx.lineTo(tanX, tanY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isDark ? '#ff007f' : '#db2777';
      ctx.beginPath();
      ctx.arc(tanX, tanY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Sine Wave Traveling Timeline / Unroller (to the right)
    const waveStartX = circleCenter.x + radius + 70;
    const waveEndX = width - 40;
    const waveLength = waveEndX - waveStartX;

    // Timeline baseline
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(waveStartX, circleCenter.y);
    ctx.lineTo(waveEndX, circleCenter.y);
    ctx.stroke();

    // Connecting laser line from vector tip to wave start
    ctx.strokeStyle = isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(22, 163, 74, 0.45)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(waveStartX, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Continuous Sine Wave
    ctx.strokeStyle = isDark ? '#22c55e' : '#16a34a';
    ctx.lineWidth = 3;
    if (isDark) {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();

    const step = 2;
    for (let wx = 0; wx <= waveLength; wx += step) {
      const phase = theta - (wx / radius) * 1.5;
      const wy = circleCenter.y - Math.sin(phase) * radius;
      if (wx === 0) ctx.moveTo(waveStartX + wx, wy);
      else ctx.lineTo(waveStartX + wx, wy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Cosine Wave in faint red for comparison
    ctx.strokeStyle = isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let wx = 0; wx <= waveLength; wx += step) {
      const phase = theta - (wx / radius) * 1.5;
      const wy = circleCenter.y - Math.cos(phase) * radius;
      if (wx === 0) ctx.moveTo(waveStartX + wx, wy);
      else ctx.lineTo(waveStartX + wx, wy);
    }
    ctx.stroke();

    // 7. Harmonic Overtone Visualizer Bars (Top Right)
    const visualizerX = width - 220;
    const visualizerY = 65;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(visualizerX - 10, visualizerY - 20, 200, 110, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#00f0ff' : '#0284c7';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('AUDIO HARMONICS ENGINE', visualizerX, visualizerY - 5);

    const freqBase = 220 * Math.pow(2, theta / Math.PI);
    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = '10px monospace';
    ctx.fillText(`f₀ = ${freqBase.toFixed(1)} Hz`, visualizerX, visualizerY + 12);

    // 3 harmonic bars: Fundamental (f0), 2nd Harmonic (2f0), 3rd Harmonic (3f0)
    const barHeights = [
      Math.abs(sinVal) * 50 + 10,
      Math.abs(Math.sin(2 * theta)) * 30 + 5,
      Math.abs(Math.sin(3 * theta)) * 20 + 3,
    ];
    const barColors = isDark
      ? ['#00f0ff', '#39ff14', '#ffd700']
      : ['#0284c7', '#16a34a', '#d97706'];

    barHeights.forEach((h, idx) => {
      const bx = visualizerX + idx * 45 + 15;
      const by = visualizerY + 75 - h;
      ctx.fillStyle = barColors[idx];
      ctx.fillRect(bx, by, 24, h);

      ctx.fillStyle = isDark ? '#64748b' : '#475569';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`H${idx + 1}`, bx + 4, visualizerY + 88);
    });

    // Readout Box (Bottom Left)
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(circleCenter.x - radius - 20, circleCenter.y + radius + 30, radius * 2 + 40, 60, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = isDark ? '#ffd700' : '#b45309';
    ctx.fillText(`θ = ${(theta).toFixed(2)} rad (${Math.round((theta * 180) / Math.PI)}°)`, circleCenter.x - radius, circleCenter.y + radius + 50);

    ctx.fillStyle = isDark ? '#ef4444' : '#dc2626';
    ctx.fillText(`cos(θ) = ${cosVal.toFixed(3)}`, circleCenter.x - radius, circleCenter.y + radius + 72);

    ctx.fillStyle = isDark ? '#22c55e' : '#16a34a';
    ctx.fillText(`sin(θ) = ${sinVal.toFixed(3)}`, circleCenter.x + 10, circleCenter.y + radius + 72);

    if (tanVal !== null) {
      ctx.fillStyle = isDark ? '#ff007f' : '#db2777';
      ctx.fillText(`tan(θ) = ${tanVal.toFixed(3)}`, circleCenter.x + radius - 70, circleCenter.y + radius + 50);
    }
  }
}
