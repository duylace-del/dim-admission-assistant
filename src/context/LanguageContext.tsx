import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang, translations, TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'az',
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('dim_lang') as Lang) || 'az';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('dim_lang', l);
  };

  const t = (key: TranslationKey): string => {
    return (translations[lang] as any)[key] ?? (translations.az as any)[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
