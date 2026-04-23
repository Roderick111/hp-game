/**
 * Language context — provides t() translation function to all components.
 *
 * Language is per-player, stored in PlayerState on the backend.
 * The provider reads it from investigation state and passes it down.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { translations, type TranslationKey } from './translations';

type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string;

interface LanguageContextValue {
  language: string;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: (key) => key,
});

export function LanguageProvider({
  language,
  children,
}: {
  language: string;
  children: ReactNode;
}) {
  const value = useMemo<LanguageContextValue>(() => {
    const dict = translations[language] ?? translations.en;

    const t: TFunction = (key, vars) => {
      let text = dict[key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    };

    return { language, t };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
