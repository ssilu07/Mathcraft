// src/components/InspectorSheet.tsx

import React from 'react';
import { SandboxState, Point2D } from '../types/math';
import { GeometryEngine } from '../engines/GeometryEngine';
import katex from 'katex';
import { Sparkles, Info, X } from 'lucide-react';
import { MathAudioSynth } from '../engines/MathAudioSynth';

interface InspectorSheetProps {
  state: SandboxState;
  onDeselect: () => void;
}

export const InspectorSheet: React.FC<InspectorSheetProps> = ({ state, onDeselect }) => {
  const { selectedId, points, segments, lines, circles, polygons } = state;

  const pointsMap = new Map<string, Point2D>();
  points.forEach((p) => pointsMap.set(p.id, p));

  const selectedPoint = points.find((p) => p.id === selectedId);
  const selectedSegment = segments.find((s) => s.id === selectedId);
  const selectedLine = lines.find((l) => l.id === selectedId);
  const selectedCircle = circles.find((c) => c.id === selectedId);
  const selectedPolygon = polygons.find((poly) => poly.id === selectedId);

  // If nothing is selected, display global math summary
  if (!selectedId || (!selectedPoint && !selectedSegment && !selectedLine && !selectedCircle && !selectedPolygon)) {
    return (
      <aside className="hidden md:flex w-64 lg:w-72 bg-white/95 dark:bg-slate-900/85 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 p-4 flex-col gap-4 select-none overflow-y-auto shrink-0 transition-colors duration-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
          <Info size={14} className="text-cyan-600 dark:text-cyan-400" /> Live Math Inspector
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Select any point, line, circle, or polygon on the canvas to inspect its real-time analytical equations, lengths, slopes, and KaTeX mathematical formulas.
        </p>

        {/* Global Stats */}
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-600 dark:text-slate-400">Total Points:</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{points.length}</span>
          </div>
          <div className="flex justify-between text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-600 dark:text-slate-400">Segments & Lines:</span>
            <span className="font-mono text-pink-600 dark:text-pink-400 font-bold">{segments.length + lines.length}</span>
          </div>
          <div className="flex justify-between text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-600 dark:text-slate-400">Circles:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{circles.length}</span>
          </div>
          <div className="flex justify-between text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-600 dark:text-slate-400">Polygons:</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{polygons.length}</span>
          </div>
        </div>

        <div className="mt-auto p-3 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/20 rounded-xl text-[11px] text-cyan-900 dark:text-cyan-300/80 leading-relaxed">
          <strong className="text-cyan-800 dark:text-cyan-300 block mb-1">Tip:</strong>
          In Euclidean geometry, dragging any base point dynamically recalculates all dependent constraints, bisectors, and intersections in real time.
        </div>
      </aside>
    );
  }

  const inspectorContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
          <Sparkles size={14} /> Element Inspector
        </div>
        <button
          onClick={() => {
            onDeselect();
            MathAudioSynth.getInstance().playTactileSnap(800);
          }}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Selected POINT */}
      {selectedPoint && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Point {selectedPoint.label || selectedPoint.id}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40">
              Point2D
            </span>
          </div>

          <div
            className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-cyan-200 text-xs overflow-x-auto shadow-xs"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(
                `P(x, y) = (${selectedPoint.x.toFixed(2)}, \\; ${selectedPoint.y.toFixed(2)})`,
                { displayMode: true, throwOnError: false }
              ),
            }}
          />

          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
              <span>Distance to Origin:</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                {Math.hypot(selectedPoint.x, selectedPoint.y).toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
              <span>Polar Angle θ:</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                {((Math.atan2(selectedPoint.y, selectedPoint.x) * 180) / Math.PI).toFixed(1)}°
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selected SEGMENT */}
      {selectedSegment && (() => {
        const p1 = pointsMap.get(selectedSegment.p1Id);
        const p2 = pointsMap.get(selectedSegment.p2Id);
        if (!p1 || !p2) return null;

        const d = GeometryEngine.distance(p1, p2);
        const { slope } = GeometryEngine.lineCoefficients(p1, p2);
        const mid = GeometryEngine.midpoint(p1, p2);

        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Segment [{p1.label || 'P1'} - {p2.label || 'P2'}]</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40">
                Segment
              </span>
            </div>

            <div
              className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-blue-200 text-xs overflow-x-auto shadow-xs"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  `d = \\sqrt{(${p2.x.toFixed(1)} - ${p1.x.toFixed(1)})^2 + (${p2.y.toFixed(1)} - ${p1.y.toFixed(1)})^2} = ${d.toFixed(3)}`,
                  { displayMode: true, throwOnError: false }
                ),
              }}
            />

            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Length d:</span>
                <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">{d.toFixed(3)} units</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Slope m:</span>
                <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">
                  {slope !== null ? slope.toFixed(3) : 'Undefined (Vertical)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Midpoint M:</span>
                <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">
                  ({mid.x.toFixed(2)}, {mid.y.toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Selected LINE */}
      {selectedLine && (() => {
        const p1 = pointsMap.get(selectedLine.p1Id);
        const p2 = pointsMap.get(selectedLine.p2Id);
        if (!p1 || !p2) return null;

        const { A, B, C, slope, intercept } = GeometryEngine.lineCoefficients(p1, p2);

        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Infinite Line</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 border border-pink-300 dark:border-pink-500/40">
                Line2D
              </span>
            </div>

            <div
              className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-pink-200 text-xs overflow-x-auto shadow-xs"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  `${A.toFixed(2)}x + ${B.toFixed(2)}y + (${C.toFixed(2)}) = 0`,
                  { displayMode: true, throwOnError: false }
                ),
              }}
            />

            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Slope m:</span>
                <span className="font-mono text-pink-700 dark:text-pink-400 font-bold">
                  {slope !== null ? slope.toFixed(3) : '∞ (Vertical)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Y-Intercept b:</span>
                <span className="font-mono text-pink-700 dark:text-pink-400 font-bold">
                  {intercept !== null ? intercept.toFixed(3) : 'None'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Selected CIRCLE */}
      {selectedCircle && (() => {
        const center = pointsMap.get(selectedCircle.centerId);
        if (!center) return null;

        let r = selectedCircle.radius || 1;
        if (selectedCircle.radiusPointId) {
          const rp = pointsMap.get(selectedCircle.radiusPointId);
          if (rp) r = GeometryEngine.distance(center, rp);
        }

        const area = Math.PI * r * r;
        const circ = 2 * Math.PI * r;

        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Circle</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                Circle2D
              </span>
            </div>

            <div
              className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-emerald-200 text-xs overflow-x-auto shadow-xs"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  `(x - ${center.x.toFixed(1)})^2 + (y - ${center.y.toFixed(1)})^2 = ${r.toFixed(1)}^2`,
                  { displayMode: true, throwOnError: false }
                ),
              }}
            />

            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Radius r:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{r.toFixed(3)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Circumference (2πr):</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{circ.toFixed(3)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Area (πr²):</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{area.toFixed(3)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Selected POLYGON */}
      {selectedPolygon && (() => {
        const pts = selectedPolygon.pointIds.map((id) => pointsMap.get(id)).filter(Boolean) as Point2D[];
        const { area, perimeter } = GeometryEngine.polygonMetrics(pts);

        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{pts.length}-gon Polygon</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                Shoelace Area
              </span>
            </div>

            <div
              className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-amber-200 text-xs overflow-x-auto shadow-xs"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  `\\text{Area} = \\frac{1}{2} \\left| \\sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \\right| = ${area.toFixed(3)}`,
                  { displayMode: true, throwOnError: false }
                ),
              }}
            />

            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Shoelace Area:</span>
                <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">{area.toFixed(3)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Perimeter:</span>
                <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">{perimeter.toFixed(3)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/60">
                <span>Vertices:</span>
                <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">{pts.length} points</span>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (Screens md and wider) */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 p-4 flex-col gap-4 select-none overflow-y-auto shrink-0 z-10 transition-colors duration-200 shadow-xs">
        {inspectorContent}
      </aside>

      {/* Mobile Floating Drawer (Screens < md) */}
      <div className="md:hidden fixed inset-x-3 bottom-18 z-40 max-h-[55vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-200 text-slate-800 dark:text-slate-100">
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-1 shrink-0" />
        {inspectorContent}
      </div>
    </>
  );
};
