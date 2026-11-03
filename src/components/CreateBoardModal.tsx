import React, { useState } from 'react';
import { RetroBoard, DEFAULT_CATEGORIES, Category, Participant, SpiderCategory } from '../types/retro';
import { generateBoardId, generateParticipantId } from '../utils/storage';
import {
  X,
  Plus,
  RefreshCw,
  Users,
  CheckSquare,
  Square,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (board: RetroBoard) => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  onCreateBoard
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [boardId, setBoardId] = useState(generateBoardId('RTR'));
  const [participantInput, setParticipantInput] = useState('Ingrid, Magnus, Sara, Jonas');

  // Topic selection & custom topics
  const [availableCategories, setAvailableCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    DEFAULT_CATEGORIES.map(c => c.id)
  );
  const [customTopicName, setCustomTopicName] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRefreshId = () => {
    setBoardId(generateBoardId('RTR'));
  };

  const handleToggleCategory = (id: string) => {
    setError(null);
    if (selectedCategoryIds.includes(id)) {
      if (selectedCategoryIds.length <= 1) {
        setError(t('atLeastOneTopic'));
        return;
      }
      setSelectedCategoryIds(selectedCategoryIds.filter(cId => cId !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedCategoryIds(availableCategories.map(c => c.id));
    setError(null);
  };

  const handleDeselectAll = () => {
    // Keep at least the first one selected
    if (availableCategories.length > 0) {
      setSelectedCategoryIds([availableCategories[0].id]);
    }
  };

  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTopicName.trim();
    if (!trimmed) return;

    if (availableCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Et tema med dette navnet finnes allerede.');
      return;
    }

    const customColors = ['#14B8A6', '#F97316', '#84CC16', '#6366F1', '#A855F7', '#EC4899'];
    const newColor = customColors[availableCategories.length % customColors.length];
    const newId = `cat-custom-${Date.now().toString(36)}`;
    const newCategory: Category = {
      id: newId,
      name: trimmed,
      color: newColor
    };

    setAvailableCategories([...availableCategories, newCategory]);
    setSelectedCategoryIds([...selectedCategoryIds, newId]);
    setCustomTopicName('');
    setShowAddCustom(false);
    setError(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (selectedCategoryIds.length === 0) {
      setError(t('atLeastOneTopic'));
      return;
    }

    // Filter to selected categories only
    const finalCategories = availableCategories.filter(c => selectedCategoryIds.includes(c.id));

    // Parse initial participants
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#F43F5E'];
    const names = participantInput
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);

    const participants: Participant[] = names.map((name, i) => ({
      id: generateParticipantId(),
      name,
      isDone: false,
      avatarColor: colors[i % colors.length],
      joinedAt: new Date().toISOString()
    }));

    // Default spider categories matching selected topics
    const spiderCategories: SpiderCategory[] = finalCategories.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      description: c.description,
      averageScore: 0,
      isHighFocus: false,
      claimIds: [],
      keyTakeaway: c.description ? `Fokusområde: ${c.description}` : undefined
    }));

    const newBoard: RetroBoard = {
      id: boardId,
      title: title.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      categories: finalCategories,
      participants,
      claims: [],
      spiderCategories,
      currentPhase: 'input',
      presentingParticipantId: participants[0]?.id
    };

    onCreateBoard(newBoard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              {t('facilitatorBadge')}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('createBoardModalTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Sett opp tavlen, velg temaer, og definer teamets deltakere.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Board Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('boardTitleLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={t('boardTitlePlaceholder')}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner transition-colors"
              required
              autoFocus
            />
          </div>

          {/* Unique Board ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('uniqueIdLabel')}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm flex items-center justify-between shadow-inner">
                <span>{boardId}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-semibold">
                  Unik ID
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefreshId}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-sm"
                title={t('generateNewId')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Denne ID-en brukes i delingslenken som teammedlemmene åpner.
            </p>
          </div>

          {/* Description / Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Beskrivelse eller fokusområde for sesjonen (valgfritt)
            </label>
            <textarea
              rows={2}
              placeholder="Hva er hovedfokuset for denne retrospektiven?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner transition-colors"
            />
          </div>

          {/* Initial Participants */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('participantsLabel')}
              </label>
              <span className="text-[10px] text-slate-400 font-normal">
                Kan også legges til senere
              </span>
            </div>
            <input
              type="text"
              value={participantInput}
              onChange={e => setParticipantInput(e.target.value)}
              placeholder={t('participantsPlaceholder')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner transition-colors"
            />
          </div>

          {/* Categories / Topics with Checkboxes */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('topicsTitle')}
                </span>
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                  {selectedCategoryIds.length}/{availableCategories.length} valgt
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  {t('selectAll')}
                </button>
                <span className="text-slate-400">&bull;</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  {t('deselectAll')}
                </button>
              </div>
            </div>

            {/* Explanatory callout notice requested by user */}
            <div className="mb-3 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800/50 dark:text-indigo-200 text-[11px] flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span>{t('topicsHelper')}</span>
              </div>
            </div>

            {/* Checkbox Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableCategories.map(c => {
                const isSelected = selectedCategoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggleCategory(c.id)}
                    className={`p-2.5 rounded-xl text-left border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/60 dark:bg-slate-900 border-indigo-400 dark:border-indigo-500/60 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className={`text-xs truncate ${isSelected ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {c.name}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Topic toggle button */}
            {!showAddCustom ? (
              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Legg til et egendefinert tema med en gang</span>
              </button>
            ) : (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Nytt tema
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customTopicName}
                    onChange={e => setCustomTopicName(e.target.value)}
                    placeholder="F.eks. Sikkerhet & GDPR"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTopic}
                    disabled={!customTopicName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    Legg til
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCustom(false);
                      setCustomTopicName('');
                    }}
                    className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs cursor-pointer"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim() || selectedCategoryIds.length === 0}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {t('createBoardSubmitBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
