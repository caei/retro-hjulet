import React, { useState } from 'react';
import { RetroBoard } from '../types/retro';
import { getSavedBoards, getBoardById, createDemoBoard, deleteBoard } from '../utils/storage';
import {
  Compass,
  Plus,
  ArrowRight,
  LogIn,
  Upload,
  Sparkles,
  Clock,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

interface LandingPageProps {
  onSelectBoard: (board: RetroBoard) => void;
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectBoard,
  onOpenCreateModal,
  onOpenImportModal
}) => {
  const { t } = useLanguage();
  const [boardInput, setBoardInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentBoards, setRecentBoards] = useState<RetroBoard[]>(() => {
    const savedBoardsMap = getSavedBoards();
    return Object.values(savedBoardsMap)
      .filter(b => !b.isDemo && b.id !== 'RTR-42X#7k')
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  });

  const handleRemoveBoard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteBoard(id);
    setRecentBoards(prev => prev.filter(b => b.id !== id));
  };

  const handleClearAllHistory = () => {
    recentBoards.forEach(b => deleteBoard(b.id));
    setRecentBoards([]);
  };

  // Helper to extract board ID if user pastes full URL
  const extractBoardId = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('?board=')) {
      try {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const id = url.searchParams.get('board');
        if (id) return id.trim();
      } catch {
        const match = trimmed.match(/[?&]board=([^&#]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]).trim();
      }
    }
    return trimmed;
  };

  const handleJoinBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const rawInput = boardInput.trim();
    if (!rawInput) return;

    const boardId = extractBoardId(rawInput);
    setIsLoading(true);

    try {
      // 1. Check local storage
      const local = getBoardById(boardId);
      if (local) {
        onSelectBoard(local);
        setIsLoading(false);
        return;
      }

      // 2. Check server via REST API
      const res = await fetch(`/api/boards/${encodeURIComponent(boardId)}`);
      if (res.ok) {
        const serverBoard = await res.json();
        onSelectBoard(serverBoard);
        setIsLoading(false);
        return;
      }

      setError(t('joinNotFound', { id: boardId }));
    } catch (err: any) {
      setError(t('joinNetworkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = () => {
    const demo = createDemoBoard();
    onSelectBoard(demo);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header with Language Selector & Theme Toggle */}
      <header className="border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: '#4f46e5' }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0"
            >
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">
                {t('appTitle')}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider block">
                {t('appSubtitle')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle (Light / Dark mode) */}
            <ThemeToggle />

            {/* Language Selector Dropdown */}
            <LanguageSelector />

            <button
              onClick={onOpenImportModal}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700/80 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">{t('openJson')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Action Hub */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-4xl mx-auto w-full space-y-10">
        {/* Hero Title */}
        <div className="text-center space-y-3 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {t('landingBadge')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {t('landingHeroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('landingHeroDesc')}
          </p>
        </div>

        {/* Two Main Cards: Join with ID vs Create New Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Card 1: Join with ID / Link */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-lg dark:shadow-2xl flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-600/20 dark:border-indigo-500/30 dark:text-indigo-400 flex items-center justify-center">
                <LogIn className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t('joinCardTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {t('joinCardDesc')}
                </p>
              </div>

              <form onSubmit={handleJoinBoard} className="space-y-3 pt-2">
                <div>
                  <input
                    type="text"
                    placeholder={t('joinInputPlaceholder')}
                    value={boardInput}
                    onChange={e => {
                      setBoardInput(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono shadow-inner transition-colors"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!boardInput.trim() || isLoading}
                  style={{
                    backgroundColor: boardInput.trim() && !isLoading ? '#4f46e5' : '#818cf8',
                    color: '#ffffff'
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-white"
                >
                  <span className="text-white font-bold">{isLoading ? t('joiningButton') : t('joinButton')}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </div>

          {/* Card 2: Create New Board */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-lg dark:shadow-2xl flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 text-violet-600 dark:bg-violet-600/20 dark:border-violet-500/30 dark:text-violet-400 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t('createCardTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {t('createCardDesc')}
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t('createFeature1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t('createFeature2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t('createFeature3')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenCreateModal}
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff'
              }}
              className="w-full mt-6 py-3.5 px-4 rounded-2xl text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-white"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white font-bold">{t('createButton')}</span>
            </button>
          </div>
        </div>

        {/* Recent Boards on this device (if any) */}
        {recentBoards.length > 0 && (
          <div className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-md dark:shadow-xl space-y-3 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {t('recentBoardsTitle')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  {recentBoards.length} {recentBoards.length === 1 ? t('boardCountSingular') : t('boardsCount')}
                </span>
                <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title={t('clearAllHistory')}
                >
                  {t('clearAllHistory')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {recentBoards.map(b => (
                <div
                  key={b.id}
                  onClick={() => onSelectBoard(b)}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-500 text-left transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-sm hover:shadow"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-white truncate">
                      {b.title}
                    </h4>
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                      ID: {b.id} &bull; {b.participants.length} deltakere
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Delete single board from local history */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveBoard(e, b.id)}
                      title={t('removeBoardFromHistory')}
                      aria-label={t('removeBoardFromHistory')}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:text-slate-600 dark:group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo Board fallback link */}
        <div className="text-center pt-2">
          <button
            onClick={handleLoadDemo}
            className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4 transition-colors cursor-pointer"
          >
            {t('demoLink')}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 dark:border-slate-900 text-center text-xs text-slate-500 dark:text-slate-600 transition-colors">
        {t('footerText')}
      </footer>
    </div>
  );
};
