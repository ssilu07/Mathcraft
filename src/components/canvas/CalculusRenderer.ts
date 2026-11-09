// src/components/canvas/CalculusRenderer.ts

import { MathParser, MathFunctionType } from '../../engines/MathParser';
import { ThemeMode } from '../../types/math';

export class CalculusRenderer {
  public static renderTangentRoller(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    curveType: MathFunctionType,
    rollerX: number,
    time: number,
    theme: ThemeMode = 'dark'
  ) {
    const isDark = theme === 'dark';
    const origin = { x: width * 0.5, y: height * 0.55 };
    const scaleX = 40; // 40 pixels per 1 math unit
    const scaleY = 40;

    const preset = MathParser.PRESETS[curveType] || MathParser.PRESETS.parabola;
    const f = preset.fn;

    // Draw Coordinate Axes
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, height);
    ctx.stroke();

    // Axis numbers
    ctx.fillStyle = isDark ? '#64748b' : '#475569';
    ctx.font = '10px monospace';
    for (let u = -10; u <= 10; u += 2) {
      if (u === 0) continue;
      const sx = origin.x + u * scaleX;
      ctx.fillText(`${u}`, sx - 4, origin.y + 14);
      const sy = origin.y - u * scaleY;
      ctx.fillText(`${u}`, origin.x + 6, sy + 4);
    }

    // Draw Curve f(x)
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 3;
    if (isDark) {
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 6;
    }
    ctx.beginPath();

    for (let px = 0; px <= width; px += 3) {
      const mathX = (px - origin.x) / scaleX;
      const mathY = f(mathX);
      const py = origin.y - mathY * scaleY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Evaluate Roller Position & Derivative
    const currMathY = f(rollerX);
    const slope = MathParser.derivative(f, rollerX);
    const angleRad = Math.atan(slope);

    const screenX = origin.x + rollerX * scaleX;
    const screenY = origin.y - currMathY * scaleY;

    // Color code slope
    let slopeColor = isDark ? '#39ff14' : '#16a34a'; // Green Uphill
    if (Math.abs(slope) < 0.08) {
      slopeColor = isDark ? '#ffd700' : '#b45309'; // Extrema Gold
    } else if (slope < 0) {
      slopeColor = isDark ? '#ff007f' : '#dc2626'; // Downhill Red
    }

    // Draw Tangent Line
    const tangentLen = 140;
    const tanDx = Math.cos(angleRad) * tangentLen;
    const tanDy = -Math.sin(angleRad) * tangentLen;

    ctx.strokeStyle = slopeColor;
    ctx.lineWidth = 3;
    if (isDark) {
      ctx.shadowColor = slopeColor;
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.moveTo(screenX - tanDx, screenY - tanDy);
    ctx.lineTo(screenX + tanDx, screenY + tanDy);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Normal Line
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    const normDx = -Math.sin(angleRad) * 60;
    const normDy = -Math.cos(angleRad) * 60;
    ctx.beginPath();
    ctx.moveTo(screenX - normDx, screenY - normDy);
    ctx.lineTo(screenX + normDx, screenY + normDy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Skateboarder / Roller Car
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(-angleRad); // rotate to match tangent

    // Wheels
    ctx.fillStyle = isDark ? '#00f0ff' : '#0284c7';
    ctx.beginPath();
    ctx.arc(-14, -6, 5, 0, Math.PI * 2);
    ctx.arc(14, -6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Skateboard Deck
    ctx.fillStyle = slopeColor;
    ctx.beginPath();
    ctx.roundRect(-22, -14, 44, 7, [3]);
    ctx.fill();

    // Skater figure - high contrast stroke in both modes
    ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Torso
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -32);
    // Head
    ctx.moveTo(0, -32);
    ctx.arc(0, -38, 6, 0, Math.PI * 2);
    // Arms balancing
    ctx.moveTo(-12, -26);
    ctx.lineTo(12, -26);
    ctx.stroke();

    ctx.restore();

    // Display HUD badge
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(20, 20, 280, 110, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`FUNCTION: ${preset.name}`, 35, 42);

    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = '11px monospace';
    ctx.fillText(`Roller Position x = ${rollerX.toFixed(2)}`, 35, 64);
    ctx.fillText(`Function Value f(x) = ${currMathY.toFixed(2)}`, 35, 84);

    ctx.fillStyle = slopeColor;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Tangent Slope f'(x) = ${slope.toFixed(3)}`, 35, 108);
  }

  public static renderRiemannLiquid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    curveType: MathFunctionType,
    bounds: [number, number],
    n: number,
    type: 'left' | 'right' | 'midpoint' | 'trapezoid',
    time: number,
    theme: ThemeMode = 'dark'
  ) {
    const isDark = theme === 'dark';
    const origin = { x: width * 0.5, y: height * 0.6 };
    const scaleX = 45;
    const scaleY = 45;

    const preset = MathParser.PRESETS[curveType] || MathParser.PRESETS.parabola;
    const f = preset.fn;

    // Draw Axes
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, height);
    ctx.stroke();

    const { rectangles, sum, exact, error } = MathParser.calculateRiemann(f, bounds[0], bounds[1], n, type);

    // Draw Liquid Riemann Rectangles with animated wave shimmer
    rectangles.forEach((rect, idx) => {
      const rx = origin.x + rect.x * scaleX;
      const rw = rect.width * scaleX;
      const rh = rect.height * scaleY;
      const ry = origin.y - rh;

      // Liquid gradient
      const grad = ctx.createLinearGradient(rx, origin.y, rx, ry);
      if (isDark) {
        grad.addColorStop(0, 'rgba(57, 255, 20, 0.15)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0.45)');
      } else {
        grad.addColorStop(0, 'rgba(22, 163, 74, 0.2)');
        grad.addColorStop(1, 'rgba(2, 132, 199, 0.35)');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(rx, ry, rw, rh);

      // Top wave shimmer
      const shimmer = Math.sin(time * 0.005 + idx * 0.4) * 2;
      ctx.strokeStyle = isDark ? '#00f0ff' : '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx, ry + shimmer);
      ctx.lineTo(rx + rw, ry + shimmer);
      ctx.stroke();

      // Rectangle border
      ctx.strokeStyle = isDark ? 'rgba(57, 255, 20, 0.3)' : 'rgba(22, 163, 74, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);
    });

    // Draw Actual Function Curve f(x)
    ctx.strokeStyle = isDark ? '#ff007f' : '#db2777';
    ctx.lineWidth = 3;
    if (isDark) {
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();

    for (let px = 0; px <= width; px += 3) {
      const mathX = (px - origin.x) / scaleX;
      const mathY = f(mathX);
      const py = origin.y - mathY * scaleY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Integral comparison HUD Box (Top Left)
    const hudW = 320;
    const hudH = 130;
    const hudX = 20;
    const hudY = 20;

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#39ff14' : '#16a34a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`LIQUID RIEMANN SUM (${type.toUpperCase()})`, hudX + 16, hudY + 24);

    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = '11px monospace';
    ctx.fillText(`Partitions n = ${n} rectangles [a=${bounds[0]}, b=${bounds[1]}]`, hudX + 16, hudY + 46);

    ctx.fillStyle = isDark ? '#00f0ff' : '#0284c7';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Riemann Estimate Σ = ${sum.toFixed(4)}`, hudX + 16, hudY + 72);

    ctx.fillStyle = isDark ? '#ffd700' : '#b45309';
    ctx.fillText(`Exact Integral ∫ = ${exact.toFixed(4)}`, hudX + 16, hudY + 94);

    const errorPct = exact !== 0 ? (error / Math.abs(exact)) * 100 : 0;
    ctx.fillStyle = errorPct < 2 ? (isDark ? '#39ff14' : '#16a34a') : (isDark ? '#f59e0b' : '#d97706');
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Error = ${error.toFixed(4)} (${errorPct.toFixed(2)}%)`, hudX + 16, hudY + 116);
  }
}
