import { useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { sessionState } from '../api/session';

/**
 * Single global wiring point for session death.
 *
 * The API layer fires `sessionState.emitExpired('unauthorized')` on any 401.
 * Screens never have to detect this themselves: this hook, mounted once in the
 * root layout, redirects to the login screen. That is what makes "gracefully
 * redirect the user to the login screen" true for every request in the app —
 * including ones issued from a background refresh.
 */
export function useSessionExpiryRedirect(enabled: boolean): void {
  const handle = useCallback(
    (reason: string) => {
      if (!enabled) return;
      router.replace({ pathname: '/(auth)/sign-in', params: { reason } });
    },
    [enabled],
  );

  useEffect(() => sessionState.onExpired(handle), [handle]);
}

/** Imperative helper for services that must force a logout. */
export function forceSignOut(reason = 'signed_out'): void {
  sessionState.emitExpired(reason);
  router.replace({ pathname: '/(auth)/sign-in', params: { reason } });
}
