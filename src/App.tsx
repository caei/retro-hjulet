import React, { useState, useEffect, useCallback } from 'react';
import { RetroBoard, RetroPhase } from './types/retro';
import {
  getBoardById,
  saveBoard,
  setActiveBoardId
} from './utils/storage';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ParticipantInputView } from './components/ParticipantInputView';
import { TeamStatusView } from './components/TeamStatusView';
import { PresentationView } from './components/PresentationView';
import { SpiderAnalysisView } from './components/SpiderAnalysisView';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { CreateBoardModal } from './components/CreateBoardModal';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { useRetroWebSocket } from './hooks/useRetroWebSocket';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

function RetroApp() {
  const { t } = useLanguage();
  const [board, setBoard] = useState<RetroBoard | null>(() => {
    // Only automatically enter a board if specified in the URL query (?board=...)
    const params = new URLSearchParams(window.location.search);
    const boardParam = params.get('board');

    if (boardParam) {
      const existing = getBoardById(boardParam);
      if (existing) return existing;
    }

    // Default to null so new users land on the Landing Page!
    return null;
  });

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  // If a board ID is in the URL, but wasn't in localStorage, try fetching it from server
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const boardParam = params.get('board');
    if (boardParam && !board) {
      fetch(`/api/boards/${encodeURIComponent(boardParam)}`)
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then(serverBoard => {
          if (serverBoard) {
            setBoard(serverBoard);
            saveBoard(serverBoard);
          }
        })
        .catch(err => console.warn('Could not fetch board from server:', err));
    }
  }, [board]);

  // Handle incoming remote updates from other users via WebSockets
  const handleRemoteBoardUpdate = useCallback((remoteBoard: RetroBoard) => {
    setBoard(remoteBoard);
    saveBoard(remoteBoard);
  }, []);

  // Hook for real-time WebSocket communication
  const { isConnected, onlineCount, broadcastBoard } = useRetroWebSocket({
    board,
    onRemoteBoardUpdate: handleRemoteBoardUpdate,
  });

  // Sync local board updates to state, localStorage, and broadcast to all connected peers
  const handleUpdateBoard = (updated: RetroBoard) => {
    setBoard(updated);
    saveBoard(updated);
    broadcastBoard(updated);
  };

  const handlePhaseChange = (phase: RetroPhase) => {
    if (!board) return;
    const updated: RetroBoard = {
      ...board,
      currentPhase: phase
    };
    handleUpdateBoard(updated);
  };

  const handleSelectBoard = (selected: RetroBoard) => {
    if (!selected.isDemo && selected.id !== 'RTR-42X#7k') {
      saveBoard(selected);
      setActiveBoardId(selected.id);
    }
    setBoard(selected);
    broadcastBoard(selected);

    const url = new URL(window.location.href);
    url.searchParams.set('board', selected.id);
    window.history.pushState({}, '', url.toString());
  };

  const handleCreateBoard = (newBoard: RetroBoard) => {
    handleSelectBoard(newBoard);
  };

  const handleImportBoard = (imported: RetroBoard) => {
    handleSelectBoard(imported);
  };

  const handleLeaveBoard = () => {
    setBoard(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('board');
    url.searchParams.delete('participant');
    window.history.pushState({}, '', url.toString());
  };

  // If no board is active, display the Landing Page
  if (!board) {
    return (
      <>
        <LandingPage
          onSelectBoard={handleSelectBoard}
          onOpenCreateModal={() => setIsCreateOpen(true)}
          onOpenImportModal={() => setIsImportOpen(true)}
        />

        <CreateBoardModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreateBoard={handleCreateBoard}
        />

        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportBoard={handleImportBoard}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header with Real-Time Presence, Language Switcher & Leave Action */}
      <Header
        board={board}
        onPhaseChange={handlePhaseChange}
        onNewBoard={() => setIsCreateOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
        onLeaveBoard={handleLeaveBoard}
        isConnected={isConnected}
        onlineCount={onlineCount}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {board.currentPhase === 'input' && (
          <ParticipantInputView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onGoToStatus={() => handlePhaseChange('status')}
            onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
          />
        )}

        {board.currentPhase === 'status' && (
          <TeamStatusView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onSelectPresenter={(pId) => {
              const updated = {
                ...board,
                currentPhase: 'present' as RetroPhase,
                presentingParticipantId: pId
              };
              handleUpdateBoard(updated);
            }}
            onGoToInput={() => handlePhaseChange('input')}
          />
        )}

        {board.currentPhase === 'present' && (
          <PresentationView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onGoToSpider={() => handlePhaseChange('spider')}
            onGoToStatus={() => handlePhaseChange('status')}
          />
        )}

        {board.currentPhase === 'spider' && (
          <SpiderAnalysisView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}
      </main>

      {/* Footer info */}
      <footer className="py-4 border-t border-slate-200 dark:border-slate-900 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLeaveBoard}
              className="font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {t('appTitle')}
            </button>
            <span>&bull;</span>
            <span>{t('appTagline')}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{t('boardIdLabel')}: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{board.id}</strong></span>
            <button
              onClick={handleLeaveBoard}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              {t('leaveBoard')}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExportModal
        board={board}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportBoard={handleImportBoard}
      />

      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateBoard={handleCreateBoard}
      />

      <ManageCategoriesModal
        board={board}
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onUpdateBoard={handleUpdateBoard}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RetroApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
