// src/types/math.ts

export type ToolType =
  | 'select'
  | 'point'
  | 'segment'
  | 'line'
  | 'circle'
  | 'polygon'
  | 'perpendicular'
  | 'parallel'
  | 'perpendicular_bisector'
  | 'angle_bisector'
  | 'midpoint'
  | 'intersection'
  | 'tangent'
  | 'unit_circle'
  | 'tangent_roller'
  | 'riemann_sum'
  | 'pan';

export type AppMode = 'sandbox' | 'proofs' | 'puzzles' | 'chapters';

export type GridType = 'cartesian' | 'polar' | 'isometric' | 'none';

export type ThemeMode = 'dark' | 'light';

export interface Point2D {
  id: string;
  x: number; // World coordinates
  y: number; // World coordinates
  label?: string;
  color?: string;
  radius?: number;
  isFixed?: boolean;
  isIntersection?: boolean;
  derivedFrom?: {
    type: 'intersection' | 'midpoint' | 'circumcenter';
    parents: string[]; // ids of parent objects
  };
}

export interface Segment2D {
  id: string;
  type: 'segment';
  p1Id: string;
  p2Id: string;
  color?: string;
  label?: string;
}

export interface Line2D {
  id: string;
  type: 'line';
  p1Id: string;
  p2Id: string;
  color?: string;
  label?: string;
  constraint?: {
    type: 'perpendicular' | 'parallel' | 'perpendicular_bisector' | 'angle_bisector';
    targetLineId?: string;
    throughPointId?: string;
    anglePoints?: [string, string, string]; // [A, B, C] where B is vertex
  };
}

export interface Circle2D {
  id: string;
  type: 'circle';
  centerId: string;
  radiusPointId?: string;
  radius?: number; // if radiusPointId not provided
  color?: string;
  label?: string;
}

export interface Polygon2D {
  id: string;
  type: 'polygon';
  pointIds: string[]; // Ordered list of point IDs
  color?: string;
  fillColor?: string;
  label?: string;
}

export interface GeometricElement {
  id: string;
  type: 'point' | 'segment' | 'line' | 'circle' | 'polygon';
}

export interface SandboxState {
  points: Point2D[];
  segments: Segment2D[];
  lines: Line2D[];
  circles: Circle2D[];
  polygons: Polygon2D[];
  selectedId: string | null;
  hoveredId: string | null;
  activeTool: ToolType;
  gridType: GridType;
  snapToGrid: boolean;
  snapToIntersection: boolean;
  showEquations: boolean;
  angleUnit: 'degrees' | 'radians';
  // Sliders
  parameters: {
    t: number;      // 0 to 1
    theta: number;  // 0 to 2*pi
    n: number;      // 2 to 100 (Riemann rectangles, polygon sides, pie wedges)
    k: number;      // -10 to 10
  };
  isPlaying: boolean;
  activeCurveType: 'parabola' | 'sine' | 'cubic' | 'gaussian';
  riemannType: 'left' | 'right' | 'midpoint' | 'trapezoid';
  riemannBounds: [number, number]; // [a, b]
  theme?: ThemeMode;
}

export interface CanvasTransform {
  zoom: number;
  panX: number; // in screen pixels
  panY: number; // in screen pixels
  width: number;
  height: number;
  dpr: number;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  category: 'Euclidean Geometry' | 'Trigonometry & Waves' | 'Calculus & Motion' | 'Optimization & Kinematics' | 'Visual Proofs' | 'Arcade Puzzles';
  icon: string;
  targetMode: AppMode;
  initialTool?: ToolType;
  proofId?: string;
  puzzleLevel?: number;
}
