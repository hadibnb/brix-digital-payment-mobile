import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import resources from './resources';
import { DEFAULT_LANGUAGE, RTL_LANGUAGE_CODES, SUPPORTED_LANGUAGES } from '../config/fallback';

let initialized = false;

function deviceLanguage(): string {
  const locales = getLocales();
  const primary = locales[0];
  const tag = (primary?.languageCode ?? 'en').toLowerCase();
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(tag)) return tag;
  return DEFAULT_LANGUAGE;
}

export function isRtlLanguage(language: string): boolean {
  return RTL_LANGUAGE_CODES.includes(language);
}

/**
 * Bootstraps i18next. Called once from the root layout before first paint.
 * Language resolution order: stored preference -> device locale -> default.
 */
export async function initI18n(stored?: string | null): Promise<string> {
  if (initialized) return i18n.language;
  const initial =
    stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)
      ? stored
      : deviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initial,
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation'],
    compatibilityJSON: 'v3',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  initialized = true;
  return initial;
}

/**
 * A language switch, applied live. RTL languages flip `I18nManager`, which on
 * Android requires a reload to fully take effect — `shouldForceRtl` mirrors
 * the platform expectation rather than silently pretending it applied.
 */
export async function changeLanguage(language: string): Promise<void> {
  await i18n.changeLanguage(language);
  const rtl = isRtlLanguage(language);
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
}

export default i18n;
