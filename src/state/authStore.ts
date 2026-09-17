import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { sessionState } from '../api/session';
import type { SessionUser } from '../api/types';

const TOKEN_KEY = 'brix.accessToken';
const CSRF_KEY = 'brix.csrfToken';
const USER_KEY = 'brix.user';
const BIOMETRIC_KEY = 'brix.biometricEnabled';

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'locked';

type AuthState = {
  status: AuthStatus;
  user: SessionUser | null;
  biometricEnabled: boolean;
  biometricAvailable: boolean;

  hydrate: () => Promise<void>;
  setSession: (next: { user: SessionUser; accessToken?: string | null; csrfToken?: string | null }) => Promise<void>;
  signOut: () => Promise<void>;
  lock: () => void;
  unlockWithBiometrics: () => Promise<boolean>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
};

/**
 * Session store.
 *
 * Tokens live in expo-secure-store (iOS Keychain / Android Keystore), never in
 * plain AsyncStorage. The cookie session is handled by the platform cookie jar
 * via `credentials: 'include'` in the API client, so a browser-style cookie
 * session keeps working across launches exactly as it does on the web.
 *
 * Biometric unlock gates *local* access to an already-established session. It
 * never replaces backend authentication and never stores a password.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  biometricEnabled: false,
  biometricAvailable: false,

  async hydrate() {
    try {
      const [token, csrf, rawUser, biometricFlag, hasHardware, enrolled] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(CSRF_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(BIOMETRIC_KEY),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      sessionState.setTokens({ accessToken: token, csrfToken: csrf });

      const user = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
      const biometricEnabled = biometricFlag === 'true';
      const biometricAvailable = Boolean(hasHardware && enrolled);

      // With biometric enabled and a stored session, the app boots locked.
      const needsUnlock = biometricEnabled && biometricAvailable && Boolean(token || user);

      set({
        user,
        biometricEnabled,
        biometricAvailable,
        status: needsUnlock ? 'locked' : user || token || csrf ? 'authenticated' : 'unauthenticated',
      });
    } catch {
      set({ status: 'unauthenticated', user: null });
    }
  },

  async setSession({ user, accessToken, csrfToken }) {
    sessionState.setTokens({ accessToken, csrfToken });
    if (accessToken) await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    if (csrfToken) await SecureStore.setItemAsync(CSRF_KEY, csrfToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, status: 'authenticated' });
  },

  async signOut() {
    sessionState.clear();
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(CSRF_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ user: null, status: 'unauthenticated' });
  },

  lock() {
    if (get().biometricEnabled) set({ status: 'locked' });
  },

  async unlockWithBiometrics() {
    const { biometricAvailable } = get();
    if (!biometricAvailable) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock BRIX Digital Payment',
      cancelLabel: 'Use password',
      disableDeviceFallback: false,
    });
    if (result.success) {
      set({ status: 'authenticated' });
      return true;
    }
    return false;
  },

  async enableBiometrics() {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hasHardware || !enrolled) {
      set({ biometricAvailable: false });
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm biometric unlock for BRIX',
      disableDeviceFallback: false,
    });
    if (!result.success) return false;
    await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
    set({ biometricEnabled: true, biometricAvailable: true });
    return true;
  },

  async disableBiometrics() {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    set({ biometricEnabled: false });
  },
}));
