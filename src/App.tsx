// src/App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { SandboxState, AppMode, GridType, ToolType, Point2D, ThemeMode } from './types/math';
import { useHistory } from './hooks/useHistory';
import { TopNavbar } from './components/TopNavbar';
import { LeftToolbar } from './components/LeftToolbar';
import { InspectorSheet } from './components/InspectorSheet';
import { BottomControlBar } from './components/BottomControlBar';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { VisualProofs } from './components/proofs/VisualProofs';
import { PuzzleManager } from './components/puzzles/PuzzleManager';
import { ChapterSelectorModal, ChapterItem } from './components/ChapterSelectorModal';
import { MathAudioSynth } from './engines/MathAudioSynth';
import { licenseService, LicenseInfo } from './services/licenseService';
import { RefundLockScreen } from './components/licensing/RefundLockScreen';

// Initial default state with an aesthetically pleasing geometric construction
const initialSandboxState: SandboxState = {
  points: [
    { id: 'p1', x: -3, y: -2, label: 'A', color: '#00f0ff' },
    { id: 'p2', x: 3, y: -2, label: 'B', color: '#00f0ff' },
    { id: 'p3', x: 0, y: 3, label: 'C', color: '#00f0ff' },
    { id: 'p4', x: 0, y: 0, label: 'O', color: '#ffd700' },
  ],
  segments: [
    { id: 's1', type: 'segment', p1Id: 'p1', p2Id: 'p2', color: '#38bdf8' },
    { id: 's2', type: 'segment', p1Id: 'p2', p2Id: 'p3', color: '#38bdf8' },
    { id: 's3', type: 'segment', p1Id: 'p3', p2Id: 'p1', color: '#38bdf8' },
  ],
  lines: [],
  circles: [
    { id: 'c1', type: 'circle', centerId: 'p4', radiusPointId: 'p3', color: '#39ff14' },
  ],
  polygons: [
    { id: 'poly1', type: 'polygon', pointIds: ['p1', 'p2', 'p3'], color: '#38bdf8', fillColor: 'rgba(56, 189, 248, 0.08)' },
  ],
  selectedId: null,
  hoveredId: null,
  activeTool: 'select',
  gridType: 'cartesian',
  snapToGrid: true,
  snapToIntersection: true,
  showEquations: true,
  angleUnit: 'degrees',
  parameters: {
    t: 0.5,
    theta: Math.PI / 4,
    n: 16,
    k: 1,
  },
  isPlaying: false,
  activeCurveType: 'parabola',
  riemannType: 'midpoint',
  riemannBounds: [-3, 3],
};

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('sandbox');
  const [isChapterModalOpen, setIsChapterModalOpen] = useState<boolean>(false);
  const [activeProofId, setActiveProofId] = useState<'pythagoras' | 'circle' | 'triangle'>('pythagoras');
  const [activePuzzleLevel, setActivePuzzleLevel] = useState<number>(1);

  // License Management & Refund Protection State
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(() => licenseService.getCurrentInfo());
  const [isVerifyingLicense, setIsVerifyingLicense] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = licenseService.subscribe((info) => {
      setLicenseInfo(info);
    });
    // Trigger initial verification
    licenseService.verifyLicense();
    return () => unsubscribe();
  }, []);

  // Auto re-validate when user resumes the app or regains internet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        licenseService.verifyLicense();
      }
    };
    const handleOnline = () => {
      licenseService.verifyLicense();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleVerifyLicense = useCallback(async () => {
    setIsVerifyingLicense(true);
    MathAudioSynth.getInstance().playTactileSnap(1200);
    try {
      await licenseService.verifyLicense(true);
    } finally {
      setIsVerifyingLicense(false);
    }
  }, []);

  // Mute audio and sound engine if the app is marked as refunded
  useEffect(() => {
    if (licenseInfo.isRefunded || licenseInfo.status === 'REFUNDED') {
      MathAudioSynth.getInstance().setMuted(true);
    }
  }, [licenseInfo.isRefunded, licenseInfo.status]);

  // Theme Mode State ('dark' | 'light')
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mathcraft_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark'; // default theme is dark
  });

  // Sync theme with html document element and meta theme-color
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#080c16');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }
    localStorage.setItem('mathcraft_theme', theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    MathAudioSynth.getInstance().playTactileSnap(1500);
  }, []);

  useEffect(() => {
    document.title = "MathCraft: Visual Geometry";
  }, []);

  // Undo/Redo history stack with 40 states capacity
  const {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: _reset,
  } = useHistory<SandboxState>({ ...initialSandboxState, theme }, 40);

  // Sync state.theme with active theme
  useEffect(() => {
    setState((prev) => ({ ...prev, theme }), false);
  }, [theme, setState]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if locked due to refund or missing license
      if (licenseInfo.isRefunded || licenseInfo.status === 'REFUNDED' || licenseInfo.status === 'UNLICENSED') {
        return;
      }

      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      } else if (e.key.toLowerCase() === 'v') {
        setState((prev) => ({ ...prev, activeTool: 'select' }));
      } else if (e.key.toLowerCase() === 'h') {
        setState((prev) => ({ ...prev, activeTool: 'pan' }));
      } else if (e.key.toLowerCase() === 'p') {
        setState((prev) => ({ ...prev, activeTool: 'point' }));
      } else if (e.key.toLowerCase() === 's') {
        setState((prev) => ({ ...prev, activeTool: 'segment' }));
      } else if (e.key.toLowerCase() === 'l') {
        setState((prev) => ({ ...prev, activeTool: 'line' }));
      } else if (e.key.toLowerCase() === 'c') {
        setState((prev) => ({ ...prev, activeTool: 'circle' }));
      } else if (e.key.toLowerCase() === 'g') {
        setState((prev) => ({ ...prev, activeTool: 'polygon' }));
      } else if (e.key === ' ') {
        e.preventDefault();
        setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, setState, licenseInfo.isRefunded, licenseInfo.status]);

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    setState((prev) => ({
      ...prev,
      points: [],
      segments: [],
      lines: [],
      circles: [],
      polygons: [],
      selectedId: null,
      hoveredId: null,
    }));
  }, [setState]);

  // Load Preset Template
  const handleLoadPreset = useCallback((presetName: string) => {
    if (presetName === 'triangle') {
      const pA: Point2D = { id: 'pa', x: -4, y: -2, label: 'A', color: '#00f0ff' };
      const pB: Point2D = { id: 'pb', x: 4, y: -2, label: 'B', color: '#00f0ff' };
      const pC: Point2D = { id: 'pc', x: 0, y: 4, label: 'C', color: '#00f0ff' };
      const pO: Point2D = { id: 'po', x: 0, y: 0, label: 'O', color: '#ffd700' };

      setState((prev) => ({
        ...prev,
        points: [pA, pB, pC, pO],
        segments: [
          { id: 's1', type: 'segment', p1Id: 'pa', p2Id: 'pb', color: '#38bdf8' },
          { id: 's2', type: 'segment', p1Id: 'pb', p2Id: 'pc', color: '#38bdf8' },
          { id: 's3', type: 'segment', p1Id: 'pc', p2Id: 'pa', color: '#38bdf8' },
        ],
        lines: [],
        circles: [
          { id: 'c1', type: 'circle', centerId: 'po', radiusPointId: 'pc', color: '#39ff14' },
        ],
        polygons: [
          { id: 'poly1', type: 'polygon', pointIds: ['pa', 'pb', 'pc'], color: '#38bdf8', fillColor: 'rgba(56, 189, 248, 0.08)' },
        ],
        selectedId: 'poly1',
      }));
    } else if (presetName === 'tangent_circle') {
      const pC: Point2D = { id: 'pc', x: 0, y: 0, label: 'C', color: '#39ff14' };
      const pR: Point2D = { id: 'pr', x: 3, y: 0, label: 'R', color: '#00f0ff' };
      const pT: Point2D = { id: 'pt', x: 3, y: 5, label: 'T', color: '#ff007f' };

      setState((prev) => ({
        ...prev,
        points: [pC, pR, pT],
        segments: [
          { id: 's1', type: 'segment', p1Id: 'pc', p2Id: 'pr', color: '#39ff14' },
          { id: 's2', type: 'segment', p1Id: 'pr', p2Id: 'pt', color: '#ff007f' },
          { id: 's3', type: 'segment', p1Id: 'pc', p2Id: 'pt', color: '#ffd700' },
        ],
        lines: [],
        circles: [
          { id: 'c1', type: 'circle', centerId: 'pc', radiusPointId: 'pr', color: '#39ff14' },
        ],
        polygons: [],
        selectedId: 's2',
      }));
    }
  }, [setState]);

  // Export Canvas as PNG
  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `MathCraft_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Launch Chapter from Curriculum
  const handleLaunchChapter = (chapter: ChapterItem) => {
    setCurrentMode(chapter.mode);
    if (chapter.mode === 'sandbox' && chapter.tool) {
      setState((prev) => ({ ...prev, activeTool: chapter.tool! }));
    } else if (chapter.mode === 'proofs' && chapter.proofId) {
      setActiveProofId(chapter.proofId);
    } else if (chapter.mode === 'puzzles' && chapter.puzzleLevel) {
      setActivePuzzleLevel(chapter.puzzleLevel);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#080c16] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <TopNavbar
        currentMode={currentMode}
        onSetMode={(mode) => setCurrentMode(mode)}
        gridType={state.gridType}
        onSetGridType={(grid: GridType) => setState((prev) => ({ ...prev, gridType: grid }))}
        snapToGrid={state.snapToGrid}
        onToggleSnap={() => setState((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onExportPNG={handleExportPNG}
        onOpenChapters={() => setIsChapterModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* MODE: FREE GEOMETRY & CALCULUS SANDBOX */}
        {currentMode === 'sandbox' && (
          <>
            <LeftToolbar
              activeTool={state.activeTool}
              onSelectTool={(tool: ToolType) => setState((prev) => ({ ...prev, activeTool: tool }))}
              onClearCanvas={handleClearCanvas}
              onLoadPreset={handleLoadPreset}
            />

            <main className="flex-1 h-full relative overflow-hidden">
              <CanvasViewport
                state={state}
                setState={setState}
                onSelectElement={(id) => setState((prev) => ({ ...prev, selectedId: id }))}
              />
            </main>

            <InspectorSheet
              state={state}
              onDeselect={() => setState((prev) => ({ ...prev, selectedId: null }))}
            />
          </>
        )}

        {/* MODE: "AHA!" INTERACTIVE VISUAL PROOFS */}
        {currentMode === 'proofs' && (
          <main className="flex-1 h-full relative overflow-hidden">
            <VisualProofs theme={theme} initialProof={activeProofId} />
          </main>
        )}

        {/* MODE: GAMIFIED CHALLENGES & PUZZLES */}
        {currentMode === 'puzzles' && (
          <main className="flex-1 h-full relative overflow-hidden">
            <PuzzleManager theme={theme} initialLevel={activePuzzleLevel} />
          </main>
        )}
      </div>

      {/* Bottom Control Bar (Shown in Sandbox Mode) */}
      {currentMode === 'sandbox' && (
        <BottomControlBar state={state} setState={setState} />
      )}

      {/* Curriculum Chapters Modal */}
      <ChapterSelectorModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        onSelectChapter={handleLaunchChapter}
      />

      {/* Google Play Refund & License Lockdown Barrier */}
      {(licenseInfo.status === 'REFUNDED' || licenseInfo.status === 'UNLICENSED') && (
        <RefundLockScreen
          licenseInfo={licenseInfo}
          onRefresh={handleVerifyLicense}
          isVerifying={isVerifyingLicense}
        />
      )}
    </div>
  );
};

export default App;
