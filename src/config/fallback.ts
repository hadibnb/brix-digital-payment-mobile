/**
 * Offline fallback values.
 *
 * These are NOT the source of truth. Every value here is fetched live from the
 * BRIX backend at runtime:
 *   - fees + USD reference + USDC wallet + Sheba  -> GET /funding-config.php
 *   - local reference rate per currency           -> GET /rate-engine.php?currency=XX
 *
 * The constants below only exist so the UI can render something meaningful
 * while offline or if the live call fails. Whenever they are used, the UI sets
 * `source: 'fallback'` and shows an explicit "offline reference value" notice.
 */

/** Defaults used before the user or the backend region context decides. */
export const DEFAULT_CURRENCY = 'AED';
export const DEFAULT_LANGUAGE = 'en';

/** Language codes written right-to-left. */
export const RTL_LANGUAGE_CODES: readonly string[] = ['fa', 'ar'];

export const FALLBACK_FEES = {
  cardIssuanceFeeBrix: '0.081',
  transactionFeeBrix: '0.001',
} as const;

/** Observed from /funding-config.php -> data.brix_usd_reference */
export const FALLBACK_BRIX_USD_REFERENCE = 7;

/**
 * Local reference rates observed live from /rate-engine.php.
 * Format: 1 BRIX = <value> <currency>
 */
export const FALLBACK_RATES: Record<string, number> = {
  AED: 25.708,
  OMR: 2.691,
  CNY: 47.056,
};

/** Currency list declared by the web client (`CURRENCIES = [...]` in assets/app.js). */
export const SUPPORTED_CURRENCIES: readonly string[] = [
  'USD', 'AED', 'OMR', 'CNY', 'QAR', 'SAR', 'IQD', 'TRY', 'PKR', 'INR',
  'RUB', 'KWD', 'BHD', 'YER', 'JOD', 'AFN', 'LBP', 'SYP', 'EGP', 'GEL',
  'AZN', 'BYN', 'KZT', 'KGS', 'TJS', 'TMT',
];

/** Languages bundled by the web client (assets/app.js i18n map). */
export const SUPPORTED_LANGUAGES = ['en', 'fa', 'ar', 'tr', 'ru', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Languages written right-to-left. */

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fa: 'فارسی',
  ar: 'العربية',
  tr: 'Türkçe',
  ru: 'Русский',
  hi: 'हिन्दी',
};

/** Region -> currency hint used only if /local-context.php is unreachable. */
export const REGION_CURRENCY_HINTS: Record<string, string> = {
  AE: 'AED', OM: 'OMR', CN: 'CNY', QA: 'QAR', SA: 'SAR', IQ: 'IQD',
  TR: 'TRY', PK: 'PKR', IN: 'INR', RU: 'RUB', KW: 'KWD', BH: 'BHD',
  YE: 'YER', JO: 'JOD', AF: 'AFN', LB: 'LBP', SY: 'SYP', EG: 'EGP',
  GE: 'GEL', AZ: 'AZN', BY: 'BYN', KZ: 'KZT', KG: 'KGS', TJ: 'TJS',
  TM: 'TMT', IR: 'USD',
};
