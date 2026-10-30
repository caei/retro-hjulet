import React, { useState } from 'react';
import { RetroBoard, Category, SpiderCategory } from '../types/retro';
import {
  X,
  Plus,
  Trash2,
  ShieldCheck,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ManageCategoriesModalProps {
  board: RetroBoard;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBoard: (updated: RetroBoard) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
  '#A855F7', // Violet
];

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  board,
  isOpen,
  onClose,
  onUpdateBoard
}) => {
  const { t } = useLanguage();
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicColor, setNewTopicColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = newTopicName.trim();
    if (!trimmedName) return;

    if (board.categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('Et tema med dette navnet finnes allerede.');
      return;
    }

    const newId = `cat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newCat: Category = {
      id: newId,
      name: trimmedName,
      color: newTopicColor,
      description: newTopicDesc.trim() || undefined
    };

    // Also add to spiderCategories if not present
    const newSpiderCat: SpiderCategory = {
      id: newId,
      name: trimmedName,
      color: newTopicColor,
      description: newTopicDesc.trim() || undefined,
      averageScore: 5.0,
      isHighFocus: false,
      claimIds: [],
      keyTakeaway: 'Nylig opprettet tema'
    };

    const updatedBoard: RetroBoard = {
      ...board,
      categories: [...board.categories, newCat],
      spiderCategories: [...board.spiderCategories, newSpiderCat]
    };

    onUpdateBoard(updatedBoard);
    setNewTopicName('');
    setNewTopicDesc('');
    // pick next color in presets
    const nextColorIdx = (PRESET_COLORS.indexOf(newTopicColor) + 1) % PRESET_COLORS.length;
    setNewTopicColor(PRESET_COLORS[nextColorIdx]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (board.categories.length <= 1) {
      setError(t('atLeastOneTopic'));
      return;
    }

    const claimCount = board.claims.filter(c => c.categoryId === categoryId).length;
    if (claimCount > 0) {
      const confirmed = window.confirm(
        `Dette temaet har ${claimCount} registrert(e) påstand(er). Hvis du fjerner det, flyttes påstandene til første tilgjengelige tema. Vil du fortsette?`
      );
      if (!confirmed) return;
    }

    const remainingCats = board.categories.filter(c => c.id !== categoryId);
    const fallbackCatId = remainingCats[0].id;

    // Migrate claims
    const updatedClaims = board.claims.map(c =>
      c.categoryId === categoryId ? { ...c, categoryId: fallbackCatId } : c
    );

    const updatedBoard: RetroBoard = {
      ...board,
      categories: remainingCats,
      spiderCategories: board.spiderCategories.filter(sc => sc.id !== categoryId),
      claims: updatedClaims
    };

    onUpdateBoard(updatedBoard);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] flex flex-col transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 dark:bg-violet-500/15 dark:border-violet-500/30 dark:text-violet-300 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              {t('facilitatorBadge')}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('facilitatorModalTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('facilitatorInfo')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-y-auto flex-1 space-y-5 pr-1">
          {/* Active Categories List */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Aktive temaer på denne tavlen ({board.categories.length})
            </label>
            <div className="space-y-2">
              {board.categories.map((cat) => {
                const claimCount = board.claims.filter(c => c.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">
                          {cat.name}
                        </div>
                        {cat.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {cat.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-xs">
                        {claimCount} {claimCount === 1 ? 'påstand' : 'påstander'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={board.categories.length <= 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
                        title={t('deleteTopic')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Topic Form */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {t('addCustomTopic')}
              </span>
            </div>

            <form onSubmit={handleAddTopic} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={e => {
                      setNewTopicName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t('topicNamePlaceholder')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newTopicDesc}
                    onChange={e => setNewTopicDesc(e.target.value)}
                    placeholder={t('topicDescriptionPlaceholder')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Color picker presets */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 mr-1">{t('topicColor')}:</span>
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTopicColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        newTopicColor === color ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : 'hover:scale-110 opacity-80'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {newTopicColor === color && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newTopicName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('saveTopic')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500 dark:text-slate-400 shrink-0" />
            <span>Fasilitator har full frihet til å endre temaer gjennom hele sesjonen.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
