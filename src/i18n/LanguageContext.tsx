import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LANGUAGES, translations, TranslationKey, LanguageOption } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  pdfStrings: typeof translations.nb.pdf;
  languages: LanguageOption[];
}

const STORAGE_KEY = 'retrohjulet_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'nb' || saved === 'nn' || saved === 'en')) {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read language from localStorage:', e);
    }
    // Default must be Bokmål
    return 'nb';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.nb;
    let val = (dict as any)[key] ?? (translations.nb as any)[key] ?? String(key);

    if (typeof val === 'string' && params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        val = val.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }

    return val;
  };

  const pdfStrings = (translations[language]?.pdf || translations.nb.pdf) as typeof translations.nb.pdf;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, pdfStrings, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
