import React, { useState, useEffect } from 'react';
import { RetroBoard, SpiderCategory, Claim, Category } from '../types/retro';
import { SpiderChart } from './SpiderChart';
import {
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  MoveRight,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  HardDrive,
  Filter,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface SpiderAnalysisViewProps {
  board: RetroBoard;
  onUpdateBoard: (updated: RetroBoard) => void;
  onOpenExport: () => void;
}

export const SpiderAnalysisView: React.FC<SpiderAnalysisViewProps> = ({
  board,
  onUpdateBoard,
  onOpenExport
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Filter for claim moving table
  const [filterParticipantId, setFilterParticipantId] = useState<string>('all');

  // Modals for category management
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SpiderCategory | null>(null);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366F1');

  // Recalculate spider categories based on current claims assignments and generate distinct takeaways
  const recalculateSpiderCategories = (categories: SpiderCategory[], claims: Claim[]): SpiderCategory[] => {
    return categories.map(cat => {
      // Find all claims assigned to this category (by category id, claimIds list, or matching category name)
      const matchingClaims = claims.filter(c => {
        if (c.categoryId === cat.id) return true;
        if (cat.claimIds && cat.claimIds.includes(c.id)) return true;
        const origCat = board.categories.find(k => k.id === c.categoryId);
        if (origCat && origCat.name.trim().toLowerCase() === cat.name.trim().toLowerCase()) return true;
        return false;
      });

      const claimIds = matchingClaims.map(c => c.id);
      const avg = matchingClaims.length > 0
        ? Math.round((matchingClaims.reduce((acc, c) => acc + c.score, 0) / matchingClaims.length) * 10) / 10
        : (cat.claimIds && cat.claimIds.length > 0 ? cat.averageScore : 0);

      // Determine unique takeaway if missing or generic
      let takeaway = cat.keyTakeaway?.trim();
      const isGeneric = !takeaway ||
        takeaway === '-' ||
        takeaway === 'Innspill samles under retrospektivet' ||
        takeaway.startsWith('Innspill samles') ||
        takeaway.includes('Moderat til lavt stressnivå') ||
        takeaway.includes('Høyt stress/friksjonsnivå') ||
        takeaway.includes('Innspill samlet under');

      if (isGeneric) {
        if (matchingClaims.length > 0) {
          const sorted = [...matchingClaims].sort((a, b) => b.score - a.score);
          const top = sorted[0];
          const topText = top.text.length > 55 ? top.text.slice(0, 52) + '...' : top.text;
          if (top.score >= 8) {
            takeaway = `Kritisk friksjon: "${topText}" (${top.score}/10). ${sorted.length > 1 ? `Totalt ${sorted.length} påstander (snitt ${avg}/10).` : ''}`;
          } else if (top.score >= 6) {
            takeaway = `Merkbar friksjon: "${topText}" (${top.score}/10). ${sorted.length > 1 ? `Totalt ${sorted.length} påstander registrert.` : ''}`;
          } else if (top.score >= 4) {
            takeaway = `Moderat friksjon: "${topText}" (${top.score}/10). ${sorted.length > 1 ? `Totalt ${sorted.length} påstander.` : ''}`;
          } else {
            takeaway = `God flyt: "${topText}" (${top.score}/10). Lav friksjon rapportert av teamet.`;
          }
        } else if (cat.description) {
          takeaway = cat.description;
        } else {
          takeaway = 'Ingen påstander registrert for dette emnet.';
        }
      }

      return {
        ...cat,
        averageScore: avg,
        isHighFocus: avg >= 6.0,
        claimIds,
        keyTakeaway: takeaway
      };
    });
  };

  // Auto-sync categories if board has claims but spiderCategories are still initial placeholders
  useEffect(() => {
    if (board.isReadOnly || board.claims.length === 0) return;
    const recalculated = recalculateSpiderCategories(board.spiderCategories, board.claims);
    const hasDiverged = recalculated.some((rc, i) => {
      const orig = board.spiderCategories[i];
      if (!orig) return true;
      return orig.averageScore !== rc.averageScore ||
        orig.isHighFocus !== rc.isHighFocus ||
        orig.keyTakeaway !== rc.keyTakeaway ||
        (orig.claimIds?.length || 0) !== rc.claimIds.length;
    });

    if (hasDiverged) {
      onUpdateBoard({
        ...board,
        spiderCategories: recalculated
      });
    }
  }, [board.claims]);

  // Run Gemini AI clustering
  const handleRunAiClustering = async () => {
    if (board.isReadOnly) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/cluster-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardTitle: board.title,
          claims: board.claims.map(c => {
            const cat = board.categories.find(k => k.id === c.categoryId);
            return {
              id: c.id,
              participantId: c.participantId,
              participantName: c.participantName,
              text: c.text,
              score: c.score,
              categoryId: c.categoryId,
              categoryName: cat?.name || 'Generelt',
              categoryColor: cat?.color || '#6366F1'
            };
          }),
          categories: board.categories
        })
      });

      if (!response.ok) {
        throw new Error(`Feil fra server: ${response.statusText}`);
      }

      const data = await response.json();

      const aiCategories: SpiderCategory[] = data.categories || [];
      const recalculated = recalculateSpiderCategories(aiCategories, board.claims);

      // Also ensure board.categories includes any newly discovered categories
      const updatedCategories: Category[] = [...board.categories];
      aiCategories.forEach(ac => {
        if (!updatedCategories.some(c => c.id === ac.id)) {
          updatedCategories.push({
            id: ac.id,
            name: ac.name,
            color: ac.color,
            description: ac.description
          });
        }
      });

      onUpdateBoard({
        ...board,
        categories: updatedCategories,
        spiderCategories: recalculated,
        aiSynthesis: {
          summary: data.summary || 'KI har analysert alle innspill og gruppert påstandene.',
          focusAreas: data.focusAreas || [],
          recommendations: data.recommendations || [],
          generatedAt: new Date().toISOString(),
          fallback: data.fallback
        }
      });
    } catch (err: any) {
      console.error('AI clustering error:', err);
      setAiError(err.message || 'Kunne ikke fullføre KI-gruppering. Prøv igjen.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Move a claim to another category
  const handleMoveClaim = (claimId: string, targetCategoryId: string) => {
    if (board.isReadOnly) return;

    // Update claim's categoryId
    const updatedClaims = board.claims.map(c =>
      c.id === claimId ? { ...c, categoryId: targetCategoryId } : c
    );

    // Recalculate spider categories
    const updatedSpider = recalculateSpiderCategories(board.spiderCategories, updatedClaims);

    onUpdateBoard({
      ...board,
      claims: updatedClaims,
      spiderCategories: updatedSpider
    });
  };

  // Add new category to spider chart
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || board.isReadOnly) return;

    const newCatId = `cat-user-${Date.now().toString(36)}`;
    const newSpiderCat: SpiderCategory = {
      id: newCatId,
      name: newCatName.trim(),
      description: newCatDesc.trim() || undefined,
      color: newCatColor,
      averageScore: 5.0,
      isHighFocus: false,
      claimIds: [],
      keyTakeaway: 'Nylig opprettet kategori av teamet'
    };

    const newGeneralCat: Category = {
      id: newCatId,
      name: newCatName.trim(),
      color: newCatColor,
      description: newCatDesc.trim() || undefined
    };

    const updatedSpider = recalculateSpiderCategories(
      [...board.spiderCategories, newSpiderCat],
      board.claims
    );

    onUpdateBoard({
      ...board,
      categories: [...board.categories, newGeneralCat],
      spiderCategories: updatedSpider
    });

    setNewCatName('');
    setNewCatDesc('');
    setShowAddCategoryModal(false);
  };

  // Save edited category
  const handleSaveEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim() || board.isReadOnly) return;

    const updatedSpider = board.spiderCategories.map(c =>
      c.id === editingCategory.id ? editingCategory : c
    );

    const updatedCategories = board.categories.map(c =>
      c.id === editingCategory.id
        ? { ...c, name: editingCategory.name, color: editingCategory.color, description: editingCategory.description }
        : c
    );

    onUpdateBoard({
      ...board,
      categories: updatedCategories,
      spiderCategories: recalculateSpiderCategories(updatedSpider, board.claims)
    });

    setEditingCategory(null);
  };

  // Delete a category from spider chart
  const handleDeleteCategory = (catId: string) => {
    if (board.isReadOnly) return;
    if (board.spiderCategories.length <= 3) {
      alert('Edderkoppdiagrammet trenger minst 3 kategorier for å vises.');
      return;
    }

    const updatedSpider = board.spiderCategories.filter(c => c.id !== catId);
    onUpdateBoard({
      ...board,
      spiderCategories: recalculateSpiderCategories(updatedSpider, board.claims)
    });
  };

  // Helper to test if a claim belongs to a spider category (by explicit claimId or categoryId)
  const isClaimInSpiderCategory = (claim: Claim, catId: string): boolean => {
    const cat = board.spiderCategories.find(sc => sc.id === catId);
    if (!cat) return false;
    return claim.categoryId === catId || !!(cat.claimIds && cat.claimIds.includes(claim.id));
  };

  // Filtered claims for the move table
  const displayedClaims = board.claims.filter(c =>
    filterParticipantId === 'all' ? true : c.participantId === filterParticipantId
  );

  // Sorted displayed claims: when category is selected, matching claims are prioritized at top!
  const sortedDisplayedClaims = [...displayedClaims].sort((a, b) => {
    if (selectedCatId) {
      const aMatches = isClaimInSpiderCategory(a, selectedCatId);
      const bMatches = isClaimInSpiderCategory(b, selectedCatId);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
    }
    return b.score - a.score;
  });

  // Sorted spider categories for summary: highest stress on top descending
  const sortedSpiderCategories = [...board.spiderCategories].sort(
    (a, b) => b.averageScore - a.averageScore
  );

  const focusAreas = board.spiderCategories.filter(c => c.isHighFocus || c.averageScore >= 6.5);
  const activeSelectedCategory = board.spiderCategories.find(c => c.id === selectedCatId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with AI Action and Stats */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Edderkoppdiagram & Syntese
              </span>
              {focusAreas.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  {focusAreas.length} {focusAreas.length === 1 ? 'område krever fokus' : 'områder krever fokus'}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Felles Edderkoppdiagram
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Her er alle påstander fra teamets stresshjul samlet. KI kan gruppere påstandene i felles kategorier, eller teamet kan tilpasse kategorier og flytte påstander for å finne de viktigste fokusområdene.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!board.isReadOnly && (
              <button
                onClick={handleRunAiClustering}
                disabled={isAiLoading || board.claims.length === 0}
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>KI analyserer og grupperer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Grupper påstander med KI</span>
                  </>
                )}
              </button>
            )}

            {!board.isReadOnly && (
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Legg til kategori</span>
              </button>
            )}

            <button
              onClick={onOpenExport}
              className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Eksporter PDF / Disk</span>
            </button>
          </div>
        </div>

        {aiError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Spider Chart & Categories / Focus Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Radar / Spider Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-xl dark:shadow-2xl flex flex-col items-center transition-colors">
          <div className="w-full flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Teamets samlede radar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aksene representerer emner &bull; Høyere score = større stress
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
                {board.spiderCategories.length} akser
              </span>
            </div>
          </div>

          <div className="w-full max-w-[500px] aspect-square flex items-center justify-center py-2">
            <SpiderChart
              categories={board.spiderCategories}
              size={480}
              interactive={true}
              selectedCategoryId={selectedCatId}
              onSelectCategory={cat => setSelectedCatId(cat.id === selectedCatId ? null : cat.id)}
            />
          </div>

          {/* Quick instructions */}
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium text-center mt-2">
            💡 Tips: Klikk på en akse eller kategori for å fremheve tilhørende påstander i listen.
          </p>
        </div>

        {/* Right Column: Focus Areas & AI Synthesis & Category List (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* AI Synthesis Summary Card */}
          {board.aiSynthesis && (
            <div className="bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                  KI-syntese & Teamets puls
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                  Gemini 3.8 Flash
                </span>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                {board.aiSynthesis.summary}
              </p>

              {/* Priority Focus Areas */}
              {board.aiSynthesis.focusAreas?.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Prioriterte fokusområder:
                  </span>
                  <div className="space-y-1.5">
                    {board.aiSynthesis.focusAreas.map((area, i) => (
                      <div
                        key={i}
                        className="bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800/40 dark:text-rose-200 rounded-xl px-3 py-2 text-xs font-semibold flex items-start gap-2 shadow-2xs"
                      >
                        <span className="text-rose-700 dark:text-rose-400 font-bold shrink-0">{i + 1}.</span>
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {board.aiSynthesis.recommendations?.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Anbefalte tiltak for neste periode:
                  </span>
                  <div className="space-y-1.5">
                    {board.aiSynthesis.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold flex items-start gap-2 shadow-2xs"
                      >
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">→</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories Management & High-Focus Indicators */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-xl dark:shadow-2xl space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Kategorier i diagrammet ({board.spiderCategories.length})</span>
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60">
                    Høyest stress øverst ↓
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Klikk på en kategori for å fremheve tilhørende påstander i oversikten under.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedCatId && (
                  <button
                    type="button"
                    onClick={() => setSelectedCatId(null)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer mr-1"
                  >
                    Nullstill
                  </button>
                )}
                {!board.isReadOnly && (
                  <button
                    onClick={() => setShowAddCategoryModal(true)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Legg til ny kategori"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {sortedSpiderCategories.map(cat => {
                const isSelected = selectedCatId === cat.id;
                const isHigh = cat.isHighFocus || cat.averageScore >= 6.5;
                const count = cat.claimIds?.length || 0;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCatId(isSelected ? null : cat.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500/40 dark:bg-slate-800'
                        : isHigh
                        ? 'bg-rose-50 border-rose-300 hover:border-rose-400 dark:bg-rose-950/15 dark:border-rose-800/40'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                              {cat.name}
                            </h4>
                            {isHigh && (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 dark:text-rose-400 dark:bg-rose-950/60 dark:border-rose-800/60 px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0">
                                Fokus
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 block">
                            {cat.averageScore.toFixed(1)} / 10
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                            {count} {count === 1 ? 'påstand' : 'påstander'}
                          </span>
                        </div>

                        {!board.isReadOnly && (
                          <div className="flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setEditingCategory(cat)}
                              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Rediger kategori"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {board.spiderCategories.length > 3 && (
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors"
                                title="Slett kategori"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Flytte påstander seksjon (Claim Moving Table) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MoveRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Flytt påstander til rett kategori</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Hver deltaker kan flytte sine påstander dersom de er lagt under feil kategori. Edderkoppdiagrammet og fokusområdene oppdateres umiddelbart.
            </p>
          </div>

          {/* Filter by Participant */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Filtrer:</span>
            <select
              value={filterParticipantId}
              onChange={e => setFilterParticipantId(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="all">Alle deltakere ({board.claims.length})</option>
              {board.participants.map(p => {
                const count = board.claims.filter(c => c.participantId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Selected Category Highlight Banner */}
        {activeSelectedCategory && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-500/40 text-xs shadow-xs transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: activeSelectedCategory.color }}
              />
              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                <span className="font-bold text-indigo-950 dark:text-indigo-100">
                  Fremhever påstander for: {activeSelectedCategory.name}
                </span>
                <span className="text-indigo-700 dark:text-indigo-300 font-mono font-semibold">
                  (Snitt stress: {activeSelectedCategory.averageScore.toFixed(1)}/10 &bull; {sortedDisplayedClaims.filter(c => isClaimInSpiderCategory(c, activeSelectedCategory.id)).length} påstander)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCatId(null)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-950 dark:text-indigo-300 dark:hover:text-white underline underline-offset-2 shrink-0 cursor-pointer ml-3"
            >
              Vis alle normalt
            </button>
          </div>
        )}

        {/* Claims Table / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDisplayedClaims.map(claim => {
            const currentCat = board.categories.find(c => c.id === claim.categoryId) ||
              board.spiderCategories.find(c => c.id === claim.categoryId);
            const isHighlight = selectedCatId ? isClaimInSpiderCategory(claim, selectedCatId) : false;

            return (
              <div
                key={claim.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${
                  isHighlight
                    ? 'bg-indigo-50/90 hover:bg-white dark:bg-indigo-950/40 dark:hover:bg-slate-900 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/50 shadow-md scale-[1.01]'
                    : selectedCatId
                    ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-40 hover:opacity-100 hover:border-slate-300 transition-opacity'
                    : 'bg-slate-50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        {claim.participantName}
                      </span>
                      {isHighlight && (
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold text-white bg-indigo-600 shrink-0">
                          Valgt
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                      claim.score >= 8
                        ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-300'
                        : claim.score >= 6
                        ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-300'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300'
                    }`}>
                      Stress: {claim.score}/10
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    "{claim.text}"
                  </p>

                  {claim.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl italic shadow-2xs">
                      {claim.notes}
                    </p>
                  )}
                </div>

                {/* Move category select */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: currentCat?.color || '#6366F1' }}
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {currentCat?.name || 'Kategori'}
                    </span>
                  </div>

                  {!board.isReadOnly ? (
                    <select
                      value={claim.categoryId}
                      onChange={e => handleMoveClaim(claim.id, e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-900 dark:text-slate-200 text-xs rounded-xl px-2.5 py-1.5 max-w-[150px] truncate focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs transition-colors"
                    >
                      {board.spiderCategories.map(sc => (
                        <option key={sc.id} value={sc.id}>
                          Flytt til: {sc.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400 italic">Låst</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add New Category */}
      {showAddCategoryModal && !board.isReadOnly && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Legg til ny kategori i edderkoppdiagrammet
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Opprett et nytt emne som teamet kan gruppere påstander under.
            </p>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategorinavn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="F.eks: Arkitektur & Sikkerhet"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kort beskrivelse (valgfritt)
                </label>
                <input
                  type="text"
                  placeholder="Hva omfatter denne aksen?"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Velg farge
                </label>
                <div className="flex items-center gap-2">
                  {['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#F43F5E'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        newCatColor === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer transition-colors"
                >
                  Legg til
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Category */}
      {editingCategory && !board.isReadOnly && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Rediger kategori
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Endre navn, beskrivelse eller farge for denne aksen.
            </p>

            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategorinavn
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Beskrivelse
                </label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Farge
                </label>
                <div className="flex items-center gap-2">
                  {['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#F43F5E'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        editingCategory.color === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer transition-colors"
                >
                  Lagre endringer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
