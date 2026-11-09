// src/engines/GeometryEngine.ts

import { Point2D, Segment2D, Line2D, Circle2D, Polygon2D } from '../types/math';

export interface IntersectionResult {
  x: number;
  y: number;
  type: 'line-line' | 'line-circle' | 'circle-circle';
}

export class GeometryEngine {
  private static readonly EPSILON = 1e-7;

  // Calculate Euclidean distance between two points
  public static distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  // Calculate midpoint between two points
  public static midpoint(p1: { x: number; y: number }, p2: { x: number; y: number }): { x: number; y: number } {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  // Line equation coefficients Ax + By + C = 0 normalized such that A^2 + B^2 = 1
  public static lineCoefficients(p1: { x: number; y: number }, p2: { x: number; y: number }): {
    A: number;
    B: number;
    C: number;
    slope: number | null;
    intercept: number | null;
    angle: number; // in radians
  } {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);

    if (len < this.EPSILON) {
      return { A: 1, B: 0, C: -p1.x, slope: null, intercept: null, angle: 0 };
    }

    // A = -dy/len, B = dx/len, C = -(A*x1 + B*y1)
    let A = -dy / len;
    let B = dx / len;
    let C = -(A * p1.x + B * p1.y);

    const slope = Math.abs(dx) > this.EPSILON ? dy / dx : null;
    const intercept = slope !== null ? p1.y - slope * p1.x : null;
    const angle = Math.atan2(dy, dx);

    return { A, B, C, slope, intercept, angle };
  }

  // Intersect Line-Line
  public static intersectLineLine(
    l1p1: { x: number; y: number },
    l1p2: { x: number; y: number },
    l2p1: { x: number; y: number },
    l2p2: { x: number; y: number }
  ): { x: number; y: number } | null {
    const { A: a1, B: b1, C: c1 } = this.lineCoefficients(l1p1, l1p2);
    const { A: a2, B: b2, C: c2 } = this.lineCoefficients(l2p1, l2p2);

    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < this.EPSILON) {
      return null; // Parallel or coincident
    }

    const x = (b1 * c2 - b2 * c1) / det;
    const y = (c1 * a2 - c2 * a1) / det;
    return { x, y };
  }

  // Intersect Line and Circle
  public static intersectLineCircle(
    lp1: { x: number; y: number },
    lp2: { x: number; y: number },
    center: { x: number; y: number },
    radius: number
  ): { x: number; y: number }[] {
    const { A, B, C } = this.lineCoefficients(lp1, lp2);
    // Signed distance from center to line
    const dist = A * center.x + B * center.y + C;

    if (Math.abs(dist) > radius + this.EPSILON) {
      return []; // No intersection
    }

    // Closest point on line to circle center
    const cx = center.x - A * dist;
    const cy = center.y - B * dist;

    if (Math.abs(Math.abs(dist) - radius) < this.EPSILON) {
      // Tangent, single intersection
      return [{ x: cx, y: cy }];
    }

    // Two intersections
    const d = Math.sqrt(Math.max(0, radius * radius - dist * dist));
    // Unit vector along the line is (-B, A)
    const ux = -B;
    const uy = A;

    return [
      { x: cx + ux * d, y: cy + uy * d },
      { x: cx - ux * d, y: cy - uy * d },
    ];
  }

  // Intersect Circle and Circle
  public static intersectCircleCircle(
    c1: { x: number; y: number },
    r1: number,
    c2: { x: number; y: number },
    r2: number
  ): { x: number; y: number }[] {
    const d = this.distance(c1, c2);

    if (d < this.EPSILON) {
      return []; // Concentric
    }
    if (d > r1 + r2 + this.EPSILON || d < Math.abs(r1 - r2) - this.EPSILON) {
      return []; // Too far apart or one inside another
    }

    // Distance from c1 to chord
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - a * a;
    if (h2 < -this.EPSILON) return [];

    const h = Math.sqrt(Math.max(0, h2));

    // Midpoint on chord
    const mx = c1.x + (a * (c2.x - c1.x)) / d;
    const my = c1.y + (a * (c2.y - c1.y)) / d;

    if (h < this.EPSILON) {
      return [{ x: mx, y: my }];
    }

    // Normal unit vector
    const rx = -(c2.y - c1.y) * (h / d);
    const ry = (c2.x - c1.x) * (h / d);

    return [
      { x: mx + rx, y: my + ry },
      { x: mx - rx, y: my - ry },
    ];
  }

  // Perpendicular line through point P to line AB
  public static perpendicularLine(
    throughP: { x: number; y: number },
    lineP1: { x: number; y: number },
    lineP2: { x: number; y: number }
  ): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
    const dx = lineP2.x - lineP1.x;
    const dy = lineP2.y - lineP1.y;

    // Normal vector is (-dy, dx)
    return {
      p1: { x: throughP.x, y: throughP.y },
      p2: { x: throughP.x - dy, y: throughP.y + dx },
    };
  }

  // Parallel line through point P to line AB
  public static parallelLine(
    throughP: { x: number; y: number },
    lineP1: { x: number; y: number },
    lineP2: { x: number; y: number }
  ): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
    const dx = lineP2.x - lineP1.x;
    const dy = lineP2.y - lineP1.y;

    return {
      p1: { x: throughP.x, y: throughP.y },
      p2: { x: throughP.x + dx, y: throughP.y + dy },
    };
  }

  // Perpendicular Bisector of segment AB
  public static perpendicularBisector(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
    const mid = this.midpoint(p1, p2);
    return this.perpendicularLine(mid, p1, p2);
  }

  // Angle Bisector for angle formed by Points A -> B -> C (B is vertex)
  public static angleBisector(
    A: { x: number; y: number },
    B: { x: number; y: number },
    C: { x: number; y: number }
  ): { p1: { x: number; y: number }; p2: { x: number; y: number }; angleDeg: number; angleRad: number } {
    const v1 = { x: A.x - B.x, y: A.y - B.y };
    const v2 = { x: C.x - B.x, y: C.y - B.y };

    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    if (len1 < this.EPSILON || len2 < this.EPSILON) {
      return { p1: B, p2: { x: B.x + 1, y: B.y }, angleDeg: 0, angleRad: 0 };
    }

    const u1 = { x: v1.x / len1, y: v1.y / len1 };
    const u2 = { x: v2.x / len2, y: v2.y / len2 };

    const angle1 = Math.atan2(u1.y, u1.x);
    const angle2 = Math.atan2(u2.y, u2.x);

    // Calculate interior angle
    let diff = angle2 - angle1;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    const bisectorAngle = angle1 + diff / 2;
    const angleRad = Math.abs(diff);
    const angleDeg = (angleRad * 180) / Math.PI;

    return {
      p1: { x: B.x, y: B.y },
      p2: { x: B.x + Math.cos(bisectorAngle) * 5, y: B.y + Math.sin(bisectorAngle) * 5 },
      angleDeg,
      angleRad,
    };
  }

  // Shoelace Formula for Polygon Area & Perimeter
  public static polygonMetrics(points: { x: number; y: number }[]): { area: number; perimeter: number } {
    const n = points.length;
    if (n < 3) return { area: 0, perimeter: 0 };

    let areaSum = 0;
    let perimeter = 0;

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];

      areaSum += p1.x * p2.y - p2.x * p1.y;
      perimeter += Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }

    const area = 0.5 * Math.abs(areaSum);
    return { area, perimeter };
  }

  // Circumcenter of a triangle A, B, C
  public static circumcenter(
    A: { x: number; y: number },
    B: { x: number; y: number },
    C: { x: number; y: number }
  ): { center: { x: number; y: number }; radius: number } | null {
    const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    if (Math.abs(d) < this.EPSILON) return null; // Collinear

    const a2 = A.x * A.x + A.y * A.y;
    const b2 = B.x * B.x + B.y * B.y;
    const c2 = C.x * C.x + C.y * C.y;

    const ux = (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d;
    const uy = (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d;

    const center = { x: ux, y: uy };
    const radius = this.distance(center, A);

    return { center, radius };
  }

  // Snap point to grid
  public static snapToGrid(
    point: { x: number; y: number },
    gridSize: number = 1.0,
    tolerance: number = 0.25
  ): { x: number; y: number; didSnap: boolean } {
    const snappedX = Math.round(point.x / gridSize) * gridSize;
    const snappedY = Math.round(point.y / gridSize) * gridSize;

    const dist = Math.hypot(point.x - snappedX, point.y - snappedY);
    if (dist <= tolerance) {
      return { x: snappedX, y: snappedY, didSnap: true };
    }
    return { x: point.x, y: point.y, didSnap: false };
  }

  // Find all dynamic intersection points in current geometry
  public static findAllIntersections(
    pointsMap: Map<string, Point2D>,
    lines: Line2D[],
    segments: Segment2D[],
    circles: Circle2D[]
  ): { x: number; y: number; label: string; sources: string[] }[] {
    const results: { x: number; y: number; label: string; sources: string[] }[] = [];

    // Collect all lines & segment lines
    const allLines: { id: string; p1: Point2D; p2: Point2D; isSegment: boolean }[] = [];

    for (const l of lines) {
      const p1 = pointsMap.get(l.p1Id);
      const p2 = pointsMap.get(l.p2Id);
      if (p1 && p2) {
        allLines.push({ id: l.id, p1, p2, isSegment: false });
      }
    }

    for (const s of segments) {
      const p1 = pointsMap.get(s.p1Id);
      const p2 = pointsMap.get(s.p2Id);
      if (p1 && p2) {
        allLines.push({ id: s.id, p1, p2, isSegment: true });
      }
    }

    // 1. Line-Line intersections
    for (let i = 0; i < allLines.length; i++) {
      for (let j = i + 1; j < allLines.length; j++) {
        const l1 = allLines[i];
        const l2 = allLines[j];
        const pt = this.intersectLineLine(l1.p1, l1.p2, l2.p1, l2.p2);
        if (pt) {
          // If segments, check bounding box
          let valid = true;
          if (l1.isSegment) {
            const minX = Math.min(l1.p1.x, l1.p2.x) - 1e-4;
            const maxX = Math.max(l1.p1.x, l1.p2.x) + 1e-4;
            const minY = Math.min(l1.p1.y, l1.p2.y) - 1e-4;
            const maxY = Math.max(l1.p1.y, l1.p2.y) + 1e-4;
            if (pt.x < minX || pt.x > maxX || pt.y < minY || pt.y > maxY) valid = false;
          }
          if (l2.isSegment) {
            const minX = Math.min(l2.p1.x, l2.p2.x) - 1e-4;
            const maxX = Math.max(l2.p1.x, l2.p2.x) + 1e-4;
            const minY = Math.min(l2.p1.y, l2.p2.y) - 1e-4;
            const maxY = Math.max(l2.p1.y, l2.p2.y) + 1e-4;
            if (pt.x < minX || pt.x > maxX || pt.y < minY || pt.y > maxY) valid = false;
          }
          if (valid) {
            results.push({
              x: pt.x,
              y: pt.y,
              label: `∩(${l1.id}, ${l2.id})`,
              sources: [l1.id, l2.id],
            });
          }
        }
      }
    }

    // 2. Line-Circle intersections
    for (const line of allLines) {
      for (const circ of circles) {
        const center = pointsMap.get(circ.centerId);
        if (!center) continue;
        let radius = circ.radius || 1;
        if (circ.radiusPointId) {
          const rp = pointsMap.get(circ.radiusPointId);
          if (rp) radius = this.distance(center, rp);
        }

        const pts = this.intersectLineCircle(line.p1, line.p2, center, radius);
        for (const pt of pts) {
          let valid = true;
          if (line.isSegment) {
            const minX = Math.min(line.p1.x, line.p2.x) - 1e-4;
            const maxX = Math.max(line.p1.x, line.p2.x) + 1e-4;
            const minY = Math.min(line.p1.y, line.p2.y) - 1e-4;
            const maxY = Math.max(line.p1.y, line.p2.y) + 1e-4;
            if (pt.x < minX || pt.x > maxX || pt.y < minY || pt.y > maxY) valid = false;
          }
          if (valid) {
            results.push({
              x: pt.x,
              y: pt.y,
              label: `∩(${line.id}, ${circ.id})`,
              sources: [line.id, circ.id],
            });
          }
        }
      }
    }

    // 3. Circle-Circle intersections
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const c1 = circles[i];
        const c2 = circles[j];
        const center1 = pointsMap.get(c1.centerId);
        const center2 = pointsMap.get(c2.centerId);
        if (!center1 || !center2) continue;

        let r1 = c1.radius || 1;
        if (c1.radiusPointId) {
          const rp1 = pointsMap.get(c1.radiusPointId);
          if (rp1) r1 = this.distance(center1, rp1);
        }

        let r2 = c2.radius || 1;
        if (c2.radiusPointId) {
          const rp2 = pointsMap.get(c2.radiusPointId);
          if (rp2) r2 = this.distance(center2, rp2);
        }

        const pts = this.intersectCircleCircle(center1, r1, center2, r2);
        for (const pt of pts) {
          results.push({
            x: pt.x,
            y: pt.y,
            label: `∩(${c1.id}, ${c2.id})`,
            sources: [c1.id, c2.id],
          });
        }
      }
    }

    return results;
  }
}
