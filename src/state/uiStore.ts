import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_CURRENCY, DEFAULT_LANGUAGE } from '../config/fallback';

const CURRENCY_KEY = 'brix_currency';
const LANGUAGE_KEY = 'brix_language';

/**
 * Preference store. Deliberately uses the *same* storage keys as the web client
 * (`brix_currency`, `brix_language`) so the two clients agree on the user's
 * chosen currency and language.
 *
 * `regionDetected` records whether the currency came from the backend's
 * /local-context.php region resolution or from an explicit user choice — a user
 * choice must never be overwritten by a later region detection.
 */
type UiState = {
  currency: string;
  language: string;
  regionDetected: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setCurrency: (currency: string, opts?: { fromRegion?: boolean }) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
};

export const useUiStore = create<UiState>((set, get) => ({
  currency: DEFAULT_CURRENCY,
  language: DEFAULT_LANGUAGE,
  regionDetected: false,
  hydrated: false,

  async hydrate() {
    try {
      const [currency, language] = await Promise.all([
        AsyncStorage.getItem(CURRENCY_KEY),
        AsyncStorage.getItem(LANGUAGE_KEY),
      ]);
      set({
        currency: currency ?? DEFAULT_CURRENCY,
        language: language ?? DEFAULT_LANGUAGE,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  async setCurrency(currency, opts) {
    const fromRegion = opts?.fromRegion ?? false;
    // A region-derived currency must not clobber an explicit user preference.
    if (fromRegion && !get().regionDetected && get().currency !== DEFAULT_CURRENCY) return;
    set({ currency, regionDetected: fromRegion || get().regionDetected });
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, currency);
    } catch {
      // Persistence failure must not break the live selection.
    }
  },

  async setLanguage(language) {
    set({ language });
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // ignore
    }
  },
}));
