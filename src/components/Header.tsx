import React, { useState, useRef, useEffect } from 'react';
import { RetroBoard, RetroPhase } from '../types/retro';
import {
  Check,
  Copy,
  Share2,
  Plus,
  Download,
  Upload,
  Lock,
  Compass,
  Users,
  Presentation,
  Activity,
  Settings2,
  Home,
  ChevronDown,
  Wrench
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  board: RetroBoard;
  currentPhase?: RetroPhase;
  onPhaseChange: (phase: RetroPhase) => void;
  onNewBoard: () => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenManageCategories?: () => void;
  onLeaveBoard?: () => void;
  isConnected?: boolean;
  onlineCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  board,
  currentPhase,
  onPhaseChange,
  onNewBoard,
  onOpenExport,
  onOpenImport,
  onOpenManageCategories,
  onLeaveBoard,
  isConnected = false,
  onlineCount = 1
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?board=${board.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const phases: { id: RetroPhase; label: string; shortLabel: string; icon: any }[] = [
    { id: 'input', label: t('phase1'), shortLabel: t('phase1Short'), icon: Compass },
    { id: 'status', label: t('phase2'), shortLabel: t('phase2Short'), icon: Users },
    { id: 'present', label: t('phase3'), shortLabel: t('phase3Short'), icon: Presentation },
    { id: 'spider', label: t('phase4'), shortLabel: t('phase4Short'), icon: Activity }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* Read Only Archive Notice */}
      {board.isReadOnly && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold">Skrivebeskyttet arkivvisning:</span>
          <span>Denne tavlen er hentet inn fra en lagret JSON-fil og kan kun presenteres/vises, ikke redigeres.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ROW 1: Board Identity, Presence, New Board & Tools */}
        <div className="flex items-center justify-between py-2 sm:py-2.5 gap-2 sm:gap-4 border-b border-slate-100 dark:border-slate-800/80">
          {/* Left: Home + Title + ID Badge + Online Status */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Go to Landing / Home Button */}
            <button
              onClick={onLeaveBoard}
              title={t('homeBtn')}
              aria-label={t('homeBtn')}
              style={{ backgroundColor: '#4f46e5' }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 flex items-center justify-center shadow-md shadow-indigo-600/30 text-white shrink-0 transition-transform cursor-pointer"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            <div className="min-w-0 flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-sm">
                {board.title}
              </h1>

              {/* Unique ID Badge */}
              <button
                onClick={handleCopyLink}
                title={t('copyLink')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer group shrink-0"
              >
                <span>{board.id}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
                )}
              </button>

              {/* Real-time WebSocket connection indicator (ALWAYS visible, shrink-0) */}
              <div
                title={isConnected ? `Sanntid tilkoblet (${onlineCount} påkoblet)` : 'Kobler til sanntid...'}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border shrink-0 shadow-2xs ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                    : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-600 dark:bg-emerald-400 animate-pulse' : 'bg-amber-600 dark:bg-amber-400'}`} />
                <span className="font-mono text-[10px] sm:text-xs">
                  {isConnected ? `${onlineCount} påkoblet` : 'Kobler...'}
                </span>
              </div>

              <span className="hidden lg:inline text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
                &bull; {board.participants.length} deltakere &bull; {board.claims.length} påstander
              </span>
            </div>
          </div>

          {/* Right: + Ny Tavle, Verktøy (Dropdown), Theme Toggle, Language */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* New board button - Prominent and directly visible */}
            <button
              onClick={onNewBoard}
              style={{ backgroundColor: '#4f46e5' }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
              title={t('newBoard')}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t('newBoard')}</span>
              <span className="sm:hidden font-bold">Ny</span>
            </button>

            {/* Tools Dropdown (Replaces sprawling row of buttons) */}
            <div className="relative shrink-0" ref={toolsRef}>
              <button
                type="button"
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white dark:border-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title={t('moreActions')}
              >
                <Wrench className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span className="hidden md:inline">{t('moreActions')}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isToolsOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    {t('moreActions')}
                  </div>

                  {onOpenManageCategories && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenManageCategories();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Settings2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                      <div>
                        <div className="font-semibold">{t('manageTopics')}</div>
                        <div className="text-[10px] text-slate-400">{t('facilitatorManageTopics')}</div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenExport();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-semibold">{t('exportOrDrive')}</div>
                      <div className="text-[10px] text-slate-400">PDF, Google Disk, JSON</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsOpen(false);
                      onOpenImport();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                    <div>
                      <div className="font-semibold">{t('openJson')}</div>
                      <div className="text-[10px] text-slate-400">Importer arkivert tavle</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsOpen(false);
                      handleCopyLink();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                    )}
                    <div className="font-semibold">{copied ? t('copied') : t('copyLink')}</div>
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle compact />

            {/* Language Selector */}
            <LanguageSelector compact />
          </div>
        </div>

        {/* ROW 2: The 4 Phases (Zero Scroll, Fits 100% on Mobile and Web) */}
        <div className="py-2">
          {/* Mobile view: 4-column Segmented Control (Tabs 1, 2, 3, 4 ALWAYS VISIBLE, NO SCROLL) */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs sm:hidden">
            {phases.map((phase) => {
              const Icon = phase.icon;
              const activePhase = currentPhase || board.currentPhase;
              const isActive = activePhase === phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => onPhaseChange(phase.id)}
                  className={`flex flex-col xs:flex-row items-center justify-center gap-1 py-1.5 px-0.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/50'
                      : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                  title={phase.label}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                  <span className="truncate">{phase.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop/Tablet view: Neatly centered 4 phases (NO SCROLL, Plenty of breathing room) */}
          <div className="hidden sm:flex items-center justify-center">
            <nav className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              {phases.map((phase) => {
                const Icon = phase.icon;
                const activePhase = currentPhase || board.currentPhase;
                const isActive = activePhase === phase.id;
                return (
                  <button
                    key={phase.id}
                    onClick={() => onPhaseChange(phase.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/50'
                        : 'bg-transparent text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                    <span>{phase.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
