import React, { useState, useEffect } from 'react';
import { RetroBoard, Claim, Participant } from '../types/retro';
import { StressWheel } from './StressWheel';
import { generateClaimId, generateParticipantId } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  CheckCircle2,
  UserPlus,
  Sliders,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  User,
  Users,
  Lock,
  Share2,
  Check,
  Copy,
  ChevronDown,
  Settings2
} from 'lucide-react';

interface ParticipantInputViewProps {
  board: RetroBoard;
  onUpdateBoard: (updated: RetroBoard) => void;
  onGoToStatus: () => void;
  onOpenManageCategories?: () => void;
}

export const ParticipantInputView: React.FC<ParticipantInputViewProps> = ({
  board,
  onUpdateBoard,
  onGoToStatus,
  onOpenManageCategories
}) => {
  const storageKey = `retro_my_participant_${board.id}`;

  // Get initial personal participant ID from URL or localStorage
  const getInitialParticipantId = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramPid = urlParams.get('participant');
    if (paramPid && board.participants.some(p => p.id === paramPid)) {
      return paramPid;
    }
    const saved = localStorage.getItem(storageKey);
    if (saved && board.participants.some(p => p.id === saved)) {
      return saved;
    }
    return null;
  };

  const [myParticipantId, setMyParticipantId] = useState<string | null>(getInitialParticipantId);
  const [showIdentitySelector, setShowIdentitySelector] = useState(!getInitialParticipantId());
  const [newJoinName, setNewJoinName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Form state for adding claims
  const [claimText, setClaimText] = useState('');
  const [claimScore, setClaimScore] = useState<number>(6);
  const [categoryId, setCategoryId] = useState<string>(
    board.categories[0]?.id || ''
  );
  const [claimNotes, setClaimNotes] = useState('');

  // Save to localStorage when participant is selected
  useEffect(() => {
    if (myParticipantId) {
      localStorage.setItem(storageKey, myParticipantId);
    }
  }, [myParticipantId, storageKey]);

  // If the active participant was deleted from board, reset
  useEffect(() => {
    if (myParticipantId && !board.participants.some(p => p.id === myParticipantId)) {
      setMyParticipantId(null);
      setShowIdentitySelector(true);
    }
  }, [board.participants, myParticipantId]);

  const activeParticipant = board.participants.find(p => p.id === myParticipantId);
  const myClaims = board.claims.filter(c => c.participantId === myParticipantId);

  // Handle joining as a new participant
  const handleJoinAsNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJoinName.trim() || board.isReadOnly) return;

    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#F43F5E'];
    const newP: Participant = {
      id: generateParticipantId(),
      name: newJoinName.trim(),
      isDone: false,
      avatarColor: colors[board.participants.length % colors.length],
      joinedAt: new Date().toISOString()
    };

    onUpdateBoard({
      ...board,
      participants: [...board.participants, newP]
    });

    setMyParticipantId(newP.id);
    localStorage.setItem(storageKey, newP.id);
    setShowIdentitySelector(false);
    setNewJoinName('');
  };

  // Handle selecting an existing participant
  const handleSelectExisting = (pId: string) => {
    setMyParticipantId(pId);
    localStorage.setItem(storageKey, pId);
    setShowIdentitySelector(false);
  };

  // Add a new claim to my stress wheel
  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim() || !activeParticipant || board.isReadOnly) return;

    const newClaim: Claim = {
      id: generateClaimId(),
      participantId: activeParticipant.id,
      participantName: activeParticipant.name,
      text: claimText.trim(),
      score: claimScore,
      categoryId: categoryId || board.categories[0]?.id,
      notes: claimNotes.trim() ? claimNotes.trim() : undefined
    };

    onUpdateBoard({
      ...board,
      claims: [...board.claims, newClaim]
    });

    // Reset input fields
    setClaimText('');
    setClaimNotes('');
    setClaimScore(6);
  };

  const handleDeleteClaim = (claimId: string) => {
    if (board.isReadOnly) return;
    onUpdateBoard({
      ...board,
      claims: board.claims.filter(c => c.id !== claimId)
    });
  };

  const handleMoveClaimCategory = (claimId: string, newCatId: string) => {
    if (board.isReadOnly) return;
    onUpdateBoard({
      ...board,
      claims: board.claims.map(c => c.id === claimId ? { ...c, categoryId: newCatId } : c)
    });
  };

  const handleUpdateClaimScore = (claimId: string, newScore: number) => {
    if (board.isReadOnly) return;
    onUpdateBoard({
      ...board,
      claims: board.claims.map(c => c.id === claimId ? { ...c, score: newScore } : c)
    });
  };

  // Toggle done status
  const handleToggleDone = () => {
    if (!activeParticipant || board.isReadOnly) return;
    const newDoneState = !activeParticipant.isDone;

    if (newDoneState) {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    const updatedParticipants = board.participants.map(p =>
      p.id === activeParticipant.id ? { ...p, isDone: newDoneState } : p
    );

    onUpdateBoard({
      ...board,
      participants: updatedParticipants
    });
  };

  const handleCopyMyPersonalLink = () => {
    if (!activeParticipant) return;
    const url = new URL(window.location.href);
    url.searchParams.set('board', board.id);
    url.searchParams.set('participant', activeParticipant.id);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getScoreDescription = (s: number) => {
    if (s <= 3) return { label: 'Lav friksjon / God flyt', color: 'text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30' };
    if (s <= 6) return { label: 'Moderat friksjon / Merkbart', color: 'text-amber-800 bg-amber-100 border-amber-300 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30' };
    if (s <= 8) return { label: 'Høy stressfaktor / Viktig problem', color: 'text-orange-800 bg-orange-100 border-orange-300 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/30' };
    return { label: 'Kritisk stress / Akutt blokkering', color: 'text-rose-800 bg-rose-100 border-rose-300 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30' };
  };

  const scoreInfo = getScoreDescription(claimScore);

  // SCREEN 1: User has not identified themselves yet (Onboarding / Identity selection)
  if (!activeParticipant || showIdentitySelector) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl space-y-6 transition-colors">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-600/20 dark:border-indigo-500/30 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <User className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Individuell registrering
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Kven er du i teamet?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Kvar deltakar fyller ut sitt eige stresshjul individuelt på sin eigen skjerm, før de samlast for å presentere for resten.
            </p>
          </div>

          {/* Option A: Select yourself from existing list */}
          {board.participants.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                Er namnet ditt allereie på lista?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {board.participants.map(p => {
                  const pClaimCount = board.claims.filter(c => c.participantId === p.id).length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectExisting(p.id)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-800/60 border border-slate-200 hover:border-indigo-500 dark:border-slate-800 text-left transition-all group cursor-pointer shadow-xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: p.avatarColor }}
                        />
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white truncate">
                          {p.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500 font-mono font-medium">
                          {pClaimCount} {pClaimCount === 1 ? 'påstand' : 'påstander'}
                        </span>
                        {p.isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 font-bold">
                eller skriv inn namnet ditt
              </span>
            </div>
          </div>

          {/* Option B: Join as a new participant */}
          {!board.isReadOnly ? (
            <form onSubmit={handleJoinAsNew} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Ny deltakar: Skriv inn namnet ditt
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="F.eks. Ola Nordmann eller Kari (Utviklar)"
                  value={newJoinName}
                  onChange={e => setNewJoinName(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
                <button
                  type="submit"
                  disabled={!newJoinName.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
                >
                  Bli med
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-600 dark:text-slate-400">
              Tavlen er skrivebeskytta arkivvisning.
            </div>
          )}

          {/* Quick link to common status view */}
          <div className="pt-4 border-t border-slate-800/80 flex justify-center">
            <button
              onClick={onGoToStatus}
              className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Sjå felles tavlestatus for teamet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Individual Participant Workspace
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Personalized Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shrink-0"
            style={{ backgroundColor: activeParticipant.avatarColor }}
          >
            {activeParticipant.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Ditt personlege stresshjul
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                <span>Individuell utfylling</span>
              </span>
              {activeParticipant.isDone && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Markert som FERDIG</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Velkomen, {activeParticipant.name}!
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Legg inn dine eigne påstandar og score i fred. Trykk på «Ferdig» når du er klar for felles presentasjon.
            </p>
          </div>
        </div>

        {/* Actions for this participant */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Copy direct link to my wheel */}
          <button
            onClick={handleCopyMyPersonalLink}
            title="Kopier di personlege direkte-lenke"
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            <span>{copiedLink ? 'Lenke kopiert!' : 'Mi personlege lenke'}</span>
          </button>

          {/* Switch identity button (if team lead or testing) */}
          <button
            onClick={() => setShowIdentitySelector(true)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Bytt kven som fyller ut (for fasilitator)"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bytt deltakar</span>
          </button>

          {/* Go to common status page */}
          <button
            onClick={onGoToStatus}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Felles tavle</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left form & claims list + Right live stress wheel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Claim List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Claim Form */}
          {!board.isReadOnly ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-xl space-y-5 transition-colors">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Legg til eit kakestykke i hjulet ditt
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Kvar påstand eller nøkkelord blir eit kakestykke. Fargen er emnet, og radien representerer stress-/friksjonsnivået.
                </p>
              </div>

              <form onSubmit={handleAddClaim} className="space-y-4">
                {/* Statement text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Påstand / nøkkelord / kort setning <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={claimText}
                    onChange={e => setClaimText(e.target.value)}
                    placeholder="F.eks: 'Mange uforutsette ad-hoc møter' eller 'Super hjelpsomhet i teamet'"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                    required
                  />
                </div>

                {/* Topic selection tiles */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Velg diskusjonsemne (kategori &amp; farge)
                    </label>
                    {onOpenManageCategories && (
                      <button
                        type="button"
                        onClick={onOpenManageCategories}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        title="Møteleder / Fasilitator: legg til eller endre temaer"
                      >
                        <Settings2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span>Endre / legg til emner</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {board.categories.map(cat => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setCategoryId(cat.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-500 dark:bg-slate-800 dark:text-white'
                              : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stress score slider (1-10) */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Stress-score / friksjonsgrad
                    </label>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${scoreInfo.color}`}>
                      Score: {claimScore} / 10 &bull; {scoreInfo.label}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={claimScore}
                    onChange={e => setClaimScore(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-2 bg-slate-300 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-500 font-mono font-medium">
                    <span>1 (Ingen stress / God flyt)</span>
                    <span>5 (Moderat)</span>
                    <span>10 (Kritisk stress / Blokkering)</span>
                  </div>
                </div>

                {/* Optional note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Utdjupande notat eller forslag (valfritt)
                  </label>
                  <input
                    type="text"
                    value={claimNotes}
                    onChange={e => setClaimNotes(e.target.value)}
                    placeholder="Konkrete døme eller idear til forbetring..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!claimText.trim()}
                    style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Legg til kakestykke i hjulet
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center text-slate-600 dark:text-slate-400">
              <Info className="w-5 h-5 mx-auto mb-2 text-amber-500" />
              <p className="text-sm font-semibold">Tavlen er i skrivebeskytta visning.</p>
            </div>
          )}

          {/* List of my claims */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Dine registrerte påstandar ({myClaims.length})
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Du kan justere score, byte emne eller slette fram til du trykker «Ferdig».
                </p>
              </div>

              {myClaims.length > 0 && !board.isReadOnly && (
                <button
                  onClick={handleToggleDone}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    activeParticipant.isDone
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{activeParticipant.isDone ? 'Du er klar!' : 'Trykk for Ferdig'}</span>
                </button>
              )}
            </div>

            {myClaims.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm font-medium">Du har ikkje lagt inn nokon påstandar enno.</p>
                <p className="text-xs mt-1">Bruk skjemaet ovanfor for å bygge opp ditt personlege stresshjul.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {myClaims.map(claim => {
                  const cat = board.categories.find(c => c.id === claim.categoryId);
                  return (
                    <div
                      key={claim.id}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
                            style={{ backgroundColor: cat?.color || '#6366F1' }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 leading-snug">
                              {claim.text}
                            </p>
                            {claim.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                Notat: {claim.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                            {claim.score}/10
                          </span>

                          {!board.isReadOnly && (
                            <button
                              onClick={() => handleDeleteClaim(claim.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Slett påstand"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Adjustment controls */}
                      {!board.isReadOnly && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 dark:text-slate-500 font-medium">Endre emne:</span>
                            <select
                              value={claim.categoryId}
                              onChange={e => handleMoveClaimCategory(claim.id, e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                            >
                              {board.categories.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 dark:text-slate-500 font-medium">Juster score:</span>
                            <div className="flex items-center gap-1">
                              {[2, 4, 6, 8, 10].map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleUpdateClaimScore(claim.id, s)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                    claim.score === s
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:border-transparent'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Stress Wheel for this participant (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-xl flex flex-col items-center sticky top-20 transition-colors">
            <div className="w-full flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Ditt Stresshjul
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {myClaims.length} kakestykker &bull; radius = stress
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeParticipant.avatarColor }}
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {activeParticipant.name}
                </span>
              </div>
            </div>

            {/* Live Interactive Wheel */}
            <div className="w-full max-w-[420px] aspect-square flex items-center justify-center py-2">
              <StressWheel
                claims={myClaims}
                categories={board.categories}
                size={400}
                interactive={true}
              />
            </div>

            {/* Category Color Legend */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 w-full">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Emnenes fargekoder:
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                {board.categories.map(c => {
                  const count = myClaims.filter(cl => cl.categoryId === c.id).length;
                  return (
                    <div key={c.id} className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate text-slate-700 dark:text-slate-300">{c.name}</span>
                      {count > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          ({count})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Big "Ferdig" submission card */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 w-full flex flex-col gap-3">
              <button
                onClick={handleToggleDone}
                style={{ backgroundColor: activeParticipant.isDone ? '#059669' : '#4f46e5', color: '#ffffff' }}
                className={`w-full py-3.5 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer text-white ${
                  activeParticipant.isDone
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {activeParticipant.isDone
                    ? 'Du er registrert som FERDIG! (Klikk for å angre)'
                    : 'Eg er ferdig med mitt hjul!'}
                </span>
              </button>

              <button
                onClick={onGoToStatus}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>Gå til felles status og sjå kven som er klare</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
