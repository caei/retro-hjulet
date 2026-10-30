import React, { useState, useRef } from 'react';
import { RetroBoard } from '../types/retro';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  Lock,
  Check,
  Presentation
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBoard: (board: RetroBoard) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportBoard
}) => {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.json')) {
      setError('Filen må være en JSON-fil (.json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation check
        if (!parsed.id || !parsed.title || !Array.isArray(parsed.categories)) {
          throw new Error('Ugyldig format på retrospektiv-filen. Mangler nødvendige felter.');
        }

        // Force Read-Only lock as requested
        const importedBoard: RetroBoard = {
          ...parsed,
          isReadOnly: true, // "men da ikkje være mulig å endre"
          currentPhase: parsed.currentPhase === 'input' ? 'spider' : (parsed.currentPhase || 'spider')
        };

        onImportBoard(importedBoard);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Kunne ikke lese JSON-filen. Kontroller at den er gyldig.');
      }
    };

    reader.onerror = () => {
      setError('Feil ved lesing av fil.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Lock className="w-3 h-3" />
              Skrivebeskyttet Arkiv
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Hent inn lagret retrospektiv
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Last opp en tidligere eksportert JSON-fil. Tavlen vil bli åpnet for presentasjon og gjennomgang, men er skrivebeskyttet mot endringer.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>

          <p className="text-sm font-semibold text-slate-200">
            Klikk for å velge fil, eller dra og slipp her
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Støtter .json filer eksportert fra RetroHjulet
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};
