// src/components/TopNavbar.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Trophy,
  BookOpen,
  Magnet,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Sun,
  Moon,
  SlidersHorizontal,
  X,
  Grid,
} from 'lucide-react';
import { AppMode, GridType, ThemeMode } from '../types/math';
import { MathAudioSynth } from '../engines/MathAudioSynth';

interface TopNavbarProps {
  currentMode: AppMode;
  onSetMode: (mode: AppMode) => void;
  gridType: GridType;
  onSetGridType: (grid: GridType) => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExportPNG: () => void;
  onOpenChapters: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentMode,
  onSetMode,
  gridType,
  onSetGridType,
  snapToGrid,
  onToggleSnap,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExportPNG,
  onOpenChapters,
  theme,
  onToggleTheme,
}) => {
  const [isMuted, setIsMuted] = useState(MathAudioSynth.getInstance().getMuted());
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleMuteToggle = () => {
    const muted = MathAudioSynth.getInstance().toggleMute();
    setIsMuted(muted);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedNotification(true);
    MathAudioSynth.getInstance().playTactileSnap(1600);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const modes = [
    { id: 'sandbox' as AppMode, label: 'Sandbox', icon: Compass },
    { id: 'proofs' as AppMode, label: 'Proofs', icon: Sparkles },
    { id: 'puzzles' as AppMode, label: 'Puzzles', icon: Trophy },
  ];

  const gridOptions: { id: GridType; label: string }[] = [
    { id: 'cartesian', label: 'Cartesian' },
    { id: 'polar', label: 'Polar' },
    { id: 'isometric', label: 'Isometric' },
    { id: 'none', label: 'Off' },
  ];

  const isDark = theme === 'dark';

  return (
    <header className="h-14 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 flex items-center justify-between gap-2 select-none z-30 shrink-0 transition-colors duration-200 shadow-xs relative">
      {/* Brand & Chapters Pill */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <img
            src="/app-icon.png"
            alt="MathCraft Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shadow-md shadow-cyan-500/20 border border-cyan-500/30 ring-1 ring-cyan-500/20"
          />
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
              MATH<span className="text-cyan-600 dark:text-cyan-400">CRAFT</span>
            </h1>
            <span className="hidden sm:block text-[9px] font-mono text-slate-500 dark:text-slate-400 -mt-0.5">
              VISUAL GEOMETRY
            </span>
          </div>
        </div>

        {/* Chapters Curriculum Button */}
        <button
          onClick={() => {
            onOpenChapters();
            MathAudioSynth.getInstance().playTactileSnap(1200);
          }}
          className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-xs font-semibold transition-all active:scale-95 shadow-xs"
          title="Browse Curriculum Chapters"
        >
          <BookOpen size={13} />
          <span className="hidden sm:inline">Chapters</span>
        </button>
      </div>

      {/* Main Mode Navigation Switcher */}
      <nav className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                onSetMode(m.id);
                MathAudioSynth.getInstance().playTactileSnap(1300);
              }}
              title={m.label}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Actions: Desktop full bar & Mobile compact controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Undo / Redo (Always accessible) */}
        <div className="flex items-center bg-white dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => {
              if (canUndo) {
                onUndo();
                MathAudioSynth.getInstance().playTactileSnap(900);
              }
            }}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={() => {
              if (canRedo) {
                onRedo();
                MathAudioSynth.getInstance().playTactileSnap(1100);
              }
            }}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors border-l border-slate-200 dark:border-slate-800"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Desktop-only controls (Hidden on mobile < md) */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Grid Type Selector */}
          {currentMode === 'sandbox' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-900/70 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
              {gridOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSetGridType(opt.id);
                    MathAudioSynth.getInstance().playTactileSnap(1000);
                  }}
                  className={`px-2 py-1 rounded transition-colors ${
                    gridType === opt.id
                      ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Snap to Grid Toggle */}
          {currentMode === 'sandbox' && (
            <button
              onClick={() => {
                onToggleSnap();
                MathAudioSynth.getInstance().playTactileSnap(1100);
              }}
              title={snapToGrid ? 'Snap to Grid: ON' : 'Snap to Grid: OFF'}
              className={`p-2 rounded-lg border transition-all ${
                snapToGrid
                  ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/50 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Magnet size={15} />
            </button>
          )}

          {/* Theme Mode Toggle (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 text-xs font-semibold ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-800 hover:border-amber-400/40'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 shadow-xs'
            }`}
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={handleMuteToggle}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className={`p-2 rounded-lg border transition-all ${
              isMuted
                ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40'
                : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 shadow-xs'
            }`}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Export PNG */}
          <button
            onClick={() => {
              onExportPNG();
              MathAudioSynth.getInstance().playTactileSnap(1400);
            }}
            title="Export Canvas as High-Res PNG"
            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800 transition-all active:scale-95 shadow-xs"
          >
            <Download size={15} />
          </button>

          {/* Share Link */}
          <button
            onClick={handleCopyLink}
            title="Copy Link to Share"
            className="relative p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400 rounded-lg border border-slate-200 dark:border-slate-800 transition-all active:scale-95 shadow-xs"
          >
            <Share2 size={15} />
            {copiedNotification && (
              <span className="absolute -bottom-8 right-0 bg-cyan-800 dark:bg-cyan-900 border border-cyan-400 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-xl whitespace-nowrap z-50">
                Link Copied!
              </span>
            )}
          </button>
        </div>

        {/* Mobile "More Options" Menu Button (Visible on screens < md) */}
        <div className="relative md:hidden" ref={menuRef}>
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              MathAudioSynth.getInstance().playTactileSnap(1100);
            }}
            className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
              isMobileMenuOpen
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
            title="More Options"
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* Mobile Popover Menu */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-11 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Settings & Tools
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Grid Options on Mobile */}
              {currentMode === 'sandbox' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Grid size={13} className="text-cyan-500" /> Grid Type
                    </span>
                    <button
                      onClick={() => {
                        onToggleSnap();
                        MathAudioSynth.getInstance().playTactileSnap(1100);
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition ${
                        snapToGrid
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Snap: {snapToGrid ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                    {gridOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onSetGridType(opt.id);
                          MathAudioSynth.getInstance().playTactileSnap(1000);
                        }}
                        className={`py-1 rounded text-center transition ${
                          gridType === opt.id
                            ? 'bg-cyan-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Action Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    onToggleTheme();
                    MathAudioSynth.getInstance().playTactileSnap(1400);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition active:scale-95"
                >
                  {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-700" />}
                  <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={() => {
                    handleMuteToggle();
                    MathAudioSynth.getInstance().playTactileSnap(1200);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                    isMuted
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-300 dark:border-red-900/40'
                      : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-emerald-500'
                  }`}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
              </div>

              {/* Export & Share on Mobile */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onExportPNG();
                    setIsMobileMenuOpen(false);
                    MathAudioSynth.getInstance().playTactileSnap(1400);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition active:scale-95"
                >
                  <Download size={14} className="text-slate-400" />
                  <span>Export PNG</span>
                </button>

                <button
                  onClick={() => {
                    handleCopyLink();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-cyan-500 transition active:scale-95"
                >
                  <Share2 size={14} />
                  <span>{copiedNotification ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
