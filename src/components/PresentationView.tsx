import React, { useState, useMemo } from 'react';
import { RetroBoard, Claim } from '../types/retro';
import { StressWheel } from './StressWheel';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Check,
  Activity,
  Users,
  Sparkles,
  Sliders,
  Compass
} from 'lucide-react';

interface PresentationViewProps {
  board: RetroBoard;
  onUpdateBoard: (updated: RetroBoard) => void;
  onGoToSpider: () => void;
  onGoToStatus: () => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  board,
  onUpdateBoard,
  onGoToSpider,
  onGoToStatus
}) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Set of discussed claim IDs, synchronized across all participants via board
  const discussedSet = useMemo(() => {
    const set = new Set<string>(board.discussedClaimIds || []);
    board.claims.forEach(c => {
      if (c.isDiscussed) {
        set.add(c.id);
      }
    });
    return set;
  }, [board.claims, board.discussedClaimIds]);

  // Current presenter index
  const currentPresenterId = board.presentingParticipantId || board.participants[0]?.id;
  const currentIndex = board.participants.findIndex(p => p.id === currentPresenterId);
  const activePresenter = board.participants[currentIndex >= 0 ? currentIndex : 0];

  const presenterClaims = board.claims.filter(
    c => c.participantId === activePresenter?.id
  );

  // Sort claims by score descending so highest stress points are addressed first
  const sortedClaims = [...presenterClaims].sort((a, b) => b.score - a.score);

  const avgScore = presenterClaims.length > 0
    ? (presenterClaims.reduce((acc, c) => acc + c.score, 0) / presenterClaims.length).toFixed(1)
    : '0';

  const handleSelectPresenter = (pId: string) => {
    setSelectedClaimId(null);
    onUpdateBoard({
      ...board,
      presentingParticipantId: pId
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleSelectPresenter(board.participants[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < board.participants.length - 1) {
      handleSelectPresenter(board.participants[currentIndex + 1].id);
    }
  };

  const toggleDiscussed = (claimId: string) => {
    if (board.isReadOnly) return;
    const isNowDiscussed = !discussedSet.has(claimId);

    const updatedClaims = board.claims.map(c =>
      c.id === claimId ? { ...c, isDiscussed: isNowDiscussed } : c
    );

    const nextDiscussedIds = new Set(discussedSet);
    if (isNowDiscussed) {
      nextDiscussedIds.add(claimId);
    } else {
      nextDiscussedIds.delete(claimId);
    }

    onUpdateBoard({
      ...board,
      claims: updatedClaims,
      discussedClaimIds: Array.from(nextDiscussedIds)
    });
  };

  const handleToggleAllPresenterClaims = () => {
    if (board.isReadOnly || presenterClaims.length === 0) return;
    const allDiscussed = presenterClaims.every(c => discussedSet.has(c.id));
    const targetState = !allDiscussed;

    const presenterClaimIdSet = new Set(presenterClaims.map(c => c.id));
    const updatedClaims = board.claims.map(c =>
      presenterClaimIdSet.has(c.id) ? { ...c, isDiscussed: targetState } : c
    );

    const nextDiscussedIds = new Set(discussedSet);
    presenterClaims.forEach(c => {
      if (targetState) {
        nextDiscussedIds.add(c.id);
      } else {
        nextDiscussedIds.delete(c.id);
      }
    });

    onUpdateBoard({
      ...board,
      claims: updatedClaims,
      discussedClaimIds: Array.from(nextDiscussedIds)
    });
  };

  if (!activePresenter) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-600 dark:text-slate-400">
        <p className="font-semibold text-base">Ingen deltakere registrert.</p>
        <button
          onClick={onGoToStatus}
          className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          Gå til felles status
        </button>
      </div>
    );
  }

  const categoryMap = new Map(board.categories.map(c => [c.id, c]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Presentation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-4 sm:p-5 shadow-lg dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        {/* Presenter Info & Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-600/20 dark:border-indigo-500/30 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Presentation className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Presenterer nå ({currentIndex + 1} av {board.participants.length})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: activePresenter.avatarColor }}
              />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {activePresenter.name} sitt stresshjul
              </h2>
            </div>
          </div>
        </div>

        {/* Presenter Selector Dropdown & Previous/Next Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl p-1 shadow-2xs">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Forrige deltaker"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={activePresenter.id}
              onChange={e => handleSelectPresenter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-1 focus:outline-none cursor-pointer"
            >
              {board.participants.map((p, idx) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {idx + 1}. {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleNext}
              disabled={currentIndex >= board.participants.length - 1}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Neste deltaker"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Jump to Spider analysis when ready */}
          <button
            onClick={onGoToSpider}
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Til Edderkoppdiagram (KI)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Stress Wheel (Left) & Claims (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Big Interactive Stress Wheel (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-xl dark:shadow-2xl flex flex-col items-center sticky top-20 transition-colors">
          <div className="w-full flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Stresshjulet til {activePresenter.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Klikk på et kakestykke for å fokusere diskusjonen
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                Gjennomsnitt
              </span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                {avgScore} / 10
              </span>
            </div>
          </div>

          <div className="w-full max-w-[420px] aspect-square flex items-center justify-center py-2">
            <StressWheel
              claims={presenterClaims}
              categories={board.categories}
              size={420}
              interactive={true}
              selectedClaimId={selectedClaimId}
              onSelectClaim={c => setSelectedClaimId(c.id === selectedClaimId ? null : c.id)}
            />
          </div>

          {/* Quick Legend */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 w-full flex flex-wrap items-center justify-center gap-3 text-xs">
            {board.categories.map(c => {
              const hasClaims = presenterClaims.some(cl => cl.categoryId === c.id);
              if (!hasClaims) return null;
              return (
                <div key={c.id} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{c.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Claims list sorted by stress score (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-xl dark:shadow-2xl space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Påstander og nøkkelord</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {presenterClaims.length} totalt
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Sortert etter høyest stress først. Merk av etter hvert som teamet har diskutert punktet.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {presenterClaims.filter(c => discussedSet.has(c.id)).length} av {presenterClaims.length} gjennomgått
              </span>
              {presenterClaims.length > 0 && !board.isReadOnly && (
                <button
                  type="button"
                  onClick={handleToggleAllPresenterClaims}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {presenterClaims.every(c => discussedSet.has(c.id)) ? 'Nullstill alle' : 'Merk alle'}
                </button>
              )}
            </div>
          </div>

          {presenterClaims.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              <p className="font-medium">Deltakeren har ikke lagt inn noen påstander i sitt hjul.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedClaims.map((claim) => {
                const cat = categoryMap.get(claim.categoryId);
                const isSelected = selectedClaimId === claim.id;
                const isDiscussed = discussedSet.has(claim.id);

                return (
                  <div
                    key={claim.id}
                    onClick={() => setSelectedClaimId(claim.id === selectedClaimId ? null : claim.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 shadow-lg ring-2 ring-indigo-500/50 dark:bg-slate-800 dark:border-indigo-500'
                        : isDiscussed
                        ? 'bg-slate-100/70 border-slate-200 text-slate-500 opacity-60 dark:bg-slate-950/60 dark:border-slate-800/60 dark:text-slate-400'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800 dark:hover:border-slate-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Discussed Checkbox */}
                        <button
                          type="button"
                          disabled={board.isReadOnly}
                          onClick={e => {
                            e.stopPropagation();
                            toggleDiscussed(claim.id);
                          }}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            board.isReadOnly ? 'cursor-default opacity-75' : 'cursor-pointer'
                          } ${
                            isDiscussed
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent hover:border-slate-500'
                          }`}
                          title={board.isReadOnly ? 'Skrivebeskyttet' : (isDiscussed ? 'Merk som ubehandlet' : 'Merk som diskutert')}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-0">
                          {/* Category and score tags */}
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white flex items-center gap-1 shadow-xs"
                              style={{ backgroundColor: cat?.color || '#6366F1' }}
                            >
                              <span>{cat?.name || 'Emne'}</span>
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                                claim.score >= 8
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-300'
                                  : claim.score >= 6
                                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-300'
                                  : 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300'
                              }`}
                            >
                              Stress: {claim.score} / 10
                            </span>

                            {claim.score >= 8 && (
                              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <span>🚨 Høy friksjon</span>
                              </span>
                            )}
                          </div>

                          {/* Claim text */}
                          <p className={`text-sm sm:text-base font-semibold ${isDiscussed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                            "{claim.text}"
                          </p>

                          {/* Notes */}
                          {claim.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                              <span className="font-bold text-slate-800 dark:text-slate-300">Notat:</span> {claim.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation Bar at Bottom */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Forrige</span>
            </button>

            {currentIndex < board.participants.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                <span>Neste: {board.participants[currentIndex + 1].name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onGoToSpider}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Fullfør runde &bull; Se Edderkoppdiagram</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
