import React, { useState } from 'react';
import { RetroBoard } from '../types/retro';
import { useLanguage } from '../i18n/LanguageContext';
import {
  X,
  Download,
  FileText,
  HardDrive,
  Check,
  Share2,
  ExternalLink,
  Info,
  Sparkles
} from 'lucide-react';

interface ExportModalProps {
  board: RetroBoard;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  board,
  isOpen,
  onClose
}) => {
  const { language, t } = useLanguage();
  const [downloadedJson, setDownloadedJson] = useState(false);
  const [downloadedPdf, setDownloadedPdf] = useState(false);
  const [driveActionNotice, setDriveActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    const { exportBoardToPdf } = await import('../utils/pdfGenerator');
    exportBoardToPdf(board, language);
    setDownloadedPdf(true);
    setTimeout(() => setDownloadedPdf(false), 3000);
  };

  const handleDownloadJson = () => {
    // Snapshot with archive marker
    const snapshot = {
      ...board,
      isReadOnly: true, // Marked read-only so when imported later, it cannot be changed
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = board.title.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
    a.href = url;
    a.download = `retro_${board.id}_${safeTitle}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedJson(true);
    setTimeout(() => setDownloadedJson(false), 3000);
  };

  // Google Disk integration helper
  const handleSaveToGoogleDrive = async () => {
    // Check if navigator.share with files is supported
    const snapshot = {
      ...board,
      isReadOnly: true,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const safeTitle = board.title.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
    const fileName = `retro_${board.id}_${safeTitle}.json`;

    if (navigator.canShare && navigator.canShare({ files: [new File([jsonStr], fileName, { type: 'application/json' })] })) {
      try {
        const file = new File([jsonStr], fileName, { type: 'application/json' });
        await navigator.share({
          files: [file],
          title: `Retrospektiv: ${board.title}`,
          text: `Retrospektiv-arkiv for ${board.title} (ID: ${board.id})`
        });
        setDriveActionNotice('Delt! Du kan velge Google Disk i delingsmenyen.');
        return;
      } catch (e) {
        // User cancelled or share failed, fallback
      }
    }

    // Default download + open Google Drive
    handleDownloadJson();
    window.open('https://drive.google.com/drive/my-drive', '_blank');
    setDriveActionNotice('JSON-filen er lastet ned og Google Disk er åpnet i en ny fane. Du kan dra og slippe filen direkte inn i ønsket mappe.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider inline-block mb-2">
            Eksport & Arkivering
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Ta vare på retrospektivet
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Eksporter resultatene som PDF eller JSON. Google Disk-knappen laster ned JSON-filen og åpner Drive for manuell opplasting.
          </p>
        </div>

        <div className="space-y-4">
          {/* Option 1: PDF Export */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t('exportPdfTitle')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {t('exportPdfDesc')}
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {downloadedPdf ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{t('copied')}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('downloadPdfBtn')}</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2: JSON Export */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t('exportJsonTitle')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {t('exportJsonDesc')}
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadJson}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {downloadedJson ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{t('copied')}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('downloadJsonBtn')}</span>
                </>
              )}
            </button>
          </div>

          {/* Option 3: Google Disk */}
          <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Last ned og opne Google Disk</span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.2 rounded-full border border-emerald-800/60">
                    Manuell opplasting
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  JSON-fila blir lasta ned. Opplastinga til Google Drive må gjerast manuelt.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveToGoogleDrive}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Åpne i Disk</span>
            </button>
          </div>
        </div>

        {driveActionNotice && (
          <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-indigo-200 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>{driveActionNotice}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
