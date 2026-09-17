import en from './locales/en';
import fa from './locales/fa';
import ar from './locales/ar';
import tr from './locales/tr';
import ru from './locales/ru';
import hi from './locales/hi';

/**
 * Localisation architecture.
 *
 * Every user-facing string lives in a locale resource — no UI text is hardcoded
 * into a component. Adding a language is: drop a file in `locales/`, register it
 * in `resources`, add its code to SUPPORTED_LANGUAGES in config/fallback.ts.
 *
 * The language set mirrors the web client's i18n bundle: en, fa, ar, tr, ru, hi.
 * `fallbackLng: 'en'` means a partially translated locale (tr/ru/hi) degrades to
 * English per-key rather than showing a raw key.
 */
export const resources = {
  en: { translation: en },
  fa: { translation: fa },
  ar: { translation: ar },
  tr: { translation: tr },
  ru: { translation: ru },
  hi: { translation: hi },
} as const;

/** Locales shipped complete. Others fall back to English key-by-key. */
export const COMPLETE_LOCALES: readonly string[] = ['en', 'fa', 'ar'];

export type TranslationKey = string;

export default resources;
