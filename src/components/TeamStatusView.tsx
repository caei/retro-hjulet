import React from 'react';
import { RetroBoard, Participant } from '../types/retro';
import { StressWheel } from './StressWheel';
import {
  Users,
  CheckCircle2,
  Clock,
  Presentation,
  ArrowRight,
  Sparkles,
  Compass,
  Plus
} from 'lucide-react';

interface TeamStatusViewProps {
  board: RetroBoard;
  onUpdateBoard: (updated: RetroBoard) => void;
  onSelectPresenter: (participantId: string) => void;
  onGoToInput: () => void;
}

export const TeamStatusView: React.FC<TeamStatusViewProps> = ({
  board,
  onUpdateBoard,
  onSelectPresenter,
  onGoToInput
}) => {
  const total = board.participants.length;
  const doneCount = board.participants.filter(p => p.isDone).length;
  const isAllDone = total > 0 && doneCount === total;
  const progressPercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const toggleParticipantDone = (pId: string) => {
    if (board.isReadOnly) return;
    const updated = board.participants.map(p =>
      p.id === pId ? { ...p, isDone: !p.isDone } : p
    );
    onUpdateBoard({
      ...board,
      participants: updated
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Readiness Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Felles tavlestatus
              </span>
              {isAllDone && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Alle er klare til presentasjon!
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Deltakernes status og stresshjul
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Når alle har lagt inn sine påstander og markert seg som ferdig, velger teamet hvem som presenterer sitt stresshjul først for resten.
            </p>
          </div>

          {/* Quick CTA to start presentation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={onGoToInput}
              className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tilbake til registrering</span>
            </button>

            {total > 0 && (
              <button
                onClick={() => onSelectPresenter(board.participants[0].id)}
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Presentation className="w-4 h-4" />
                <span>Start presentasjonsrunde</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300">
              Ferdigstatus: <strong className="text-indigo-600 dark:text-indigo-400">{doneCount}</strong> av <strong>{total}</strong> deltakere klare
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-mono font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAllDone
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Participants Grid with Stress-Wheel Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {board.participants.map(p => {
          const pClaims = board.claims.filter(c => c.participantId === p.id);
          const avg = pClaims.length > 0
            ? (pClaims.reduce((acc, c) => acc + c.score, 0) / pClaims.length).toFixed(1)
            : '0';

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 rounded-2xl p-5 shadow-lg dark:shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header: Name, Avatar, Status */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: p.avatarColor }}
                    />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">
                      {p.name}
                    </h3>
                  </div>

                  {/* Status pill */}
                  <button
                    onClick={() => toggleParticipantDone(p.id)}
                    disabled={board.isReadOnly}
                    title="Klikk for å endre status"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      p.isDone
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300'
                        : 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-300'
                    }`}
                  >
                    {p.isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Klar</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Arbeider...</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Compact Stress Wheel preview */}
                <div className="py-2 flex justify-center">
                  <div className="w-48 h-48 flex items-center justify-center">
                    <StressWheel
                      claims={pClaims}
                      categories={board.categories}
                      size={180}
                      interactive={false}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 my-4 text-center">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-2xs">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold block">
                      Påstander
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {pClaims.length}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-2xs">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold block">
                      Snitt stress
                    </span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {avg}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: Present this person's wheel */}
              <button
                onClick={() => onSelectPresenter(p.id)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 dark:bg-indigo-600/20 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white dark:border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Velg {p.name} til å presentere</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
