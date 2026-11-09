// src/components/canvas/GeometryRenderer.ts

import {
  Point2D,
  Segment2D,
  Line2D,
  Circle2D,
  Polygon2D,
  GridType,
  CanvasTransform,
  ThemeMode,
} from '../../types/math';
import { GeometryEngine } from '../../engines/GeometryEngine';

export class GeometryRenderer {
  // Convert World (math) coordinate to Screen (canvas pixel) coordinate
  public static worldToScreen(
    wx: number,
    wy: number,
    transform: CanvasTransform
  ): { x: number; y: number } {
    return {
      x: transform.width / 2 + transform.panX + wx * transform.zoom,
      y: transform.height / 2 + transform.panY - wy * transform.zoom, // Y inverted in screen coords
    };
  }

  // Convert Screen coordinate to World coordinate
  public static screenToWorld(
    sx: number,
    sy: number,
    transform: CanvasTransform
  ): { x: number; y: number } {
    return {
      x: (sx - transform.width / 2 - transform.panX) / transform.zoom,
      y: -(sy - transform.height / 2 - transform.panY) / transform.zoom,
    };
  }

  // Draw Grid Background
  public static renderGrid(
    ctx: CanvasRenderingContext2D,
    transform: CanvasTransform,
    gridType: GridType,
    theme: ThemeMode = 'dark'
  ) {
    const { width, height, zoom } = transform;
    const isDark = theme === 'dark';

    if (gridType === 'none') return;

    const origin = this.worldToScreen(0, 0, transform);

    if (gridType === 'cartesian') {
      const step = zoom >= 60 ? 1 : zoom >= 20 ? 2 : 5;
      const pixelStep = step * zoom;

      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.07)';

      const startX = (origin.x % pixelStep) - pixelStep;
      for (let x = startX; x < width + pixelStep; x += pixelStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const startY = (origin.y % pixelStep) - pixelStep;
      for (let y = startY; y < height + pixelStep; y += pixelStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Main Axes
      ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.35)' : 'rgba(2, 132, 199, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // X Axis
      ctx.moveTo(0, origin.y);
      ctx.lineTo(width, origin.y);
      // Y Axis
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, height);
      ctx.stroke();

      // Axis unit ticks and numbers
      ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
      ctx.font = '10px monospace';
      const labelMinX = Math.floor((-origin.x) / (step * zoom)) * step;
      const labelMaxX = Math.ceil((width - origin.x) / (step * zoom)) * step;

      for (let wx = labelMinX; wx <= labelMaxX; wx += step) {
        if (wx === 0) continue;
        const s = this.worldToScreen(wx, 0, transform);
        ctx.fillText(`${wx}`, s.x - 4, origin.y + 14);
      }

      const labelMinY = Math.floor((origin.y - height) / (step * zoom)) * step;
      const labelMaxY = Math.ceil(origin.y / (step * zoom)) * step;
      for (let wy = labelMinY; wy <= labelMaxY; wy += step) {
        if (wy === 0) continue;
        const s = this.worldToScreen(0, wy, transform);
        ctx.fillText(`${wy}`, origin.x + 6, s.y + 4);
      }
    } else if (gridType === 'polar') {
      // Concentric circles
      const maxR = Math.hypot(width, height) / zoom;
      const rStep = 2;

      ctx.strokeStyle = isDark ? 'rgba(255, 0, 127, 0.08)' : 'rgba(225, 29, 72, 0.12)';
      ctx.lineWidth = 1;

      for (let r = rStep; r <= maxR; r += rStep) {
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, r * zoom, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radial rays every 30 degrees (pi/6)
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(origin.x + Math.cos(a) * 1500, origin.y - Math.sin(a) * 1500);
        ctx.stroke();
      }
    } else if (gridType === 'isometric') {
      const isoStep = 30;
      ctx.strokeStyle = isDark ? 'rgba(57, 255, 20, 0.06)' : 'rgba(16, 185, 129, 0.14)';
      ctx.lineWidth = 1;

      const angle = Math.PI / 6; // 30 degrees
      for (let i = -width; i < width * 2; i += isoStep) {
        // Line at +30 deg
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + Math.tan(angle) * height, height);
        ctx.stroke();

        // Line at -30 deg
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i - Math.tan(angle) * height, height);
        ctx.stroke();
      }
    }
  }

  // Draw Polygons
  public static renderPolygons(
    ctx: CanvasRenderingContext2D,
    polygons: Polygon2D[],
    pointsMap: Map<string, Point2D>,
    transform: CanvasTransform,
    selectedId: string | null,
    theme: ThemeMode = 'dark'
  ) {
    const isDark = theme === 'dark';

    for (const poly of polygons) {
      const pts = poly.pointIds.map((id) => pointsMap.get(id)).filter(Boolean) as Point2D[];
      if (pts.length < 3) continue;

      const isSelected = selectedId === poly.id;
      const screenPts = pts.map((p) => this.worldToScreen(p.x, p.y, transform));

      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i].x, screenPts[i].y);
      }
      ctx.closePath();

      const defaultFill = isDark
        ? isSelected ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 240, 255, 0.08)'
        : isSelected ? 'rgba(2, 132, 199, 0.22)' : 'rgba(2, 132, 199, 0.1)';

      ctx.fillStyle = poly.fillColor || defaultFill;
      ctx.fill();

      const defaultStroke = isDark
        ? isSelected ? '#00f0ff' : poly.color || '#38bdf8'
        : isSelected ? '#0284c7' : (poly.color === '#38bdf8' ? '#0284c7' : poly.color || '#0284c7');

      ctx.strokeStyle = defaultStroke;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Metrics badge
      const metrics = GeometryEngine.polygonMetrics(pts);
      const centroid = {
        x: screenPts.reduce((acc, p) => acc + p.x, 0) / screenPts.length,
        y: screenPts.reduce((acc, p) => acc + p.y, 0) / screenPts.length,
      };

      // Draw subtle background pill behind text so it never blends into geometry lines
      const badgeW = 96;
      const badgeH = 34;
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(8, 12, 22, 0.75)' : 'rgba(255, 255, 255, 0.85)';
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(centroid.x - badgeW / 2, centroid.y - badgeH / 2, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Area: ${metrics.area.toFixed(2)}`, centroid.x, centroid.y - 4);
      ctx.fillText(`Perimeter: ${metrics.perimeter.toFixed(2)}`, centroid.x, centroid.y + 11);
      ctx.restore();
    }
  }

  // Draw Segments and Lines
  public static renderLinesAndSegments(
    ctx: CanvasRenderingContext2D,
    segments: Segment2D[],
    lines: Line2D[],
    pointsMap: Map<string, Point2D>,
    transform: CanvasTransform,
    selectedId: string | null,
    theme: ThemeMode = 'dark'
  ) {
    const isDark = theme === 'dark';

    // Segments
    for (const seg of segments) {
      const p1 = pointsMap.get(seg.p1Id);
      const p2 = pointsMap.get(seg.p2Id);
      if (!p1 || !p2) continue;

      const isSelected = selectedId === seg.id;
      const sp1 = this.worldToScreen(p1.x, p1.y, transform);
      const sp2 = this.worldToScreen(p2.x, p2.y, transform);

      const defaultSegColor = isDark
        ? isSelected ? '#00f0ff' : seg.color || '#38bdf8'
        : isSelected ? '#0284c7' : (seg.color === '#38bdf8' ? '#0284c7' : seg.color || '#0284c7');

      ctx.strokeStyle = defaultSegColor;
      ctx.lineWidth = isSelected ? 3.5 : 2;
      ctx.beginPath();
      ctx.moveTo(sp1.x, sp1.y);
      ctx.lineTo(sp2.x, sp2.y);
      ctx.stroke();

      // Live length label
      const len = GeometryEngine.distance(p1, p2);
      const midX = (sp1.x + sp2.x) / 2;
      const midY = (sp1.y + sp2.y) / 2;

      ctx.fillStyle = isDark ? '#94a3b8' : '#334155';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`d=${len.toFixed(2)}`, midX, midY - 6);
    }

    // Infinite Lines
    for (const line of lines) {
      const p1 = pointsMap.get(line.p1Id);
      const p2 = pointsMap.get(line.p2Id);
      if (!p1 || !p2) continue;

      const isSelected = selectedId === line.id;
      const sp1 = this.worldToScreen(p1.x, p1.y, transform);
      const sp2 = this.worldToScreen(p2.x, p2.y, transform);

      const dx = sp2.x - sp1.x;
      const dy = sp2.y - sp1.y;
      const len = Math.hypot(dx, dy) || 1;

      // Extend to infinity across screen
      const ext = 2000;
      const startX = sp1.x - (dx / len) * ext;
      const startY = sp1.y - (dy / len) * ext;
      const endX = sp1.x + (dx / len) * ext;
      const endY = sp1.y + (dy / len) * ext;

      const defaultLineColor = isDark
        ? isSelected ? '#ff007f' : line.color || '#f43f5e'
        : isSelected ? '#e11d48' : (line.color === '#ff007f' ? '#e11d48' : line.color || '#e11d48');

      ctx.strokeStyle = defaultLineColor;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.setLineDash(line.constraint ? [5, 4] : []);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw Circles
  public static renderCircles(
    ctx: CanvasRenderingContext2D,
    circles: Circle2D[],
    pointsMap: Map<string, Point2D>,
    transform: CanvasTransform,
    selectedId: string | null,
    theme: ThemeMode = 'dark'
  ) {
    const isDark = theme === 'dark';

    for (const circ of circles) {
      const center = pointsMap.get(circ.centerId);
      if (!center) continue;

      let rMath = circ.radius || 1;
      if (circ.radiusPointId) {
        const rp = pointsMap.get(circ.radiusPointId);
        if (rp) rMath = GeometryEngine.distance(center, rp);
      }

      const sc = this.worldToScreen(center.x, center.y, transform);
      const screenRadius = rMath * transform.zoom;
      const isSelected = selectedId === circ.id;

      ctx.beginPath();
      ctx.arc(sc.x, sc.y, screenRadius, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? isSelected ? 'rgba(57, 255, 20, 0.12)' : 'rgba(57, 255, 20, 0.04)'
        : isSelected ? 'rgba(22, 163, 74, 0.14)' : 'rgba(22, 163, 74, 0.05)';
      ctx.fill();

      const defaultCircColor = isDark
        ? isSelected ? '#39ff14' : circ.color || '#22c55e'
        : isSelected ? '#16a34a' : (circ.color === '#39ff14' ? '#16a34a' : circ.color || '#16a34a');

      ctx.strokeStyle = defaultCircColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Radius line indicator
      ctx.strokeStyle = isDark ? 'rgba(57, 255, 20, 0.4)' : 'rgba(22, 163, 74, 0.45)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sc.x, sc.y);
      ctx.lineTo(sc.x + screenRadius, sc.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isDark ? '#39ff14' : '#15803d';
      ctx.font = '10px monospace';
      ctx.fillText(`r=${rMath.toFixed(2)}`, sc.x + screenRadius / 2, sc.y - 4);
    }
  }

  // Draw Points with Snapping Glow
  public static renderPoints(
    ctx: CanvasRenderingContext2D,
    points: Point2D[],
    transform: CanvasTransform,
    selectedId: string | null,
    hoveredId: string | null,
    theme: ThemeMode = 'dark'
  ) {
    const isDark = theme === 'dark';

    for (const pt of points) {
      const sp = this.worldToScreen(pt.x, pt.y, transform);
      const isSelected = selectedId === pt.id;
      const isHovered = hoveredId === pt.id;
      const radius = pt.radius || 6;

      // Glow on hover or selection
      if (isSelected || isHovered) {
        ctx.fillStyle = isDark
          ? isSelected ? 'rgba(0, 240, 255, 0.35)' : 'rgba(255, 255, 255, 0.2)'
          : isSelected ? 'rgba(2, 132, 199, 0.3)' : 'rgba(15, 23, 42, 0.12)';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, radius + 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Point circle fill
      let pointFill = pt.color;
      if (pt.isIntersection) {
        pointFill = isDark ? '#ffd700' : '#d97706';
      } else if (!pointFill || pointFill === '#00f0ff') {
        pointFill = isDark ? '#00f0ff' : '#0284c7';
      }

      ctx.fillStyle = pointFill;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border around point
      ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Coordinate label - High contrast in both themes!
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${pt.label || ''}(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`, sp.x + 9, sp.y - 8);
    }
  }

  // Draw Snap Indicator Ripple
  public static renderSnapIndicator(
    ctx: CanvasRenderingContext2D,
    snapPos: { x: number; y: number },
    transform: CanvasTransform,
    theme: ThemeMode = 'dark'
  ) {
    const isDark = theme === 'dark';
    const sp = this.worldToScreen(snapPos.x, snapPos.y, transform);
    const snapColor = isDark ? '#39ff14' : '#16a34a';

    ctx.strokeStyle = snapColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = snapColor;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
