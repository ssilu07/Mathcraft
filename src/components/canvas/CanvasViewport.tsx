// src/components/canvas/CanvasViewport.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SandboxState,
  CanvasTransform,
  Point2D,
  Segment2D,
  Line2D,
  Circle2D,
  Polygon2D,
} from '../../types/math';
import { GeometryEngine } from '../../engines/GeometryEngine';
import { GeometryRenderer } from './GeometryRenderer';
import { TrigRenderer } from './TrigRenderer';
import { CalculusRenderer } from './CalculusRenderer';
import { MathAudioSynth } from '../../engines/MathAudioSynth';

interface CanvasViewportProps {
  state: SandboxState;
  setState: (updater: (prev: SandboxState) => SandboxState, record?: boolean) => void;
  onSelectElement: (id: string | null) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  state,
  setState,
  onSelectElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport Transform
  const [transform, setTransform] = useState<CanvasTransform>({
    zoom: 50, // 50 pixels per 1 unit
    panX: 0,
    panY: 0,
    width: 800,
    height: 600,
    dpr: window.devicePixelRatio || 1,
  });

  // State refs for animation loop
  const stateRef = useRef(state);
  stateRef.current = state;
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Interaction tracking
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const [tempPoints, setTempPoints] = useState<string[]>([]); // For multi-step tools
  const [snapCandidate, setSnapCandidate] = useState<{ x: number; y: number } | null>(null);

  const animFrameRef = useRef<number | null>(null);

  // Resize canvas observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      setTransform((prev) => ({
        ...prev,
        width,
        height,
        dpr,
      }));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Main 60 FPS Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.032, (time - lastTime) / 1000);
      lastTime = time;

      const currState = stateRef.current;
      const currTrans = transformRef.current;

      // Handle parameter animations if playing
      if (currState.isPlaying) {
        setState((prev) => {
          let nextTheta = prev.parameters.theta + dt * 0.8;
          if (nextTheta > Math.PI * 2) nextTheta -= Math.PI * 2;

          let nextT = prev.parameters.t + dt * 0.2;
          if (nextT > 1) nextT -= 1;

          // Sound harmonizer update
          if (prev.activeTool === 'unit_circle') {
            MathAudioSynth.getInstance().updateContinuousHarmonizer(nextTheta);
          }

          return {
            ...prev,
            parameters: {
              ...prev.parameters,
              theta: nextTheta,
              t: nextT,
            },
          };
        }, false);
      }

      // Ensure canvas pixel dimensions match DPR
      const targetW = currTrans.width * currTrans.dpr;
      const targetH = currTrans.height * currTrans.dpr;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(currTrans.dpr, currTrans.dpr);
      ctx.clearRect(0, 0, currTrans.width, currTrans.height);

      const theme = currState.theme || 'dark';
      const isDark = theme === 'dark';

      // 1. Blueprint Background
      ctx.fillStyle = isDark ? '#080c16' : '#f8fafc';
      ctx.fillRect(0, 0, currTrans.width, currTrans.height);

      // Mode-specific renderers
      if (currState.activeTool === 'unit_circle') {
        TrigRenderer.render(
          ctx,
          currTrans.width,
          currTrans.height,
          currState.parameters.theta,
          time,
          currState.isPlaying,
          theme
        );
      } else if (currState.activeTool === 'tangent_roller') {
        // Parameter t mapped from [-5, 5]
        const rollerX = -5 + currState.parameters.t * 10;
        CalculusRenderer.renderTangentRoller(
          ctx,
          currTrans.width,
          currTrans.height,
          currState.activeCurveType,
          rollerX,
          time,
          theme
        );
      } else if (currState.activeTool === 'riemann_sum') {
        CalculusRenderer.renderRiemannLiquid(
          ctx,
          currTrans.width,
          currTrans.height,
          currState.activeCurveType,
          currState.riemannBounds,
          currState.parameters.n,
          currState.riemannType,
          time,
          theme
        );
      } else {
        // Standard Euclidean Geometry Sandbox
        GeometryRenderer.renderGrid(ctx, currTrans, currState.gridType, theme);

        const pointsMap = new Map<string, Point2D>();
        currState.points.forEach((p) => pointsMap.set(p.id, p));

        GeometryRenderer.renderPolygons(
          ctx,
          currState.polygons,
          pointsMap,
          currTrans,
          currState.selectedId,
          theme
        );

        GeometryRenderer.renderLinesAndSegments(
          ctx,
          currState.segments,
          currState.lines,
          pointsMap,
          currTrans,
          currState.selectedId,
          theme
        );

        GeometryRenderer.renderCircles(
          ctx,
          currState.circles,
          pointsMap,
          currTrans,
          currState.selectedId,
          theme
        );

        GeometryRenderer.renderPoints(
          ctx,
          currState.points,
          currTrans,
          currState.selectedId,
          currState.hoveredId,
          theme
        );

        // Snap indicator
        if (snapCandidate) {
          GeometryRenderer.renderSnapIndicator(ctx, snapCandidate, currTrans, theme);
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [setState, snapCandidate]);

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;

    setTransform((prev) => {
      const newZoom = Math.max(10, Math.min(300, prev.zoom * zoomFactor));
      return { ...prev, zoom: newZoom };
    });
  };

  // Find nearest snap position (to existing points or grid)
  const getSnappedWorldPos = (worldPos: { x: number; y: number }) => {
    // 1. Snap to existing point
    const snapDistance = 16 / transform.zoom;
    for (const pt of state.points) {
      if (GeometryEngine.distance(worldPos, pt) < snapDistance) {
        return { pos: { x: pt.x, y: pt.y }, snappedId: pt.id };
      }
    }

    // 2. Snap to grid if enabled
    if (state.snapToGrid) {
      const snapped = GeometryEngine.snapToGrid(worldPos, 1.0, 0.25);
      if (snapped.didSnap) {
        return { pos: { x: snapped.x, y: snapped.y } };
      }
    }

    return { pos: worldPos };
  };

  // Mouse Down Handler
  const handleMouseDown = (e: { clientX: number; clientY: number; button?: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Pan with middle mouse or pan tool
    if (e.button === 1 || state.activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: sx - transform.panX, y: sy - transform.panY });
      return;
    }

    const worldPos = GeometryRenderer.screenToWorld(sx, sy, transform);
    const { pos: snappedPos, snappedId } = getSnappedWorldPos(worldPos);

    // Hit test points
    const hitRadius = 14 / transform.zoom;
    const hitPoint = state.points.find((p) => GeometryEngine.distance(worldPos, p) <= hitRadius);

    if (state.activeTool === 'select') {
      if (hitPoint) {
        setDraggedPointId(hitPoint.id);
        onSelectElement(hitPoint.id);
        MathAudioSynth.getInstance().playTactileSnap(1200);
      } else {
        onSelectElement(null);
      }
      return;
    }

    // Tool: Place Point
    if (state.activeTool === 'point') {
      const nextIndex = state.points.length + 1;
      const newPt: Point2D = {
        id: `P_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        x: snappedPos.x,
        y: snappedPos.y,
        label: `P${nextIndex}`,
        color: '#00f0ff',
      };

      setState((prev) => ({
        ...prev,
        points: [...prev.points, newPt],
        selectedId: newPt.id,
      }));

      MathAudioSynth.getInstance().playPointNote(nextIndex);
      onSelectElement(newPt.id);
      return;
    }

    // Tool: Segment
    if (state.activeTool === 'segment') {
      let targetPtId = hitPoint?.id;
      if (!targetPtId) {
        const newPt: Point2D = {
          id: `P_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          x: snappedPos.x,
          y: snappedPos.y,
          label: `P${state.points.length + 1}`,
        };
        targetPtId = newPt.id;
        setState((prev) => ({ ...prev, points: [...prev.points, newPt] }), false);
      }

      if (tempPoints.length === 0) {
        setTempPoints([targetPtId]);
        MathAudioSynth.getInstance().playTactileSnap(1000);
      } else {
        const p1Id = tempPoints[0];
        const p2Id = targetPtId;
        if (p1Id !== p2Id) {
          const newSeg: Segment2D = {
            id: `SEG_${Date.now()}`,
            type: 'segment',
            p1Id,
            p2Id,
            color: '#38bdf8',
          };
          setState((prev) => ({
            ...prev,
            segments: [...prev.segments, newSeg],
            selectedId: newSeg.id,
          }));
          MathAudioSynth.getInstance().playTactileSnap(1500);
          onSelectElement(newSeg.id);
        }
        setTempPoints([]);
      }
      return;
    }

    // Tool: Infinite Line
    if (state.activeTool === 'line') {
      let targetPtId = hitPoint?.id;
      if (!targetPtId) {
        const newPt: Point2D = {
          id: `P_${Date.now()}`,
          x: snappedPos.x,
          y: snappedPos.y,
          label: `P${state.points.length + 1}`,
        };
        targetPtId = newPt.id;
        setState((prev) => ({ ...prev, points: [...prev.points, newPt] }), false);
      }

      if (tempPoints.length === 0) {
        setTempPoints([targetPtId]);
        MathAudioSynth.getInstance().playTactileSnap(1000);
      } else {
        const p1Id = tempPoints[0];
        const p2Id = targetPtId;
        if (p1Id !== p2Id) {
          const newLine: Line2D = {
            id: `LINE_${Date.now()}`,
            type: 'line',
            p1Id,
            p2Id,
            color: '#f43f5e',
          };
          setState((prev) => ({
            ...prev,
            lines: [...prev.lines, newLine],
            selectedId: newLine.id,
          }));
          MathAudioSynth.getInstance().playTactileSnap(1500);
          onSelectElement(newLine.id);
        }
        setTempPoints([]);
      }
      return;
    }

    // Tool: Circle
    if (state.activeTool === 'circle') {
      let targetPtId = hitPoint?.id;
      if (!targetPtId) {
        const newPt: Point2D = {
          id: `P_${Date.now()}`,
          x: snappedPos.x,
          y: snappedPos.y,
          label: `P${state.points.length + 1}`,
        };
        targetPtId = newPt.id;
        setState((prev) => ({ ...prev, points: [...prev.points, newPt] }), false);
      }

      if (tempPoints.length === 0) {
        setTempPoints([targetPtId]);
        MathAudioSynth.getInstance().playTactileSnap(1100);
      } else {
        const centerId = tempPoints[0];
        const radiusPointId = targetPtId;
        if (centerId !== radiusPointId) {
          const newCirc: Circle2D = {
            id: `CIRC_${Date.now()}`,
            type: 'circle',
            centerId,
            radiusPointId,
            color: '#39ff14',
          };
          setState((prev) => ({
            ...prev,
            circles: [...prev.circles, newCirc],
            selectedId: newCirc.id,
          }));
          MathAudioSynth.getInstance().playTactileSnap(1500);
          onSelectElement(newCirc.id);
        }
        setTempPoints([]);
      }
      return;
    }

    // Tool: Polygon
    if (state.activeTool === 'polygon') {
      let targetPtId = hitPoint?.id;
      if (!targetPtId) {
        const newPt: Point2D = {
          id: `P_${Date.now()}`,
          x: snappedPos.x,
          y: snappedPos.y,
          label: `P${state.points.length + 1}`,
        };
        targetPtId = newPt.id;
        setState((prev) => ({ ...prev, points: [...prev.points, newPt] }), false);
      }

      // Check if closing polygon on first point
      if (tempPoints.length >= 3 && tempPoints[0] === targetPtId) {
        const newPoly: Polygon2D = {
          id: `POLY_${Date.now()}`,
          type: 'polygon',
          pointIds: [...tempPoints],
          color: '#38bdf8',
        };
        setState((prev) => ({
          ...prev,
          polygons: [...prev.polygons, newPoly],
          selectedId: newPoly.id,
        }));
        MathAudioSynth.getInstance().playVictoryChord();
        onSelectElement(newPoly.id);
        setTempPoints([]);
      } else {
        setTempPoints((prev) => [...prev, targetPtId!]);
        MathAudioSynth.getInstance().playPointNote(tempPoints.length);
      }
      return;
    }

    // Tool: Perpendicular Bisector
    if (state.activeTool === 'perpendicular_bisector') {
      if (hitPoint) {
        if (tempPoints.length === 0) {
          setTempPoints([hitPoint.id]);
          MathAudioSynth.getInstance().playTactileSnap(1000);
        } else {
          const p1 = state.points.find((p) => p.id === tempPoints[0]);
          const p2 = hitPoint;
          if (p1 && p2 && p1.id !== p2.id) {
            const bisect = GeometryEngine.perpendicularBisector(p1, p2);
            const ptA: Point2D = { id: `P_${Date.now()}_A`, x: bisect.p1.x, y: bisect.p1.y, label: 'Mid' };
            const ptB: Point2D = { id: `P_${Date.now()}_B`, x: bisect.p2.x, y: bisect.p2.y };
            const newLine: Line2D = {
              id: `LINE_BISECT_${Date.now()}`,
              type: 'line',
              p1Id: ptA.id,
              p2Id: ptB.id,
              color: '#39ff14',
            };
            setState((prev) => ({
              ...prev,
              points: [...prev.points, ptA, ptB],
              lines: [...prev.lines, newLine],
              selectedId: newLine.id,
            }));
            MathAudioSynth.getInstance().playTactileSnap(1500);
            onSelectElement(newLine.id);
          }
          setTempPoints([]);
        }
      }
      return;
    }

    // Tool: Angle Bisector (Select 3 points A -> B=vertex -> C)
    if (state.activeTool === 'angle_bisector') {
      if (hitPoint) {
        const nextTemp = [...tempPoints, hitPoint.id];
        if (nextTemp.length < 3) {
          setTempPoints(nextTemp);
          MathAudioSynth.getInstance().playPointNote(nextTemp.length);
        } else {
          const [A_id, B_id, C_id] = nextTemp;
          const A = state.points.find((p) => p.id === A_id);
          const B = state.points.find((p) => p.id === B_id);
          const C = state.points.find((p) => p.id === C_id);
          if (A && B && C) {
            const bisect = GeometryEngine.angleBisector(A, B, C);
            const ptEnd: Point2D = { id: `P_${Date.now()}_END`, x: bisect.p2.x, y: bisect.p2.y };
            const newLine: Line2D = {
              id: `LINE_ANG_BISECT_${Date.now()}`,
              type: 'line',
              p1Id: B.id,
              p2Id: ptEnd.id,
              color: '#ff007f',
            };
            setState((prev) => ({
              ...prev,
              points: [...prev.points, ptEnd],
              lines: [...prev.lines, newLine],
              selectedId: newLine.id,
            }));
            MathAudioSynth.getInstance().playTactileSnap(1500);
            onSelectElement(newLine.id);
          }
          setTempPoints([]);
        }
      }
      return;
    }
  };

  // Mouse Move Handler
  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        panX: sx - panStart.x,
        panY: sy - panStart.y,
      }));
      return;
    }

    const worldPos = GeometryRenderer.screenToWorld(sx, sy, transform);
    const { pos: snappedPos } = getSnappedWorldPos(worldPos);

    if (GeometryEngine.distance(worldPos, snappedPos) > 1e-4) {
      setSnapCandidate(snappedPos);
    } else {
      setSnapCandidate(null);
    }

    // Dragging an existing point
    if (draggedPointId) {
      setState((prev) => ({
        ...prev,
        points: prev.points.map((p) =>
          p.id === draggedPointId ? { ...p, x: snappedPos.x, y: snappedPos.y } : p
        ),
      }), false);
    }
  };

  // Mouse Up Handler
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggedPointId) {
      setDraggedPointId(null);
      MathAudioSynth.getInstance().playTactileSnap(1400);
    }
  };

  // Touch Handlers for Mobile & Tablet Devices
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(transform.zoom);
  const touchStartPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchStartDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartZoomRef.current = transform.zoom;
      touchStartPanRef.current = {
        x: (t1.clientX + t2.clientX) / 2 - transform.panX,
        y: (t1.clientY + t2.clientY) / 2 - transform.panY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleFactor = dist / touchStartDistRef.current;
      const newZoom = Math.min(300, Math.max(15, touchStartZoomRef.current * scaleFactor));
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      setTransform((prev) => ({
        ...prev,
        zoom: newZoom,
        panX: midX - touchStartPanRef.current.x,
        panY: midY - touchStartPanRef.current.y,
      }));
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    handleMouseUp();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-50 dark:bg-[#080c16] transition-colors duration-200">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: 'none' }}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Floating Canvas View Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg">
        <button
          onClick={() => {
            setTransform((prev) => ({ ...prev, zoom: Math.min(300, prev.zoom * 1.2) }));
            MathAudioSynth.getInstance().playTactileSnap(1200);
          }}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-bold flex items-center justify-center transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
          title="Zoom In"
        >
          +
        </button>
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 px-2">
          {Math.round(transform.zoom)}%
        </span>
        <button
          onClick={() => {
            setTransform((prev) => ({ ...prev, zoom: Math.max(15, prev.zoom * 0.8) }));
            MathAudioSynth.getInstance().playTactileSnap(1000);
          }}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-bold flex items-center justify-center transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => {
            setTransform((prev) => ({ ...prev, zoom: 50, panX: 0, panY: 0 }));
            MathAudioSynth.getInstance().playTactileSnap(800);
          }}
          className="px-2.5 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold flex items-center justify-center transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
          title="Reset View"
        >
          Reset (0,0)
        </button>
      </div>

      {/* Temporary construction hint */}
      {tempPoints.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-cyan-900/95 dark:bg-cyan-950/90 text-cyan-100 dark:text-cyan-200 border border-cyan-400 dark:border-cyan-500/40 px-4 py-2 rounded-xl text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Active Construction: Selected {tempPoints.length} point(s). Click next point to finish!
        </div>
      )}
    </div>
  );
};
