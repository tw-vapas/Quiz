import { vi, TranslationKeys } from './vi';
import { en } from './en';
import { useQuizStore } from '@/store/quizStore';

export type Locale = 'vi' | 'en';

export const dictionaries: Record<Locale, TranslationKeys> = {
  vi,
  en,
};

/**
 * Get nested object value by string path (e.g. "common.app_title")
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
}

/**
 * Translate key with dynamic parameter interpolation
 * Example: t("start.active_sources_summary", { count: 2, total: 5, questions: 100 })
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[locale] || dictionaries.vi;
  let text = getNestedValue(dict, key);

  // Fallback to Vietnamese dictionary if key missing in current locale
  if (text === undefined && locale !== 'vi') {
    text = getNestedValue(dictionaries.vi, key);
  }

  // Fallback to key itself if missing everywhere
  if (text === undefined) {
    return key;
  }

  // Handle interpolation {{param}}
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text!.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(value));
    });
  }

  return text;
}

/**
 * Detect browser language on client side
 */
export function detectBrowserLanguage(): Locale {
  if (typeof window === 'undefined' || !navigator) return 'vi';
  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  if (browserLang.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return 'vi';
}

/**
 * React hook for component i18n
 */
export function useTranslation() {
  const language = useQuizStore((state) => state.language);
  const setLanguage = useQuizStore((state) => state.setLanguage);

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(language, key, params);
  };

  return {
    language,
    setLanguage,
    t,
  };
}
