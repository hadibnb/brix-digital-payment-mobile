/**
 * In-memory session state.
 *
 * Mirrors the web client, which holds a CSRF token and an access token and
 * sends both:
 *   if (csrf) headers['X-CSRF-Token'] = csrf
 *   if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken
 *
 * Tokens are hydrated from secure storage on boot and cleared on logout or on
 * any 401/403 response.
 */

type SessionExpiredHandler = (reason: string) => void;

let accessToken: string | null = null;
let csrfToken: string | null = null;

const expiredHandlers = new Set<SessionExpiredHandler>();

export const sessionState = {
  getAccessToken(): string | null {
    return accessToken;
  },

  getCsrfToken(): string | null {
    return csrfToken;
  },

  isAuthenticated(): boolean {
    // The backend may authenticate purely by cookie, so a held bearer token is
    // not required to consider the client attached to a session.
    return accessToken !== null || csrfToken !== null;
  },

  setTokens(next: { accessToken?: string | null; csrfToken?: string | null }): void {
    if (next.accessToken !== undefined) accessToken = next.accessToken;
    if (next.csrfToken !== undefined) csrfToken = next.csrfToken;
  },

  clear(): void {
    accessToken = null;
    csrfToken = null;
  },

  /** Registers a listener invoked when the backend rejects the session. */
  onExpired(handler: SessionExpiredHandler): () => void {
    expiredHandlers.add(handler);
    return () => {
      expiredHandlers.delete(handler);
    };
  },

  emitExpired(reason: string): void {
    accessToken = null;
    csrfToken = null;
    expiredHandlers.forEach((handler) => {
      try {
        handler(reason);
      } catch {
        // A broken listener must never cascade into the API layer.
      }
    });
  },
};

/** Pulls a CSRF token out of a response if the backend chooses to rotate it. */
export function captureCsrfFromHeaders(headers: Headers): void {
  const next =
    headers.get('x-csrf-token') ??
    headers.get('x-xsrf-token') ??
    headers.get('csrf-token');
  if (next && next.length > 0) csrfToken = next;
}
