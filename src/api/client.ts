import { API_BASE_URL, API_GATEWAY_PATH, ALLOW_CLEARTEXT, REQUEST_TIMEOUT_MS } from '../config/env';
import { ApiError, toApiError } from './ApiError';
import { captureCsrfFromHeaders, sessionState } from './session';
import { GATEWAY_ROUTES, type GatewayRouteName } from './endpoints';
import { newIdempotencyKey } from '../utils/idempotency';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Send an Idempotency-Key so the backend can deduplicate the operation. */
  idempotency?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Defaults to true. Set false for pre-auth calls. */
  auth?: boolean;
};

export type RawResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

/** Thrown when an operation targets a route the backend has not documented. */
export function unverifiedEndpointError(route: string): ApiError {
  return new ApiError({
    kind: 'unverifiedEndpoint',
    message: `The BRIX backend route for "${route}" could not be verified from the published client.`,
    code: 'ENDPOINT_UNVERIFIED',
    retryable: false,
  });
}

// ---------------------------------------------------------------------------
// URL construction
// ---------------------------------------------------------------------------

function assertSecureBase(): void {
  if (API_BASE_URL.startsWith('https://')) return;
  if (ALLOW_CLEARTEXT && /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)/.test(API_BASE_URL)) return;
  throw new ApiError({
    kind: 'cleartextBlocked',
    message: 'Refusing to send credentials over a non-HTTPS connection.',
    code: 'CLEARTEXT_BLOCKED',
  });
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const parts: string[] = [];
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });
  return parts.join('&');
}

/** Mirrors makeApiUrl() from the web client. */
export function makeGatewayUrl(route: string, query?: RequestOptions['query']): string {
  const qs = buildQuery(query);
  const base = `${API_BASE_URL}${API_GATEWAY_PATH}?route=${encodeURIComponent(route)}`;
  return qs ? `${base}&${qs}` : base;
}

/** Direct script URL, e.g. rate-engine.php?currency=AED */
export function makeDirectUrl(script: string, query?: RequestOptions['query']): string {
  const qs = buildQuery(query);
  const base = `${API_BASE_URL}/${script.replace(/^\/+/, '')}`;
  return qs ? `${base}?${qs}` : base;
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function buildHeaders(init: {
  hasBody: boolean;
  auth: boolean;
  idempotency: boolean;
}): Record<string, string> {
  // Exactly the header set the web client sends.
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.hasBody) headers['Content-Type'] = 'application/json';

  if (init.auth) {
    const csrf = sessionState.getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const token = sessionState.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (init.idempotency) headers['Idempotency-Key'] = newIdempotencyKey();
  return headers;
}

function classifyHttpError(status: number, payload: unknown): ApiError {
  const body = extractErrorBody(payload);
  const message =
    body.message ??
    (status === 401
      ? 'Your session has expired. Please sign in again.'
      : status === 403
        ? 'You do not have permission to perform this action.'
        : `The BRIX server returned an error (${status}).`);

  const kind =
    status === 401
      ? 'unauthorized'
      : status === 403
        ? 'forbidden'
        : status === 404
          ? 'notFound'
          : status === 409
            ? 'duplicate'
            : status === 400 || status === 422
              ? 'validation'
              : 'server';

  return new ApiError({
    kind,
    status,
    message,
    code: body.code,
    details: body.details,
    retryable: status >= 500 || status === 429,
    raw: payload,
  });
}

function extractErrorBody(payload: unknown): {
  message?: string;
  code?: string;
  details?: unknown;
} {
  if (!payload || typeof payload !== 'object') return {};
  const obj = payload as Record<string, unknown>;
  const err = obj.error;
  if (typeof err === 'string') {
    return { message: err, code: typeof obj.code === 'string' ? obj.code : undefined };
  }
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    return {
      message: typeof e.message === 'string' ? e.message : undefined,
      code: typeof e.code === 'string' ? e.code : undefined,
      details: e.details,
    };
  }
  return {
    message: typeof obj.message === 'string' ? obj.message : undefined,
    code: typeof obj.code === 'string' ? obj.code : undefined,
    details: obj.details,
  };
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Core request. Handles: HTTPS enforcement, timeout, cancellation merging,
 * bearer + CSRF headers, cookie session (`credentials: 'include'`),
 * `cache: 'no-store'`, idempotency keys, 401 -> session-expired broadcast and
 * a normalised ApiError for every failure.
 *
 * NOTE: React Native persists the platform cookie jar, so `credentials:
 * 'include'` keeps the backend's cookie session alive across app launches
 * exactly as it does in the browser.
 */
export async function requestJson<T>(
  url: string,
  options: RequestOptions = {},
): Promise<RawResponse<T>> {
  assertSecureBase();

  const method: HttpMethod = options.method ?? 'GET';
  const hasBody = options.body !== undefined && options.body !== null;
  const headers = buildHeaders({
    hasBody,
    auth: options.auth ?? true,
    idempotency: options.idempotency ?? false,
  });

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);

  const onExternalAbort = () => controller.abort('external');
  if (options.signal) {
    if (options.signal.aborted) controller.abort('external');
    else options.signal.addEventListener('abort', onExternalAbort);
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });

    captureCsrfFromHeaders(response.headers);
    const payload = await parseBody(response);

    if (response.status === 401) {
      const error = classifyHttpError(401, payload);
      sessionState.emitExpired('unauthorized');
      throw error;
    }

    if (!response.ok) throw classifyHttpError(response.status, payload);

    // Envelope handling: the direct scripts answer {success, data}.
    if (payload && typeof payload === 'object' && 'success' in (payload as object)) {
      const envelope = payload as { success: boolean; data?: T };
      if (envelope.success === false) throw classifyHttpError(response.status, payload);
      return {
        data: (envelope.data ?? (payload as unknown)) as T,
        status: response.status,
        headers: response.headers,
      };
    }

    return { data: payload as T, status: response.status, headers: response.headers };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const isAbort = error instanceof Error && error.name === 'AbortError';
    if (isAbort) {
      // Distinguish our timeout from a caller-initiated cancel.
      if (options.signal?.aborted) {
        throw new ApiError({ kind: 'unknown', message: 'Request cancelled', code: 'CANCELLED' });
      }
      throw new ApiError({
        kind: 'timeout',
        message: 'The BRIX server did not respond in time.',
        code: 'TIMEOUT',
        retryable: true,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    const looksLikeNetwork = /network|failed to fetch|connection|socket|dns/i.test(message);
    throw new ApiError({
      kind: 'network',
      message: looksLikeNetwork
        ? 'No connection to the BRIX server. Check your internet connection.'
        : message,
      code: 'NETWORK',
      retryable: true,
      raw: error,
    });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}

/** Call through the central gateway: /api.php?route=<route> */
export function gatewayRequest<T>(
  route: GatewayRouteName | string,
  options: RequestOptions = {},
): Promise<RawResponse<T>> {
  const resolved = (GATEWAY_ROUTES as Record<string, string>)[route] ?? route;
  return requestJson<T>(makeGatewayUrl(resolved, options.query), options);
}

/** Call a direct PHP script: /<script>.php */
export function directRequest<T>(
  script: string,
  options: RequestOptions = {},
): Promise<RawResponse<T>> {
  return requestJson<T>(makeDirectUrl(script, options.query), options);
}

export { toApiError };
